# Backend (Go)

Public listener for the ACM/MCE console. During the Node-to-Go migration it owns TLS, health probes, config, and auth helpers, and reverse-proxies every unmigrated route to the Node sidecar in `../backend-node`.

## Key Technologies

- **Runtime**: Go 1.26+ (`net/http`; TLS enables HTTP/2 automatically)
- **Router**: `chi` — probes registered natively; everything else is `NotFound` → reverse proxy
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
| `internal/health` | `/ping`, `/livenessProbe` (Go only), `/readinessProbe` (Go + sidecar `/ping`) |
| `internal/config` | `.env` + `config/` directory (filename = key) |
| `internal/auth` | Cookie/Bearer, SA token/CA, TokenReview helper |
| `internal/events/rbac` | `GET /events/rbac` SSE: ClusterRole informer (`vm-clusterroles` label) + per-user SSAR |
| `internal/log` | slog JSON helper |
| `config/` | Runtime settings shared with the Node sidecar |
| `certs/` | TLS material (`npm run generate-certs` at repo root) |

## Commands

From the repo root (preferred), or `cd backend`:

| Command | Purpose |
|---------|---------|
| `npm start` / `npm run plugins` | Go `:4000` in front of Node sidecar `:4001`. Air rebuilds and restarts Go when `cmd/` or `internal/` change |
| `npm run test:backend` | `go test ./...` |
| `npm run lint:backend` | `golangci-lint` (see `backend/.golangci.yml`) |
| `npm run check:backend` | tests + golangci-lint |
| `npm run build:backend` | `go build -o bin/console ./cmd/console` |
| `npm run setup:hub` | Regenerate `backend/.env` and `backend/certs` after `oc login` to a new cluster |

## Architecture

```text
Browser / OpenShift Console plugin
        │
        ▼
Go backend :4000 (TLS / HTTP/2)
        ├─ GET /livenessProbe, /readinessProbe, /ping
        │    (also /multicloud/…)
        ├─ GET /events/rbac (ClusterRole watch; also /multicloud/events/rbac)
        └─ everything else (original URL) ──HTTP/1.1──► Node sidecar :4001
                                                              │
                                                              ▼
                                                        Hub cluster API
```

`/multicloud` is stripped only when matching Go-owned routes. The proxy forwards the original path so Node can keep stripping it.

## Shared artifacts

`npm run setup` writes `backend/.env`. The sidecar loads the same file via `ENV_FILE` / `CONFIG_DIR` / `CERTS_DIR`. `godotenv` does not override `PORT`, so the sidecar can listen on `NODE_BACKEND_PORT` while `.env` still has `PORT=4000` for Go.

Go exits 1 at startup if the service-account token is missing (`TOKEN` or `/var/run/secrets/kubernetes.io/serviceaccount/token`).
