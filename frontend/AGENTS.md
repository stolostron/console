# Frontend

React 18+ SPA with TypeScript in strict mode. Serves as both the standalone console and the source for ACM/MCE dynamic plugins.

## Key Technologies

- **UI Framework**: PatternFly 6+ (Red Hat's design system)
- **State Management**: Recoil atoms for global state
- **Data Fetching**: React Query, Apollo/GraphQL for search
- **Routing**: React Router with v5 compatibility layer
- **Build**: Webpack 5 with module federation for dynamic plugins
- **Testing**: Jest with React Testing Library
- **i18n**: i18next with namespace-scoped translation files in `public/locales/`

## Source Layout

| Directory | Purpose |
|-----------|---------|
| `src/routes/` | Feature routes: Applications, Credentials, Governance, Infrastructure, Search, etc. |
| `src/resources/` | Kubernetes resource type definitions, CRUD operations, and transforms |
| `src/components/` | Shared UI components |
| `src/ui-components/` | Reusable UI building blocks |
| `src/lib/` | Utilities: i18n, helpers, API client, doc links |
| `src/hooks/` | Custom React hooks |
| `src/wizards/` | ACM-specific wizard wrappers (Argo, Governance, Placement) |
| `src/plugin-extensions/` | OpenShift dynamic plugin extension registrations |
| `plugins/acm/` | ACM dynamic plugin build configuration |
| `plugins/mce/` | MCE dynamic plugin build configuration |
| `packages/` | npm workspace packages (see subdirectory AGENTS.md files) |

## Commands

Run from the `frontend/` directory, or use the `npm run *:frontend` variants from the repo root.

| Command | Purpose |
|---------|---------|
| `npm test` | Run Jest tests |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run prettier` | Prettier check |
| `npm run tsc` | TypeScript type check |
| `npm run check` | Run lint + prettier + tsc together |
| `npm run build` | Standalone production build |
| `npm run build:plugin:acm` | Build ACM plugin |
| `npm run build:plugin:mce` | Build MCE plugin |
| `npm run i18n` | Validate i18n translation files |
| `npm run storybook` | Launch Storybook for component development |

## Conventions

- All user-facing strings must use `useTranslation()` or `<Trans />` from `src/lib/acm-i18next` — never hardcode display text
- Use PatternFly components following their [design guidelines](https://www.patternfly.org/); prefer PatternFly over custom UI
- Never use `dangerouslySetInnerHTML` or `innerHTML`
- Use proper error boundaries and error handling in components

## Testing

- Test files live alongside source files as `*.test.ts` / `*.test.tsx`
- Run a single test: `npm test -- <pattern>`
- Jest config is in `jest.config.ts`; mocks are in `__mocks__/`
- Tests should meaningfully cover behavior, not just achieve coverage metrics
- Properly mock and isolate dependencies
- Async tests must handle promises correctly (await, act())

## Authentication Flow (Standalone Mode Only)

When running as a standalone app (`npm start`), the frontend handles its own authentication:

1. Frontend uses `acm-access-token-cookie` for user tokens
2. On 401 responses, OAuth flow starts via `/login` endpoint
3. Backend proxies to cluster OAuth and sets the cookie on success

When running as dynamic plugins (the recommended dev mode via `npm run plugins`), OpenShift Console handles authentication and the plugins inherit the user's session.

## Dynamic Plugins

Plugin builds use module federation. Each plugin has:
- `console-extensions.ts` — Extension point declarations
- `console-plugin-metadata.ts` — Plugin metadata
- `webpack.plugin.ts` — Plugin-specific webpack config

MCE (MultiCluster Engine) is a prerequisite for ACM. The MCE plugin provides the base multicluster management features, and the ACM plugin adds additional capabilities on top (governance, applications, etc.).
