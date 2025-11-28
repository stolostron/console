# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

@stolostron/console is the user interface for Red Hat Advanced Cluster Management (ACM) for Kubernetes and Red Hat MultiCluster Engine (MCE). It's a sophisticated multi-cluster management console that can run both as a standalone application and as OpenShift Console dynamic plugins.

## Development Commands

### Essential Commands
- `npm ci` - Install dependencies for both frontend and backend
- `npm start` - Start both frontend and backend in development mode
- `npm run plugins` - Run as OpenShift Console plugins with OCP console (requires cluster setup)
- `npm test` - Run comprehensive test suite for both frontend and backend
- `npm run check` - Run linting, formatting, and type checking across the entire project
- `npm run build` - Production build for both frontend and backend

### Setup and Environment
- `npm run setup` - Configure environment for cluster connection (creates backend/.env)
- `npm run clean` - Clean build artifacts from both frontend and backend

### Quality Assurance
- `npm run lint` - Lint both frontend and backend code
- `npm run lint:fix` - Auto-fix linting issues
- `npm run i18n` - Validate internationalization files
- `npm run i18n:fix` - Fix i18n issues

### Testing
- `npm run test:frontend` - Run frontend tests only
- `npm run test:backend` - Run backend tests only
- Individual test files: `npm test -- <test-file-pattern>`

### Docker/Podman
- `npm run docker:build` - Build production Docker image
- `npm run podman:build` - Build production Podman image (for ARM64 compatibility)

## Architecture

### Monorepo Structure
```
console/
├── frontend/          # React application with TypeScript
├── backend/           # Node.js ESM backend service
├── docs/              # Architecture documentation
└── scripts/           # Build and development scripts
```

### Frontend Architecture
- **Framework**: React 18+ with TypeScript in strict mode
- **State Management**: Recoil for global state, Redux Toolkit for complex scenarios
- **UI Framework**: PatternFly 5+ (Red Hat's design system)
- **Routing**: React Router with v5 compatibility layer
- **Build**: Webpack 5 with module federation for dynamic plugins
- **Testing**: Jest with React Testing Library

### Backend Architecture
- **Runtime**: Node.js 20+ with ESM modules
- **Server**: Custom HTTP/2 proxy server using find-my-way router
- **Authentication**: OAuth flow with cookie-based token management
- **Logging**: Pino structured logging with development formatting
- **Metrics**: Prometheus client integration

### Multi-Modal Deployment
The console supports three deployment modes:
1. **Standalone**: Independent web application
2. **ACM Dynamic Plugin**: Integrated into OpenShift Console for ACM features
3. **MCE Dynamic Plugin**: Integrated into OpenShift Console for MCE features

### Key Technologies
- **Frontend**: React, TypeScript, PatternFly, Recoil, Monaco Editor, React Query
- **Backend**: Node.js ESM, HTTP/2 proxy, Pino logging, Prometheus metrics
- **Development**: Webpack 5, Jest, ESLint, Prettier, Husky pre-commit hooks

## Development Prerequisites

1. **Node.js 20** and **npm 8** are required
2. **OpenShift 4.x cluster** with ACM or MCE installed for full functionality
3. **openssl** for certificate generation

## Common Development Patterns

### Port Configuration
All ports are customizable via environment variables defined in `port-defaults.sh`:
- `FRONTEND_PORT` (default 3000) - Standalone console
- `BACKEND_PORT` (default 4000) - Backend APIs
- `CONSOLE_PORT` (default 9000) - OpenShift console
- `ACM_PORT` (default 3001) - ACM plugin
- `MCE_PORT` (default 3002) - MCE plugin

### Authentication Flow
1. Frontend uses `acm-access-token-cookie` for user tokens
2. On 401 responses, OAuth flow starts via `/login` endpoint
3. Backend proxies to cluster OAuth and sets cookie on success

### Working with Dynamic Plugins
- Use `npm run plugins` to develop with OpenShift Console integration
- Plugin code is in `frontend/plugins/` directory
- ACM and MCE plugins are built separately and served on different ports

### Multicluster SDK
The `@stolostron/multicluster-sdk` package provides:
- Fleet-wide resource management across multiple clusters
- Multicluster-aware React hooks and components
- Search capabilities across managed clusters

## Code Quality Standards

### TypeScript
- Strict mode enabled across the project
- No implicit any allowed
- Comprehensive type checking required before commits

### Testing
- Jest with React Testing Library for frontend
- Node.js native test runner for backend
- Coverage requirements enforced

### Linting and Formatting
- ESLint with TypeScript rules
- Prettier for code formatting
- Husky pre-commit hooks enforce quality checks

## Feature Flags

Features can be enabled/disabled via the `console-config` ConfigMap in the installation namespace. Feature flags are defined in `frontend/src/utils/flags/consts.ts`.

## Troubleshooting

### Certificate Issues
If experiencing proxy errors, remove `backend/certs` folder and run `npm run ci:backend` to regenerate certificates.

### Module Resolution Errors
Ensure Node.js 20 and npm 8 are being used. Version mismatches cause ESM module resolution failures.

### Missing .env File
Run `npm run setup` to generate the required `backend/.env` file with cluster connection details.

## Branch Strategy

The project uses automatic fast-forwarding between release branches:
- Pull requests should target the first branch in each release line
- `main → release-2.15 → backplane-2.10` (current active branches)
- Multiple release lines are maintained for different product versions