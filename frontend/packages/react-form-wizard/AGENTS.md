# React Form Wizard

`@patternfly-labs/react-form-wizard` — A PatternFly-based wizard framework used heavily by ACM create and edit flows. Originally a separate npm package, now vendored into this monorepo.

## Source Layout

| Directory | Purpose |
|-----------|---------|
| `src/` | Framework core: `WizardPage`, `Step`, `Section`, input components, contexts, review components |
| `wizards/` | Concrete ACM wizards: Ansible, Application, Argo, Cluster, Credentials, Hypershift, Policy, PolicySet, ROSA, Placement, etc. |

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | TypeScript compile + copy SVG/CSS/YAML/HBS assets to `lib/` |
| `npm run watch` | Dev rebuild loop for `src/` and `wizards/` changes |
| `npm run start` | Webpack dev server for the demo app |
| `npm test` | Run tsc, lint, prettier, Cypress, and pages build concurrently |
| `npm run lint` | ESLint check on `src/` and `wizards/` |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run tsc` | Type check only |
| `npm run cypress` | Run Cypress E2E tests headless |
| `npm run cypress:open` | Open Cypress interactive test runner |
| `npm run pages` | Production build for GitHub Pages demo |

## Conventions

- The `src/` directory contains the reusable framework; `wizards/` contains ACM-specific wizard implementations
- Non-TS assets (SVG, CSS, YAML, HBS) are copied to `lib/` as part of the build — keep build scripts updated if adding new asset types
- E2E tests use Cypress, not Jest — run `npm run cypress:open` for interactive debugging
- This package is consumed by the frontend via npm workspaces; changes rebuild automatically in `npm run plugins` mode via the root `watch:react-form-wizard` script
