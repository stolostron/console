// Copyright Contributors to the Open Cluster Management project

package vmproxy

import "testing"

func TestKubeVirtAPI(t *testing.T) {
	cases := []struct {
		path   string
		action string
		want   string
	}{
		{"/virtualmachines/update", "", "/apis/kubevirt.io/v1/namespaces/ns/virtualmachines/vm"},
		{"/virtualmachines/delete", "", "/apis/kubevirt.io/v1/namespaces/ns/virtualmachines/vm"},
		{"/virtualmachines/start", "start", "/apis/subresources.kubevirt.io/v1/namespaces/ns/virtualmachines/vm/start"},
		{"/virtualmachines/stop", "stop", "/apis/subresources.kubevirt.io/v1/namespaces/ns/virtualmachines/vm/stop"},
		{"/virtualmachines/restart", "restart", "/apis/subresources.kubevirt.io/v1/namespaces/ns/virtualmachines/vm/restart"},
		{"/virtualmachineinstances/pause", "pause", "/apis/subresources.kubevirt.io/v1/namespaces/ns/virtualmachineinstances/vm/pause"},
		{"/virtualmachineinstances/unpause", "unpause", "/apis/subresources.kubevirt.io/v1/namespaces/ns/virtualmachineinstances/vm/unpause"},
		{"/virtualmachinesnapshots/create", "", "/apis/snapshot.kubevirt.io/v1beta1/namespaces/ns/virtualmachinesnapshots"},
		{"/virtualmachinesnapshots/update", "", "/apis/snapshot.kubevirt.io/v1beta1/namespaces/ns/virtualmachinesnapshots/vm"},
		{"/virtualmachinesnapshots/delete", "", "/apis/snapshot.kubevirt.io/v1beta1/namespaces/ns/virtualmachinesnapshots/vm"},
		{"/virtualmachinerestores", "", "/apis/snapshot.kubevirt.io/v1beta1/namespaces/ns/virtualmachinerestores"},
	}
	for _, tc := range cases {
		if got := kubeVirtAPI(tc.path, "vm", "ns", tc.action); got != tc.want {
			t.Fatalf("%s: got %q want %q", tc.path, got, tc.want)
		}
	}
	if got := kubeVirtAPI("/unknown", "vm", "ns", "start"); got != "" {
		t.Fatalf("unknown path: got %q", got)
	}
}

func TestIsSubresourceAction(t *testing.T) {
	subresource := []string{
		"/virtualmachines/start",
		"/virtualmachines/stop",
		"/virtualmachines/restart",
		"/virtualmachineinstances/pause",
		"/virtualmachineinstances/unpause",
	}
	for _, path := range subresource {
		if !isSubresourceAction(path) {
			t.Fatalf("%s should be subresource action", path)
		}
	}
	nonSubresource := []string{
		"/virtualmachines/update",
		"/virtualmachines/delete",
		"/virtualmachinesnapshots/create",
		"/virtualmachinerestores",
	}
	for _, path := range nonSubresource {
		if isSubresourceAction(path) {
			t.Fatalf("%s should not be subresource action", path)
		}
	}
}
