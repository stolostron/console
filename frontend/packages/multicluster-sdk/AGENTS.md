# Multicluster SDK

`@stolostron/multicluster-sdk` — React SDK providing fleet-wide Kubernetes resource management for OpenShift Console dynamic plugins. Drop-in replacements for `@openshift-console/dynamic-plugin-sdk` hooks and functions that work across managed clusters when RHACM is installed.

## Source Layout

| Directory | Purpose |
|-----------|---------|
| `src/api/` | Fleet K8s API functions: create, get, list, patch, delete across clusters |
| `src/components/` | React components (FleetResourceLink, etc.) |
| `src/extensions/` | Dynamic plugin extension helpers |
| `src/internal/` | Internal implementation details |
| `src/types/` | TypeScript type definitions |
| `src/index.ts` | Public API entry point |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | `tsc --build tsconfig.build.json` |
| `npm run watch` | Rebuild on `src/` changes |
| `npm test` | Run Jest tests (`TZ=UTC`) |
| `npm run lint` | ESLint check on `src/` |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run tsc` | Type check only |
| `npm run generate-doc` | Auto-generate README API docs from TSDoc |
| `npm run check-doc` | Verify generated docs are up to date |

## Conventions

- This package is published to npm (not private) — maintain semver and public API stability
- Peer dependency: `@openshift-console/dynamic-plugin-sdk >=1.0.0 || >=4.19.0-prerelease`
- Use TSDoc comments on all public exports; the README API section is auto-generated from them
- Run `npm run check-doc` after changing public APIs to verify docs stay current
- Tests run with `TZ=UTC` to avoid timezone-dependent failures
