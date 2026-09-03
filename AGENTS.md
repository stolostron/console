# AGENTS.md

## Project Overview

`@stolostron/console` is the UI for Red Hat Advanced Cluster Management (ACM) for Kubernetes and Red Hat MultiCluster Engine (MCE). It runs as a standalone application for development and as OpenShift Console dynamic plugins in production.

## Monorepo Structure

```text
console/
├── frontend/                 # React 18+ SPA with TypeScript (npm workspaces root)
│   ├── src/                  # Main application source
│   ├── plugins/              # ACM and MCE dynamic plugin builds
│   └── packages/             # Workspace packages:
│       ├── multicluster-sdk/   # @stolostron/multicluster-sdk
│       ├── react-form-wizard/  # @patternfly-labs/react-form-wizard
│       ├── eslint-config/      # @stolostron/eslint-config
│       └── prettier-config/    # @stolostron/prettier-config
├── backend/                  # Go console backend (public listener)
├── backend-node/             # Node sidecar for routes not yet migrated to Go
├── docs/                     # Architecture documentation
├── scripts/                  # Build and development scripts
└── resources/                # Sample K8s YAML fixtures
```

## Prerequisites

- **Node.js** (version pinned in `.nvmrc` and `.tool-versions`) and **npm**
- **Go** (1.26+) for the console backend
- **OpenShift 4.x cluster** with ACM or MCE installed for full functionality
- **openssl** for certificate generation

## Setup

```bash
npm ci                  # installs frontend, backend-node; go mod download when Go is installed
npm run setup           # writes backend/.env from the current oc context
npm run generate-certs  # writes backend/certs/ (required for local TLS)
```

After `oc login` to a new hub: `npm run setup:hub` (regenerates `.env` and certs).

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start frontend + backend in standalone mode (Go live-reloads on `.go` changes) |
| `npm run plugins` | Run as dynamic plugins with local OCP console (**recommended dev mode**) |
| `npm test` | Run all tests (frontend + backend) |
| `npm run check` | Run lint, format, and type checking across the entire project |
| `npm run build` | Production build for frontend and backend |
| `npm run lint` | Lint both frontend and backend |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run i18n` | Validate internationalization files |
| `npm run clean` | Clean build artifacts |

### Scoped Commands

Run checks against only one side of the monorepo:

- `npm run test:frontend` / `npm run test:backend` / `npm run test:backend-node`
- `npm run check:frontend` / `npm run check:backend` / `npm run check:backend-node`
- `npm run lint:frontend` / `npm run lint:backend` / `npm run lint:backend-node`

### Port Configuration

Ports are customizable via environment variables defined in `port-defaults.sh`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `FRONTEND_PORT` | 3000 | Standalone console |
| `BACKEND_PORT` | 4000 | Backend APIs (Go listener) |
| `NODE_BACKEND_PORT` | 4001 | Node sidecar (unmigrated routes) |
| `CONSOLE_PORT` | 9000 | OpenShift console |
| `MCE_PORT` | 3001 | MCE plugin |
| `ACM_PORT` | 3002 | ACM plugin |

## Deployment Modes

1. **Standalone** — Independent web application (`npm start`)
2. **ACM Dynamic Plugin** — Integrated into OpenShift Console for ACM features
3. **MCE Dynamic Plugin** — Integrated into OpenShift Console for MCE features

Use `npm run plugins` for development; it matches the production deployment model.

## Code Quality Standards

- TypeScript strict mode in frontend; `backend-node` uses `noImplicitAny` but not full strict mode
- Go backend: `gofmt`, `golangci-lint`, and `go test ./...` (`npm run check:backend`)
- ESLint with `@stolostron/eslint-config` (flat config)
- Prettier with `@stolostron/prettier-config` (120 char width, no semicolons, single quotes)
- Husky `commit-msg` hook enforces a `Signed-off-by` line on every commit
- `lint-staged` is available via `npm run lint-staged` and applies copyright headers, ESLint fixes, and i18n validation on staged files
- Run `npm run check` before submitting PRs

### File Headers

All source files must start with the copyright header:

```typescript
/* Copyright Contributors to the Open Cluster Management project */
```

### Naming Conventions

- **Files**: Match the file name with the default exported component or function name
- **Components**: PascalCase (e.g., `ClusterList`, `PolicyWizard`)
- **Functions/variables**: camelCase with descriptive names — avoid abbreviations
- **Constants**: `UPPER_SNAKE_CASE` for truly constant values (e.g., `MAX_RETRY_ATTEMPTS`)
- **Reusable UI components**: Prefix with `Acm` (e.g., `AcmTable`, `AcmButton`) — these live in `frontend/src/ui-components/`

## Commit Standards

Each commit in a pull request should be small, logical, and complete:

- **Small** — One coherent idea per commit. A reviewer can understand the change in isolation.
- **Logical** — Related changes grouped together, unrelated changes in separate commits.
- **Complete** — Every commit passes unit tests (`npm test`) and repository checks
  (`npm run check` — TypeScript, linting, copyright headers, and translation validation)
  independently.
- **Tests separate** — Add test cases in their own commits, separate from the implementation they cover.
- **Clean history** — If reverting a change during development, drop the original commit
  rather than adding a revert commit. Use interactive rebase to keep the PR history clean
  before requesting review.
- **No WIP** — Avoid "WIP", "fixup", or "temp" commits in the final PR. Squash or rebase them before review.

## Branch Strategy

The same codebase builds images for ACM (`release-*` branches) and MCE (`backplane-*` branches). The build system automatically fast-forwards commits between paired branches. See the "Active Release Branches" section in `README.md` for the current branch chains. Pull requests should target the first branch in each chain, which is `main` for the current release. Never open a PR directly against a `backplane-*` branch. 

## Best practices

- **Import shorthand** — When adding an import, use ~/ instead of ../../

## Feature Flags

Features can be enabled/disabled via the `console-config` ConfigMap in the installation namespace. Flags are defined in `frontend/src/utils/flags/consts.ts`.

## Troubleshooting

- **`concurrently: command not found`** — Run `npm ci` at the repo root first
- **Certificate errors** — Remove `backend/certs/` and run `npm run generate-certs`
- **Module resolution errors** — Verify Node.js and npm versions match `.nvmrc` / `.tool-versions`; version mismatches break ESM resolution
- **Missing `.env`** — Run `npm run setup` (or `npm run setup:hub` after `oc login` to a new cluster) to generate `backend/.env`
- **Plugin UI redirects to `/dashboards`** — `oc whoami --show-server` must match `CLUSTER_API_URL` in `backend/.env`. After `oc login` to a new hub, run `npm run setup:hub` and restart `npm run plugins`. `start-ocp-console.sh` runs `scripts/check-hub-alignment.sh` to catch this early.
- **Console `tls: first record does not look like a TLS handshake`** — `backend/certs/` is missing or backends were started before certs existed. Run `npm run generate-certs` and restart `npm run plugins` (both Go and Node sidecar read certs only at startup).
