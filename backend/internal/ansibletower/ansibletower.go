// Copyright Contributors to the Open Cluster Management project

package ansibletower

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
	"github.com/stolostron/console/backend/internal/outbound"
)

// Paths is the AAP pathname allowlist (must match frontend ansiblePaths).
var Paths = []string{
	"/api/v2/job_templates/",
	"/api/v2/workflow_job_templates/",
	"/api/v2/inventories/",
	"/api/controller/v2/job_templates/",
	"/api/controller/v2/workflow_job_templates/",
	"/api/controller/v2/inventories/",
}

type requestBody struct {
	SecretNamespace string `json:"secretNamespace"`
	SecretName      string `json:"secretName"`
	AnsiblePath     string `json:"ansiblePath"`
}

// Options configure the Ansible Tower proxy.
type Options struct {
	RESTConfig  *rest.Config
	Authn       func(w http.ResponseWriter, r *http.Request) (string, bool)
	KubeForUser func(token string) (kubernetes.Interface, error)
	Tower       *http.Client
}

// Handler serves POST /ansibletower.
type Handler struct {
	RESTConfig  *rest.Config
	Authn       func(w http.ResponseWriter, r *http.Request) (string, bool)
	KubeForUser func(token string) (kubernetes.Interface, error)
	Tower       *http.Client
}

// New returns an Ansible Tower proxy handler.
func New(opts Options) *Handler {
	h := &Handler{
		RESTConfig:  opts.RESTConfig,
		Authn:       opts.Authn,
		KubeForUser: opts.KubeForUser,
		Tower:       opts.Tower,
	}
	if h.Authn == nil && opts.RESTConfig != nil {
		h.Authn = func(w http.ResponseWriter, r *http.Request) (string, bool) {
			return auth.AuthenticateRequest(r.Context(), opts.RESTConfig, w, r)
		}
	}
	if h.KubeForUser == nil && opts.RESTConfig != nil {
		h.KubeForUser = func(token string) (kubernetes.Interface, error) {
			return kubernetes.NewForConfig(auth.UserRESTConfig(opts.RESTConfig, token))
		}
	}
	if h.Tower == nil {
		h.Tower = &http.Client{
			Timeout:   30 * time.Second,
			Transport: outbound.Transport(&tls.Config{InsecureSkipVerify: true}, true), //nolint:gosec // Node rejectUnauthorized: false
		}
	}
	return h
}

func (h *Handler) authenticate(w http.ResponseWriter, r *http.Request) (string, bool) {
	if h.Authn != nil {
		return h.Authn(w, r)
	}
	w.WriteHeader(http.StatusUnauthorized)
	return "", false
}

// ServeHTTP proxies an allow-listed AAP GET using credentials from a user-readable Secret.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	token, ok := h.authenticate(w, r)
	if !ok {
		return
	}
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	var body requestBody
	if err = json.Unmarshal(raw, &body); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if body.SecretNamespace == "" || body.SecretName == "" || body.AnsiblePath == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	host, towerToken, err := h.credential(r.Context(), token, body.SecretNamespace, body.SecretName)
	if err != nil || host == "" || towerToken == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	hostURL, err := url.Parse(host)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	towerURL, err := url.Parse(body.AnsiblePath)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if !towerURL.IsAbs() {
		towerURL = hostURL.ResolveReference(towerURL)
	}
	if towerURL.Scheme == "" || towerURL.Host == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if towerURL.Scheme != hostURL.Scheme || towerURL.Host != hostURL.Host {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	if !allowedPath(towerURL.Path) {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, towerURL.String(), nil)
	if err != nil {
		applog.Logger().Error("ansibletower request", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	req.Header.Set("Authorization", "Bearer "+towerToken)
	resp, err := h.Tower.Do(req)
	if err != nil {
		applog.Logger().Error("ansibletower upstream", "error", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(err.Error())
		return
	}
	defer func() { _, _ = io.Copy(io.Discard, resp.Body); _ = resp.Body.Close() }()
	for k, vs := range resp.Header {
		if skipHopByHopHeader(k) {
			continue
		}
		for _, v := range vs {
			w.Header().Add(k, v)
		}
	}
	w.WriteHeader(resp.StatusCode)
	_, _ = io.Copy(w, resp.Body)
}

func (h *Handler) credential(ctx context.Context, userToken, ns, name string) (string, string, error) {
	if h.KubeForUser == nil {
		return "", "", errNoKube
	}
	kube, err := h.KubeForUser(userToken)
	if err != nil {
		return "", "", err
	}
	secret, err := kube.CoreV1().Secrets(ns).Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		return "", "", err
	}
	return string(secret.Data["host"]), string(secret.Data["token"]), nil
}

var errNoKube = errors.New("ansibletower kube client missing")

func allowedPath(path string) bool {
	for _, p := range Paths {
		if path == p {
			return true
		}
	}
	return false
}

func skipHopByHopHeader(name string) bool {
	switch http.CanonicalHeaderKey(name) {
	case "Connection", "Keep-Alive", "Proxy-Authenticate", "Proxy-Authorization",
		"Te", "Trailers", "Transfer-Encoding", "Upgrade", "Content-Length":
		return true
	default:
		return false
	}
}
