// Copyright Contributors to the Open Cluster Management project

package vmproxy

// kubeVirtAPI maps a console VM proxy path to the managed-cluster KubeVirt API path.
func kubeVirtAPI(urlPath, name, namespace, action string) string {
	switch urlPath {
	case "/virtualmachines/update", "/virtualmachines/delete":
		return "/apis/kubevirt.io/v1/namespaces/" + namespace + "/virtualmachines/" + name
	case "/virtualmachines/start", "/virtualmachines/stop", "/virtualmachines/restart":
		return "/apis/subresources.kubevirt.io/v1/namespaces/" + namespace + "/virtualmachines/" + name + "/" + action
	case "/virtualmachineinstances/pause", "/virtualmachineinstances/unpause":
		return "/apis/subresources.kubevirt.io/v1/namespaces/" + namespace + "/virtualmachineinstances/" + name + "/" + action
	case "/virtualmachinesnapshots/create":
		return "/apis/snapshot.kubevirt.io/v1beta1/namespaces/" + namespace + "/virtualmachinesnapshots"
	case "/virtualmachinesnapshots/update", "/virtualmachinesnapshots/delete":
		return "/apis/snapshot.kubevirt.io/v1beta1/namespaces/" + namespace + "/virtualmachinesnapshots/" + name
	case "/virtualmachinerestores":
		return "/apis/snapshot.kubevirt.io/v1beta1/namespaces/" + namespace + "/virtualmachinerestores"
	default:
		return ""
	}
}

// isSubresourceAction reports start/stop/restart/pause/unpause paths that skip JSON content headers.
func isSubresourceAction(urlPath string) bool {
	switch urlPath {
	case "/virtualmachines/start", "/virtualmachines/stop", "/virtualmachines/restart",
		"/virtualmachineinstances/pause", "/virtualmachineinstances/unpause":
		return true
	default:
		return false
	}
}
