// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"testing"
)

func TestDefaultWatchSpecsCount(t *testing.T) {
	specs := DefaultWatchSpecs()
	if len(specs) != 68 {
		t.Fatalf("got %d specs, want 68", len(specs))
	}
	var polled, cacheOnly, withSel int
	for _, s := range specs {
		if s.Polled {
			polled++
		}
		if !s.ForwardEventsToClients {
			cacheOnly++
		}
		if len(s.LabelSelector) > 0 || len(s.FieldSelector) > 0 {
			withSel++
		}
	}
	if polled != 2 {
		t.Fatalf("polled=%d want 2", polled)
	}
	if cacheOnly != 2 {
		t.Fatalf("cacheOnly=%d want 2 (Authentication, MultiClusterHub)", cacheOnly)
	}
	if withSel != 12 {
		t.Fatalf("selector specs=%d want 12", withSel)
	}
}

func TestWatchSpecBuilders(t *testing.T) {
	s := watch("Secret", "v1").
		labels("cluster.open-cluster-management.io/type", "ans").
		fields("metadata.name", "auto-import-secret").
		polled().
		cacheOnly()
	if s.LabelSelector["cluster.open-cluster-management.io/type"] != "ans" {
		t.Fatal("labels")
	}
	if s.FieldSelector["metadata.name"] != "auto-import-secret" {
		t.Fatal("fields")
	}
	if !s.Polled || s.ForwardEventsToClients {
		t.Fatal("polled/cacheOnly")
	}
	key := s.SpecKey()
	want := "v1|Secret|cluster.open-cluster-management.io/type=ans|metadata.name=auto-import-secret"
	if key != want {
		t.Fatalf("got %q want %q", key, want)
	}
}

func TestWatchSpecDefaultForwardsEvents(t *testing.T) {
	s := watch("Namespace", "v1")
	if !s.ForwardEventsToClients {
		t.Fatal("default should forward")
	}
}

func TestShouldForward(t *testing.T) {
	cases := []struct {
		name string
		spec WatchSpec
		want bool
	}{
		{"default", watch("Namespace", "v1"), true},
		{"cacheOnly", watch("Authentication", "config.openshift.io/v1").cacheOnly(), false},
		{"polled", watch("Application", "argoproj.io/v1alpha1").polled(), false},
		{"polledAndCacheOnly", watch("Secret", "v1").polled().cacheOnly(), false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.spec.ShouldForward(); got != tc.want {
				t.Fatalf("ShouldForward()=%v want %v", got, tc.want)
			}
		})
	}
}

func TestDefaultWatchSpecsShouldForwardCount(t *testing.T) {
	var forward, skip int
	for _, s := range DefaultWatchSpecs() {
		if s.ShouldForward() {
			forward++
		} else {
			skip++
		}
	}
	if forward != 64 {
		t.Fatalf("forward=%d want 64", forward)
	}
	if skip != 4 {
		t.Fatalf("skip=%d want 4 (2 polled + 2 cacheOnly)", skip)
	}
}

func TestSelectorQueryEmpty(t *testing.T) {
	if SelectorQuery(nil) != "" {
		t.Fatal("expected empty")
	}
}

func TestSelectorQueryOrder(t *testing.T) {
	got := SelectorQuery(map[string]string{"metadata.namespace": "mce", "metadata.name": "svc"})
	if got != "metadata.name=svc,metadata.namespace=mce" {
		t.Fatal(got)
	}
}
