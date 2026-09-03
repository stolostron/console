# Backend (Go)

Public listener for the ACM/MCE console. During the Node-to-Go migration it owns TLS, health probes, config, and auth helpers, and reverse-proxies every unmigrated route to the Node sidecar in `../backend-node`.

## Key Technologies

- **Runtime**: Go 1.26+ (`net/http`; TLS enables HTTP/2 automatically)
- **Router**: `chi` — probes and migrated routes registered natively; static GET assets; everything else is `NotFound` → reverse proxy
- **Proxy**: `httputil.ReverseProxy` (HTTP/1.1 to the sidecar so WebSocket upgrades work; `FlushInterval: -1` for SSE)
- **Logging**: `log/slog` JSON (`method`, `path`, `status`, `duration`)
- **Config watch**: `fsnotify` on `config/` (1s debounce)
- **Auth**: cookie `acm-access-token-cookie` then `Authorization: Bearer`; TokenReview is a library, not a global gate

## Source Layout

| Path | Purpose |
|------|---------|
| `cmd/console` | Process entry: load config, require SA token, listen, SIGINT/SIGTERM |
| `internal/server` | TLS listener, chi mux, `/multicloud` probe aliases |
| `internal/proxy` | Reverse proxy to `NODE_BACKEND_URL` (original path, including `/multicloud`) |
| `internal/k8sproxy` | Hub kube-apiserver passthrough for `/api`, `/apis`, `/version` (user Bearer token) |
| `internal/clusterproxy` | cluster-proxy-addon-user URL discovery (MCE target namespace / env overrides) |
| `internal/mcproxy` | Managed-cluster reverse proxy (`/managedclusterproxy/*`, including WebSocket) |
| `internal/metricsproxy` | Prometheus and observability query reverse proxies |
| `internal/vmproxy` | VirtualMachine GET helpers, actions, and resource-usage aggregation |
| `internal/health` | `/ping`, `/livenessProbe` (Go only), `/readinessProbe` (Go + sidecar `/ping`) |
| `internal/config` | `.env` + `config/` directory (filename = key) |
| `internal/auth` | Cookie/Bearer, SA token/CA, TokenReview helper, OCM SSO client-credentials token |
| `internal/oauth` | `/configure` discovery; standalone `/login` `/login/callback` `/logout` (OpenShift OAuth and OIDC) |
| `internal/user` | `/authenticated`, `/username`, `/userpreference` (TokenReview and UserPreference CR) |
| `internal/clusterinfo` | `/hub`, `/cluster-version`, `/hypershift-status`, MCH/MCE components, `/operatorCheck`, `/apiPaths` |
| `internal/cors` | Development CORS middleware (OPTIONS preflight for standalone dev) |
| `internal/events/rbac` | `GET /events/rbac` SSE: ClusterRole informer (`vm-clusterroles` label) + per-user SSAR |
| `internal/informers` | Hub resource cache (~67 watch specs, dual-run with Node; `CONSOLE_INFORMER_CACHE=0` disables). Dev: `GET /debug/informer-snapshot`. `GET /events` still sidecar |
| `internal/static` | Plugin and SPA files: cache headers, CSP, brotli/gzip negotiation |
| `internal/log` | slog JSON helper |
| `config/` | Runtime settings shared with the Node sidecar |
| `certs/` | TLS material (`npm run setup` / `npm run ci:backend` create when missing; `npm run generate-certs` to force) |

## Commands

From the repo root (preferred), or `cd backend`:

| Command | Purpose |
|---------|---------|
| `npm start` / `npm run plugins` | Go `:4000` in front of Node sidecar `:4001`. Air rebuilds and restarts Go when `cmd/` or `internal/` change |
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
        ├─ GET /events/rbac (ClusterRole watch; also /multicloud/events/rbac)
        ├─ GET /debug/informer-snapshot (dev only; Go informer cache dump)
        ├─ SA informers (~67 specs) in process (cache only; SSE still sidecar)
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
        └─ everything else (original URL) ──HTTP/1.1──► Node sidecar :4001
                                                              │
                                                              ▼
                                                        Hub cluster API (unmigrated routes)
```

`/multicloud` is stripped only when matching Go-owned routes. The proxy forwards the original path so Node can keep stripping it.

During ACM-42597 the Go process watches the same specs as Node `startWatching()` **after** the public listener is bound. Startup is capped at 8 concurrent list/watch setups; the informer client uses QPS 20 / Burst 40; resync is disabled. Set `CONSOLE_INFORMER_CACHE=0` (or `false`/`off`) to skip Go watches. Node SSE is unchanged. After informers sync, logs `informer cache memory` with `heapAlloc` — compare that to the sidecar deflate cache, not combined RSS.

## Shared artifacts

`npm run setup` writes `backend/.env`. The sidecar loads the same file via `ENV_FILE` / `CONFIG_DIR` / `CERTS_DIR`. `godotenv` does not override `PORT`, so the sidecar can listen on `NODE_BACKEND_PORT` while `.env` still has `PORT=4000` for Go.

Go exits 1 at startup if the service-account token is missing (`TOKEN` or `/var/run/secrets/kubernetes.io/serviceaccount/token`).

Migrated proxy routes also read `CLUSTER_PROXY_ADDON_USER_HOST` / `CLUSTER_PROXY_ADDON_USER_ROUTE`, `PROMETHEUS_ROUTE`, `OBSERVABILITY_ROUTE`, and `SERVICE_CA_CERT` from the same `.env`.

`PUBLIC_FOLDER` (default `public`) is the on-disk plugin/SPA tree. Production images copy `frontend/plugins/{acm|mce}/dist` to `/app/public/plugin`.
