// Copyright Contributors to the Open Cluster Management project

package informers

import (
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/tools/cache"
)

func TestAsUnstructuredVariants(t *testing.T) {
	ptr := uObj("v1", "Pod", "ns", "p", "uid-1", nil)
	if got, ok := asUnstructured(ptr); !ok || got.GetName() != "p" {
		t.Fatalf("ptr %+v", got)
	}
	val := *ptr
	if got, ok := asUnstructured(val); !ok || got.GetName() != "p" {
		t.Fatalf("val %+v", got)
	}
	tomb := cache.DeletedFinalStateUnknown{Obj: ptr}
	if got, ok := asUnstructured(tomb); !ok || got.GetName() != "p" {
		t.Fatalf("tombstone %+v", got)
	}
	if _, ok := asUnstructured(struct{}{}); ok {
		t.Fatal("expected false for unknown type")
	}
}

func TestTransformForSetsKindAndStripsManagedFields(t *testing.T) {
	mf := []any{map[string]any{"manager": "kubectl"}}
	in := uObj("v1", "Namespace", "", "default", "uid", map[string]any{"managedFields": mf})
	spec := watch("Namespace", "v1")
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)
	if u.GetKind() != "Namespace" || u.GetAPIVersion() != "v1" {
		t.Fatalf("metadata %+v", u.Object)
	}
	if len(managedFieldsOf(u)) != 0 {
		t.Fatal("managedFields should be stripped")
	}
}

func TestTransformForKeepsPolicyManagedFields(t *testing.T) {
	mf := []any{map[string]any{"manager": "kubectl"}}
	in := uObj("policy.open-cluster-management.io/v1", "Policy", "ns", "p", "uid", map[string]any{"managedFields": mf})
	spec := watch("Policy", "policy.open-cluster-management.io/v1")
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)
	if len(managedFieldsOf(u)) == 0 {
		t.Fatal("Policy should keep managedFields")
	}
}

func TestTransformForPassthroughNonUnstructured(t *testing.T) {
	raw := "not-a-resource"
	out, err := transformFor(watch("Pod", "v1"))(raw)
	if err != nil || out != raw {
		t.Fatalf("got %v err %v", out, err)
	}
}

func TestTransformForStripsAddonFields(t *testing.T) {
	in := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "addon.open-cluster-management.io/v1alpha1",
		"kind":       "ManagedClusterAddOn",
		"metadata": map[string]any{
			"name":      "work-manager",
			"namespace": "cluster1",
			"uid":       "uid-1",
			"annotations": map[string]any{
				"console.open-cluster-management.io/launch-link": "https://example.com",
			},
		},
		"spec": map[string]any{
			"installNamespace": "open-cluster-management-agent-addon",
		},
		"status": map[string]any{
			"registrations": []any{
				map[string]any{"signerName": "s", "subject": map[string]any{"groups": []any{"g"}}},
			},
			"supportedConfigs": []any{
				map[string]any{"group": "g", "resource": "r"},
			},
			"configReferences": []any{
				map[string]any{"group": "g", "resource": "r", "name": "n", "namespace": "ns"},
			},
			"healthCheck": map[string]any{"mode": "Lease"},
			"namespace":   "open-cluster-management-agent-addon",
			"addOnMeta":   map[string]any{"displayName": "Work Manager", "description": "desc"},
			"addOnConfiguration": map[string]any{
				"crdName": "klusterletconfigs.config.open-cluster-management.io",
				"crName":  "klusterletconfig",
			},
			"conditions": []any{
				map[string]any{
					"type": "Available", "status": "True",
					"message": "ok", "reason": "ManagedClusterAddOnLeaseUpdated",
					"lastTransitionTime": "2024-01-01T00:00:00Z",
				},
			},
		},
	}}

	spec := watch("ManagedClusterAddOn", "addon.open-cluster-management.io/v1alpha1")
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)

	for _, path := range [][]string{
		{"status", "registrations"},
		{"status", "supportedConfigs"},
		{"status", "configReferences"},
		{"status", "healthCheck"},
		{"status", "namespace"},
	} {
		if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, path...); found {
			t.Errorf("expected %v to be stripped", path)
		}
	}

	conds, _, _ := unstructured.NestedSlice(u.Object, "status", "conditions")
	if len(conds) != 1 {
		t.Fatalf("expected 1 condition, got %d", len(conds))
	}
	c := conds[0].(map[string]any)
	if _, ok := c["reason"]; !ok {
		t.Error("condition.reason must be kept")
	}
	if _, ok := c["lastTransitionTime"]; ok {
		t.Error("condition.lastTransitionTime should be stripped")
	}

	if v, _, _ := unstructured.NestedString(u.Object, "status", "addOnMeta", "displayName"); v != "Work Manager" {
		t.Error("addOnMeta.displayName must be kept")
	}
	if v, _, _ := unstructured.NestedString(u.Object, "spec", "installNamespace"); v != "open-cluster-management-agent-addon" {
		t.Error("spec.installNamespace must be kept")
	}
	if u.GetName() != "work-manager" || u.GetNamespace() != "cluster1" {
		t.Error("metadata.name and namespace must be kept")
	}
}

func TestTransformForStripsManagedClusterFields(t *testing.T) {
	in := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "cluster.open-cluster-management.io/v1",
		"kind":       "ManagedCluster",
		"metadata": map[string]any{
			"name": "cluster1",
			"uid":  "uid-1",
			"labels": map[string]any{
				"local-cluster": "true",
				"cloud":         "Amazon",
			},
		},
		"spec": map[string]any{
			"hubAcceptsClient": true,
			"managedClusterClientConfigs": []any{
				map[string]any{
					"url":      "https://api.cluster1.example.com:6443",
					"caBundle": "LS0tLS1CRUdJTi...(large base64 cert)...",
				},
			},
			"leaseDurationSeconds": int64(60),
			"taints": []any{
				map[string]any{"key": "node.open-cluster-management.io/unreachable", "effect": "NoSelect"},
			},
		},
		"status": map[string]any{
			"allocatable": map[string]any{"cpu": "8", "memory": "32Gi"},
			"capacity":    map[string]any{"cpu": "8", "memory": "32Gi"},
			"version":     map[string]any{"kubernetes": "v1.28.0"},
			"clusterClaims": []any{
				map[string]any{"name": "id.k8s.io", "value": "cluster1-id"},
			},
			"conditions": []any{
				map[string]any{
					"type": "ManagedClusterConditionAvailable", "status": "True",
					"reason": "ManagedClusterAvailable", "message": "ok",
					"lastTransitionTime": "2024-01-01T00:00:00Z",
				},
			},
		},
	}}

	spec := watch("ManagedCluster", "cluster.open-cluster-management.io/v1").cluster()
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)

	for _, path := range [][]string{
		{"spec", "managedClusterClientConfigs"},
		{"spec", "leaseDurationSeconds"},
		{"spec", "taints"},
		{"status", "allocatable"},
		{"status", "capacity"},
		{"status", "version"},
	} {
		if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, path...); found {
			t.Errorf("expected %v to be stripped", path)
		}
	}

	conds, _, _ := unstructured.NestedSlice(u.Object, "status", "conditions")
	if len(conds) != 1 {
		t.Fatalf("expected 1 condition, got %d", len(conds))
	}
	c := conds[0].(map[string]any)
	if _, ok := c["lastTransitionTime"]; ok {
		t.Error("condition.lastTransitionTime should be stripped")
	}
	if _, ok := c["type"]; !ok {
		t.Error("condition.type must be kept")
	}

	if v, _, _ := unstructured.NestedBool(u.Object, "spec", "hubAcceptsClient"); !v {
		t.Error("spec.hubAcceptsClient must be kept")
	}
	claims, _, _ := unstructured.NestedSlice(u.Object, "status", "clusterClaims")
	if len(claims) != 1 {
		t.Error("clusterClaims must be kept")
	}
	if u.GetLabels()["cloud"] != "Amazon" {
		t.Error("metadata.labels must be kept")
	}
}

func TestTransformForStripsManagedClusterInfoFields(t *testing.T) {
	in := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "internal.open-cluster-management.io/v1beta1",
		"kind":       "ManagedClusterInfo",
		"metadata": map[string]any{
			"name":      "cluster1",
			"namespace": "cluster1",
			"uid":       "uid-1",
		},
		"spec": map[string]any{
			"masterEndpoint": "https://api.cluster1.example.com:6443",
			"loggingCA":      "LS0tLS1CRUdJTi...",
		},
		"status": map[string]any{
			"consoleURL":      "https://console.cluster1.example.com",
			"version":         "v1.28.0",
			"kubeVendor":      "OpenShift",
			"cloudVendor":     "Amazon",
			"clusterID":       "abc-123",
			"loggingEndpoint": map[string]any{"ip": "10.0.0.1"},
			"loggingPort":     map[string]any{"port": int64(9200)},
			"distributionInfo": map[string]any{
				"type": "OCP",
				"ocp":  map[string]any{"version": "4.14.0"},
			},
			"conditions": []any{
				map[string]any{
					"type": "Upgradeable", "status": "True",
					"reason": "UpgradeReady", "message": "ok",
					"lastTransitionTime": "2024-01-01T00:00:00Z",
				},
			},
			"nodeList": []any{
				map[string]any{
					"name":     "node1",
					"capacity": map[string]any{"cpu": "8"},
					"conditions": []any{
						map[string]any{
							"type": "Ready", "status": "True",
							"lastTransitionTime": "2024-01-01T00:00:00Z",
						},
					},
				},
			},
		},
	}}

	spec := watch("ManagedClusterInfo", "internal.open-cluster-management.io/v1beta1")
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)

	for _, path := range [][]string{
		{"spec", "loggingCA"},
		{"status", "loggingEndpoint"},
		{"status", "loggingPort"},
		{"status", "kubeVendor"},
		{"status", "cloudVendor"},
		{"status", "clusterID"},
	} {
		if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, path...); found {
			t.Errorf("expected %v to be stripped", path)
		}
	}

	conds, _, _ := unstructured.NestedSlice(u.Object, "status", "conditions")
	if len(conds) != 1 {
		t.Fatalf("expected 1 condition, got %d", len(conds))
	}
	c := conds[0].(map[string]any)
	if _, ok := c["lastTransitionTime"]; ok {
		t.Error("condition.lastTransitionTime should be stripped")
	}

	nodes, _, _ := unstructured.NestedSlice(u.Object, "status", "nodeList")
	if len(nodes) != 1 {
		t.Fatal("expected 1 node")
	}
	node := nodes[0].(map[string]any)
	nodeConds := node["conditions"].([]any)
	nc := nodeConds[0].(map[string]any)
	if _, ok := nc["lastTransitionTime"]; ok {
		t.Error("node condition.lastTransitionTime should be stripped")
	}

	if v, _, _ := unstructured.NestedString(u.Object, "spec", "masterEndpoint"); v == "" {
		t.Error("spec.masterEndpoint must be kept")
	}
	if v, _, _ := unstructured.NestedString(u.Object, "status", "consoleURL"); v == "" {
		t.Error("status.consoleURL must be kept")
	}
	if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, "status", "distributionInfo"); !found {
		t.Error("status.distributionInfo must be kept")
	}
}

func TestTransformForStripsApplicationSetFields(t *testing.T) {
	in := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "ApplicationSet",
		"metadata": map[string]any{
			"name":              "my-appset",
			"namespace":         "openshift-gitops",
			"uid":               "uid-1",
			"creationTimestamp":  "2024-01-01T00:00:00Z",
		},
		"spec": map[string]any{
			"generators": []any{
				map[string]any{
					"clusterDecisionResource": map[string]any{
						"labelSelector": map[string]any{
							"matchLabels": map[string]any{
								"cluster.open-cluster-management.io/placement": "my-placement",
							},
						},
					},
				},
			},
			"template": map[string]any{
				"metadata": map[string]any{
					"name": "{{name}}-app",
					"labels": map[string]any{
						"app": "test",
					},
					"annotations": map[string]any{
						"apps.open-cluster-management.io/ocm-managed-cluster": "true",
					},
				},
				"spec": map[string]any{
					"destination": map[string]any{"namespace": "default"},
					"source": map[string]any{
						"repoURL": "https://github.com/example/repo",
						"path":    "manifests",
					},
					"project": "default",
				},
			},
		},
		"status": map[string]any{
			"conditions": []any{
				map[string]any{
					"type": "ErrorOccurred", "status": "True",
					"message": "long error message here",
					"reason":  "ApplicationValidationError",
				},
				map[string]any{
					"type": "ResourcesUpToDate", "status": "False",
					"message": "another message",
					"reason":  "ErrorOccurred",
				},
			},
			"health": map[string]any{
				"status":  "Degraded",
				"message": "error details",
			},
		},
	}}

	spec := watch("ApplicationSet", "argoproj.io/v1alpha1").polled()
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)

	for _, path := range [][]string{
		{"status", "conditions"},
		{"status", "health"},
		{"spec", "template", "spec"},
		{"spec", "template", "metadata", "name"},
		{"spec", "template", "metadata", "labels"},
	} {
		if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, path...); found {
			t.Errorf("expected %v to be stripped", path)
		}
	}

	if v, _, _ := unstructured.NestedString(u.Object, "spec", "template", "metadata", "annotations",
		"apps.open-cluster-management.io/ocm-managed-cluster"); v != "true" {
		t.Error("spec.template.metadata.annotations must be kept (used by isArgoPullModel)")
	}

	if u.GetName() != "my-appset" || u.GetNamespace() != "openshift-gitops" {
		t.Error("metadata must be kept")
	}
	if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, "spec", "generators"); !found {
		t.Error("spec.generators must be kept")
	}
}

func TestTransformForStripsArgoApplicationFields(t *testing.T) {
	in := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "argoproj.io/v1alpha1",
		"kind":       "Application",
		"metadata": map[string]any{
			"name":      "my-app",
			"namespace": "openshift-gitops",
			"uid":       "uid-1",
		},
		"spec": map[string]any{
			"destination": map[string]any{
				"namespace": "default",
				"server":    "https://kubernetes.default.svc",
			},
			"source": map[string]any{
				"repoURL": "https://github.com/example/repo",
				"path":    "manifests",
			},
		},
		"status": map[string]any{
			"operationState": map[string]any{
				"phase":      "Succeeded",
				"message":    "successfully synced",
				"startedAt":  "2024-01-01T00:00:00Z",
				"finishedAt": "2024-01-01T00:01:00Z",
				"syncResult": map[string]any{
					"resources": []any{
						map[string]any{"kind": "Deployment", "name": "app"},
					},
				},
			},
			"history": []any{
				map[string]any{
					"id":        float64(1),
					"revision":  "abc123",
					"deployedAt": "2024-01-01T00:00:00Z",
				},
			},
			"health": map[string]any{"status": "Healthy"},
			"sync":   map[string]any{"status": "Synced"},
			"resources": []any{
				map[string]any{
					"kind": "Deployment", "name": "app",
					"namespace": "default", "status": "Synced",
				},
			},
		},
	}}

	spec := watch("Application", "argoproj.io/v1alpha1").polled()
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)

	if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, "status", "operationState"); found {
		t.Error("status.operationState should be stripped from Argo Application")
	}
	if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, "status", "history"); found {
		t.Error("status.history should be stripped from Argo Application")
	}

	if v, _, _ := unstructured.NestedString(u.Object, "status", "health", "status"); v != "Healthy" {
		t.Error("status.health must be kept")
	}
	if v, _, _ := unstructured.NestedString(u.Object, "status", "sync", "status"); v != "Synced" {
		t.Error("status.sync must be kept")
	}
	resources, found, _ := unstructured.NestedSlice(u.Object, "status", "resources")
	if !found || len(resources) != 1 {
		t.Error("status.resources must be kept")
	}
	if _, found, _ := unstructured.NestedFieldNoCopy(u.Object, "spec", "destination"); !found {
		t.Error("spec.destination must be kept")
	}
}

func TestTransformForDoesNotStripNonArgoApplication(t *testing.T) {
	in := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "app.k8s.io/v1beta1",
		"kind":       "Application",
		"metadata":   map[string]any{"name": "sub-app", "namespace": "ns", "uid": "uid-1"},
		"status": map[string]any{
			"conditions": []any{
				map[string]any{"type": "Ready", "status": "True"},
			},
		},
	}}
	spec := watch("Application", "app.k8s.io/v1beta1")
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)
	conds, found, _ := unstructured.NestedSlice(u.Object, "status", "conditions")
	if !found || len(conds) != 1 {
		t.Error("non-Argo Application should NOT have conditions stripped")
	}
}

func TestTransformForDoesNotStripNonTargetKinds(t *testing.T) {
	in := &unstructured.Unstructured{Object: map[string]any{
		"apiVersion": "v1",
		"kind":       "Namespace",
		"metadata":   map[string]any{"name": "test", "uid": "uid-1"},
		"status": map[string]any{
			"conditions": []any{
				map[string]any{
					"type": "Ready", "status": "True",
					"reason": "AllGood", "lastTransitionTime": "2024-01-01T00:00:00Z",
				},
			},
		},
	}}
	spec := watch("Namespace", "v1").cluster()
	out, err := transformFor(spec)(in)
	if err != nil {
		t.Fatal(err)
	}
	u := out.(*unstructured.Unstructured)
	conds, _, _ := unstructured.NestedSlice(u.Object, "status", "conditions")
	if len(conds) != 1 {
		t.Fatal("expected 1 condition")
	}
	c := conds[0].(map[string]any)
	if _, ok := c["lastTransitionTime"]; !ok {
		t.Error("non-target kind condition.lastTransitionTime must NOT be stripped")
	}
}
