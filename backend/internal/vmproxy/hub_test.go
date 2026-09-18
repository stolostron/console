// Copyright Contributors to the Open Cluster Management project

package vmproxy

import (
	"context"
	"testing"

	authzv1 "k8s.io/api/authorization/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic/fake"
	"k8s.io/client-go/kubernetes"
	kubefake "k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"
)

func mchObject(fineGrainedEnabled bool) *unstructured.Unstructured {
	obj := &unstructured.Unstructured{}
	obj.SetGroupVersionKind(schema.GroupVersionKind{
		Group:   "operator.open-cluster-management.io",
		Version: "v1",
		Kind:    "MultiClusterHub",
	})
	obj.SetName("hub")
	components := []interface{}{
		map[string]interface{}{
			"name":    "fine-grained-rbac",
			"enabled": fineGrainedEnabled,
		},
	}
	if err := unstructured.SetNestedSlice(obj.Object, components, "spec", "overrides", "components"); err != nil {
		panic(err)
	}
	return obj
}

func mchDynamicClient(enabled bool) *fake.FakeDynamicClient {
	return fake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(), map[schema.GroupVersionResource]string{
		{Group: "operator.open-cluster-management.io", Version: "v1", Resource: "multiclusterhubs"}: "MultiClusterHubList",
	}, mchObject(enabled))
}

func TestFineGrainedRBAC_OptionOverride(t *testing.T) {
	h := &Handler{opts: Options{FineGrained: func(context.Context) (bool, error) { return true, nil }}}
	if !h.fineGrainedRBAC(context.Background()) {
		t.Fatal("expected override to enable fine-grained RBAC")
	}
}

func TestFineGrainedRBAC_FromHub(t *testing.T) {
	h := &Handler{opts: Options{HubDynamic: mchDynamicClient(true)}}
	if !h.fineGrainedRBAC(context.Background()) {
		t.Fatal("expected fine-grained RBAC enabled from hub")
	}
}

func TestFineGrainedRBAC_DisabledComponent(t *testing.T) {
	h := &Handler{opts: Options{HubDynamic: mchDynamicClient(false)}}
	if h.fineGrainedRBAC(context.Background()) {
		t.Fatal("expected fine-grained RBAC disabled")
	}
}

func TestFineGrainedRBAC_MissingClient(t *testing.T) {
	h := &Handler{}
	if h.fineGrainedRBAC(context.Background()) {
		t.Fatal("expected false without hub client")
	}
}

func TestCanCreateMCA_Allowed(t *testing.T) {
	client := kubefake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(k8stesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: true},
		}, nil
	})
	h := &Handler{opts: Options{UserKube: func(string) (kubernetes.Interface, error) { return client, nil }}}
	if !h.canCreateMCA(context.Background(), "user-token", "ns") {
		t.Fatal("expected MCA create allowed")
	}
}

func TestCanCreateMCA_Denied(t *testing.T) {
	client := kubefake.NewSimpleClientset()
	client.PrependReactor("create", "selfsubjectaccessreviews", func(k8stesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: false},
		}, nil
	})
	h := &Handler{opts: Options{UserKube: func(string) (kubernetes.Interface, error) { return client, nil }}}
	if h.canCreateMCA(context.Background(), "user-token", "ns") {
		t.Fatal("expected MCA create denied")
	}
}

func TestVMActorToken_Found(t *testing.T) {
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "vm-actor", Namespace: "cluster-ns"},
		Data:       map[string][]byte{"token": []byte("vm-actor-token")},
	}
	h := &Handler{saKube: kubefake.NewSimpleClientset(secret)}
	token, ok := h.vmActorToken(context.Background(), "cluster-ns")
	if !ok || token != "vm-actor-token" {
		t.Fatalf("token=%q ok=%v", token, ok)
	}
}

func TestVMActorToken_NotFound(t *testing.T) {
	h := &Handler{saKube: kubefake.NewSimpleClientset()}
	if token, ok := h.vmActorToken(context.Background(), "cluster-ns"); ok || token != "" {
		t.Fatalf("token=%q ok=%v", token, ok)
	}
}
