// Copyright Contributors to the Open Cluster Management project

package vmproxy_test

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
	k8stesting "k8s.io/client-go/testing"

	authzv1 "k8s.io/api/authorization/v1"

	"github.com/stolostron/console/backend/internal/clusterproxy"
	"github.com/stolostron/console/backend/internal/vmproxy"
)

func allowMCA(client *fake.Clientset, allowed bool) {
	client.PrependReactor("create", "selfsubjectaccessreviews", func(action k8stesting.Action) (bool, runtime.Object, error) {
		return true, &authzv1.SelfSubjectAccessReview{
			Status: authzv1.SubjectAccessReviewStatus{Allowed: allowed},
		}, nil
	})
}

func vmActorSecret() *corev1.Secret {
	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: "vm-actor", Namespace: "testCluster"},
		Data:       map[string][]byte{"token": []byte("test-vm-token")},
	}
}

func newVMHandler(t *testing.T, addon http.Handler, kube kubernetes.Interface) http.Handler {
	t.Helper()
	up := httptest.NewServer(addon)
	t.Cleanup(up.Close)
	target, err := url.Parse(up.URL)
	if err != nil {
		t.Fatal(err)
	}
	if kube == nil {
		fc := fake.NewSimpleClientset(vmActorSecret())
		allowMCA(fc, true)
		kube = fc
	}
	return vmproxy.New(vmproxy.Options{
		Resolver:    &clusterproxy.Resolver{Target: target},
		Kube:        kube,
		UserKube:    func(string) (kubernetes.Interface, error) { return kube, nil },
		Validate:    func(context.Context, string) error { return nil },
		FineGrained: func(context.Context) (bool, error) { return false, nil },
	})
}

func doJSON(t *testing.T, h http.Handler, method, path string, body any) *http.Response {
	t.Helper()
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)
	var rdr io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			t.Fatal(err)
		}
		rdr = strings.NewReader(string(b))
	}
	req, err := http.NewRequest(method, ts.URL+path, rdr)
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Authorization", "Bearer user-token")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := ts.Client().Do(req)
	if err != nil {
		t.Fatal(err)
	}
	return resp
}

func TestUnauthorized(t *testing.T) {
	h := newVMHandler(t, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		t.Fatal("upstream")
	}), nil)
	ts := httptest.NewServer(h)
	t.Cleanup(ts.Close)
	resp, err := ts.Client().Get(ts.URL + "/virtualmachines/get/c/n/ns")
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestStartAction(t *testing.T) {
	var capturedPath, capturedAuth, capturedMethod string
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		capturedAuth = r.Header.Get("Authorization")
		capturedMethod = r.Method
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"statusCode":200}`))
	}), nil)
	resp := doJSON(t, h, http.MethodPut, "/virtualmachines/start", map[string]string{
		"managedCluster": "testCluster",
		"vmName":         "vmName",
		"vmNamespace":    "vmNamespace",
	})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if capturedPath != "/testCluster/apis/subresources.kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName/start" {
		t.Fatalf("path %s", capturedPath)
	}
	if capturedAuth != "Bearer test-vm-token" {
		t.Fatalf("auth %s", capturedAuth)
	}
	if capturedMethod != http.MethodPut {
		t.Fatalf("method %s", capturedMethod)
	}
}

func TestPauseAction(t *testing.T) {
	var capturedPath string
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{}`))
	}), nil)
	resp := doJSON(t, h, http.MethodPut, "/virtualmachineinstances/pause", map[string]string{
		"managedCluster": "testCluster",
		"vmName":         "vmName",
		"vmNamespace":    "vmNamespace",
	})
	resp.Body.Close()
	if capturedPath != "/testCluster/apis/subresources.kubevirt.io/v1/namespaces/vmNamespace/virtualmachineinstances/vmName/pause" {
		t.Fatalf("path %s", capturedPath)
	}
}

func TestSnapshotCreate(t *testing.T) {
	var capturedPath, capturedBody string
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		b, _ := io.ReadAll(r.Body)
		capturedBody = string(b)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{}`))
	}), nil)
	reqBody := map[string]any{"kind": "VirtualMachineSnapshot", "metadata": map[string]any{"name": "test-snapshot"}}
	resp := doJSON(t, h, http.MethodPost, "/virtualmachinesnapshots/create", map[string]any{
		"managedCluster": "testCluster",
		"vmName":         "vmName",
		"vmNamespace":    "vmNamespace",
		"reqBody":        reqBody,
	})
	resp.Body.Close()
	if capturedPath != "/testCluster/apis/snapshot.kubevirt.io/v1beta1/namespaces/vmNamespace/virtualmachinesnapshots" {
		t.Fatalf("path %s", capturedPath)
	}
	if !strings.Contains(capturedBody, "VirtualMachineSnapshot") {
		t.Fatalf("body %s", capturedBody)
	}
}

func TestActionUpstreamError(t *testing.T) {
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}), nil)
	resp := doJSON(t, h, http.MethodPut, "/virtualmachines/start", map[string]string{
		"managedCluster": "testCluster",
		"vmName":         "vmName",
		"vmNamespace":    "vmNamespace",
	})
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestGetVM(t *testing.T) {
	var capturedPath string
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{"kind":"VirtualMachine"}`))
	}), nil)
	resp := doJSON(t, h, http.MethodGet, "/virtualmachines/get/testCluster/vmName/vmNamespace", nil)
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if capturedPath != "/testCluster/apis/kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName" {
		t.Fatalf("path %s", capturedPath)
	}
	if !strings.Contains(string(body), "VirtualMachine") {
		t.Fatalf("body %s", body)
	}
}

func TestGetVMSnapshot(t *testing.T) {
	var capturedPath string
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"kind":"VirtualMachineSnapshot"}`))
	}), nil)
	resp := doJSON(t, h, http.MethodGet, "/multicloud/virtualmachinesnapshots/get/testCluster/vmName/vmNamespace", nil)
	resp.Body.Close()
	if capturedPath != "/testCluster/apis/snapshot.kubevirt.io/v1beta1/namespaces/vmNamespace/virtualmachinesnapshots/vmName" {
		t.Fatalf("path %s", capturedPath)
	}
}

func TestDeleteVM(t *testing.T) {
	var capturedPath, capturedMethod string
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		capturedMethod = r.Method
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{}`))
	}), nil)
	resp := doJSON(t, h, http.MethodDelete, "/virtualmachines/delete", map[string]any{
		"managedCluster": "testCluster",
		"vmName":         "vmName",
		"vmNamespace":    "vmNamespace",
		"reqBody":        map[string]any{},
	})
	resp.Body.Close()
	if capturedMethod != http.MethodDelete {
		t.Fatalf("method %s", capturedMethod)
	}
	if capturedPath != "/testCluster/apis/kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName" {
		t.Fatalf("path %s", capturedPath)
	}
}

func TestRestoreSnapshot(t *testing.T) {
	var capturedPath string
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedPath = r.URL.Path
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte(`{}`))
	}), nil)
	resp := doJSON(t, h, http.MethodPost, "/virtualmachinerestores", map[string]any{
		"managedCluster": "testCluster",
		"vmName":         "vmName",
		"vmNamespace":    "vmNamespace",
		"reqBody":        map[string]any{"kind": "VirtualMachineRestore"},
	})
	resp.Body.Close()
	if capturedPath != "/testCluster/apis/snapshot.kubevirt.io/v1beta1/namespaces/vmNamespace/virtualmachinerestores" {
		t.Fatalf("path %s", capturedPath)
	}
}

func TestFineGrainedUsesUserToken(t *testing.T) {
	var capturedAuth string
	up := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedAuth = r.Header.Get("Authorization")
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{}`))
	}))
	t.Cleanup(up.Close)
	target, _ := url.Parse(up.URL)
	h := vmproxy.New(vmproxy.Options{
		Resolver:    &clusterproxy.Resolver{Target: target},
		Validate:    func(context.Context, string) error { return nil },
		FineGrained: func(context.Context) (bool, error) { return true, nil },
	})
	resp := doJSON(t, h, http.MethodPut, "/virtualmachines/start", map[string]string{
		"managedCluster": "testCluster",
		"vmName":         "vmName",
		"vmNamespace":    "vmNamespace",
	})
	resp.Body.Close()
	if capturedAuth != "Bearer user-token" {
		t.Fatalf("auth %s", capturedAuth)
	}
}

func TestUsageMissingParams(t *testing.T) {
	h := newVMHandler(t, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}), nil)
	resp := doJSON(t, h, http.MethodGet, "/vmResourceUsage/cluster//namespace/vmNamespace", nil)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("status %d", resp.StatusCode)
	}
}

func TestUsageAggregate(t *testing.T) {
	h := newVMHandler(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case strings.Contains(r.URL.Path, "/apis/metrics.k8s.io/"):
			_, _ = w.Write([]byte(`{"items":[
				{"metadata":{"name":"centos-launcher","labels":{"vm.kubevirt.io/name":"centos"}},"containers":[
					{"usage":{"cpu":"6894867n","memory":"908492Ki"}},
					{"usage":{"cpu":"6894867n","memory":"908492Ki"}}
				]},
				{"metadata":{"name":"fedora-launcher","labels":{"vm.kubevirt.io/name":"fedora"}},"containers":[
					{"usage":{"cpu":"6894867n","memory":"908492Ki"}},
					{"usage":{"cpu":"6894867n","memory":"908492Ki"}}
				]}
			]}`))
		case strings.Contains(r.URL.Path, "/api/v1/namespaces/") && strings.Contains(r.URL.RawQuery, "labelSelector"):
			_, _ = w.Write([]byte(`{"items":[
				{"metadata":{"name":"centos-launcher"},"spec":{"containers":[{"resources":{"requests":{"cpu":"100m","memory":"2294Mi"}}}]}},
				{"metadata":{"name":"fedora-launcher"},"spec":{"containers":[{"resources":{"requests":{"cpu":"100m","memory":"2294Mi"}}},{"resources":{"requests":{"cpu":"100m","memory":"2294Mi"}}}]}}
			]}`))
		case strings.Contains(r.URL.Path, "/virtualmachineinstances/centos/filesystemlist"):
			_, _ = w.Write([]byte(`{"items":[{"totalBytes":32212254720,"usedBytes":1029201920}]}`))
		case strings.Contains(r.URL.Path, "/virtualmachineinstances/fedora/filesystemlist"):
			_, _ = w.Write([]byte(`{"items":[{"totalBytes":42949672960,"usedBytes":5368709120}]}`))
		default:
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
	}), nil)
	resp := doJSON(t, h, http.MethodGet, "/vmResourceUsage/cluster/testCluster/namespace/vmNamespace", nil)
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status %d", resp.StatusCode)
	}
	var got map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if int(got["cpu"].(float64)) != 28 {
		t.Fatalf("cpu %v", got["cpu"])
	}
	if int(got["memory"].(float64)) != 3548 {
		t.Fatalf("memory %v", got["memory"])
	}
	if int(got["storage"].(float64)) != 6 {
		t.Fatalf("storage %v", got["storage"])
	}
}
