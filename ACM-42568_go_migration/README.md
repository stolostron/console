# Contract test framework (ACM-42590)

Isolated Go module. It does **not** import console backend or frontend code. It is a black-box HTTP client that records the Node backend contract so the same tests can later target Go.

This folder is not wired into the monorepo `package.json` or CI. A later PR can keep it in-tree as an archive until the suite is adopted as a migration gate.

## Prerequisites

- Hub cluster `oc login`
- Console backend running (`npm run plugins` from repo root; Node listens on `https://localhost:4000`)
- Go 1.22+

## Run against Node (local plugins)

```bash
cd ACM-42568_go_migration
export CONTRACT_BACKEND_URL=https://localhost:4000
export CONTRACT_TOKEN=$(oc whoami -t)
go test ./... -count=1 -timeout 15m -v
```

If `CONTRACT_TOKEN` is unset, tests try `oc whoami -t`. If `/ping` is unreachable, live tests are skipped; catalog/parser unit tests still run.

### Through the OpenShift Console plugin proxy

```bash
export CONTRACT_BACKEND_URL=http://localhost:9000
export CONTRACT_PATH_PREFIX=/api/proxy/plugin/mce/console/multicloud
export CONTRACT_TOKEN=$(oc whoami -t)
go test ./... -count=1 -timeout 15m
```

## Modes

| Env | Effect |
|-----|--------|
| `CONTRACT_MODE=assert` (default) | Check status, headers, JSON shape, SSE framing, WS upgrade |
| `CONTRACT_COMPARE_URL=https://...` | Replay each REST case against a second backend and diff normalized headers/bodies |
| `CONTRACT_RECORD=1` | Write normalized captures under `testdata/recorded/` (gitignored) |

Other knobs: `CONTRACT_SSE_TIMEOUT` (seconds, default 120), `CONTRACT_HTTP_TIMEOUT` (default 60), `CONTRACT_TLS_INSECURE` (default true), `CONTRACT_RECORD_DIR`.

## Catalog

YAML under `catalog/` is the inventory of frontend↔backend contracts from `backend/src/app.ts` and the plugin. Adding a route is a new YAML case; the runner does not change.

- `soft: true` + `softStatuses` — skip (not fail) when an optional upstream is missing (Observability, ROSA/OCM, Search)
- `alsoMulticloud: true` — repeat the case with `/multicloud` prefix stripping
- `kind: sse` / `kind: websocket` — stream and upgrade cases
- `auth: invalid` — fake Bearer; use this for 401 cases (bare `auth: none` is not unauthenticated in Node development)

See `QUIRKS.md` for Node behaviors that Go should replicate on purpose.

## Layout

```text
ACM-42568_go_migration/
├── catalog/           # declarative cases
├── testdata/          # optional recordings (gitignored)
├── *.go               # client, SSE/WS, asserts, tests
├── go.mod
├── README.md
└── QUIRKS.md
```
