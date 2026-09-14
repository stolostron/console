// Copyright Contributors to the Open Cluster Management project

package upgraderisks

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	defaultInsightsURL = "https://console.redhat.com/api/insights-results-aggregator/v2/upgrade-risks-prediction"
	userAgent          = "acm-operator/v2.10.0 cluster/acm-hub"
	chunkSize          = 100
	pullSecretName     = "pull-secret"
	configNamespace    = "openshift-config"
	crcTokenTTL        = 60 * time.Second
)

type requestBody struct {
	ClusterIDs []string `json:"clusterIds"`
}

type pullAuth struct {
	Auths map[string]struct {
		Auth string `json:"auth"`
	} `json:"auths"`
}

type postResult struct {
	StatusCode int `json:"statusCode"`
	Body       any `json:"body"`
}

// Options configure upgrade-risks-prediction.
type Options struct {
	RESTConfig *rest.Config
	Authn      func(w http.ResponseWriter, r *http.Request) (string, bool)
	Kube       kubernetes.Interface
	Client     *http.Client
	Endpoint   func() string
}

// Handler serves POST /upgrade-risks-prediction.
type Handler struct {
	RESTConfig *rest.Config
	Authn      func(w http.ResponseWriter, r *http.Request) (string, bool)
	Kube       kubernetes.Interface
	Client     *http.Client
	Endpoint   func() string

	crcMu     sync.Mutex
	cachedCRC string
	crcExpiry time.Time
}

// New returns an Insights upgrade-risks handler.
func New(opts Options) *Handler {
	h := &Handler{
		RESTConfig: opts.RESTConfig,
		Authn:      opts.Authn,
		Kube:       opts.Kube,
		Client:     opts.Client,
		Endpoint:   opts.Endpoint,
	}
	if h.Authn == nil && opts.RESTConfig != nil {
		h.Authn = func(w http.ResponseWriter, r *http.Request) (string, bool) {
			return auth.AuthenticateRequest(r.Context(), opts.RESTConfig, w, r)
		}
	}
	if h.Client == nil {
		h.Client = auth.HTTPClient(nil, 0)
	}
	if h.Endpoint == nil {
		h.Endpoint = func() string {
			if v := os.Getenv("UPGRADE_RISKS_PREDICTION_URL"); v != "" {
				return v
			}
			return defaultInsightsURL
		}
	}
	return h
}

func (h *Handler) authenticate(w http.ResponseWriter, r *http.Request) bool {
	if h.Authn != nil {
		_, ok := h.Authn(w, r)
		return ok
	}
	w.WriteHeader(http.StatusUnauthorized)
	return false
}

// ServeHTTP posts cluster IDs to Insights in chunks of 100.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if !h.authenticate(w, r) {
		return
	}
	raw, err := io.ReadAll(r.Body)
	if err != nil {
		applog.Logger().Error("upgrade-risks-prediction", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	var body requestBody
	if err = json.Unmarshal(raw, &body); err != nil {
		applog.Logger().Error("upgrade-risks-prediction", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	chunks := chunkIDs(body.ClusterIDs, chunkSize)
	if len(chunks) == 0 {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte("[]\n"))
		return
	}
	crcToken := h.crcToken(r.Context())
	results := make([]any, len(chunks))
	var wg sync.WaitGroup
	for i, ids := range chunks {
		wg.Add(1)
		go func(i int, ids []string) {
			defer wg.Done()
			out, err := h.postChunk(r.Context(), crcToken, ids)
			if err != nil {
				applog.Logger().Error("Error getting cluster upgrade risk predictions", "error", err)
				results[i] = map[string]string{"error": err.Error()}
				return
			}
			results[i] = out
		}(i, ids)
	}
	wg.Wait()
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(results)
}

func (h *Handler) crcToken(ctx context.Context) string {
	h.crcMu.Lock()
	if time.Now().Before(h.crcExpiry) {
		tok := h.cachedCRC
		h.crcMu.Unlock()
		return tok
	}
	h.crcMu.Unlock()

	tok := h.loadCRCToken(ctx)
	if tok == "" {
		return ""
	}
	h.crcMu.Lock()
	h.cachedCRC = tok
	h.crcExpiry = time.Now().Add(crcTokenTTL)
	h.crcMu.Unlock()
	return tok
}

func (h *Handler) loadCRCToken(ctx context.Context) string {
	if h.Kube == nil {
		return ""
	}
	secret, err := h.Kube.CoreV1().Secrets(configNamespace).Get(ctx, pullSecretName, metav1.GetOptions{})
	if err != nil {
		applog.Logger().Error("Error getting pull-secret in namespace openshift-config", "error", err)
		return ""
	}
	raw := secret.Data[".dockerconfigjson"]
	if len(raw) == 0 {
		return ""
	}
	var cred pullAuth
	if err = json.Unmarshal(raw, &cred); err != nil {
		return ""
	}
	return cred.Auths["cloud.openshift.com"].Auth
}

func (h *Handler) postChunk(ctx context.Context, crcToken string, ids []string) (postResult, error) {
	endpoint := defaultInsightsURL
	if h.Endpoint != nil {
		endpoint = h.Endpoint()
	}
	raw, err := json.Marshal(map[string]any{"clusters": ids})
	if err != nil {
		return postResult{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(string(raw)))
	if err != nil {
		return postResult{}, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", userAgent)
	if crcToken != "" {
		req.Header.Set("Authorization", "Bearer "+crcToken)
	}
	resp, err := h.Client.Do(req)
	if err != nil {
		return postResult{}, err
	}
	defer func() { _, _ = io.Copy(io.Discard, resp.Body); _ = resp.Body.Close() }()
	var out any
	if err = json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return postResult{}, err
	}
	return postResult{StatusCode: resp.StatusCode, Body: out}, nil
}

func chunkIDs(ids []string, size int) [][]string {
	if len(ids) == 0 {
		return nil
	}
	var out [][]string
	for i := 0; i < len(ids); i += size {
		end := i + size
		if end > len(ids) {
			end = len(ids)
		}
		out = append(out, ids[i:end])
	}
	return out
}
