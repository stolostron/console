// Copyright Contributors to the Open Cluster Management project

package clusterproxy

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"

	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/rest"

	"github.com/stolostron/console/backend/internal/hubresources"
	applog "github.com/stolostron/console/backend/internal/log"
)

const (
	DefaultNamespace = "multicluster-engine"
	inClusterPort    = "9092"
	routePort        = "443"
	servicePrefix    = "cluster-proxy-addon-user"
)

// Resolver finds the cluster-proxy-addon-user endpoint (env override or MCE target namespace).
type Resolver struct {
	HostOverride  string
	RouteOverride string
	// Target, when set, is the full addon URL (tests).
	Target *url.URL
	Hub    *rest.Config
	// Dynamic, when set, is used instead of building a client from Hub (tests).
	Dynamic dynamic.Interface
	// Client is used with Hub for dynamic.NewForConfigAndClient (tests).
	Client *http.Client

	mu        sync.Mutex
	cachedNS  string
	haveCache bool
}

// ServiceHost is the in-cluster DNS name for the addon user proxy.
func ServiceHost(namespace string) string {
	if namespace == "" {
		namespace = DefaultNamespace
	}
	return servicePrefix + "." + namespace + ".svc.cluster.local"
}

// HostPort is used by the managed-cluster reverse proxy (CLUSTER_PROXY_ADDON_USER_HOST or svc:9092).
func (r *Resolver) HostPort(ctx context.Context) (host, port string) {
	if r != nil && r.Target != nil {
		return hostnamePort(r.Target)
	}
	if r != nil && r.HostOverride != "" {
		return r.HostOverride, routePort
	}
	return ServiceHost(r.namespace(ctx)), inClusterPort
}

// ProxyURL is the addon base URL for ReverseProxy (scheme + host + port).
func (r *Resolver) ProxyURL(ctx context.Context) (*url.URL, error) {
	if r != nil && r.Target != nil {
		return r.Target, nil
	}
	host, port := r.HostPort(ctx)
	return TargetURL(host, port)
}

// URL is used by VM helpers (CLUSTER_PROXY_ADDON_USER_ROUTE or https://svc:9092).
func (r *Resolver) URL(ctx context.Context) (*url.URL, error) {
	if r != nil && r.Target != nil {
		return r.Target, nil
	}
	if r != nil && r.RouteOverride != "" {
		return url.Parse(r.RouteOverride)
	}
	host, port := r.HostPortWithoutHostOverride(ctx)
	return url.Parse("https://" + host + ":" + port)
}

// HostPortWithoutHostOverride ignores CLUSTER_PROXY_ADDON_USER_HOST so VM URL matching Node
// still uses the in-cluster service when only the Route env is unset.
func (r *Resolver) HostPortWithoutHostOverride(ctx context.Context) (host, port string) {
	return ServiceHost(r.namespace(ctx)), inClusterPort
}

// namespace returns the cached MCE target namespace, or DefaultNamespace on failure.
func (r *Resolver) namespace(ctx context.Context) string {
	if r == nil {
		return DefaultNamespace
	}
	r.mu.Lock()
	if r.haveCache {
		ns := r.cachedNS
		r.mu.Unlock()
		return ns
	}
	r.mu.Unlock()

	ns, ok := r.fetchNamespace(ctx)
	if !ok {
		return DefaultNamespace
	}

	r.mu.Lock()
	if !r.haveCache {
		r.cachedNS = ns
		r.haveCache = true
	}
	ns = r.cachedNS
	r.mu.Unlock()
	return ns
}

// fetchNamespace reads the MultiClusterEngine target namespace; ok is false when the client fails.
func (r *Resolver) fetchNamespace(ctx context.Context) (string, bool) {
	dc, err := r.dynamicClient()
	if err != nil {
		applog.Logger().Error("mce dynamic client", "error", err)
		return DefaultNamespace, false
	}
	ns, err := hubresources.MCETargetNamespace(ctx, dc)
	if err != nil {
		applog.Logger().Error("Error getting MultiClusterEngine", "error", err)
		return DefaultNamespace, false
	}
	if ns == "" {
		return DefaultNamespace, true
	}
	return ns, true
}

// dynamicClient returns Dynamic, or builds one from Hub (and optional Client).
func (r *Resolver) dynamicClient() (dynamic.Interface, error) {
	if r != nil && r.Dynamic != nil {
		return r.Dynamic, nil
	}
	if r == nil || r.Hub == nil {
		return nil, fmt.Errorf("hub rest config is required")
	}
	if r.Client != nil {
		return dynamic.NewForConfigAndClient(r.Hub, r.Client)
	}
	return dynamic.NewForConfig(r.Hub)
}

// TargetURL builds https://host:port for ReverseProxy SetURL.
func TargetURL(host, port string) (*url.URL, error) {
	if host == "" {
		return nil, fmt.Errorf("cluster proxy host is empty")
	}
	if port == "" {
		port = inClusterPort
	}
	return url.Parse("https://" + netJoinHostPort(host, port))
}

// netJoinHostPort joins host:port, bracketing IPv6 literals.
func netJoinHostPort(host, port string) string {
	if strings.Contains(host, ":") && !strings.HasPrefix(host, "[") {
		return "[" + host + "]:" + port
	}
	return host + ":" + port
}

// hostnamePort extracts host and port from u, defaulting 80/443 when the port is empty.
func hostnamePort(u *url.URL) (host, port string) {
	host = u.Hostname()
	port = u.Port()
	if port != "" {
		return host, port
	}
	if u.Scheme == "http" {
		return host, "80"
	}
	return host, "443"
}
