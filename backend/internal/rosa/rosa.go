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

const (
	defaultAPIURL = "https://api.openshift.com"

	pathOIDCConfigs       = "oidc-configs"
	pathClusterNameCheck  = "cluster-name-check"
	pathSTSRoleARNs       = "sts-role-arns"
	pathSTSOCMRole        = "sts-ocm-role"
	pathSTSUserRole       = "sts-user-role"
	pathOpenShiftVersions = "openshift-versions"
	pathMachineTypes      = "machine-types"
)

// Routes are the ROSA wizard POST paths (also registered under /multicloud).
var Routes = []string{
	"/aws-account-ids",
	"/aws-billing-accounts",
	"/" + pathOIDCConfigs,
	"/regions",
	"/" + pathClusterNameCheck,
	"/" + pathSTSRoleARNs,
	"/vpcs",
	"/" + pathSTSOCMRole,
	"/" + pathSTSUserRole,
	"/" + pathOpenShiftVersions,
	"/" + pathMachineTypes,
}

var (
	clusterNameRE  = regexp.MustCompile(`^[a-z]([a-z0-9-]*[a-z0-9])?$`)
	awsAccountIDRE = regexp.MustCompile(`^[0-9]{12}$`)
)

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
	case pathOIDCConfigs:
		h.oidcConfigs(w, r, body)
	case "regions":
		h.regions(w, r, body)
	case pathClusterNameCheck:
		h.clusterNameCheck(w, r, body)
	case pathSTSRoleARNs:
		h.stsRoleARNs(w, r, body)
	case "vpcs":
		h.vpcs(w, r, body)
	case pathSTSOCMRole:
		h.stsOCMRole(w, r, body)
	case pathSTSUserRole:
		h.userRole(w, r, body)
	case pathOpenShiftVersions:
		h.versions(w, r, body)
	case pathMachineTypes:
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
	writeJSONStatus(w, http.StatusOK, v)
}

func writeJSONStatus(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	if status != http.StatusOK {
		w.WriteHeader(status)
	}
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

func validAWSAccountID(id string) bool {
	return id == "" || awsAccountIDRE.MatchString(id)
}

func (h *Handler) ssoToken(ctx context.Context, p payload) (string, error) {
	return auth.OCMServiceToken(ctx, h.client(), p.ServiceAccountID, p.ServiceAccountSecret)
}

// authPayload parses the body and exchanges SSO credentials. ok is false when
// the error response was already written.
func (h *Handler) authPayload(w http.ResponseWriter, r *http.Request, body []byte, op string) (payload, string, bool) {
	p, err := parsePayload(body)
	if err != nil {
		applog.Logger().Error("rosa "+op, "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return payload{}, "", false
	}
	tok, err := h.ssoToken(r.Context(), p)
	if err != nil {
		applog.Logger().Error("rosa "+op+" sso", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return payload{}, "", false
	}
	return p, tok, true
}

// authPayloadOrg is authPayload plus current_account org lookup.
func (h *Handler) authPayloadOrg(
	w http.ResponseWriter, r *http.Request, body []byte, op string,
) (payload, string, orgAccount, bool) {
	p, tok, ok := h.authPayload(w, r, body, op)
	if !ok {
		return payload{}, "", orgAccount{}, false
	}
	org, err := h.getOrg(r.Context(), tok)
	if err != nil {
		applog.Logger().Error("rosa "+op+" org", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return payload{}, "", orgAccount{}, false
	}
	return p, tok, org, true
}

func (h *Handler) doJSON(ctx context.Context, method, token, rawURL string, body any) (status int, out any, err error) {
	var reader io.Reader
	if body != nil {
		raw, marshalErr := json.Marshal(body)
		if marshalErr != nil {
			return 0, nil, marshalErr
		}
		reader = strings.NewReader(string(raw))
	}
	req, err := http.NewRequestWithContext(ctx, method, encodeRequestURL(rawURL), reader)
	if err != nil {
		return 0, nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	resp, err := h.client().Do(req)
	if err != nil {
		return 0, nil, err
	}
	defer func() { _, _ = io.Copy(io.Discard, resp.Body); _ = resp.Body.Close() }()
	if err = json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return 0, nil, err
	}
	return resp.StatusCode, out, nil
}

func (h *Handler) getJSON(ctx context.Context, token, rawURL string) (any, error) {
	_, out, err := h.doJSON(ctx, http.MethodGet, token, rawURL, nil)
	return out, err
}

func (h *Handler) postJSON(ctx context.Context, token, rawURL string, body any) (postResult, error) {
	status, out, err := h.doJSON(ctx, http.MethodPost, token, rawURL, body)
	if err != nil {
		return postResult{}, err
	}
	return postResult{StatusCode: status, Body: out}, nil
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

func (h *Handler) writeUpstream(w http.ResponseWriter, op string, out any, err error, onErr any) {
	if err != nil {
		applog.Logger().Error("rosa "+op, "error", err)
		writeJSON(w, onErr)
		return
	}
	writeJSON(w, out)
}

func (h *Handler) awsAccountIds(w http.ResponseWriter, r *http.Request, body []byte) {
	_, tok, org, ok := h.authPayloadOrg(w, r, body, "aws-account-ids")
	if !ok {
		return
	}
	out, err := h.getJSON(r.Context(), tok, h.APIURL+"/api/accounts_mgmt/v1/organizations/"+org.Organization.ID+"/labels")
	h.writeUpstream(w, "aws-account-ids labels", out, err, nil)
}

func (h *Handler) awsBillingAccounts(w http.ResponseWriter, r *http.Request, body []byte) {
	_, tok, org, ok := h.authPayloadOrg(w, r, body, "aws-billing-accounts")
	if !ok {
		return
	}
	quotaURL := h.APIURL + "/api/accounts_mgmt/v1/organizations/" + org.Organization.ID +
		"/quota_cost?fetchRelatedResources=true&fetchCloudAccounts=true"
	out, err := h.getJSON(r.Context(), tok, quotaURL)
	h.writeUpstream(w, "aws-billing-accounts quota", out, err, nil)
}

func (h *Handler) oidcConfigs(w http.ResponseWriter, r *http.Request, body []byte) {
	p, tok, ok := h.authPayload(w, r, body, pathOIDCConfigs)
	if !ok {
		return
	}
	if !validAWSAccountID(p.AWSAccountID) {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	q := url.Values{}
	q.Set("search", "aws.account_id="+p.AWSAccountID+" or aws.account_id=''")
	out, err := h.getJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/oidc_configs?"+q.Encode())
	h.writeUpstream(w, pathOIDCConfigs, out, err, map[string]string{"error": errString(err)})
}

func (h *Handler) regions(w http.ResponseWriter, r *http.Request, body []byte) {
	_, tok, ok := h.authPayload(w, r, body, "regions")
	if !ok {
		return
	}
	out, err := h.getJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/cloud_providers?size=-1&fetchRegions=true")
	h.writeUpstream(w, "regions", out, err, map[string]string{"error": errString(err)})
}

func (h *Handler) clusterNameCheck(w http.ResponseWriter, r *http.Request, body []byte) {
	p, tok, ok := h.authPayload(w, r, body, pathClusterNameCheck)
	if !ok {
		return
	}
	if p.ClusterName == "" || !clusterNameRE.MatchString(p.ClusterName) {
		writeJSONStatus(w, http.StatusBadRequest, map[string]string{"error": "Invalid cluster name format"})
		return
	}
	out, err := h.postJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/clusters?method=get", map[string]any{
		"size":   1,
		"search": "name = '" + p.ClusterName + "'",
	})
	h.writeUpstream(w, pathClusterNameCheck, out, err, nil)
}

func (h *Handler) vpcs(w http.ResponseWriter, r *http.Request, body []byte) {
	var raw map[string]any
	if err := json.Unmarshal(body, &raw); err != nil {
		applog.Logger().Error("rosa vpcs", "error", err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	_, tok, ok := h.authPayload(w, r, body, "vpcs")
	if !ok {
		return
	}
	vpcURL := h.APIURL + "/api/clusters_mgmt/v1/aws_inquiries/vpcs?fetchSecurityGroups=true"
	out, err := h.postJSON(r.Context(), tok, vpcURL, map[string]any{
		"aws":    raw["aws"],
		"region": raw["region"],
	})
	h.writeUpstream(w, "vpcs", out, err, map[string]string{"error": errString(err)})
}

func (h *Handler) stsRoleARNs(w http.ResponseWriter, r *http.Request, body []byte) {
	p, tok, ok := h.authPayload(w, r, body, pathSTSRoleARNs)
	if !ok {
		return
	}
	if !validAWSAccountID(p.AWSAccountID) {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	rolesURL := h.APIURL + "/api/clusters_mgmt/v1/aws_inquiries/sts_account_roles"
	out, err := h.postJSON(r.Context(), tok, rolesURL, map[string]any{
		"account_id": p.AWSAccountID,
	})
	h.writeUpstream(w, pathSTSRoleARNs, out, err, nil)
}

func (h *Handler) stsOCMRole(w http.ResponseWriter, r *http.Request, body []byte) {
	p, tok, ok := h.authPayload(w, r, body, pathSTSOCMRole)
	if !ok {
		return
	}
	if !validAWSAccountID(p.AWSAccountID) {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	out, err := h.postJSON(r.Context(), tok, h.APIURL+"/api/clusters_mgmt/v1/aws_inquiries/sts_ocm_role", map[string]any{
		"account_id": p.AWSAccountID,
	})
	h.writeUpstream(w, pathSTSOCMRole, out, err, nil)
}

func (h *Handler) userRole(w http.ResponseWriter, r *http.Request, body []byte) {
	_, tok, org, ok := h.authPayloadOrg(w, r, body, pathSTSUserRole)
	if !ok {
		return
	}
	out, err := h.getJSON(r.Context(), tok, h.APIURL+"/api/accounts_mgmt/v1/accounts/"+org.ID+"/labels/sts_user_role")
	h.writeUpstream(w, pathSTSUserRole, out, err, nil)
}

func (h *Handler) machineTypes(w http.ResponseWriter, r *http.Request, body []byte) {
	p, tok, ok := h.authPayload(w, r, body, pathMachineTypes)
	if !ok {
		return
	}
	zones := p.AvailabilityZones
	if zones == nil {
		zones = []any{}
	}
	typesURL := h.APIURL + "/api/clusters_mgmt/v1/aws_inquiries/machine_types?size=-1"
	out, err := h.postJSON(r.Context(), tok, typesURL, map[string]any{
		"aws":                map[string]any{"sts": map[string]any{"role_arn": p.RoleARN}},
		"region":             map[string]any{"id": p.Region},
		"availability_zones": zones,
	})
	h.writeUpstream(w, pathMachineTypes, out, err, map[string]string{"error": errString(err)})
}

func (h *Handler) versions(w http.ResponseWriter, r *http.Request, body []byte) {
	_, tok, ok := h.authPayload(w, r, body, pathOpenShiftVersions)
	if !ok {
		return
	}
	rawURL := h.APIURL + "/api/clusters_mgmt/v1/versions/" +
		"?order=end_of_life_timestamp desc&product=hcp" +
		"&search=enabled='t' AND (channel_group='stable' OR channel_group='eus'" +
		" OR channel_group='candidate' OR channel_group='fast' OR channel_group='nightly')" +
		" AND rosa_enabled='t'&size=-1"
	out, err := h.getJSON(r.Context(), tok, rawURL)
	h.writeUpstream(w, pathOpenShiftVersions, out, err, map[string]string{"error": errString(err)})
}

func errString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}
