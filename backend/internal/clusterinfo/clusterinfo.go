// Copyright Contributors to the Open Cluster Management project

package clusterinfo

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/api/meta"
	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/hubresources"
	applog "github.com/stolostron/console/backend/internal/log"
)

var (
	managedClusterGVR = schema.GroupVersionResource{
		Group:    "cluster.open-cluster-management.io",
		Version:  "v1",
		Resource: "managedclusters",
	}
	managedClusterAddOnGVR = schema.GroupVersionResource{
		Group:    "addon.open-cluster-management.io",
		Version:  "v1alpha1",
		Resource: "managedclusteraddons",
	}
	authenticationGVR = schema.GroupVersionResource{
		Group:    "config.openshift.io",
		Version:  "v1",
		Resource: "authentications",
	}
	clusterVersionGVR = schema.GroupVersionResource{
		Group:    "config.openshift.io",
		Version:  "v1",
		Resource: "clusterversions",
	}
	crdGVR = schema.GroupVersionResource{
		Group:    "apiextensions.k8s.io",
		Version:  "v1",
		Resource: "customresourcedefinitions",
	}
)

// SupportedOperator names accepted by POST /operatorCheck.
type SupportedOperator string

const (
	OperatorAnsible  SupportedOperator = "ansible-automation-platform-operator"
	OperatorGitOps   SupportedOperator = "openshift-gitops-operator"
	OperatorACM      SupportedOperator = "advanced-cluster-management"
	OperatorKubeVirt SupportedOperator = "kubevirt-hyperconverged"
)

// Options configure cluster-info route handlers.
type Options struct {
	RESTConfig *rest.Config
	Dynamic    dynamic.Interface
	Discovery  discovery.DiscoveryInterface
}

// Handler serves hub, cluster-version, hypershift-status, MCH/MCE components, operatorCheck, and apiPaths.
type Handler struct {
	base      *rest.Config
	dynamic   dynamic.Interface
	discovery discovery.DiscoveryInterface
}

// New builds a cluster-info routes handler.
func New(opts Options) *Handler {
	return &Handler{
		base:      opts.RESTConfig,
		dynamic:   opts.Dynamic,
		discovery: opts.Discovery,
	}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	switch {
	case path == "/hub" && r.Method == http.MethodGet:
		h.hub(w, r)
	case path == "/cluster-version" && r.Method == http.MethodGet:
		h.clusterVersion(w, r)
	case path == "/hypershift-status" && r.Method == http.MethodGet:
		h.hypershiftStatus(w, r)
	case path == "/multiclusterhub/components" && r.Method == http.MethodGet:
		h.mchComponents(w, r)
	case path == "/multiclusterengine/components" && r.Method == http.MethodGet:
		h.mceComponents(w, r)
	case path == "/operatorCheck" && r.Method == http.MethodPost:
		h.operatorCheck(w, r)
	case path == "/apiPaths" && r.Method == http.MethodGet:
		h.apiPaths(w, r)
	default:
		http.NotFound(w, r)
	}
}

func (h *Handler) hub(w http.ResponseWriter, r *http.Request) {
	if _, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r); !ok {
		return
	}
	ctx := r.Context()

	isGlobalHub := false
	crd, err := h.dynamic.Resource(crdGVR).Get(ctx,
		"multiclusterglobalhubs.operator.open-cluster-management.io", metav1.GetOptions{})
	if err == nil {
		kind, _, _ := unstructured.NestedString(crd.Object, "kind")
		if kind == "CustomResourceDefinition" {
			isGlobalHub = true
		}
	} else if !apierrors.IsNotFound(err) {
		applog.Logger().Error("get global hub CRD failed", "error", err)
	}

	localHubName := "local-cluster"
	isHubSelfManaged := false
	mcList, err := h.dynamic.Resource(managedClusterGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		applog.Logger().Error("list managedclusters failed", "error", err)
	} else {
		for _, item := range mcList.Items {
			labels, _, _ := unstructured.NestedStringMap(item.Object, "metadata", "labels")
			if labels["local-cluster"] == "true" {
				name, _, _ := unstructured.NestedString(item.Object, "metadata", "name")
				if name != "" {
					localHubName = name
				}
				isHubSelfManaged = true
				break
			}
		}
	}

	isObservabilityInstalled := false
	addonList, err := h.dynamic.Resource(managedClusterAddOnGVR).Namespace(localHubName).List(ctx, metav1.ListOptions{})
	if err != nil {
		applog.Logger().Error("list managedclusteraddons failed", "error", err)
	} else {
		for _, item := range addonList.Items {
			name, _, _ := unstructured.NestedString(item.Object, "metadata", "name")
			if name == "observability-controller" || name == "multicluster-observability-addon" {
				isObservabilityInstalled = true
				break
			}
		}
	}

	authObj, err := h.dynamic.Resource(authenticationGVR).Get(ctx, "cluster", metav1.GetOptions{})
	authentication := buildAuthentication(nil)
	if err == nil {
		authentication = buildAuthentication(authObj.Object)
	} else if !apierrors.IsNotFound(err) {
		applog.Logger().Error("get authentication cluster failed", "error", err)
	}

	resp := map[string]interface{}{
		"isGlobalHub":              isGlobalHub,
		"localHubName":             localHubName,
		"isHubSelfManaged":         isHubSelfManaged,
		"isObservabilityInstalled": isObservabilityInstalled,
		"authentication":           authentication,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func buildAuthentication(obj map[string]interface{}) map[string]interface{} {
	if obj == nil {
		return map[string]interface{}{
			"isDirectAuthenticationEnabled": false,
		}
	}
	authType, _, _ := unstructured.NestedString(obj, "spec", "type")
	isOIDC := authType == "OIDC"
	result := map[string]interface{}{
		"isDirectAuthenticationEnabled": isOIDC,
	}
	providers, found, _ := unstructured.NestedSlice(obj, "spec", "oidcProviders")
	if !found || len(providers) == 0 {
		return result
	}
	provider, ok := providers[0].(map[string]interface{})
	if !ok {
		return result
	}
	mappings, found, _ := unstructured.NestedMap(provider, "claimMappings")
	if !found {
		return result
	}
	claimMappings := map[string]interface{}{}
	if username, ok := mappings["username"].(map[string]interface{}); ok {
		entry := map[string]interface{}{}
		if claim, ok := username["claim"].(string); ok {
			entry["claim"] = claim
		}
		if prefix, ok := username["prefix"]; ok {
			entry["prefix"] = prefix
		}
		if prefixPolicy, ok := username["prefixPolicy"].(string); ok {
			entry["prefixPolicy"] = prefixPolicy
		}
		claimMappings["username"] = entry
	}
	if groups, ok := mappings["groups"].(map[string]interface{}); ok {
		entry := map[string]interface{}{}
		if claim, ok := groups["claim"].(string); ok {
			entry["claim"] = claim
		}
		if prefix, ok := groups["prefix"].(string); ok {
			entry["prefix"] = prefix
		}
		claimMappings["groups"] = entry
	}
	if len(claimMappings) > 0 {
		result["claimMappings"] = claimMappings
	}
	return result
}

func (h *Handler) clusterVersion(w http.ResponseWriter, r *http.Request) {
	if _, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r); !ok {
		return
	}
	obj, err := h.dynamic.Resource(clusterVersionGVR).Get(r.Context(), "version", metav1.GetOptions{})
	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		applog.Logger().Error("get clusterversion failed", "error", err)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error": "Failed to get cluster version: " + err.Error(),
		})
		return
	}
	version, _, _ := unstructured.NestedString(obj.Object, "status", "desired", "version")
	payload := map[string]interface{}{}
	if version != "" {
		payload["version"] = version
	}
	_ = json.NewEncoder(w).Encode(payload)
}

func (h *Handler) hypershiftStatus(w http.ResponseWriter, r *http.Request) {
	if _, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r); !ok {
		return
	}
	ctx := r.Context()
	hubName := r.URL.Query().Get("hubName")
	if hubName == "" {
		hubName = "local-cluster"
	}

	components, err := hubresources.MCEComponents(ctx, h.dynamic)
	if err != nil {
		if isMissingAPI(err) {
			enabled := processHypershiftStatus(nil, nil)
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"statusCode": http.StatusOK,
				"body": map[string]bool{
					"isHypershiftEnabled": enabled,
				},
			})
			return
		}
		applog.Logger().Error("hypershift status mce components failed", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	addon, err := findManagedClusterAddOn(ctx, h.dynamic, hubName, "hypershift-addon")
	if err != nil {
		if apierrors.IsForbidden(err) {
			addon = nil
		} else {
			applog.Logger().Error("hypershift status addon failed", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}
	enabled := processHypershiftStatus(components, addon)
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"statusCode": http.StatusOK,
		"body": map[string]bool{
			"isHypershiftEnabled": enabled,
		},
	})
}

func processHypershiftStatus(components []hubresources.Component, addon *unstructured.Unstructured) bool {
	if len(components) == 0 {
		return false
	}
	var hypershift, localHosting bool
	for _, c := range components {
		switch c.Name {
		case "hypershift":
			hypershift = c.Enabled
		case "hypershift-local-hosting":
			localHosting = c.Enabled
		}
	}
	if !hypershift || !localHosting {
		return false
	}
	if addon == nil {
		return false
	}
	return isAddOnHealthy(addon)
}

func findManagedClusterAddOn(ctx context.Context, client dynamic.Interface, namespace, name string) (*unstructured.Unstructured, error) {
	list, err := client.Resource(managedClusterAddOnGVR).Namespace(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	for i := range list.Items {
		if list.Items[i].GetName() == name {
			return &list.Items[i], nil
		}
	}
	return nil, nil
}

func isAddOnHealthy(addon *unstructured.Unstructured) bool {
	conditions, found, _ := unstructured.NestedSlice(addon.Object, "status", "conditions")
	if !found {
		return false
	}
	for _, raw := range conditions {
		cond, ok := raw.(map[string]interface{})
		if !ok {
			continue
		}
		reason, _ := cond["reason"].(string)
		status, _ := cond["status"].(string)
		if reason == "ManagedClusterAddOnLeaseUpdated" && status == "True" {
			return true
		}
	}
	return false
}

func (h *Handler) mchComponents(w http.ResponseWriter, r *http.Request) {
	if _, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r); !ok {
		return
	}
	components, err := hubresources.MCHComponents(r.Context(), h.dynamic)
	if err != nil {
		if isMissingAPI(err) {
			writeJSON(w, nil)
			return
		}
		applog.Logger().Error("mch components failed", "error", err)
		writeJSON(w, nil)
		return
	}
	writeJSON(w, components)
}

func (h *Handler) mceComponents(w http.ResponseWriter, r *http.Request) {
	if _, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r); !ok {
		return
	}
	components, err := hubresources.MCEComponents(r.Context(), h.dynamic)
	if err != nil {
		if isMissingAPI(err) {
			writeJSON(w, nil)
			return
		}
		applog.Logger().Error("mce components failed", "error", err)
		writeJSON(w, nil)
		return
	}
	writeJSON(w, components)
}

type operatorCheckRequest struct {
	Operator SupportedOperator `json:"operator"`
}

type operatorCheckResponse struct {
	Operator  SupportedOperator `json:"operator"`
	Installed bool              `json:"installed"`
	Version   string            `json:"version,omitempty"`
}

func (h *Handler) operatorCheck(w http.ResponseWriter, r *http.Request) {
	if _, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r); !ok {
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		applog.Logger().Error("read operatorCheck body failed", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	var req operatorCheckRequest
	if err = json.Unmarshal(body, &req); err != nil || !isSupportedOperator(req.Operator) {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	resp, err := resolveOperatorInstall(r.Context(), h.dynamic, req.Operator)
	if err != nil {
		applog.Logger().Error("operatorCheck failed", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func isSupportedOperator(op SupportedOperator) bool {
	switch op {
	case OperatorAnsible, OperatorGitOps, OperatorACM, OperatorKubeVirt:
		return true
	default:
		return false
	}
}

func resolveOperatorInstall(ctx context.Context, client dynamic.Interface, operator SupportedOperator) (operatorCheckResponse, error) {
	subGVR := schema.GroupVersionResource{
		Group:    "operators.coreos.com",
		Version:  "v1alpha1",
		Resource: "subscriptions",
	}
	list, err := client.Resource(subGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		return operatorCheckResponse{}, err
	}
	if installed, version := subscriptionInstall(list.Items, operator); installed {
		return operatorCheckResponse{Operator: operator, Installed: true, Version: version}, nil
	}
	extGVR := schema.GroupVersionResource{
		Group:    "olm.operatorframework.io",
		Version:  "v1",
		Resource: "clusterextensions",
	}
	extList, err := client.Resource(extGVR).List(ctx, metav1.ListOptions{})
	if err != nil {
		if apierrors.IsNotFound(err) || apierrors.IsForbidden(err) {
			return operatorCheckResponse{Operator: operator, Installed: false}, nil
		}
		return operatorCheckResponse{}, err
	}
	installed, version := clusterExtensionInstall(extList.Items, operator)
	return operatorCheckResponse{Operator: operator, Installed: installed, Version: version}, nil
}

func subscriptionInstall(items []unstructured.Unstructured, operator SupportedOperator) (bool, string) {
	for _, item := range items {
		specName, _, _ := unstructured.NestedString(item.Object, "spec", "name")
		if specName != string(operator) {
			continue
		}
		if !hasCondition(item.Object, "CatalogSourcesUnhealthy", "False") {
			continue
		}
		version, _, _ := unstructured.NestedString(item.Object, "status", "installedCSV")
		return true, version
	}
	return false, ""
}

func clusterExtensionInstall(items []unstructured.Unstructured, operator SupportedOperator) (bool, string) {
	for _, item := range items {
		pkg, _, _ := unstructured.NestedString(item.Object, "spec", "source", "catalog", "packageName")
		if pkg != string(operator) {
			continue
		}
		if !hasCondition(item.Object, "Installed", "True") {
			continue
		}
		version, _, _ := unstructured.NestedString(item.Object, "status", "install", "bundle", "version")
		return true, version
	}
	return false, ""
}

func hasCondition(obj map[string]interface{}, condType, status string) bool {
	conditions, found, _ := unstructured.NestedSlice(obj, "status", "conditions")
	if !found {
		return false
	}
	for _, raw := range conditions {
		cond, ok := raw.(map[string]interface{})
		if !ok {
			continue
		}
		t, _ := cond["type"].(string)
		s, _ := cond["status"].(string)
		if t == condType && s == status {
			return true
		}
	}
	return false
}

type apiResourceMeta struct {
	PluralName string `json:"pluralName"`
}

func (h *Handler) apiPaths(w http.ResponseWriter, r *http.Request) {
	if _, ok := auth.AuthenticateRequest(r.Context(), h.base, w, r); !ok {
		return
	}
	_, lists, err := h.discovery.ServerGroupsAndResources()
	if err != nil {
		applog.Logger().Error("apiPaths discovery failed", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	result := make(map[string]map[string]apiResourceMeta)
	for _, list := range lists {
		if list == nil {
			continue
		}
		kindMap := make(map[string]apiResourceMeta)
		for _, res := range list.APIResources {
			if strings.Contains(res.Name, "/") {
				continue
			}
			kindMap[res.Kind] = apiResourceMeta{PluralName: res.Name}
		}
		if len(kindMap) == 0 {
			continue
		}
		result[list.GroupVersion] = kindMap
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(result)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if v == nil {
		_, _ = w.Write([]byte("null"))
		return
	}
	_ = json.NewEncoder(w).Encode(v)
}

func isMissingAPI(err error) bool {
	return meta.IsNoMatchError(err) || apierrors.IsNotFound(err)
}
