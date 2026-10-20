# Backend Internal Architecture

This document outlines the architecture of the `backend/internal` directory.

## Paths → Handler

| Paths | Handler |
|-------|---------|
| `POST /aggregate/*` | [aggregate/handler.go](internal/aggregate/handler.go) |
| `ALL /api`, `ALL /api/*`, `ALL /apis`, `ALL /apis/*`, `GET /version` | [k8sproxy.go](internal/k8sproxy/k8sproxy.go) |
| `POST /ansibletower` | [ansibletower.go](internal/ansibletower/ansibletower.go) |
| `GET /authenticated`, `GET /username`, `ALL /userpreference` | [user.go](internal/user/user.go) |
| `POST /aws-account-ids`, `/aws-billing-accounts`, `/oidc-configs`, `/regions`, `/cluster-name-check`, `/sts-role-arns`, `/vpcs`, `/sts-ocm-role`, `/sts-user-role`, `/openshift-versions`, `/machine-types` | [rosa.go](internal/rosa/rosa.go) |
| `GET /configure`, `/login`, `/login/callback`, `/logout` | [oauth.go](internal/oauth/oauth.go) |
| `GET /debug/informer-snapshot` | [informers/handler.go](internal/informers/handler.go) |
| `GET /events` | [hub/handler.go](internal/events/hub/handler.go) |
| `GET /events/rbac` | [rbac/handler.go](internal/events/rbac/handler.go) |
| `GET /hub`, `/cluster-version`, `/hypershift-status`, `/multiclusterhub/components`, `/multiclusterengine/components`, `/apiPaths`, `ALL /operatorCheck` | [clusterinfo.go](internal/clusterinfo/clusterinfo.go) |
| `GET /livenessProbe`, `GET /readinessProbe`, `GET /ping` | [health.go](internal/health/health.go) |
| `ALL /managedclusterproxy/*` | [mcproxy.go](internal/mcproxy/mcproxy.go) |
| `POST /placement-debug` | [placementdebug.go](internal/placementdebug/placementdebug.go) |
| `GET /prometheus/*`, `GET /observability/*` | [metricsproxy.go](internal/metricsproxy/metricsproxy.go) |
| `ALL /proxy/search` | [proxy.go](internal/searchproxy/proxy.go) |
| `GET /*` (static fallback) | [static.go](internal/static/static.go) |
| `POST /upgrade-risks-prediction` | [upgraderisks.go](internal/upgraderisks/upgraderisks.go) |
| `GET /virtualmachines/get/*`, `ALL /virtualmachines/*`, `ALL /virtualmachineinstances/*`, `GET /virtualmachinesnapshots/get/*`, `ALL /virtualmachinesnapshots/*`, `ALL /virtualmachinerestores`, `GET /vmResourceUsage/*` | [vmproxy/handler.go](internal/vmproxy/handler.go) |

All routes are also registered under `/multicloud` prefix.

## Folder Directory

- **cmd/console/** - Process entry point.
  - [main.go](cmd/console/main.go) - Main application entry point. Key initialization steps (not exhaustive):
    - **[`server.Handler()`](internal/server/server.go), [`server.ListenAndServe()`](internal/server/server.go) to construct the main router mux and start the HTTP/TLS server.**
    - **[`rosa.New()`](internal/rosa/rosa.go) to set up the ROSA HCP wizard proxy (11 POST routes).**
    - **[`clusterinfo.New()`](internal/clusterinfo/clusterinfo.go) to set up cluster information endpoints (`/hub`, `/cluster-version`, `/hypershift-status`, components, `/apiPaths`, `/operatorCheck`).**
    - **[`vmproxy.New()`](internal/vmproxy/handler.go) to configure VirtualMachine proxy handlers (`/virtualmachines/*`, `/virtualmachineinstances/*`, `/virtualmachinesnapshots/*`, `/vmResourceUsage/*`).**
    - **[`k8sproxy.New()`](internal/k8sproxy/k8sproxy.go) to set up the hub kube-apiserver passthrough proxy (`/api/*`, `/apis/*`, `/version`).**
    - [`config.Load()`](internal/config/config.go) to load environment variables and configuration; [`cfg.Watch()`](internal/config/config.go) to live-reload the `config/` directory via fsnotify.
    - [`auth.LoadServiceAccount()`](internal/auth/auth.go#L63), [`auth.RESTConfig()`](internal/auth/auth.go#L136), and [`auth.NewTokenReviewer()`](internal/auth/auth.go#L255) to set up authentication and Kubernetes client configurations.
    - [`kubernetes.NewForConfig()`](https://pkg.go.dev/k8s.io/client-go/kubernetes#NewForConfig), [`dynamic.NewForConfig()`](https://pkg.go.dev/k8s.io/client-go/dynamic#NewForConfig), and [`discovery.NewDiscoveryClientForConfig()`](https://pkg.go.dev/k8s.io/client-go/discovery#NewDiscoveryClientForConfig) to initialize Kubernetes clients.
    - [`rbacevents.NewStore()`](internal/events/rbac/store.go), [`rbacevents.NewSSARAccess()`](internal/events/rbac/access.go), and [`rbacevents.NewHandler()`](internal/events/rbac/handler.go) to set up RBAC event handling. `StartCleanup` begins periodic SSAR cache eviction.
    - [`informers.New()`](internal/informers/factory.go) with [`informers.DefaultWatchSpecs()`](internal/informers/specs.go) to initialize the hub resource cache. A separate [`informers.RESTConfig()`](internal/informers/factory.go) creates dedicated rate-limited clients for the informer list/watch traffic.
    - [`eventshub.New()`](internal/events/hub/hub.go), [`eventshub.NewSSARAccess()`](internal/events/hub/access.go), and [`eventshub.NewHandler()`](internal/events/hub/handler.go) to set up the SSE event hub. `StartCleanup` begins periodic SSAR cache eviction. `infCache.SetSink(eventHub)` wires informer callbacks to the hub, and `cfg.OnReload(eventHub.PublishSettings)` re-publishes settings on config change.
    - [`oauth.New()`](internal/oauth/oauth.go) to configure OAuth/OIDC authentication.
    - [`searchapi.Client`](internal/searchapi/searchapi.go) to set up the Search GraphQL client.
    - [`aggregate.NewEngine()`](internal/aggregate/engine.go), [`aggregate.NewSSARAccess()`](internal/aggregate/rbac.go), and [`aggregate.NewHandler()`](internal/aggregate/handler.go) to initialize the application aggregator cache and search loop. `StartCleanup` begins periodic SSAR cache eviction.
    - Non-production mode adds [`server.WithOAuthLogin()`](internal/server/server.go) for standalone login routes and [`server.WithDebugSnapshot()`](internal/server/server.go) for `GET /debug/informer-snapshot`.
    - [`static.New()`](internal/static/static.go) to configure static asset serving for the frontend.
    - [`mcproxy.New()`](internal/mcproxy/mcproxy.go) to configure the managed-cluster reverse proxy.
    - [`metricsproxy.New()`](internal/metricsproxy/metricsproxy.go) to set up Prometheus and observability reverse proxies.
    - [`user.New()`](internal/user/user.go) to set up user info routes.
    - [`searchproxy.New()`](internal/searchproxy/proxy.go) to configure the search GraphQL proxy.
    - [`placementdebug.New()`](internal/placementdebug/placementdebug.go) to set up the placement-debug reverse proxy.
    - [`ansibletower.New()`](internal/ansibletower/ansibletower.go) to configure the Ansible Tower proxy.
    - [`upgraderisks.New()`](internal/upgraderisks/upgraderisks.go) to set up the upgrade risks prediction proxy.
    - [`rbacevents.StartInformer()`](internal/events/rbac/informer.go) to start the ClusterRole informer (always runs).
    - [`informers.StartCache()`](internal/informers/factory.go), `eventHub.Start()`, and [`aggEng.Start()`](internal/aggregate/engine.go) to start background cache and informer loops (only when `DISABLE_EVENTS` is false).
- **informers/** - Watches and caches hub resources for application aggregation and the server-sent event (SSE) stream.
  - [factory.go](internal/informers/factory.go) - Creates and starts resource informers, limits concurrent startup, and tracks initial cache synchronization. Configures dedicated API request rate limits for the informer client.
  - [specs.go](internal/informers/specs.go) - Defines the hub resources to watch, their label and field selectors, resource scope, and whether changes are forwarded to SSE clients.
  - [handler.go](internal/informers/handler.go) - Serves the authenticated development endpoint `GET /debug/informer-snapshot`, returning cached resource identities and synchronization status for each watch.
  - [store.go](internal/informers/store.go) - Manages informer state and exposes deduplicated resource lists, SSE snapshot data, and cache synchronization diagnostics.
  - [sink.go](internal/informers/sink.go) - Converts informer add, update, and delete callbacks into resource events for the SSE hub, suppressing updates with unchanged resource versions.
  - [transform.go](internal/informers/transform.go) - Normalizes objects to `Unstructured`, restores API version and kind, and removes managed fields from cached resources except policies.
  - [gvr.go](internal/informers/gvr.go) - Resolves API version and kind to a group/version/resource (GVR) through Kubernetes discovery and identifies unavailable or forbidden resources.
  - [retry.go](internal/informers/retry.go) - Defines retry delays with jitter, the initial synchronization timeout, and the disabled periodic resync setting. Provides retry waits that stop when the context is canceled.
- **events/** - SSE (Server-Sent Events) resource watch stream and event hubs.
  - **sse/** - Shared SSE authentication (`Authenticator`, `APIAuth`) used by both the hub and rbac event handlers.
    - [auth.go](internal/events/sse/auth.go) - `Authenticator` interface and `APIAuth` implementation that validates user tokens via `GET /api`.
  - **hub/** - Informer fan-out, snapshot packets, and per-user RBAC for `GET /events`.
    - [hub.go](internal/events/hub/hub.go) - Hub fans informer events out to connected SSE clients; manages per-client channels, blocked-client purging, and keepalive pings.
    - [handler.go](internal/events/hub/handler.go) - HTTP handler for `GET /events`: authenticates the user token, streams snapshot then live events, and writes keepalive frames.
    - [access.go](internal/events/hub/access.go) - Per-user RBAC gate: cluster-scoped `list` SSAR → SelfSubjectRulesReview per namespace → SSAR fallback. 60s TTL cache keyed by token hash.
    - [access_rules.go](internal/events/hub/access_rules.go) - SelfSubjectRulesReview evaluation: classifies each namespace as deny-all, allow-all, or allow-names. Cluster-scoped kinds probe the `default` namespace only.
    - [snapshot.go](internal/events/hub/snapshot.go) - Builds the initial snapshot packet sequence (START → SETTINGS → priority resources with EOP → LOADED) and converts informer objects to SSE events.
    - [event.go](internal/events/hub/event.go) - Event type: one SSE data payload carrying a GVR, type (MODIFIED/DELETED/SETTINGS/…), and optional resource object.
    - [encode.go](internal/events/hub/encode.go) - Negotiates gzip/deflate from `Accept-Encoding` and writes compressed SSE streams.
    - [frame.go](internal/events/hub/frame.go) - Formats an SSE wire frame (`id:` + `data:` JSON + blank line), matching the Node `createEventString` layout.
    - [flap.go](internal/events/hub/flap.go) - Connection-flap detection: tracks rapid reconnects and backs off snapshot delivery to protect the hub under client churn.
  - **rbac/** - `GET /events/rbac` ClusterRole watch stream.
    - [informer.go](internal/events/rbac/informer.go) - Runs a ClusterRole informer filtered by `vm-clusterroles` label; feeds add/update/delete events into the store.
    - [store.go](internal/events/rbac/store.go) - Thread-safe ClusterRole store with snapshot and delta retrieval for SSE streaming.
    - [handler.go](internal/events/rbac/handler.go) - HTTP handler for `GET /events/rbac`: authenticates the user, streams matching ClusterRoles with keepalive pings.
    - [access.go](internal/events/rbac/access.go) - Per-user SSAR check for ClusterRole visibility; caches results with 60s TTL.
    - [list.go](internal/events/rbac/list.go) - Lists `vm-clusterroles` ClusterRoles using the user's own token for fine-grained RBAC filtering.
- **aggregate/** - `POST /aggregate/{applications,statuses,appSetData}` application inventory.
  - [handler.go](internal/aggregate/handler.go) - HTTP handler for the three aggregate endpoints; authenticates via `GET /api`, delegates to Engine, and returns JSON.
  - [pagination.go](internal/aggregate/pagination.go) - Request body types (`FilterSelections`, `SortBy`, `RequestListView`) and the `/applications` paginate handler: decodes the request, reads the cached app list, and applies server-side preprocessing when item count exceeds the breakpoint.
  - [engine.go](internal/aggregate/engine.go) - Holds the application cache and Search polling loop; rebuilds local apps from informer cache and fetches remote status from Search on a configurable interval.
  - [lister.go](internal/aggregate/lister.go) - `Lister` interface wrapping `InformerCache.ListByKind`; includes `MapLister` test double.
  - [clusters.go](internal/aggregate/clusters.go) - Extracts managed-cluster metadata (name, API URL, console URL) from informer cache for aggregation.
  - [transform.go](internal/aggregate/transform.go) - Classifies unstructured objects into application types (Subscription, Argo, Flux, OCP, AppSet).
  - [types.go](internal/aggregate/types.go) - Constants (search limits, pagination breakpoints, intervals), cache keys, and JSON wire format types used throughout the package.
  - [argo.go](internal/aggregate/argo.go) - Extracts related-resource kinds from Argo ApplicationSet and Application objects for Search queries.
  - [ocp.go](internal/aggregate/ocp.go) - Builds Search query inputs for remote OCP Deployment-based applications.
  - [pushmodel.go](internal/aggregate/pushmodel.go) - Builds Search query inputs for push-model pod status on AppSet-owned applications.
  - [pages.go](internal/aggregate/pages.go) - Chunks cached application lists into pages for incremental Search status fetching.
  - [status.go](internal/aggregate/status.go) - Extracts status messages and condition fields from Search result items into `StatusEntry` rows.
  - [fuse.go](internal/aggregate/fuse.go) - Client-side search port: Fuse.js 6.6.2 `ignoreLocation` + threshold 0.3 over name/namespace/clusters when item count exceeds 500.
  - [rbac.go](internal/aggregate/rbac.go) - Windowed SSAR access filter for aggregated rows; also checks ManagedClusterView `create` for remote Argo/Flux apps.
  - [appset.go](internal/aggregate/appset.go) - Fetches full ApplicationSet objects with the user token for the `/appSetData` endpoint.
- **ssarcache/** - Shared SSAR result cache and periodic cleanup used by the events hub, RBAC events, and aggregate access checkers.
  - [ssarcache.go](internal/ssarcache/ssarcache.go) - Token-keyed SSAR result cache with periodic expiry (`StartCleanup`).
- **httpx/** - Shared HTTP helpers and request/response utilities.
  - [httpx.go](internal/httpx/httpx.go) - Common HTTP request/response helpers.
- **vmproxy/** - VirtualMachine CRUD, lifecycle actions, and resource-usage aggregation via managed-cluster proxy.
  - [handler.go](internal/vmproxy/handler.go) - Routes `/virtualmachines/*`, `/virtualmachineinstances/*`, `/virtualmachinesnapshots/*`, and `/vmResourceUsage/*` through the cluster-proxy addon with the user token.
  - [hub.go](internal/vmproxy/hub.go) - Fine-grained RBAC: SSAR checks for VirtualMachine `get`/`update`/`delete` and subresource actions before proxying.
  - [kubevirt.go](internal/vmproxy/kubevirt.go) - Maps handler URL paths to KubeVirt and subresource API paths (`kubevirt.io`, `subresources.kubevirt.io`, `snapshot.kubevirt.io`).
  - [usage.go](internal/vmproxy/usage.go) - Queries Prometheus on the managed cluster for VM CPU, memory, and storage metrics; normalizes units and returns a usage summary.
  - [units.go](internal/vmproxy/units.go) - Parses Kubernetes resource quantities (Ki/Mi/Gi/m suffixes) into comparable integer values.
- **tlsconfig/** - TLS certificate reloading, ciphers, and security profile configuration.
  - [watch.go](internal/tlsconfig/watch.go) - Watches the OpenShift `APIServer` resource for `tlsSecurityProfile` changes via fsnotify.
  - [profile.go](internal/tlsconfig/profile.go) - Parses Old/Intermediate/Modern/Custom TLS security profiles from `config.openshift.io/v1` APIServer.
  - [reloader.go](internal/tlsconfig/reloader.go) - Hot-reloads TLS certificates via `GetConfigForClient`/`GetCertificate` without server restart.
  - [ciphers.go](internal/tlsconfig/ciphers.go) - Maps OpenSSL cipher suite names to Go `tls` constants (IANA IDs).
- **oauth/** - OpenShift OAuth/OIDC login, token exchange, and discovery logic.
  - [oauth.go](internal/oauth/oauth.go) - `GET /configure` discovery; standalone `GET /login`, `/login/callback`, `/logout` flows for non-production mode.
  - [revoke.go](internal/oauth/revoke.go) - Deletes an OAuthAccessToken with `gracePeriodSeconds=0` on logout.
  - [token.go](internal/oauth/token.go) - Derives the OpenShift OAuthAccessToken object name from a bearer token (SHA-256 prefix).
- **auth/** - Authentication, TokenReview helper, OCM SSO, and cookie parsing.
  - [auth.go](internal/auth/auth.go) - Loads projected SA credentials (`LoadServiceAccount`), builds hub `rest.Config` (`RESTConfig`), validates user tokens via `GET /api` (`ValidateUserToken`), and provides a `TokenReviewer` interface backed by the TokenReview API.
  - [tls.go](internal/auth/tls.go) - Builds `tls.Config` from SA CA bundles for outbound service-to-service calls.
  - [ocm.go](internal/auth/ocm.go) - OCM SSO client-credentials token exchange (`sso.redhat.com`) for ROSA and Insights proxies.
- **searchproxy/** - `POST /proxy/search` and graphql-ws relay to search-api.
  - [proxy.go](internal/searchproxy/proxy.go) - Reverse proxy to Search GraphQL: authenticates via `GET /api`, forwards the user Bearer token and an allowlisted header set, returns upstream errors as 502/504.
  - [ws.go](internal/searchproxy/ws.go) - WebSocket relay for graphql-ws subscriptions: upgrades the client connection, dials the upstream Search service, and bidirectionally copies frames.
  - [inject.go](internal/searchproxy/inject.go) - Rewrites the first graphql-ws `connection_init` payload to inject `Authorization: Bearer <token>` for upstream authentication.
- **hubresources/** - MCH/MCE component discovery and hub overrides.
  - [hubresources.go](internal/hubresources/hubresources.go) - Resolves MCE `spec.targetNamespace` and caches MCH namespace for Search and cluster-proxy discovery.
  - [components.go](internal/hubresources/components.go) - Lists MCH/MCE override component entries for `/multiclusterhub/components` and `/multiclusterengine/components`.
- **searchapi/** - Search GraphQL client for application aggregation.
  - [searchapi.go](internal/searchapi/searchapi.go) - SA-authenticated GraphQL client: sends `searchInput` queries with configurable timeouts and retries.
  - [discovery.go](internal/searchapi/discovery.go) - Resolves the Search service URL: `SEARCH_API_URL` env, or in-cluster `search-search-api.<ns>:4010`, plus `/searchapi/graphql` (or `/federated` when global search is enabled).
- **placementdebug/** - `POST /placement-debug` reverse proxy and CA ConfigMap watch.
  - [placementdebug.go](internal/placementdebug/placementdebug.go) - Reverse proxy to the OCM placement service; returns 503 when the CA is unavailable.
  - [ca.go](internal/placementdebug/ca.go) - Watches the `open-cluster-management-hub/ca-bundle-configmap` ConfigMap and exposes the latest CA bundle for TLS verification.
- **ansibletower/** - `POST /ansibletower`: user-token Secret GET and AAP proxying.
  - [ansibletower.go](internal/ansibletower/ansibletower.go) - Reads credential Secrets with the user token, enforces a pathname allowlist matching the frontend, and proxies to AAP with `InsecureSkipVerify`.
- **upgraderisks/** - `POST /upgrade-risks-prediction`: Insights POST chunks and pull-secret extraction.
  - [upgraderisks.go](internal/upgraderisks/upgraderisks.go) - Lists `pull-secret` in `openshift-config` with the SA, extracts `cloud.openshift.com` auth, and POSTs cluster IDs to Insights in chunks of 100.
- **config/** - Runtime settings and process configuration from env and files.
  - [config.go](internal/config/config.go) - Loads `.env` and `config/` directory (filename = key); `Watch()` enables fsnotify live-reload with 1s debounce; `OnReload` notifies subscribers.
- **clusterproxy/** - `cluster-proxy-addon-user` endpoint URL discovery.
  - [resolver.go](internal/clusterproxy/resolver.go) - Resolves the cluster-proxy-addon-user endpoint from env overrides or by looking up the MCE target namespace at runtime.
- **health/** - Health probe endpoints.
  - [health.go](internal/health/health.go) - Serves `/ping`, `/livenessProbe`, and `/readinessProbe` (process-level liveness; no dependency checks).
- **mcproxy/** - Managed-cluster reverse proxy.
  - [mcproxy.go](internal/mcproxy/mcproxy.go) - Routes `/managedclusterproxy/*` to the cluster-proxy addon with the user token; supports HTTP and WebSocket upgrade.
- **acceptenc/** - `Accept-Encoding` header parsing.
  - [acceptenc.go](internal/acceptenc/acceptenc.go) - Parses `Accept-Encoding` list elements and their q-values; used by static and SSE encoders to negotiate gzip/deflate/br.
- **server/** - Main router mux, TLS listener, and HTTP server core.
  - [server.go](internal/server/server.go) - Builds the chi mux from `server.Option` functions, binds the TLS listener with hot-reload, strips `/multicloud` prefixes, and runs the post-listen startup callback.
- **user/** - User info routes.
  - [user.go](internal/user/user.go) - Serves `/authenticated`, `/username`, and `/userpreference`; reads/writes `UserPreference` CRs via dynamic client.
- **static/** - Plugin and SPA static asset serving.
  - [static.go](internal/static/static.go) - Serves plugin and SPA files with cache headers, CSP, and content-negotiated compression (brotli/gzip via pre-compressed `.br`/`.gz` sidecars).
- **cors/** - Development CORS middleware.
  - [cors.go](internal/cors/cors.go) - Answers `OPTIONS` with 200 in non-production; allows credentialed requests from localhost dev origins (ports 3000–3002). No-op in production.
- **log/** - Logging initialization and `slog` JSON formatting.
  - [log.go](internal/log/log.go) - Configures the process-wide `slog.Logger` with JSON output and dynamic level control.
- **k8sproxy/** - Hub kube-apiserver passthrough proxy.
  - [k8sproxy.go](internal/k8sproxy/k8sproxy.go) - Reverse proxy for `/api`, `/apis`, and `/version`: forwards the user Bearer token to the hub API server with request/response header allowlists. `TLSConfigFromCA` builds TLS matching the Node `getDefaultAgent` (cluster CA + system roots).
- **clusterinfo/** - Cluster information endpoints.
  - [clusterinfo.go](internal/clusterinfo/clusterinfo.go) - Serves `/hub`, `/cluster-version`, `/hypershift-status`, MCH/MCE components, `/apiPaths`, and `POST /operatorCheck` using informer cache and dynamic client.
- **outbound/** - HTTP transport settings, timeouts, dials, and header allowlists.
  - [transport.go](internal/outbound/transport.go) - Builds `http.Transport` with dial and response-header timeouts to prevent orphaned goroutines on reverse proxies.
  - [headers.go](internal/outbound/headers.go) - Request and response header forwarding allowlists shared across reverse proxies.
- **metricsproxy/** - Prometheus and observability reverse proxies.
  - [metricsproxy.go](internal/metricsproxy/metricsproxy.go) - Reverse proxy that rewrites `/prometheus` or `/observability` to `/api/v1` on the target backend; forwards the user token and allowlisted headers.
- **rosa/** - ROSA HCP wizard proxy connecting to OCM and SSO.
  - [rosa.go](internal/rosa/rosa.go) - Proxies ROSA wizard POSTs (`/aws-account-ids`, `/regions`, `/vpcs`, …) to `api.openshift.com` after exchanging OCM client credentials at `sso.redhat.com`.
