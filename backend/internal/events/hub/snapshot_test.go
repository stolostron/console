// Copyright Contributors to the Open Cluster Management project

package hub

import (
	"strings"
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/stolostron/console/backend/internal/informers"
)

func fwd(kind, apiVersion, ns, name string) informers.ForwardedObject {
	meta := map[string]any{"name": name}
	if ns != "" {
		meta["namespace"] = ns
	}
	return informers.ForwardedObject{
		GVR: schema.GroupVersionResource{Version: "v1", Resource: strings.ToLower(kind) + "s"},
		Object: unstructured.Unstructured{Object: map[string]any{
			"apiVersion": apiVersion,
			"kind":       kind,
			"metadata":   meta,
		}},
	}
}

func typesOf(evs []Event) []string {
	out := make([]string, len(evs))
	for i, e := range evs {
		out[i] = e.Type
		if e.Type == TypeModified {
			if kind, _ := e.Object["kind"].(string); kind != "" {
				out[i] = kind
			}
		}
	}
	return out
}

func TestPacketizeEmptyEmitsEOP(t *testing.T) {
	got := packetize(nil)
	if len(got) != 1 || got[0].Type != TypeEOP {
		t.Fatalf("%+v", got)
	}
}

func TestPacketizePriorityAndModified(t *testing.T) {
	objs := []informers.ForwardedObject{
		fwd("Namespace", "v1", "", "z"),
		fwd("ManagedCluster", "cluster.open-cluster-management.io/v1", "", "b"),
		fwd("ManagedCluster", "cluster.open-cluster-management.io/v1", "", "a"),
		fwd("Secret", "v1", "ns", "s"),
	}
	got := packetize(objs)
	var kinds []string
	var eop int
	for _, e := range got {
		switch e.Type {
		case TypeEOP:
			eop++
		case TypeModified:
			kinds = append(kinds, e.Object["kind"].(string))
			if e.Type != TypeModified {
				t.Fatal("resources must be MODIFIED not ADDED")
			}
		default:
			t.Fatalf("unexpected %s", e.Type)
		}
	}
	if eop != 1 {
		t.Fatalf("EOP count %d", eop)
	}
	if kinds[0] != "ManagedCluster" || kinds[1] != "ManagedCluster" || kinds[2] != "Secret" || kinds[3] != "Namespace" {
		t.Fatalf("order %v", kinds)
	}
	name0, _ := got[0].Object["metadata"].(map[string]any)["name"].(string)
	name1, _ := got[1].Object["metadata"].(map[string]any)["name"].(string)
	if name0 != "a" || name1 != "b" {
		t.Fatalf("cluster sort %s %s", name0, name1)
	}
}

func TestSnapshotEventsShape(t *testing.T) {
	h := New(nil, func() map[string]string { return map[string]string{"LOG_LEVEL": "info"} })
	got := h.snapshotEvents()
	if got[0].Type != TypeStart || got[1].Type != TypeSettings || got[len(got)-1].Type != TypeLoaded {
		t.Fatalf("%v", typesOf(got))
	}
	if got[1].Settings["LOG_LEVEL"] != "info" {
		t.Fatalf("settings %+v", got[1].Settings)
	}
	if got[2].Type != TypeEOP {
		t.Fatalf("empty snapshot should EOP before LOADED, got %v", typesOf(got))
	}
}
