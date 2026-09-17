// Copyright Contributors to the Open Cluster Management project

package rosa

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"strings"

	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/auth"
	applog "github.com/stolostron/console/backend/internal/log"
)

const defaultAPIURL = "https://api.openshift.com"

// Routes are the ROSA wizard POST paths (also registered under /multicloud).
var Routes = []string{
	"/aws-account-ids",
	"/aws-billing-accounts",
	"/oidc-configs",
	"/regions",
	"/cluster-name-check",
	"/sts-role-arns",
	"/vpcs",
	"/sts-ocm-role",
	"/sts-user-role",
	"/openshift-versions",
	"/machine-types",
}

var clusterNameRE = regexp.MustCompile(`^[a-z]([a-z0-9-]*[a-z0-9])?$`)

// Options configure the ROSA wizard proxy.
type Options struct {
	RESTConfig *rest.Config
	Authn      func(w http.ResponseWriter, r *http.Request) (string, bool)
	Client     *http.Client
	APIURL     string
}

// Handler serves the 11 POST ROSA wizard routes.
type Handler struct {
	RESTConfig *rest.Config
	Authn      func(w http.ResponseWriter, r *http.Request) (string, bool)
	Client     *http.Client
	APIURL     string
}

// New returns a ROSA wizard handler.
func New(opts Options) *Handler {
	h := &Handler{
		RESTConfig: opts.RESTConfig,
		Authn:      opts.Authn,
		Client:     opts.Client,
		APIURL:     strings.TrimRight(opts.APIURL, "/"),
	}
	if h.APIURL == "" {
		h.APIURL = defaultAPIURL
	}
	if h.Authn == nil && opts.RESTConfig != nil {
		h.Authn = func(w http.ResponseWriter, r *http.Request) (string, bool) {
			return auth.AuthenticateRequest(r.Context(), opts.RESTConfig, w, r)
		}
	}
	return h
}

func (h *Handler) client() *http.Client {
	if h.Client != nil {
		return h.Client
	}
	return auth.HTTPClient(nil, 0)
}

func (h *Handler) authenticate(w http.ResponseWriter, r *http.Request) bool {
	if h.Authn != nil {
		_, ok := h.Authn(w, r)
		return ok
	}
	w.WriteHeader(http.StatusUnauthorized)
	return false
}

func stripPath(path string) string {
	const prefix = "/multicloud"
	if path == prefix {
		return "/"
	}
	if strings.HasPrefix(path, prefix+"/") || strings.HasPrefix(path, prefix) {
		return path[len(prefix):]
	}
	return path
}

// ServeHTTP dispatches POST ROSA wizard endpoints.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusNotFound)
		return
	}
	if !h.authenticate(w, r) {
		return
	}
	body, err := io.ReadAll(r.Body)
	if err != nil {
		applog.Logger().Error("rosa wizard read body", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	path := strings.Trim(stripPath(r.URL.Path), "/")
	switch path {
	case "aws-account-ids":
		h.awsAccountIds(w, r, body)
	case "aws-billing-accounts":
		h.awsBillingAccounts(w, r, body)
	case "oidc-configs":
		h.oidcConfigs(w, r, body)
	case "regions":
		h.regions(w, r, body)
	case "cluster-name-check":
		h.clusterNameCheck(w, r, body)
	case "sts-role-arns":
		h.stsRoleARNs(w, r, body)
	case "vpcs":
		h.vpcs(w, r, body)
	case "sts-ocm-role":
		h.stsOCMRole(w, r, body)
	case "sts-user-role":
		h.userRole(w, r, body)
	case "openshift-versions":
		h.versions(w, r, body)
	case "machine-types":
		h.machineTypes(w, r, body)
	default:
		w.WriteHeader(http.StatusNotFound)
	}
}

type payload struct {
	ServiceAccountID     string `json:"service_account_id"`
	ServiceAccountSecret string `json:"service_account_secret"`
	AWSAccountID         string `json:"aws_account_id"`
	ClusterName          string `json:"cluster_name"`
	Region               string `json:"region"`
	RoleARN              string `json:"role_arn"`
	AvailabilityZones    []any  `json:"availability_zones"`
}

type orgAccount struct {
	ID           string `json:"id"`
	Organization struct {
		ID string `json:"id"`
	} `json:"organization"`
}

type postResult struct {
	StatusCode int `json:"statusCode"`
	Body       any `json:"body"`
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func writeJSONStatus(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func encodeRequestURL(raw string) string {
	return strings.ReplaceAll(raw, " ", "%20")
}

func parsePayload(body []byte) (payload, error) {
	var p payload
	err := json.Unmarshal(body, &p)
	return p, err
}

func (h *Handler) ssoToken(ctx context.Context, p payload) (string, error) {
	return auth.OCMServiceToken(ctx, h.client(), p.ServiceAccountID, p.ServiceAccountSecret)
}

func (h *Handler) getJSON(ctx context.Context, token, rawURL string) (any, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, encodeRequestURL(rawURL), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")
	resp, err := h.client().Do(req)
	if err != nil {
		return nil, err
	}
	defer func() { _, _ = io.Copy(io.Discard, resp.Body); _ = resp.Body.Close() }()
	var out any
	if err = json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return out, nil
}

func (h *Handler) postJSON(ctx context.Context, token, rawURL string, body any) (postResult, error) {
	raw, err := json.Marshal(body)
	if err != nil {
		return postResult{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, encodeRequestURL(rawURL), strings.NewReader(string(raw)))
	if err != nil {
		return postResult{}, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/json")
	resp, err := h.client().Do(req)
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

func (h *Handler) getOrg(ctx context.Context, token string) (orgAccount, error) {
	raw, err := h.getJSON(ctx, token, h.APIURL+"/api/accounts_mgmt/v1/current_account")
	if err != nil {
		return orgAccount{}, err
	}
	b, err := json.Marshal(raw)
	if err != nil {
		return orgAccount{}, err
	}
	var org orgAccount
	if err = json.Unmarshal(b, &org); err != nil {
		return orgAccount{}, err
	}
	return org, nil
}

func (h *Handler) awsAccountIds(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa aws-account-ids", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa aws-account-ids sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	org, err := h.getOrg(r.Context(), tok)
	if err != nil {
		applog.Logger().Error("rosa aws-account-ids org", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	out, err := h.getJSON(r.Context(), tok, h.APIURL+"/api/accounts_mgmt/v1/organizations/"+org.Organization.ID+"/labels")
	if err != nil {
		applog.Logger().Error("rosa aws-account-ids labels", "error", err)
		writeJSON(w, nil)
		return
	}
	writeJSON(w, out)
}

func (h *Handler) awsBillingAccounts(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa aws-billing-accounts", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa aws-billing-accounts sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	org, err := h.getOrg(r.Context(), tok)
	if err != nil {
		applog.Logger().Error("rosa aws-billing-accounts org", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	out, err := h.getJSON(r.Context(), tok, h.APIURL+"/api/accounts_mgmt/v1/organizations/"+org.Organization.ID+"/quota_cost?fetchRelatedResources=true&fetchCloudAccounts=true")
	if err != nil {
		applog.Logger().Error("rosa aws-billing-accounts quota", "error", err)
		writeJSON(w, nil)
		return
	}
	writeJSON(w, out)
}

func (h *Handler) oidcConfigs(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa oidc-configs", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa oidc-configs sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	q := url.Values{}
	q.Set("search", "aws.account_id="+p.AWSAccountID+" or aws.account_id=''")
	rawURL := h.APIURL + "/api/clusters_mgmt/v1/oidc_configs?" + q.Encode()
	out, err := h.getJSON(r.Context(), tok, rawURL)
	if err != nil {
		applog.Logger().Error("rosa oidc-configs", "error", err)
		writeJSON(w, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, out)
}

func (h *Handler) regions(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa regions", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa regions sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	out, err := h.getJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/cloud_providers?size=-1&fetchRegions=true")
	if err != nil {
		applog.Logger().Error("rosa regions", "error", err)
		writeJSON(w, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, out)
}

func (h *Handler) clusterNameCheck(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa cluster-name-check", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if p.ClusterName == "" || !clusterNameRE.MatchString(p.ClusterName) {
		writeJSONStatus(w, http.StatusBadRequest, map[string]string{"error": "Invalid cluster name format"})
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa cluster-name-check sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	out, err := h.postJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/clusters?method=get", map[string]any{
		"size":   1,
		"search": "name = '" + p.ClusterName + "'",
	})
	if err != nil {
		applog.Logger().Error("rosa cluster-name-check", "error", err)
		writeJSON(w, nil)
		return
	}
	writeJSON(w, out)
}

func (h *Handler) vpcs(w http.ResponseWriter, r *http.Request, body []byte) {
	var raw map[string]any
	if err := json.Unmarshal(body, &raw); err != nil {
		applog.Logger().Error("rosa vpcs", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa vpcs", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa vpcs sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	payloadBody := map[string]any{"aws": raw["aws"], "region": raw["region"]}
	out, err := h.postJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/aws_inquiries/vpcs?fetchSecurityGroups=true", payloadBody)
	if err != nil {
		applog.Logger().Error("rosa vpcs", "error", err)
		writeJSON(w, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, out)
}

func (h *Handler) stsRoleARNs(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa sts-role-arns", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa sts-role-arns sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	out, err := h.postJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/aws_inquiries/sts_account_roles", map[string]any{
		"account_id": p.AWSAccountID,
	})
	if err != nil {
		applog.Logger().Error("rosa sts-role-arns", "error", err)
		writeJSON(w, nil)
		return
	}
	writeJSON(w, out)
}

func (h *Handler) stsOCMRole(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa sts-ocm-role", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa sts-ocm-role sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	out, err := h.postJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/aws_inquiries/sts_ocm_role", map[string]any{
		"account_id": p.AWSAccountID,
	})
	if err != nil {
		applog.Logger().Error("rosa sts-ocm-role", "error", err)
		writeJSON(w, nil)
		return
	}
	writeJSON(w, out)
}

func (h *Handler) userRole(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa sts-user-role", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa sts-user-role sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	org, err := h.getOrg(r.Context(), tok)
	if err != nil {
		applog.Logger().Error("rosa sts-user-role org", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	out, err := h.getJSON(r.Context(), tok, h.APIURL+"/api/accounts_mgmt/v1/accounts/"+org.ID+"/labels/sts_user_role")
	if err != nil {
		applog.Logger().Error("rosa sts-user-role", "error", err)
		writeJSON(w, nil)
		return
	}
	writeJSON(w, out)
}

func (h *Handler) machineTypes(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa machine-types", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa machine-types sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	zones := p.AvailabilityZones
	if zones == nil {
		zones = []any{}
	}
	out, err := h.postJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/aws_inquiries/machine_types?size=-1", map[string]any{
		"aws":                map[string]any{"sts": map[string]any{"role_arn": p.RoleARN}},
		"region":             map[string]any{"id": p.Region},
		"availability_zones": zones,
	})
	if err != nil {
		applog.Logger().Error("rosa machine-types", "error", err)
		writeJSON(w, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, out)
}

func (h *Handler) versions(w http.ResponseWriter, r *http.Request, body []byte) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa openshift-versions", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa openshift-versions sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	rawURL := h.APIURL + "/api/clusters_mgmt/v1/versions/?order=end_of_life_timestamp desc&product=hcp&search=enabled='t' AND (channel_group='stable' OR channel_group='eus' OR channel_group='candidate' OR channel_group='fast' OR channel_group='nightly') AND rosa_enabled='t'&size=-1"
	out, err := h.getJSON(r.Context(), tok, rawURL)
	if err != nil {
		applog.Logger().Error("rosa openshift-versions", "error", err)
		writeJSON(w, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, out)
}
