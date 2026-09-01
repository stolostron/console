// Copyright Contributors to the Open Cluster Management project

package vmproxy

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/clusterproxy"
	applog "github.com/stolostron/console/backend/internal/log"
	"github.com/stolostron/console/backend/internal/server"
)

// Options configure VirtualMachine proxy handlers.
type Options struct {
	Resolver    *clusterproxy.Resolver
	TLSConfig   *tls.Config
	RESTConfig  *rest.Config
	SAToken     string
	Kube        kubernetes.Interface
	HubDynamic  dynamic.Interface
	UserKube    func(token string) (kubernetes.Interface, error)
	Validate    func(ctx context.Context, token string) error
	FineGrained func(ctx context.Context) (bool, error)
}

// Handler serves VM GET helpers, actions, and resource-usage aggregation.
type Handler struct {
	opts        Options
	saKube      kubernetes.Interface
	addonClient *http.Client
}

// New builds a VM proxy handler.
func New(opts Options) *Handler {
	h := &Handler{opts: opts, saKube: opts.Kube}
	if h.saKube == nil && opts.RESTConfig != nil {
		if kube, err := kubernetes.NewForConfig(opts.RESTConfig); err == nil {
			h.saKube = kube
		}
	}
	h.addonClient = &http.Client{
		Transport: &http.Transport{
			TLSClientConfig:   opts.TLSConfig,
			ForceAttemptHTTP2: false,
		},
	}
	return h
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	token, ok := h.authenticate(w, r)
	if !ok {
		return
	}
	path := server.StripMulticloud(r.URL.Path)
	switch {
	case strings.HasPrefix(path, "/vmResourceUsage/"):
		h.usage(w, r, token, path)
	case strings.HasPrefix(path, "/virtualmachines/get/") || strings.HasPrefix(path, "/virtualmachinesnapshots/get/"):
		h.get(w, r, token, path)
	default:
		h.action(w, r, token, path)
	}
}

func (h *Handler) authenticate(w http.ResponseWriter, r *http.Request) (string, bool) {
	if h.opts.Validate != nil {
		token, ok := auth.RequireToken(w, r)
		if !ok {
			return "", false
		}
		if err := h.opts.Validate(r.Context(), token); err != nil {
			w.WriteHeader(http.StatusUnauthorized)
			return "", false
		}
		return token, true
	}
	return auth.AuthenticateRequest(r.Context(), h.opts.RESTConfig, w, r)
}

func (h *Handler) proxyBase(ctx context.Context) (string, error) {
	u, err := h.opts.Resolver.URL(ctx)
	if err != nil {
		return "", err
	}
	return strings.TrimRight(u.String(), "/"), nil
}

type actionBody struct {
	ManagedCluster string          `json:"managedCluster"`
	VMName         string          `json:"vmName"`
	VMNamespace    string          `json:"vmNamespace"`
	ReqBody        json.RawMessage `json:"reqBody"`
}

func (h *Handler) action(w http.ResponseWriter, r *http.Request, token, path string) {
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		applog.Logger().Error("vm proxy", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	var body actionBody
	if len(raw) > 0 {
		if unmarshalErr := json.Unmarshal(raw, &body); unmarshalErr != nil {
			applog.Logger().Error("vm proxy", "error", unmarshalErr)
		}
	}
	parts := strings.Split(path, "/")
	action := ""
	if len(parts) > 2 {
		action = parts[2]
	}
	base, err := h.proxyBase(r.Context())
	if err != nil {
		applog.Logger().Error("vm proxy", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	addonPath := kubeVirtAPI(path, body.VMName, body.VMNamespace, action)
	url := base + "/" + body.ManagedCluster + addonPath

	if !h.fineGrainedRBAC(r.Context()) {
		if h.canCreateMCA(r.Context(), token, body.ManagedCluster) {
			if actor, ok := h.vmActorToken(r.Context(), body.ManagedCluster); ok {
				token = actor
			} else {
				token = ""
			}
		}
	}

	var reqBody io.Reader
	if len(body.ReqBody) > 0 && string(body.ReqBody) != "null" {
		reqBody = bytes.NewReader(body.ReqBody)
	}
	req, err := http.NewRequestWithContext(r.Context(), r.Method, url, reqBody)
	if err != nil {
		applog.Logger().Error("vm proxy", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	if !isSubresourceAction(path) {
		req.Header.Set("Accept", "application/json")
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := h.addonClient.Do(req)
	if err != nil {
		applog.Logger().Error("Error in VirtualMachine action request (fine grained RBAC)", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	writeProxiedBody(w, resp)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request, token, path string) {
	base, err := h.proxyBase(r.Context())
	if err != nil {
		applog.Logger().Error("vm proxy", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	parts := strings.Split(path, "/")
	// /virtualmachines/get/<cluster>/<name>/<namespace>
	if len(parts) < 6 {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("null"))
		return
	}
	cluster, name, namespace := parts[3], parts[4], parts[5]
	var api string
	if strings.HasPrefix(path, "/virtualmachines/get/") {
		api = "/apis/kubevirt.io/v1/namespaces/" + namespace + "/virtualmachines/" + name
	} else {
		api = "/apis/snapshot.kubevirt.io/v1beta1/namespaces/" + namespace + "/virtualmachinesnapshots/" + name
	}
	url := base + "/" + cluster + api
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, url, nil)
	if err != nil {
		applog.Logger().Error("vm proxy", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := h.addonClient.Do(req)
	if err != nil {
		applog.Logger().Error("Error getting VM resource (fine grained RBAC)", "error", err)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(nil)
		return
	}
	defer resp.Body.Close()
	decoded, err := decodeJSONBody(resp)
	if err != nil {
		applog.Logger().Error("Error getting VM resource (fine grained RBAC)", "error", err)
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(nil)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	enc, _ := json.Marshal(decoded)
	_, _ = w.Write(enc)
}

func writeProxiedBody(w http.ResponseWriter, resp *http.Response) {
	body, _ := io.ReadAll(resp.Body)
	ct := resp.Header.Get("Content-Type")
	var payload any
	if strings.Contains(ct, "application/json") {
		if err := json.Unmarshal(body, &payload); err != nil {
			payload = string(body)
		}
	} else {
		payload = string(body)
	}
	encoded, _ := json.Marshal(payload)
	if _, isString := payload.(string); isString {
		w.Header().Set("Content-Type", "text/plain")
	} else {
		w.Header().Set("Content-Type", "application/json")
	}
	status := resp.StatusCode
	if status == 0 {
		status = http.StatusInternalServerError
	}
	w.WriteHeader(status)
	_, _ = w.Write(encoded)
}

func decodeJSONBody(resp *http.Response) (any, error) {
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if len(body) == 0 {
		return nil, nil
	}
	var v any
	if err := json.Unmarshal(body, &v); err != nil {
		return nil, err
	}
	return v, nil
}
