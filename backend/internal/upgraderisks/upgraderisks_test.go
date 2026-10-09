// Copyright Contributors to the Open Cluster Management project

package upgraderisks

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"sync"
	"testing"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

func authOK(_ http.ResponseWriter, _ *http.Request) (string, bool) {
	return "user-token", true
}

func TestUnauthorized(t *testing.T) {
	h := New(Options{})
	req := httptest.NewRequest(http.MethodPost, "/upgrade-risks-prediction", strings.NewReader(`{"clusterIds":[]}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized || rec.Body.Len() != 0 {
		t.Fatalf("status %d body %q", rec.Code, rec.Body.String())
	}
}

func TestPostsChunksAndWrapsJSON(t *testing.T) {
	var (
		mu             sync.Mutex
		gotUA, gotAuth string
		bodies         []string
	)
	insights := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		gotUA = r.Header.Get("User-Agent")
		gotAuth = r.Header.Get("Authorization")
		b, _ := io.ReadAll(r.Body)
		bodies = append(bodies, string(b))
		mu.Unlock()
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	}))
	defer insights.Close()

	docker := []byte(`{"auths":{"cloud.openshift.com":{"auth":"crc-token"}}}`)
	kube := fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "pull-secret", Namespace: "openshift-config"},
		Data:       map[string][]byte{".dockerconfigjson": docker},
	})
	h := New(Options{
		Authn:    authOK,
		Kube:     kube,
		Client:   insights.Client(),
		Endpoint: func() string { return insights.URL },
	})
	ids := make([]string, 101)
	for i := range ids {
		ids[i] = "c" + strconv.Itoa(i)
	}
	raw, _ := json.Marshal(map[string]any{"clusterIds": ids})
	req := httptest.NewRequest(http.MethodPost, "/upgrade-risks-prediction", strings.NewReader(string(raw)))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	mu.Lock()
	ua, auth := gotUA, gotAuth
	mu.Unlock()
	if ua != userAgent {
		t.Fatalf("ua %q", ua)
	}
	if auth != "Bearer crc-token" {
		t.Fatalf("auth %q", auth)
	}
	mu.Lock()
	n := len(bodies)
	mu.Unlock()
	if n != 2 {
		t.Fatalf("chunks %d", n)
	}
	var out []postResult
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if len(out) != 2 || out[0].StatusCode != 200 {
		t.Fatalf("%+v", out)
	}
}

func TestEndpointOverride(t *testing.T) {
	var gotPath string
	insights := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotPath = r.URL.Path
		_, _ = w.Write([]byte(`{}`))
	}))
	defer insights.Close()
	h := New(Options{
		Authn:    authOK,
		Client:   insights.Client(),
		Endpoint: func() string { return insights.URL + "/api/insights-results-aggregator/v2/upgrade-risks-prediction" },
	})
	req := httptest.NewRequest(http.MethodPost, "/upgrade-risks-prediction", strings.NewReader(`{"clusterIds":["id-1"]}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if gotPath != "/api/insights-results-aggregator/v2/upgrade-risks-prediction" {
		t.Fatalf("path %q", gotPath)
	}
}

func TestEmptyClusterIDs(t *testing.T) {
	h := New(Options{Authn: authOK, Client: http.DefaultClient})
	req := httptest.NewRequest(http.MethodPost, "/upgrade-risks-prediction", strings.NewReader(`{"clusterIds":[]}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	if strings.TrimSpace(rec.Body.String()) != "[]" {
		t.Fatalf("body %s", rec.Body.String())
	}
}

func TestEmptyClusterIDsSkipsKube(t *testing.T) {
	kube := fake.NewSimpleClientset()
	h := New(Options{Authn: authOK, Kube: kube, Client: http.DefaultClient})
	req := httptest.NewRequest(http.MethodPost, "/upgrade-risks-prediction", strings.NewReader(`{"clusterIds":[]}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	if acts := kube.Actions(); len(acts) != 0 {
		t.Fatalf("kube actions %v", acts)
	}
}

func pullSecretKube() *fake.Clientset {
	docker := []byte(`{"auths":{"cloud.openshift.com":{"auth":"crc-token"}}}`)
	return fake.NewSimpleClientset(&corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "pull-secret", Namespace: "openshift-config"},
		Data:       map[string][]byte{".dockerconfigjson": docker},
	})
}

func TestPullSecretGetNotList(t *testing.T) {
	insights := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{}`))
	}))
	defer insights.Close()
	kube := pullSecretKube()
	h := New(Options{
		Authn:    authOK,
		Kube:     kube,
		Client:   insights.Client(),
		Endpoint: func() string { return insights.URL },
	})
	req := httptest.NewRequest(http.MethodPost, "/upgrade-risks-prediction", strings.NewReader(`{"clusterIds":["id-1"]}`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d %s", rec.Code, rec.Body.String())
	}
	var gets, lists int
	for _, a := range kube.Actions() {
		switch a.GetVerb() {
		case "get":
			gets++
		case "list":
			lists++
		}
	}
	if gets != 1 || lists != 0 {
		t.Fatalf("gets %d lists %d actions %v", gets, lists, kube.Actions())
	}
}

func TestCRCTokenCached(t *testing.T) {
	insights := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{}`))
	}))
	defer insights.Close()
	kube := pullSecretKube()
	h := New(Options{
		Authn:    authOK,
		Kube:     kube,
		Client:   insights.Client(),
		Endpoint: func() string { return insights.URL },
	})
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/upgrade-risks-prediction", strings.NewReader(`{"clusterIds":["id-1"]}`))
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("status %d %s", rec.Code, rec.Body.String())
		}
	}
	var gets int
	for _, a := range kube.Actions() {
		if a.GetVerb() == "get" {
			gets++
		}
	}
	if gets != 1 {
		t.Fatalf("gets %d want 1 actions %v", gets, kube.Actions())
	}
}

func TestChunkIDs(t *testing.T) {
	got := chunkIDs([]string{"a", "b", "c"}, 2)
	if len(got) != 2 || len(got[0]) != 2 || len(got[1]) != 1 {
		t.Fatalf("%v", got)
	}
	if chunkIDs(nil, 100) != nil {
		t.Fatal("expected nil")
	}
}

func TestMalformedJSON400(t *testing.T) {
	h := New(Options{Authn: authOK, Client: http.DefaultClient})
	req := httptest.NewRequest(http.MethodPost, "/upgrade-risks-prediction", strings.NewReader(`{`))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status %d", rec.Code)
	}
}
