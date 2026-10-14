// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"testing"
	"time"

	authzv1 "k8s.io/api/authorization/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	ktesting "k8s.io/client-go/testing"
)

type ssarCall struct {
	verb, group, resource, name, namespace string
}

type authRec struct {
	mu     sync.Mutex
	ssar   []ssarCall
	ssrrNS []string
}

func (r *authRec) snapshot() (ssar []ssarCall, ssrr []string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	ssar = append([]ssarCall(nil), r.ssar...)
	ssrr = append([]string(nil), r.ssrrNS...)
	return ssar, ssrr
}

func countVerb(calls []ssarCall, verb string) int {
	n := 0
	for _, c := range calls {
		if c.verb == verb {
			n++
		}
	}
	return n
}

func emptyRules() authzv1.SubjectRulesReviewStatus {
	return authzv1.SubjectRulesReviewStatus{Incomplete: false, ResourceRules: []authzv1.ResourceRule{}}
}

func secretGetRules() authzv1.SubjectRulesReviewStatus {
	return authzv1.SubjectRulesReviewStatus{
		ResourceRules: []authzv1.ResourceRule{{
			Verbs:     []string{"get"},
			APIGroups: []string{""},
			Resources: []string{"secrets"},
		}},
	}
}

func clusterAdminRules() authzv1.SubjectRulesReviewStatus {
	return authzv1.SubjectRulesReviewStatus{
		ResourceRules: []authzv1.ResourceRule{{
			Verbs:     []string{"*"},
			APIGroups: []string{"*"},
			Resources: []string{"*"},
		}},
	}
}

func namedManagedClusterRule(name string) authzv1.SubjectRulesReviewStatus {
	return authzv1.SubjectRulesReviewStatus{
		ResourceRules: []authzv1.ResourceRule{{
			Verbs:         []string{"get"},
			APIGroups:     []string{"cluster.open-cluster-management.io"},
			Resources:     []string{"managedclusters"},
			ResourceNames: []string{name},
		}},
	}
}

func managedClusterAllowAll() authzv1.SubjectRulesReviewStatus {
	return authzv1.SubjectRulesReviewStatus{
		ResourceRules: []authzv1.ResourceRule{{
			Verbs:     []string{"get", "list", "watch"},
			APIGroups: []string{"cluster.open-cluster-management.io"},
			Resources: []string{"managedclusters"},
		}},
	}
}

func modifiedCluster(name string) Event {
	return Event{
		Type: TypeModified,
		GVR:  schema.GroupVersionResource{Group: "cluster.open-cluster-management.io", Version: "v1", Resource: "managedclusters"},
		Object: map[string]any{
			"kind": "ManagedCluster", "apiVersion": "cluster.open-cluster-management.io/v1",
			"metadata": map[string]any{"name": name},
		},
	}
}

func modifiedSecret(ns, name string) Event {
	return Event{
		Type: TypeModified,
		GVR:  schema.GroupVersionResource{Version: "v1", Resource: "secrets"},
		Object: map[string]any{
			"kind": "Secret", "apiVersion": "v1",
			"metadata": map[string]any{"name": name, "namespace": ns},
		},
	}
}

func modifiedMCI(cluster string) Event {
	return Event{
		Type: TypeModified,
		GVR: schema.GroupVersionResource{
			Group: "internal.open-cluster-management.io", Version: "v1beta1", Resource: "managedclusterinfos",
		},
		Object: map[string]any{
			"kind": "ManagedClusterInfo", "apiVersion": "internal.open-cluster-management.io/v1beta1",
			"metadata": map[string]any{"name": cluster, "namespace": cluster},
		},
	}
}

func modifiedPlacement(ns, name string) Event {
	return Event{
		Type: TypeModified,
		GVR: schema.GroupVersionResource{
			Group: "cluster.open-cluster-management.io", Version: "v1beta1", Resource: "placements",
		},
		Object: map[string]any{
			"kind": "Placement", "apiVersion": "cluster.open-cluster-management.io/v1beta1",
			"metadata": map[string]any{"name": name, "namespace": ns},
		},
	}
}

func modifiedClusterExtension(name string) Event {
	return Event{
		Type: TypeModified,
		GVR:  schema.GroupVersionResource{Group: "olm.operatorframework.io", Version: "v1", Resource: "clusterextensions"},
		Object: map[string]any{
			"kind": "ClusterExtension", "apiVersion": "olm.operatorframework.io/v1",
			"metadata": map[string]any{"name": name},
		},
	}
}

func newAuthClient(rec *authRec, ssrr func(ns string) (authzv1.SubjectRulesReviewStatus, error), getAllowed func(ssarCall) bool) *fake.Clientset {
	client := fake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectrulesreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		create := action.(ktesting.CreateAction)
		review := create.GetObject().(*authzv1.SelfSubjectRulesReview)
		ns := review.Spec.Namespace
		rec.mu.Lock()
		rec.ssrrNS = append(rec.ssrrNS, ns)
		rec.mu.Unlock()
		status, err := ssrr(ns)
		if err != nil {
			return true, nil, err
		}
		return true, &authzv1.SelfSubjectRulesReview{Status: status}, nil
	})
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action ktesting.Action) (bool, runtime.Object, error) {
		create := action.(ktesting.CreateAction)
		review := create.GetObject().(*authzv1.SelfSubjectAccessReview)
		attr := review.Spec.ResourceAttributes
		call := ssarCall{
			verb:      attr.Verb,
			group:     attr.Group,
			resource:  attr.Resource,
			name:      attr.Name,
			namespace: attr.Namespace,
		}
		rec.mu.Lock()
		rec.ssar = append(rec.ssar, call)
		rec.mu.Unlock()
		allowed := false
		if attr.Verb == "list" {
			allowed = false
		} else if getAllowed != nil {
			allowed = getAllowed(call)
		}
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
		}, nil
	})
	return client
}

func mustAllow(t *testing.T, a *SSARAccess, token string, ev Event) bool {
	t.Helper()
	ok, err := a.Allow(context.Background(), token, ev)
	if err != nil {
		t.Fatalf("Allow err=%v", err)
	}
	return ok
}

func TestSSRRDenyAllSkipsGet(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return emptyRules(), nil
	}, func(ssarCall) bool { return true })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if mustAllow(t, a, "none-user-token", modifiedCluster("cluster-1")) {
		t.Fatal("expected deny")
	}
	ssar, ssrr := rec.snapshot()
	if len(ssrr) != 1 || ssrr[0] != clusterScopedRulesNamespace {
		t.Fatalf("ssrr %v", ssrr)
	}
	if countVerb(ssar, "get") != 0 {
		t.Fatalf("gets %v", ssar)
	}
	if countVerb(ssar, "list") != 1 {
		t.Fatalf("lists %v", ssar)
	}
}

func TestSSRRScaleClusterScopedGets(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return emptyRules(), nil
	}, func(ssarCall) bool { return true })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	errs := make(chan error, 500)
	var wg sync.WaitGroup
	for i := 0; i < 500; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			ok, err := a.Allow(context.Background(), "scale-none-token", modifiedCluster(fmt.Sprintf("cluster-%d", i)))
			if err != nil {
				errs <- err
				return
			}
			if ok {
				errs <- fmt.Errorf("cluster-%d allowed", i)
			}
		}(i)
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Fatal(err)
	}
	ssar, ssrr := rec.snapshot()
	if len(ssrr) != 1 {
		t.Fatalf("ssrr calls %d want 1", len(ssrr))
	}
	if countVerb(ssar, "get") != 0 {
		t.Fatalf("gets %d", countVerb(ssar, "get"))
	}
	if countVerb(ssar, "list") != 1 {
		t.Fatalf("lists %d", countVerb(ssar, "list"))
	}
}

func TestSSRRScaleSameNamespace(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return emptyRules(), nil
	}, nil)
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	for i := 0; i < 200; i++ {
		ev := Event{
			Type: TypeModified,
			GVR: schema.GroupVersionResource{
				Group: "internal.open-cluster-management.io", Version: "v1beta1", Resource: "managedclusterinfos",
			},
			Object: map[string]any{
				"kind": "ManagedClusterInfo", "apiVersion": "internal.open-cluster-management.io/v1beta1",
				"metadata": map[string]any{"name": fmt.Sprintf("info-%d", i), "namespace": "acm39327-mc-01"},
			},
		}
		if mustAllow(t, a, "same-ns-none-token", ev) {
			t.Fatal("expected deny")
		}
	}
	_, ssrr := rec.snapshot()
	if len(ssrr) != 1 {
		t.Fatalf("ssrr calls %d want 1", len(ssrr))
	}
}

func TestSSRROneReviewPerNamespace(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return emptyRules(), nil
	}, func(ssarCall) bool { return true })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	for i := 0; i < 50; i++ {
		if mustAllow(t, a, "namespaced-none-token", modifiedMCI(fmt.Sprintf("cluster-%d", i))) {
			t.Fatal("expected deny")
		}
	}
	ssar, ssrr := rec.snapshot()
	if len(ssrr) != 50 {
		t.Fatalf("ssrr %d want 50", len(ssrr))
	}
	if countVerb(ssar, "get") != 0 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRSecretsDefaultNotOtherNamespaces(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(ns string) (authzv1.SubjectRulesReviewStatus, error) {
		if ns == "default" {
			return secretGetRules(), nil
		}
		return emptyRules(), nil
	}, nil)
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "user1-token", modifiedSecret("default", "default-cred")) {
		t.Fatal("default secret")
	}
	if mustAllow(t, a, "user1-token", modifiedSecret("kube-system", "other-cred")) {
		t.Fatal("kube-system secret")
	}
	if mustAllow(t, a, "user1-token", modifiedSecret("acm39327-mc-01", "cluster-cred")) {
		t.Fatal("cluster secret")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 0 {
		t.Fatalf("unexpected gets %v", ssar)
	}
}

func TestSSRRNamespacedAdminNotClusterScoped(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(ns string) (authzv1.SubjectRulesReviewStatus, error) {
		if ns == "acm39327-mc-01" {
			return clusterAdminRules(), nil
		}
		return emptyRules(), nil
	}, func(ssarCall) bool { return true })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "cluster-admin-token", modifiedMCI("acm39327-mc-01")) {
		t.Fatal("cluster ns admin")
	}
	if mustAllow(t, a, "cluster-admin-token", modifiedMCI("other-cluster")) {
		t.Fatal("other cluster ns")
	}
	if mustAllow(t, a, "cluster-admin-token", modifiedCluster("acm39327-mc-01")) {
		t.Fatal("ManagedCluster must not follow default-ns RoleBinding; empty default SSRR is deny-all")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 0 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRNamedClusterScopedConfirmedWithSSAR(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return namedManagedClusterRule("allowed-cluster"), nil
	}, func(c ssarCall) bool {
		return c.group == "cluster.open-cluster-management.io" && c.resource == "managedclusters" && c.name == "allowed-cluster"
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "partial-user-token", modifiedCluster("allowed-cluster")) {
		t.Fatal("allowed-cluster")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRNamedClusterScopedDeniedBySSAR(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return namedManagedClusterRule("allowed-cluster"), nil
	}, func(c ssarCall) bool { return false })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if mustAllow(t, a, "partial-user-token", modifiedCluster("other-cluster")) {
		t.Fatal("other-cluster")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRNamespacedAllowAllWithoutGet(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return authzv1.SubjectRulesReviewStatus{
			ResourceRules: []authzv1.ResourceRule{{
				Verbs:     []string{"get", "list", "watch"},
				APIGroups: []string{""},
				Resources: []string{"secrets"},
			}},
		}, nil
	}, func(ssarCall) bool { return false })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "viewer-token", modifiedSecret("default", "any-secret")) {
		t.Fatal("secret allow-all")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 0 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRClusterScopedAllowAllConfirmedWithSSAR(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return managedClusterAllowAll(), nil
	}, func(ssarCall) bool { return false })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if mustAllow(t, a, "default-role-token", modifiedCluster("any-cluster")) {
		t.Fatal("RoleBinding in default must not grant ManagedCluster")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRKindAccessReusedAcrossAPIVersions(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return emptyRules(), nil
	}, nil)
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ev := func(apiVersion string) Event {
		return Event{
			Type: TypeModified,
			GVR: schema.GroupVersionResource{
				Group: "cluster.open-cluster-management.io", Version: "v1beta1", Resource: "placements",
			},
			Object: map[string]any{
				"kind": "Placement", "apiVersion": apiVersion,
				"metadata": map[string]any{"name": "p", "namespace": "ns"},
			},
		}
	}
	if mustAllow(t, a, "version-token", ev("cluster.open-cluster-management.io/v1beta1")) {
		t.Fatal("v1beta1")
	}
	if mustAllow(t, a, "version-token", ev("cluster.open-cluster-management.io/v1alpha1")) {
		t.Fatal("v1alpha1")
	}
	_, ssrr := rec.snapshot()
	if len(ssrr) != 1 {
		t.Fatalf("ssrr %d want 1", len(ssrr))
	}
}

func TestSSRRIncompleteNonEmptyFallsBackToSSAR(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return incompletePodRules(), nil
	}, func(c ssarCall) bool {
		return c.verb == "get" && c.resource == "managedclusters"
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "incomplete-user-token", modifiedCluster("cluster-1")) {
		t.Fatal("expected SSAR allow")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRREmptyIncompleteIsDenyAll(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return authzv1.SubjectRulesReviewStatus{Incomplete: true, ResourceRules: []authzv1.ResourceRule{}}, nil
	}, func(ssarCall) bool { return true })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if mustAllow(t, a, "openshift-none-token", modifiedCluster("cluster-1")) {
		t.Fatal("expected deny-all")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 0 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRRequestFailureFallsBackToSSAR(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return authzv1.SubjectRulesReviewStatus{}, errors.New("internal error")
	}, func(c ssarCall) bool { return c.verb == "get" })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "ssrr-fail-token", modifiedCluster("cluster-1")) {
		t.Fatal("expected SSAR fallback allow")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRCachesExpireOnCleanup(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return emptyRules(), nil
	}, nil)
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if mustAllow(t, a, "cache-expiry-token", modifiedCluster("c1")) {
		t.Fatal("c1")
	}
	a.mu.Lock()
	for _, st := range a.byToken {
		for k, e := range st.entries {
			e.expiry = time.Now().Add(-time.Second)
			st.entries[k] = e
		}
		for ns, e := range st.rules {
			e.expiry = time.Now().Add(-time.Second)
			st.rules[ns] = e
		}
		for k, e := range st.kindAccess {
			e.expiry = time.Now().Add(-time.Second)
			st.kindAccess[k] = e
		}
	}
	a.mu.Unlock()
	a.cleanup(time.Now())
	if mustAllow(t, a, "cache-expiry-token", modifiedCluster("c2")) {
		t.Fatal("c2")
	}
	_, ssrr := rec.snapshot()
	if len(ssrr) != 2 {
		t.Fatalf("ssrr %d want 2", len(ssrr))
	}
}

func TestSSRRManagedClusterNamespaceStillClusterScoped(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(ns string) (authzv1.SubjectRulesReviewStatus, error) {
		if ns != clusterScopedRulesNamespace {
			t.Errorf("SSRR namespace %q want default", ns)
		}
		return namedManagedClusterRule("acm39327-mc-02"), nil
	}, func(ssarCall) bool { return false })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	ev := Event{
		Type: TypeModified,
		GVR:  schema.GroupVersionResource{Group: "cluster.open-cluster-management.io", Version: "v1", Resource: "managedclusters"},
		Object: map[string]any{
			"kind": "ManagedCluster", "apiVersion": "cluster.open-cluster-management.io/v1",
			"metadata": map[string]any{"name": "acm39327-mc-02", "namespace": "default"},
		},
	}
	if mustAllow(t, a, "user1-token", ev) {
		t.Fatal("must confirm with SSAR")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRREvaluationErrorIncompleteConfirmsSSAR(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return authzv1.SubjectRulesReviewStatus{
			EvaluationError: "webhook authorizer does not support user rule resolution",
			ResourceRules: []authzv1.ResourceRule{{
				Verbs:     []string{"get"},
				APIGroups: []string{""},
				Resources: []string{"pods"},
			}},
		}, nil
	}, func(c ssarCall) bool {
		return c.resource == "managedclusters" && c.name == "cluster-1"
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "evaluation-error-token", modifiedCluster("cluster-1")) {
		t.Fatal("expected SSAR allow")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRIncompleteNamedClusterScopedStillSSAR(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		status := namedManagedClusterRule("cluster-1")
		status.Incomplete = true
		return status, nil
	}, func(ssarCall) bool { return false })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if mustAllow(t, a, "incomplete-named-token", modifiedCluster("cluster-1")) {
		t.Fatal("SSAR must decide")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSARKeysIncludeAPIGroup(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return incompletePodRules(), nil
	}, func(c ssarCall) bool {
		return c.group == "app.k8s.io"
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	app := func(apiVersion, group string) Event {
		return Event{
			Type: TypeModified,
			GVR:  schema.GroupVersionResource{Group: group, Version: "v1beta1", Resource: "applications"},
			Object: map[string]any{
				"kind": "Application", "apiVersion": apiVersion,
				"metadata": map[string]any{"name": "app", "namespace": "ns"},
			},
		}
	}
	if !mustAllow(t, a, "group-collision-token", app("app.k8s.io/v1beta1", "app.k8s.io")) {
		t.Fatal("app.k8s.io")
	}
	if mustAllow(t, a, "group-collision-token", app("argoproj.io/v1alpha1", "argoproj.io")) {
		t.Fatal("argoproj.io")
	}
	ssar, _ := rec.snapshot()
	var gets []ssarCall
	for _, c := range ssar {
		if c.verb == "get" {
			gets = append(gets, c)
		}
	}
	if len(gets) != 2 {
		t.Fatalf("gets %v", gets)
	}
}

func TestSSRRPlacementAllowAllIsNamespaced(t *testing.T) {
	rec := &authRec{}
	placementAllowAll := authzv1.SubjectRulesReviewStatus{
		ResourceRules: []authzv1.ResourceRule{{
			Verbs:     []string{"get", "list", "watch"},
			APIGroups: []string{"cluster.open-cluster-management.io"},
			Resources: []string{"placements"},
		}},
	}
	client := newAuthClient(rec, func(ns string) (authzv1.SubjectRulesReviewStatus, error) {
		if ns == "default" {
			return placementAllowAll, nil
		}
		return emptyRules(), nil
	}, nil)
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "placement-token", modifiedPlacement("default", "p-default")) {
		t.Fatal("default placement")
	}
	if mustAllow(t, a, "placement-token", modifiedPlacement("other-ns", "p-other")) {
		t.Fatal("other-ns placement")
	}
}

func TestSSRRClusterExtensionConfirmedWithSSAR(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return authzv1.SubjectRulesReviewStatus{
			ResourceRules: []authzv1.ResourceRule{{
				Verbs:     []string{"get", "list", "watch"},
				APIGroups: []string{"olm.operatorframework.io"},
				Resources: []string{"clusterextensions"},
			}},
		}, nil
	}, func(c ssarCall) bool {
		return c.group == "olm.operatorframework.io" && c.resource == "clusterextensions"
	})
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if !mustAllow(t, a, "cluster-extension-token", modifiedClusterExtension("ext-1")) {
		t.Fatal("extension")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("gets %v", ssar)
	}
}

func TestSSRRRetryAfterUnavailable(t *testing.T) {
	rec := &authRec{}
	var ssrrCalls int
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		ssrrCalls++
		if ssrrCalls == 1 {
			return authzv1.SubjectRulesReviewStatus{}, errors.New("internal error")
		}
		return emptyRules(), nil
	}, func(ssarCall) bool { return false })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if mustAllow(t, a, "ssrr-retry-token", modifiedCluster("cluster-1")) {
		t.Fatal("first fallback SSAR deny")
	}
	if mustAllow(t, a, "ssrr-retry-token", modifiedCluster("cluster-2")) {
		t.Fatal("second deny-all")
	}
	ssar, ssrr := rec.snapshot()
	if len(ssrr) != 2 {
		t.Fatalf("ssrr %d want 2", len(ssrr))
	}
	if countVerb(ssar, "get") != 1 {
		t.Fatalf("only first call should SSAR get, got %v", ssar)
	}
}

func TestSSRRDenyAllNamespaceSkipsGet(t *testing.T) {
	rec := &authRec{}
	client := newAuthClient(rec, func(string) (authzv1.SubjectRulesReviewStatus, error) {
		return emptyRules(), nil
	}, func(ssarCall) bool { return true })
	a := NewSSARAccessWithClient(func(string) (kubernetes.Interface, error) { return client, nil })
	if mustAllow(t, a, "none-ns-token", modifiedNS("default")) {
		t.Fatal("expected deny")
	}
	ssar, _ := rec.snapshot()
	if countVerb(ssar, "get") != 0 {
		t.Fatalf("gets %v", ssar)
	}
}
