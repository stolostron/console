// Copyright Contributors to the Open Cluster Management project

package main

import (
	"context"
	"errors"
	"log/slog"
	"net/url"
	"os"
	"os/signal"
	"syscall"

	"k8s.io/client-go/discovery"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"

	"github.com/stolostron/console/backend/internal/auth"
	"github.com/stolostron/console/backend/internal/clusterinfo"
	"github.com/stolostron/console/backend/internal/clusterproxy"
	"github.com/stolostron/console/backend/internal/config"
	rbacevents "github.com/stolostron/console/backend/internal/events/rbac"
	"github.com/stolostron/console/backend/internal/k8sproxy"
	applog "github.com/stolostron/console/backend/internal/log"
	"github.com/stolostron/console/backend/internal/oauth"
	"github.com/stolostron/console/backend/internal/mcproxy"
	"github.com/stolostron/console/backend/internal/metricsproxy"
	"github.com/stolostron/console/backend/internal/server"
	"github.com/stolostron/console/backend/internal/static"
	"github.com/stolostron/console/backend/internal/user"
	"github.com/stolostron/console/backend/internal/vmproxy"
)

func main() {
	if err := run(); err != nil {
		applog.Logger().Error("process exit", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg := config.Load()
	applog.SetLevel(cfg.LogLevel)

	sa, ok := auth.LoadServiceAccount(cfg)
	if !ok {
		applog.Logger().Error("service account token missing",
			"msg", "set TOKEN or mount /var/run/secrets/kubernetes.io/serviceaccount/token")
		return errMissingToken
	}

	stopWatch, err := cfg.Watch()
	if err != nil {
		applog.Logger().Warn("config watch disabled", "error", err)
	} else {
		defer stopWatch()
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	restCfg, err := auth.RESTConfig(cfg, sa)
	if err != nil {
		return err
	}
	kube, err := kubernetes.NewForConfig(restCfg)
	if err != nil {
		return err
	}
	dyn, err := dynamic.NewForConfig(restCfg)
	if err != nil {
		return err
	}
	disc, err := discovery.NewDiscoveryClientForConfig(restCfg)
	if err != nil {
		return err
	}
	reviewer, err := auth.NewTokenReviewer(cfg, sa)
	if err != nil {
		return err
	}
	store := rbacevents.NewStore()
	if err = rbacevents.StartInformer(ctx, kube, store); err != nil {
		return err
	}
	rbacHandler := rbacevents.NewHandler(store, rbacevents.NewAPIAuth(restCfg), rbacevents.NewSSARAccess(restCfg))

	oauthH := oauth.New(oauth.Options{
		ClientID:      cfg.OAuth2ClientID,
		ClientSecret:  cfg.OAuth2ClientSecret,
		RedirectURL:   cfg.OAuth2RedirectURL,
		FrontendURL:   cfg.FrontendURL,
		ClusterAPIURL: cfg.ClusterAPIURL,
		OIDCIssuerURL: cfg.OIDCIssuerURL,
		Production:    cfg.Production,
		Client:        auth.HTTPClient(sa.CACert, 0),
		RESTConfig:    restCfg,
	})
	var opts []server.Option
	opts = append(opts, server.WithRBACEvents(rbacHandler), server.WithOAuth(oauthH))
	if !cfg.Production {
		opts = append(opts, server.WithOAuthLogin())
	}
	clusterURL, err := url.Parse(cfg.ClusterAPIURL)
	if err != nil {
		return err
	}
	k8sHandler := k8sproxy.New(clusterURL, k8sproxy.TLSConfigFromCA(sa.CACert))
	opts = append(opts, server.WithK8sProxy(k8sHandler))
	fsys, ok := static.OpenFS(cfg.PublicFolder)
	if !ok {
		fsys = static.BundledFS()
	}
	opts = append(opts, server.WithStatic(static.New(static.Options{
		FS:         fsys,
		Production: os.Getenv("NODE_ENV") == "production",
	})))

	serviceTLS := auth.ServiceTLSConfig(sa)
	addonResolver := &clusterproxy.Resolver{
		HostOverride:  cfg.ClusterProxyAddonUserHost,
		RouteOverride: cfg.ClusterProxyAddonUserRoute,
		Hub:           restCfg,
	}
	promURL, err := metricsproxy.ParseTarget(cfg.PrometheusRoute, metricsproxy.DefaultPrometheusURL)
	if err != nil {
		return err
	}
	obsURL, err := metricsproxy.ParseTarget(cfg.ObservabilityRoute, metricsproxy.DefaultObservabilityURL)
	if err != nil {
		return err
	}
	opts = append(opts,
		server.WithManagedClusterProxy(mcproxy.New(mcproxy.Options{
			Resolver:   addonResolver,
			TLSConfig:  serviceTLS,
			RESTConfig: restCfg,
		})),
		server.WithPrometheusProxy(metricsproxy.New(promURL, serviceTLS, "/prometheus")),
		server.WithObservabilityProxy(metricsproxy.New(obsURL, serviceTLS, "/observability")),
		server.WithVMProxy(vmproxy.New(vmproxy.Options{
			Resolver:   addonResolver,
			TLSConfig:  serviceTLS,
			RESTConfig: restCfg,
			SAToken:    sa.Token,
		})),
		server.WithUser(user.New(user.Options{
			RESTConfig: restCfg,
			Reviewer:   reviewer,
			Dynamic:    dyn,
		})),
		server.WithClusterInfo(clusterinfo.New(clusterinfo.Options{
			RESTConfig: restCfg,
			Dynamic:    dyn,
			Discovery:  disc,
		})),
	)

	handler, err := server.Handler(cfg, opts...)
	if err != nil {
		return err
	}

	applog.Logger().Info("process start",
		"PORT", cfg.Port,
		"NODE_BACKEND_URL", cfg.NodeBackendURL,
		slog.String("CONFIG_DIR", cfg.ConfigDir),
		slog.String("PUBLIC_FOLDER", cfg.PublicFolder),
	)
	return server.ListenAndServe(ctx, cfg, handler)
}

var errMissingToken = errors.New("service account token missing")
