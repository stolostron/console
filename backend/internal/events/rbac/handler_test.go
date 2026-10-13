// Copyright Contributors to the Open Cluster Management project

package rbac_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	rbacv1 "k8s.io/api/rbac/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"

	"github.com/stolostron/console/backend/internal/auth"
	rbacevents "github.com/stolostron/console/backend/internal/events/rbac"
)

func labeledRole(name string) *rbacv1.ClusterRole {
	return &rbacv1.ClusterRole{
		ObjectMeta: metav1.ObjectMeta{
			Name: name,
			UID:  types.UID(name + "-uid"),
			Labels: map[string]string{
				"rbac.open-cluster-management.io/filter": "vm-clusterroles",
			},
		},
	}
}

func TestStoreIgnoresUnlabeled(t *testing.T) {
	s := rbacevents.NewStore()
	s.Upsert("ADDED", &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: "other"}})
	if len(s.List()) != 0 {
		t.Fatalf("expected empty store, got %d", len(s.List()))
	}
}

func TestStoreUpsertDelete(t *testing.T) {
	s := rbacevents.NewStore()
	ch := s.Subscribe()
	defer s.Unsubscribe(ch)

	role := labeledRole("kubevirt.io:view")
	s.Upsert("ADDED", role)
	if len(s.List()) != 1 {
		t.Fatalf("list %d", len(s.List()))
	}
	select {
	case ev := <-ch:
		if ev.Type != "ADDED" || ev.Role.Name != role.Name {
			t.Fatalf("event %+v", ev)
		}
	case <-time.After(time.Second):
		t.Fatal("timeout waiting for add")
	}

	s.Delete(role)
	if len(s.List()) != 0 {
		t.Fatal("expected delete")
	}
	select {
	case ev := <-ch:
		if ev.Type != "DELETED" {
			t.Fatalf("type %s", ev.Type)
		}
	case <-time.After(time.Second):
		t.Fatal("timeout waiting for delete")
	}
}

func TestHandlerUnauthorized(t *testing.T) {
	h := rbacevents.NewHandler(rbacevents.NewStore(), rbacevents.StaticAuth{OK: true}, rbacevents.AllowAllAccess{})
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/events/rbac", nil))
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}

	h = rbacevents.NewHandler(rbacevents.NewStore(), rbacevents.StaticAuth{OK: false}, rbacevents.AllowAllAccess{})
	req := httptest.NewRequest(http.MethodGet, "/events/rbac", nil)
	req.Header.Set("Authorization", "Bearer bad")
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Body.Len() != 0 {
		t.Fatalf("body %q", rec.Body.String())
	}
}

func TestHandlerSnapshotSSE(t *testing.T) {
	store := rbacevents.NewStore()
	store.Upsert("ADDED", labeledRole("kubevirt.io:admin"))
	h := rbacevents.NewHandler(store, rbacevents.StaticAuth{OK: true}, rbacevents.AllowAllAccess{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	req := httptest.NewRequest(http.MethodGet, "/events/rbac", nil).WithContext(ctx)
	req.AddCookie(&http.Cookie{Name: auth.AccessTokenCookie, Value: "user-token"})

	rec := httptest.NewRecorder()
	done := make(chan struct{})
	go func() {
		h.ServeHTTP(rec, req)
		close(done)
	}()

	deadline := time.Now().Add(2 * time.Second)
	var body string
	for time.Now().Before(deadline) {
		body = rec.Body.String()
		if strings.Contains(body, `"type":"LOADED"`) {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	<-done

	if rec.Code != http.StatusOK {
		t.Fatalf("status %d body %s", rec.Code, body)
	}
	if ct := rec.Header().Get("Content-Type"); !strings.Contains(ct, "text/event-stream") {
		t.Fatalf("content-type %s", ct)
	}
	if cc := rec.Header().Get("Cache-Control"); !strings.Contains(cc, "no-transform") {
		t.Fatalf("cache-control %s", cc)
	}
	for _, typ := range []string{"START", "ADDED", "EOP", "LOADED"} {
		if !strings.Contains(body, `"type":"`+typ+`"`) {
			t.Fatalf("missing %s in %s", typ, body)
		}
	}
	if !strings.Contains(body, "kubevirt.io:admin") {
		t.Fatalf("missing role in %s", body)
	}
	var payload struct {
		Type   string          `json:"type"`
		Object json.RawMessage `json:"object"`
	}
	for _, line := range strings.Split(body, "\n") {
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		if err := json.Unmarshal([]byte(strings.TrimPrefix(line, "data: ")), &payload); err != nil {
			t.Fatal(err)
		}
		if payload.Type == "ADDED" && payload.Object == nil {
			t.Fatal("ADDED missing object")
		}
	}
}

type denyAccess struct{}

func (denyAccess) CanSee(context.Context, string, *rbacv1.ClusterRole) (bool, error) {
	return false, nil
}

func TestHandlerSSARDenyOmitsRole(t *testing.T) {
	store := rbacevents.NewStore()
	store.Upsert("ADDED", labeledRole("secret-role"))
	h := rbacevents.NewHandler(store, rbacevents.StaticAuth{OK: true}, denyAccess{})

	ctx, cancel := context.WithCancel(context.Background())
	req := httptest.NewRequest(http.MethodGet, "/events/rbac", nil).WithContext(ctx)
	req.Header.Set("Authorization", "Bearer user-token")
	rec := httptest.NewRecorder()
	go func() {
		h.ServeHTTP(rec, req)
	}()
	deadline := time.Now().Add(2 * time.Second)
	var body string
	for time.Now().Before(deadline) {
		body = rec.Body.String()
		if strings.Contains(body, `"type":"LOADED"`) {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	if strings.Contains(body, "secret-role") {
		t.Fatalf("denied role leaked: %s", body)
	}
}

func TestInformerLabelSelector(t *testing.T) {
	keep := labeledRole("keep-me")
	drop := &rbacv1.ClusterRole{ObjectMeta: metav1.ObjectMeta{Name: "drop-me", UID: types.UID("drop-uid")}}
	client := fake.NewSimpleClientset(keep, drop)
	store := rbacevents.NewStore()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := rbacevents.StartInformer(ctx, client, store); err != nil {
		t.Fatal(err)
	}
	names := map[string]bool{}
	for _, r := range store.List() {
		names[r.Name] = true
	}
	if !names["keep-me"] {
		t.Fatal("missing labeled role")
	}
	if names["drop-me"] {
		t.Fatal("unlabeled role should not be stored")
	}
}

func TestSSARAccessListThenGet(t *testing.T) {
	var verbs []string
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		create := action.(ktesting.CreateAction)
		review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
		verbs = append(verbs, review.Spec.ResourceAttributes.Verb)
		allowed := review.Spec.ResourceAttributes.Verb == "get"
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
		}, nil
	})

	a := rbacevents.NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) {
		return client, nil
	})

	ok, err := a.CanSee(context.Background(), "tok", labeledRole("r1"))
	if err != nil {
		t.Fatal(err)
	}
	if !ok {
		t.Fatal("expected get to allow")
	}
	if len(verbs) < 2 || verbs[0] != "list" || verbs[1] != "get" {
		t.Fatalf("verbs %v", verbs)
	}
}
