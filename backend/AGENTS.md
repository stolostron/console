# Backend (Go)

Public listener for the ACM/MCE console. It owns TLS, health probes, config, auth, hub watches, and every public HTTP route.

## Key Technologies

- **Runtime**: Go 1.26+ (`net/http`; TLS enables HTTP/2 automatically)
- **Router**: `chi` — all public routes registered natively; static GET assets; unknown paths 404; wrong method 405
- **Logging**: `log/slog` JSON (`method`, `path`, `status`, `duration`)
- **Config watch**: `fsnotify` on `config/` (1s debounce)
- **Auth**: cookie `acm-access-token-cookie` then `Authorization: Bearer`; TokenReview is a library, not a global gate

## Source Layout

| Path | Purpose |
|------|---------|
| `cmd/console` | Process entry: load config, require SA token, listen, SIGINT/SIGTERM |
| `internal/server` | TLS listener, chi mux, `/multicloud` probe aliases |
| `internal/k8sproxy` | Hub kube-apiserver passthrough for `/api`, `/apis`, `/version` (user Bearer token) |
| `internal/clusterproxy` | cluster-proxy-addon-user URL discovery (MCE target namespace / env overrides) |
| `internal/mcproxy` | Managed-cluster reverse proxy (`/managedclusterproxy/*`, including WebSocket) |
| `internal/metricsproxy` | Prometheus and observability query reverse proxies |
| `internal/vmproxy` | VirtualMachine GET helpers, actions, and resource-usage aggregation |
| `internal/health` | `/ping`, `/livenessProbe`, `/readinessProbe` (process live) |
| `internal/config` | `.env` + `config/` directory (filename = key) |
| `internal/auth` | Cookie/Bearer, SA token/CA, TokenReview helper, OCM SSO client-credentials token |
| `internal/oauth` | `/configure` discovery; standalone `/login` `/login/callback` `/logout` (OpenShift OAuth and OIDC) |
| `internal/user` | `/authenticated`, `/username`, `/userpreference` (TokenReview and UserPreference CR) |
| `internal/clusterinfo` | `/hub`, `/cluster-version`, `/hypershift-status`, MCH/MCE components, `/operatorCheck`, `/apiPaths` |
| `internal/cors` | Development CORS middleware (OPTIONS preflight for standalone dev) |
| `internal/events/rbac` | `GET /events/rbac` SSE: ClusterRole informer (`vm-clusterroles` label) + per-user SSAR |
| `internal/events/hub` | `GET /events` SSE: informer fan-out, snapshot packets, per-user SSAR (60s TTL). DELETED is not RBAC-filtered |
| `internal/aggregate` | `POST /aggregate/{applications,statuses,appSetData}`: informer cache + Search SA GraphQL, Fuse.js-compatible filter, windowed SSAR |
| `internal/searchapi` | Search GraphQL client used by the aggregator (`/searchapi/graphql` or `/federated`) |
| `internal/searchproxy` | `POST /proxy/search` and graphql-ws relay to search-api with the **user** token (`connection_init` Authorization injection) |
| `internal/rosa` | ROSA HCP wizard POSTs to `sso.redhat.com` + `api.openshift.com` (OCM service-account token) |
| `internal/ansibletower` | `POST /ansibletower`: user-token Secret GET, AAP path allowlist, TLS skip-verify |
| `internal/placementdebug` | `POST /placement-debug` reverse proxy + independent watch of OCM CA ConfigMap |
| `internal/upgraderisks` | `POST /upgrade-risks-prediction`: SA list `pull-secret`, chunked Insights POSTs |
| `internal/informers` | Hub resource cache (`DefaultWatchSpecs()`). Dev: `GET /debug/informer-snapshot` |
| `internal/static` | Plugin and SPA files: cache headers, CSP, brotli/gzip negotiation |
| `internal/log` | slog JSON helper |
| `config/` | Runtime settings from `config/` files and `.env` |
| `certs/` | TLS material (`npm run setup` / `npm run ci:backend` create when missing; `npm run generate-certs` to force) |

## Commands

From the repo root (preferred), or `cd backend`:

| Command | Purpose |
|---------|---------|
| `npm start` / `npm run plugins` | Go `:4000`. Air rebuilds and restarts Go when `cmd/` or `internal/` change |
| `npm run test:backend` | `go test ./...` |
| `npm run lint:backend` | `golangci-lint` (see `backend/.golangci.yml`) |
| `npm run check:backend` | tests + golangci-lint |
| `npm run build:backend` | `go build -o bin/console ./cmd/console` |
| `npm run setup:hub` | `rm -rf backend/.env backend/certs && npm run setup && npm run ci:backend` after `oc login` to a new cluster |

## Architecture

```text
Browser / OpenShift Console plugin
        │
        ▼
Go backend :4000 (TLS / HTTP/2)
        ├─ GET /livenessProbe, /readinessProbe, /ping
        │    (also /multicloud/…)
        ├─ GET /events (resource watch SSE + per-user SSAR; also /multicloud/events)
        ├─ GET /events/rbac (ClusterRole watch; also /multicloud/events/rbac)
        ├─ POST /aggregate/{applications,statuses,appSetData} (application inventory; also /multicloud/…)
        ├─ POST /proxy/search and WebSocket graphql-ws (user token; also /multicloud/proxy/search)
        ├─ POST ROSA wizard (/aws-account-ids, /regions, /vpcs, …) → OCM
        ├─ POST /ansibletower, /placement-debug, /upgrade-risks-prediction
        ├─ GET /debug/informer-snapshot (dev only; Go informer cache dump)
        ├─ SA informers (~67 specs) feed GET /events and POST /aggregate
        ├─ ALL /api, /apis, GET /version → hub kube-apiserver (user token)
        │    (also /multicloud/…)
        ├─ GET /configure (OAuth/OIDC token_endpoint discovery)
        ├─ GET /login, /login/callback, /logout (standalone OAuth/OIDC; non-production)
        ├─ GET /authenticated, /username, /userpreference (user auth and preferences)
        ├─ GET /hub, /cluster-version, /hypershift-status, /multiclusterhub/components,
        │    /multiclusterengine/components, GET /apiPaths, POST /operatorCheck
        ├─ ALL /managedclusterproxy/* → cluster-proxy addon (user token; WebSocket)
        ├─ GET /prometheus/*, /observability/* → metrics backends (user token)
        ├─ /virtualmachines/*, /virtualmachineinstances/*, /virtualmachinesnapshots/*,
        │    /virtualmachinerestores, GET /vmResourceUsage/* → managed cluster via addon
        ├─ GET static assets (/plugin/*, hashed JS/CSS, locales, index.html)
        └─ unknown paths → 404 (empty body); wrong method → 405
```

`/multicloud` is stripped only when matching Go-owned routes.

The Go process starts hub list/watch **after** the public listener is bound. Startup is capped at 8 concurrent list/watch setups; the informer client uses QPS 20 / Burst 40; resync is disabled. After informers sync, logs `informer cache memory` with `heapAlloc`. Watch specs live only in `internal/informers/specs.go` (`DefaultWatchSpecs()`).

`POST /aggregate/*` rebuilds ACM/Argo Application rows from `InformerCache.ListByKind` and refreshes remote OCP/Flux/Argo status from Search (15s for the first three passes, then `APP_SEARCH_INTERVAL` or 60s). Pagination uses Fuse.js 6.6.2 options (`ignoreLocation`, threshold 0.3) when there are more than 500 items; `itemCount` in `/aggregate/statuses` is a JSON string.

`POST /proxy/search` and the Search WebSocket are served by Go (`backend/internal/searchproxy`). Auth is GET `/api`. GraphQL POST injects the user Bearer token and forwards the header allowlist (`accept`, `accept-encoding`, `content-encoding`, `content-length`, `content-type`). The graphql-ws relay opens `wss` to the same Search URL, sends `Authorization` on the upgrade, and rewrites the first `connection_init` payload with `Authorization: Bearer <token>`. Upstream connect timeout 60s → 504; connect failure → 502. Discovery matches the aggregator: `SEARCH_API_URL` or `search-search-api.<mch-ns>.svc.cluster.local:4010` plus `/searchapi/graphql` (or `/federated` when `globalSearchFeatureFlag=enabled`).

Long-tail HTTP is always registered. Auth is GET `/api` (401 empty body). ROSA wizard POSTs exchange OCM client credentials at SSO then call `api.openshift.com`. `POST /ansibletower` reads the credential Secret with the **user** token, allow-lists AAP pathnames, and GETs the tower with `InsecureSkipVerify`. `POST /placement-debug` reverse-proxies to `PLACEMENT_DEBUG_URL` (or the in-cluster placement service) with the OCM CA ConfigMap `open-cluster-management-hub/ca-bundle-configmap`; missing CA → 503. `POST /upgrade-risks-prediction` lists `openshift-config` secrets with the **SA**, extracts `pull-secret` `cloud.openshift.com` auth, and POSTs Insights in chunks of 100 (`UPGRADE_RISKS_PREDICTION_URL` or console.redhat.com).

`GET /events` framing: `id:` + `data:` (no space), gzip when `Accept-Encoding` includes gzip, keepalive `:\n\n` every 10s, snapshot `START` → `SETTINGS` → priority packets with `EOP` → `LOADED`, live `MODIFIED`/`DELETED` then `LOADED`. Creates and updates are both `MODIFIED` (not `ADDED`). **DELETED events are broadcast without per-user SSAR** — a known gap; do not “fix” it in this stream without a follow-up.

## Shared artifacts

`npm run setup` writes `backend/.env`.

Go exits 1 at startup if the service-account token is missing (`TOKEN` or `/var/run/secrets/kubernetes.io/serviceaccount/token`).

Proxy routes also read `CLUSTER_PROXY_ADDON_USER_HOST` / `CLUSTER_PROXY_ADDON_USER_ROUTE`, `PROMETHEUS_ROUTE`, `OBSERVABILITY_ROUTE`, `SERVICE_CA_CERT`, `PLACEMENT_DEBUG_URL`, and `UPGRADE_RISKS_PREDICTION_URL` from the same `.env` / `config/` directory.

`PUBLIC_FOLDER` (default `public`) is the on-disk plugin/SPA tree. Production images copy `frontend/plugins/{acm|mce}/dist` to `/app/public/plugin`.
