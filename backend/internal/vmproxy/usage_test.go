// Copyright Contributors to the Open Cluster Management project

package vmproxy

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/stolostron/console/backend/internal/clusterproxy"
)

func TestParseUsagePath(t *testing.T) {
	cases := []struct {
		path            string
		cluster         string
		namespace       string
		ok              bool
	}{
		{"/vmResourceUsage/cluster/c1/namespace/ns1", "c1", "ns1", true},
		{"/vmResourceUsage/cluster/c1/namespace/ns1/", "c1", "ns1", true},
		{"/vmResourceUsage/cluster/", "", "", false},
		{"/vmResourceUsage/cluster/c1/namespace/", "c1", "", true},
		{"/other/path", "", "", false},
		{"", "", "", false},
	}
	for _, tc := range cases {
		cluster, namespace, ok := parseUsagePath(tc.path)
		if ok != tc.ok || cluster != tc.cluster || namespace != tc.namespace {
			t.Fatalf("%q: got cluster=%q namespace=%q ok=%v want cluster=%q namespace=%q ok=%v",
				tc.path, cluster, namespace, ok, tc.cluster, tc.namespace, tc.ok)
		}
	}
}

func TestAggregateUsage_SkipsUnmatchedPods(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case strings.Contains(r.URL.Path, "/apis/metrics.k8s.io/"):
			_, _ = w.Write([]byte(`{"items":[
				{"metadata":{"name":"orphan-launcher","labels":{}},"containers":[{"usage":{"cpu":"1000000n","memory":"100Ki"}}]},
				{"metadata":{"name":"centos-launcher","labels":{"vm.kubevirt.io/name":"centos"}},"containers":[{"usage":{"cpu":"2000000n","memory":"200Ki"}}]}
			]}`))
		case strings.Contains(r.URL.Path, "/api/v1/namespaces/"):
			_, _ = w.Write([]byte(`{"items":[
				{"metadata":{"name":"centos-launcher"},"spec":{"containers":[{"resources":{"requests":{"cpu":"100m","memory":"128Mi"}}}]}}
			]}`))
		case strings.Contains(r.URL.Path, "/virtualmachineinstances/centos/filesystemlist"):
			_, _ = w.Write([]byte(`{"items":[{"totalBytes":1073741824,"usedBytes":536870912}]}`))
		default:
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
	}))
	t.Cleanup(ts.Close)

	target, err := url.Parse(ts.URL)
	if err != nil {
		t.Fatal(err)
	}
	h := New(Options{Resolver: &clusterproxy.Resolver{Target: target}})

	got, err := h.aggregateUsage(context.Background(), ts.URL, "cluster", "ns", "token")
	if err != nil {
		t.Fatal(err)
	}
	if len(got.VmisUsage) != 1 {
		t.Fatalf("vmisUsage len=%d", len(got.VmisUsage))
	}
	if got.VmisUsage[0].VmiName != "centos" {
		t.Fatalf("vmi %q", got.VmisUsage[0].VmiName)
	}
}

func TestAggregateUsage_EmptyMetrics(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if strings.Contains(r.URL.Path, "/apis/metrics.k8s.io/") {
			_, _ = w.Write([]byte(`{"items":[]}`))
			return
		}
		if strings.Contains(r.URL.Path, "/api/v1/namespaces/") {
			_, _ = w.Write([]byte(`{"items":[]}`))
			return
		}
		t.Fatalf("unexpected path %s", r.URL.Path)
	}))
	t.Cleanup(ts.Close)

	target, err := url.Parse(ts.URL)
	if err != nil {
		t.Fatal(err)
	}
	h := New(Options{Resolver: &clusterproxy.Resolver{Target: target}})

	got, err := h.aggregateUsage(context.Background(), ts.URL, "cluster", "ns", "token")
	if err != nil {
		t.Fatal(err)
	}
	if len(got.VmisUsage) != 0 || got.CPU != 0 || got.Memory != 0 || got.Storage != 0 {
		t.Fatalf("expected empty usage, got %#v", got)
	}
}

func TestGetJSON_DecodesResponse(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-token" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"items":[{"metadata":{"name":"pod-a"}}]}`))
	}))
	t.Cleanup(ts.Close)

	h := New(Options{})
	h.addonClient = ts.Client()

	var list podListType
	if err := h.getJSON(context.Background(), ts.URL, "test-token", &list); err != nil {
		t.Fatal(err)
	}
	if len(list.Items) != 1 || list.Items[0].Metadata.Name != "pod-a" {
		t.Fatalf("list %#v", list)
	}
}

func TestUsageResponseJSONShape(t *testing.T) {
	resp := usageResponse{
		CPU:     10,
		Memory:  20,
		Storage: 30,
		VmisUsage: []vmiUsage{{
			PodName: "pod", VmiName: "vm", ClusterName: "c", Namespace: "ns",
			CPU: usageMetrics{Requested: 100, Usage: 50, UsagePercent: 50},
		}},
	}
	b, err := json.Marshal(resp)
	if err != nil {
		t.Fatal(err)
	}
	var decoded map[string]any
	if err := json.Unmarshal(b, &decoded); err != nil {
		t.Fatal(err)
	}
	if decoded["cpu"].(float64) != 10 {
		t.Fatalf("cpu %v", decoded["cpu"])
	}
	vmis := decoded["vmisUsage"].([]any)
	if len(vmis) != 1 {
		t.Fatalf("vmisUsage len %d", len(vmis))
	}
}
