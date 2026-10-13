// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"testing"
	"time"

	"k8s.io/apimachinery/pkg/runtime/schema"
)

var compliantValues = []string{"Compliant", "NonCompliant", "Pending"}

func testFlapConfig() flapConfig {
	return flapConfig{
		threshold: 5,
		window:    time.Minute,
		cooldown:  time.Minute,
		settling:  time.Minute,
		ttl:       12 * time.Hour,
		interval:  time.Minute,
	}
}

func policyWithCompliant(name, namespace string, changeIndex int) map[string]any {
	return map[string]any{
		"kind":       policyKind,
		"apiVersion": "policy.open-cluster-management.io/v1",
		"metadata":   map[string]any{"name": name, "namespace": namespace, "uid": namespace + "-" + name},
		"status":     map[string]any{"compliant": compliantValues[changeIndex%len(compliantValues)]},
	}
}

func throttlePolicyAt(s *flapState, name, namespace string, at time.Time) {
	s.shouldThrottle(policyWithCompliant(name, namespace, 0), at.Add(-s.cfg.settling-100*time.Millisecond), schema.GroupVersionResource{})
	for i := 0; i <= s.cfg.threshold; i++ {
		when := at.Add(-time.Duration(s.cfg.threshold-i) * 100 * time.Millisecond)
		s.shouldThrottle(policyWithCompliant(name, namespace, i+1), when, schema.GroupVersionResource{})
	}
}

func TestFormatFlappingMessage(t *testing.T) {
	cfg := testFlapConfig()
	got := formatFlappingMessage("Policy", "default", "policy-a", cfg)
	want := "Policy policy-a in namespace default has been modified more than 5 times in the last 1 minutes. Verify this resource is configured correctly. Updates are being limited to 1 times per minute."
	if got != want {
		t.Fatalf("got %q", got)
	}
}

func TestShouldThrottleResetsOnSpecChange(t *testing.T) {
	s := newFlapState(testFlapConfig())
	base := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(s, "spec-change", "default", base.Add(s.cfg.settling+time.Duration(s.cfg.threshold)+time.Millisecond))

	obj := policyWithCompliant("spec-change", "default", 0)
	obj["spec"] = map[string]any{"disabled": true}
	if s.shouldThrottle(obj, base.Add(s.cfg.settling+time.Duration(s.cfg.threshold)+2*time.Millisecond), schema.GroupVersionResource{}) {
		t.Fatal("spec change should not throttle")
	}
	entry := s.entry("Policy", "default", "spec-change")
	if entry == nil {
		t.Fatal("missing entry")
	}
	if entry.throttled {
		t.Fatal("expected throttle cleared")
	}
	if entry.hasSpec {
		t.Fatal("expected lastSpec cleared")
	}
}

func TestShouldThrottleNeverNonPolicy(t *testing.T) {
	s := newFlapState(testFlapConfig())
	now := time.Unix(1_700_000_000, 0)
	for i := 0; i < s.cfg.threshold+10; i++ {
		obj := map[string]any{
			"kind":       "ManagedCluster",
			"apiVersion": "cluster.open-cluster-management.io/v1",
			"metadata":   map[string]any{"name": "cluster-a", "namespace": ""},
		}
		if s.shouldThrottle(obj, now.Add(time.Duration(i)*time.Millisecond), schema.GroupVersionResource{}) {
			t.Fatal("ManagedCluster must not throttle")
		}
	}
}

func TestShouldThrottleWaitsForSettling(t *testing.T) {
	s := newFlapState(testFlapConfig())
	base := time.Unix(1_700_000_000, 0)
	for i := 0; i <= s.cfg.threshold; i++ {
		s.shouldThrottle(policyWithCompliant("policy-a", "default", i), base.Add(time.Duration(i)*time.Millisecond), schema.GroupVersionResource{})
		entry := s.entry("Policy", "default", "policy-a")
		if entry.throttled {
			t.Fatal("must not throttle during settling")
		}
	}
	s.shouldThrottle(policyWithCompliant("policy-a", "default", s.cfg.threshold+1), base.Add(s.cfg.settling+time.Millisecond), schema.GroupVersionResource{})
	if !s.entry("Policy", "default", "policy-a").throttled {
		t.Fatal("expected throttled after settling")
	}
}

func TestShouldThrottlePolicyAfterThreshold(t *testing.T) {
	s := newFlapState(testFlapConfig())
	at := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(s, "flappy", "default", at)
	if !s.shouldThrottle(policyWithCompliant("flappy", "default", 99), at.Add(100*time.Millisecond), schema.GroupVersionResource{}) {
		t.Fatal("expected suppress within cooldown")
	}
	if s.shouldThrottle(policyWithCompliant("flappy", "default", 100), at.Add(s.cfg.cooldown), schema.GroupVersionResource{}) {
		t.Fatal("expected allow at cooldown")
	}
}

func TestShouldThrottleAllowsOncePerCooldown(t *testing.T) {
	s := newFlapState(testFlapConfig())
	base := time.Unix(1_700_000_000, 0)
	throttledAt := base.Add(s.cfg.settling + time.Duration(s.cfg.threshold)*100*time.Millisecond)
	throttlePolicyAt(s, "periodic", "default", throttledAt)
	if !s.shouldThrottle(policyWithCompliant("periodic", "default", s.cfg.threshold+2), throttledAt.Add(100*time.Millisecond), schema.GroupVersionResource{}) {
		t.Fatal("expected suppress")
	}
	if s.shouldThrottle(policyWithCompliant("periodic", "default", s.cfg.threshold+3), throttledAt.Add(s.cfg.cooldown), schema.GroupVersionResource{}) {
		t.Fatal("expected allow after cooldown")
	}
}

func TestCheckThrottleStatusRecoversAfterCooldown(t *testing.T) {
	s := newFlapState(testFlapConfig())
	base := time.Unix(1_700_000_000, 0)
	throttledAt := base.Add(s.cfg.settling + time.Duration(s.cfg.threshold)*100*time.Millisecond)
	throttlePolicyAt(s, "recovering", "ns1", throttledAt)
	recovered := s.recover(throttledAt.Add(s.cfg.cooldown + time.Millisecond))
	if len(recovered) != 1 {
		t.Fatalf("recovered %d", len(recovered))
	}
	entry := s.entry("Policy", "ns1", "recovering")
	if entry.throttled {
		t.Fatal("expected recovered")
	}
	if !entry.lastCached.IsZero() {
		t.Fatal("expected lastCached reset")
	}
}

func TestForgetDropsThrottledEntry(t *testing.T) {
	s := newFlapState(testFlapConfig())
	at := time.Unix(1_700_000_000, 0)
	throttlePolicyAt(s, "gone", "default", at)
	s.forget(policyWithCompliant("gone", "default", 0))
	if entry := s.entry("Policy", "default", "gone"); entry != nil {
		t.Fatal("expected entry removed")
	}
	if recovered := s.recover(at.Add(s.cfg.cooldown + time.Millisecond)); len(recovered) != 0 {
		t.Fatalf("recovered %d after forget", len(recovered))
	}
}

func replicatedFlappingPolicy(rootNS, rootName, cluster string) map[string]any {
	return map[string]any{
		"kind":       policyKind,
		"apiVersion": "policy.open-cluster-management.io/v1",
		"metadata": map[string]any{
			"name":      rootNS + "." + rootName,
			"namespace": cluster,
			"uid":       cluster + "-" + rootName,
			"labels": map[string]any{
				rootPolicyLabel:  rootNS + "." + rootName,
				clusterNameLabel: cluster,
			},
		},
		"status": map[string]any{
			"compliant": "Compliant",
			"details": []any{
				map[string]any{
					"compliant": "Compliant",
					"history": []any{
						map[string]any{"message": "Compliant; notification - configmaps [kike-flap-cm] was updated successfully"},
						map[string]any{"message": "NonCompliant; violation - configmaps [kike-flap-cm] found but not as specified"},
					},
				},
			},
		},
	}
}

func rootPolicy(namespace, name, cluster, compliant string) map[string]any {
	return map[string]any{
		"kind":       policyKind,
		"apiVersion": "policy.open-cluster-management.io/v1",
		"metadata":   map[string]any{"name": name, "namespace": namespace, "uid": namespace + "-" + name},
		"status": map[string]any{
			"compliant": compliant,
			"status": []any{
				map[string]any{"clustername": cluster, "clusternamespace": cluster, "compliant": compliant},
			},
		},
	}
}

func TestThrottledPolicyKeepsRecentViolation(t *testing.T) {
	s := newFlapState(testFlapConfig())
	at := time.Unix(1_700_000_000, 0)
	obj := replicatedFlappingPolicy("default", "kike-foo", "weekly")
	s.shouldThrottle(obj, at.Add(-s.cfg.settling-time.Second), schema.GroupVersionResource{})
	now := at
	var suppressed bool
	for i := 0; i < s.cfg.threshold+1; i++ {
		obj = replicatedFlappingPolicy("default", "kike-foo", "weekly")
		suppressed = s.shouldThrottle(obj, now, schema.GroupVersionResource{})
		now = now.Add(time.Millisecond)
	}
	if suppressed {
		t.Fatal("crossing the threshold should publish the violation")
	}
	status, _ := obj["status"].(map[string]any)
	if obj["throttled"] != true || status["compliant"] != "NonCompliant" {
		t.Fatalf("published object = %#v", obj["status"])
	}

	follow := replicatedFlappingPolicy("default", "kike-foo", "weekly")
	if !s.shouldThrottle(follow, now, schema.GroupVersionResource{}) {
		t.Fatal("expected the compliant follow-up to be suppressed")
	}
	next, ok := s.clientPolicy("weekly", "default.kike-foo", follow)
	if !ok {
		t.Fatal("expected throttled snapshot")
	}
	nextStatus, _ := next["status"].(map[string]any)
	if next["throttled"] != true || nextStatus["compliant"] != "NonCompliant" {
		t.Fatalf("snapshot lost the violation: %#v", nextStatus)
	}

	rootLive := rootPolicy("default", "kike-foo", "weekly", "Compliant")
	rootNext, ok := s.clientPolicy("default", "kike-foo", rootLive)
	if !ok {
		t.Fatal("expected root projection")
	}
	rootStatus, _ := rootNext["status"].(map[string]any)
	if rootStatus["compliant"] != "NonCompliant" {
		t.Fatalf("root compliant = %v", rootStatus["compliant"])
	}
	clusters, _ := rootStatus["status"].([]any)
	cluster, _ := clusters[0].(map[string]any)
	if cluster["clustername"] != "weekly" || cluster["compliant"] != "NonCompliant" {
		t.Fatalf("cluster status = %#v", cluster)
	}
}
