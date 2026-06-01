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
├── backend/                  # Node.js ESM proxy server
├── docs/                     # Architecture documentation
├── scripts/                  # Build and development scripts
└── resources/                # Sample K8s YAML fixtures
```

## Prerequisites

- **Node.js** (version pinned in `.nvmrc` and `.tool-versions`) and **npm**
- **OpenShift 4.x cluster** with ACM or MCE installed for full functionality
- **openssl** for certificate generation

## Setup

```bash
npm run setup   # Configure cluster connection (creates backend/.env)
npm ci          # Install dependencies for frontend and backend
```

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start frontend + backend in standalone mode |
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

- `npm run test:frontend` / `npm run test:backend`
- `npm run check:frontend` / `npm run check:backend`
- `npm run lint:frontend` / `npm run lint:backend`

### Port Configuration

Ports are customizable via environment variables defined in `port-defaults.sh`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `FRONTEND_PORT` | 3000 | Standalone console |
| `BACKEND_PORT` | 4000 | Backend APIs |
| `CONSOLE_PORT` | 9000 | OpenShift console |
| `MCE_PORT` | 3001 | MCE plugin |
| `ACM_PORT` | 3002 | ACM plugin |

## Deployment Modes

1. **Standalone** — Independent web application (`npm start`)
2. **ACM Dynamic Plugin** — Integrated into OpenShift Console for ACM features
3. **MCE Dynamic Plugin** — Integrated into OpenShift Console for MCE features

Use `npm run plugins` for development; it matches the production deployment model.

## Code Quality Standards

- TypeScript strict mode, no implicit `any`
- ESLint with `@stolostron/eslint-config` (flat config)
- Prettier with `@stolostron/prettier-config` (120 char width, no semicolons, single quotes)
- Husky pre-commit hook runs `lint-staged` and enforces `Signed-off-by` line on commits
- `lint-staged` applies copyright headers, ESLint fixes, and i18n validation on staged files
- Run `npm run check` before submitting PRs

## Branch Strategy

The same codebase builds images for ACM (`release-*` branches) and MCE (`backplane-*` branches). The build system automatically fast-forwards commits between paired branches. See the "Active Release Branches" section in `README.md` for the current branch chains. Pull requests should target the first branch in each chain, which is `main` for the current release. Never open a PR directly against a `backplane-*` branch. 

## Feature Flags

Features can be enabled/disabled via the `console-config` ConfigMap in the installation namespace. Flags are defined in `frontend/src/utils/flags/consts.ts`.

## Troubleshooting

- **Certificate errors** — Remove `backend/certs/` and run `npm run ci:backend` to regenerate
- **Module resolution errors** — Verify Node.js and npm versions match `.nvmrc` / `.tool-versions`; version mismatches break ESM resolution
- **Missing `.env`** — Run `npm run setup` to generate `backend/.env` with cluster connection details
