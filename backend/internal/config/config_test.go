// Copyright Contributors to the Open Cluster Management project

package config_test

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/stolostron/console/backend/internal/config"
)

func TestReloadSettings_PromotesKeys(t *testing.T) {
	dir := t.TempDir()
	write := func(name, val string) {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(val), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	write("LOG_LEVEL", "info")
	write("APP_SEARCH_LIMIT", "50")
	write("globalSearchFeatureFlag", "enabled")
	write("UPGRADE_RISKS_PREDICTION_URL", "https://example.invalid")
	write("ansibleIntegration", "available")

	t.Setenv("LOG_LEVEL", "")
	cfg := &config.Config{ConfigDir: dir}
	if err := cfg.ReloadSettings(); err != nil {
		t.Fatal(err)
	}
	if os.Getenv("LOG_LEVEL") != "info" {
		t.Fatalf("LOG_LEVEL=%q", os.Getenv("LOG_LEVEL"))
	}
	if os.Getenv("APP_SEARCH_LIMIT") != "50" {
		t.Fatalf("APP_SEARCH_LIMIT=%q", os.Getenv("APP_SEARCH_LIMIT"))
	}
	if os.Getenv("globalSearchFeatureFlag") != "enabled" {
		t.Fatalf("flag=%q", os.Getenv("globalSearchFeatureFlag"))
	}
	if os.Getenv("UPGRADE_RISKS_PREDICTION_URL") != "https://example.invalid" {
		t.Fatalf("upgrade url=%q", os.Getenv("UPGRADE_RISKS_PREDICTION_URL"))
	}
	if os.Getenv("ansibleIntegration") != "" {
		t.Fatal("ansibleIntegration must not be promoted to env")
	}
	settings := cfg.Settings()
	if settings["ansibleIntegration"] != "available" {
		t.Fatalf("settings missing ansibleIntegration: %#v", settings)
	}
}

func TestLoad_FromEnvFile(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, ".env")
	if err := os.WriteFile(path, []byte("CLUSTER_API_URL=https://from-file.example\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	orig := os.Getenv("CLUSTER_API_URL")
	os.Unsetenv("CLUSTER_API_URL")
	t.Cleanup(func() {
		if orig == "" {
			os.Unsetenv("CLUSTER_API_URL")
			return
		}
		_ = os.Setenv("CLUSTER_API_URL", orig)
	})
	t.Setenv("ENV_FILE", path)
	cfg := config.Load()
	if cfg.ClusterAPIURL != "https://from-file.example" {
		t.Fatalf("CLUSTER_API_URL=%q", cfg.ClusterAPIURL)
	}
}

func TestLoad_OAuthEnv(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("ENV_FILE", filepath.Join(dir, ".env"))
	t.Setenv("OAUTH2_CLIENT_ID", "cid")
	t.Setenv("OAUTH2_CLIENT_SECRET", "csecret")
	t.Setenv("OAUTH2_REDIRECT_URL", "https://localhost:3000/multicloud/login/callback")
	t.Setenv("OIDC_ISSUER_URL", "https://sso.example.com")
	t.Setenv("FRONTEND_URL", "https://localhost:3000")
	t.Setenv("NODE_ENV", "production")
	cfg := config.Load()
	if cfg.OAuth2ClientID != "cid" || cfg.OAuth2ClientSecret != "csecret" {
		t.Fatalf("client %q %q", cfg.OAuth2ClientID, cfg.OAuth2ClientSecret)
	}
	if cfg.OAuth2RedirectURL != "https://localhost:3000/multicloud/login/callback" {
		t.Fatalf("redirect %q", cfg.OAuth2RedirectURL)
	}
	if cfg.OIDCIssuerURL != "https://sso.example.com" || cfg.FrontendURL != "https://localhost:3000" {
		t.Fatalf("oidc/frontend %q %q", cfg.OIDCIssuerURL, cfg.FrontendURL)
	}
	if !cfg.Production {
		t.Fatal("expected Production")
	}
}

func TestLoad_ProxyEnvVars(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("ENV_FILE", filepath.Join(dir, ".env"))
	t.Setenv("PORT", "4100")
	t.Setenv("NODE_BACKEND_URL", "https://127.0.0.1:4101")
	t.Setenv("PROMETHEUS_ROUTE", "https://prom.example")
	t.Setenv("OBSERVABILITY_ROUTE", "https://obs.example")
	t.Setenv("CLUSTER_PROXY_ADDON_USER_HOST", "proxy.example")
	t.Setenv("CLUSTER_PROXY_ADDON_USER_ROUTE", "https://proxy.example")

	cfg := config.Load()
	if cfg.Port != "4100" {
		t.Fatalf("Port=%q", cfg.Port)
	}
	if cfg.NodeBackendURL != "https://127.0.0.1:4101" {
		t.Fatalf("NodeBackendURL=%q", cfg.NodeBackendURL)
	}
	if cfg.PrometheusRoute != "https://prom.example" {
		t.Fatalf("PrometheusRoute=%q", cfg.PrometheusRoute)
	}
	if cfg.ObservabilityRoute != "https://obs.example" {
		t.Fatalf("ObservabilityRoute=%q", cfg.ObservabilityRoute)
	}
	if cfg.ClusterProxyAddonUserHost != "proxy.example" {
		t.Fatalf("ClusterProxyAddonUserHost=%q", cfg.ClusterProxyAddonUserHost)
	}
	if cfg.ClusterProxyAddonUserRoute != "https://proxy.example" {
		t.Fatalf("ClusterProxyAddonUserRoute=%q", cfg.ClusterProxyAddonUserRoute)
	}
}

func TestLoad_PublicFolder(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("ENV_FILE", filepath.Join(dir, ".env"))
	t.Setenv("PUBLIC_FOLDER", "/app/public")
	cfg := config.Load()
	if cfg.PublicFolder != "/app/public" {
		t.Fatalf("PublicFolder=%q", cfg.PublicFolder)
	}
}

func TestReloadSettings_MissingDir(t *testing.T) {
	cfg := &config.Config{ConfigDir: filepath.Join(t.TempDir(), "missing")}
	if err := cfg.ReloadSettings(); err != nil {
		t.Fatal(err)
	}
}

func TestReloadSettings_UnsetsRemovedKeys(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "LOG_LEVEL")
	if err := os.WriteFile(path, []byte("debug"), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg := &config.Config{ConfigDir: dir}
	if err := cfg.ReloadSettings(); err != nil {
		t.Fatal(err)
	}
	if os.Getenv("LOG_LEVEL") != "debug" {
		t.Fatalf("LOG_LEVEL=%q", os.Getenv("LOG_LEVEL"))
	}
	if err := os.Remove(path); err != nil {
		t.Fatal(err)
	}
	if err := cfg.ReloadSettings(); err != nil {
		t.Fatal(err)
	}
	if os.Getenv("LOG_LEVEL") != "" {
		t.Fatalf("LOG_LEVEL=%q want unset", os.Getenv("LOG_LEVEL"))
	}
}

func TestSettings_ReturnsCopy(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "feature-flag")
	if err := os.WriteFile(path, []byte("on"), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg := &config.Config{ConfigDir: dir}
	if err := cfg.ReloadSettings(); err != nil {
		t.Fatal(err)
	}
	got := cfg.Settings()
	got["feature-flag"] = "off"
	if cfg.Settings()["feature-flag"] != "on" {
		t.Fatalf("settings mutated: %q", cfg.Settings()["feature-flag"])
	}
}

func TestWatch_ReloadsOnChange(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "LOG_LEVEL")
	if err := os.WriteFile(path, []byte("debug"), 0o644); err != nil {
		t.Fatal(err)
	}
	cfg := &config.Config{ConfigDir: dir}
	if err := cfg.ReloadSettings(); err != nil {
		t.Fatal(err)
	}
	cancel, err := cfg.Watch()
	if err != nil {
		t.Fatal(err)
	}
	defer cancel()

	if err := os.WriteFile(path, []byte("error"), 0o644); err != nil {
		t.Fatal(err)
	}
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if os.Getenv("LOG_LEVEL") == "error" {
			return
		}
		time.Sleep(50 * time.Millisecond)
	}
	t.Fatalf("LOG_LEVEL did not update, got %q", os.Getenv("LOG_LEVEL"))
}
