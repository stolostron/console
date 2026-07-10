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

## ESLint-Enforced Rules

These are enforced by `@stolostron/eslint-config` and will cause lint failures:

- **i18n**: Import `useTranslation` and `Trans` from `../lib/acm-i18next` — never from `react-i18next` directly
- **State**: Import `useRecoilValue` etc. from `../shared-recoil` and access atoms via `useSharedAtoms()` — never import from `recoil` directly or import atoms from `../atoms`

## Import Organization

Follow this general grouping (flexibility allowed):

1. React imports (`useState`, `useEffect`, etc.)
2. Third-party libraries (PatternFly, lodash, etc.)
3. Internal utilities and shared components
4. Relative imports from local directories
5. CSS/SCSS imports last

## TypeScript Conventions

- Use `interface` for object shapes that might be extended; `type` for unions and computed types
- Use `import type` syntax to avoid runtime imports
- Avoid `any` — use `unknown` if the type is truly unknown
- Use utility types (`Partial<T>`, `Record<string, T>`, `Pick`, `Omit`) over manual equivalents
- Define Kubernetes resource interfaces in `src/resources/`, extending `IResource`
- Use consistent naming: `[ResourceName]Definition` for resource definition constants

## React Conventions

- Functional components with hooks only — no class components
- Use early return pattern to reduce nesting
- Use ternary for simple either/or rendering; never nest ternaries
- Use `&&` for conditional rendering only with boolean conditions — use explicit comparisons for numbers/arrays (e.g., `{items.length > 0 && ...}` not `{items.length && ...}`)
- Avoid using index as key prop
- Avoid inline functions and inline object/array creation in JSX
- Don't store derived data in state; don't mutate props or state
- Use `React.memo` for components receiving the same props frequently
- Use `useMemo` for expensive calculations and `useCallback` for functions passed as props

## PatternFly

- Always use PatternFly components instead of custom HTML — import from `@patternfly/react-core` and `@patternfly/react-icons`
- Do NOT modify PatternFly component styles with custom CSS; use PatternFly variants and modifiers instead
- Use `@emotion/css` for custom styling only when absolutely necessary
- Use ACM custom components when available: `AcmTable`, `AcmEmptyState`, `AcmCountCard`, `AcmAlert`, `AcmToastProvider`
- Use `AcmDataFormPage` for multi-mode forms (form/wizard/details)
- Never use `dangerouslySetInnerHTML` or `innerHTML`

## Recoil State Management

- Atoms are defined in `atoms.ts` using internal `AtomArray<T>()` and `AtomMap<T>()` helpers
- Access atoms through `useSharedAtoms()` — never import atoms directly
- Use `useRecoilValueGetter()` for async operations
- Throttle events using `THROTTLE_EVENTS_DELAY` (500ms)
- Handle `WatchEvent` types: `ADDED`, `DELETED`, `MODIFIED`, `EOP`

## Internationalization

- Import `useTranslation` and `Trans` from `../lib/acm-i18next` only (ESLint enforced)
- All user-facing strings must be externalized — no hardcoded display text (ESLint enforced)
- Translations are stored in `public/locales/en/translation.json` and automatically updated by running `npm run i18n:fix`
- You only need to edit `public/locales/en/translation.json` when you are not using the value as the key (recommended for very long strings)
- Do not edit translation files for other languages - we have translation services provided by an external team
- Use i18next pluralization (`t('key', { count })`) and interpolation (`t('key', { name })`)

## RBAC

- Use `RbacDropdown` and `RbacButton` components from `components/Rbac.tsx` for permission-gated UI
- Use `rbacCreate`, `rbacUpdate`, `rbacDelete` helpers from `lib/rbac-util`
- Use `createSubjectAccessReview` with `ResourceAttributes` for direct permission checks

## Testing

- Test files live alongside source files as `*.test.ts` / `*.test.tsx`
- Run a single test: `npm test -- <pattern>`
- Jest config is in `jest.config.ts`; mocks are in `__mocks__/`
- Every component test must include an accessibility test with `jest-axe`:
  ```typescript
  expect(await axe(container)).toHaveNoViolations()
  ```
- Use `@testing-library/user-event` for user interactions — not `fireEvent`
- Prefer query priority: `getByRole` > `getByLabelText` > `getByText` > `getByTestId`
- Mock Recoil atoms via `useSharedAtoms()`, not direct imports
- Use `nock` for HTTP call mocking
- Follow Arrange-Act-Assert pattern
- Tests should meaningfully cover behavior, not just achieve coverage metrics

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

### Cross-Plugin Communication

- Use `acm.shared-context` extension type with `PluginDataContextProvider` for data sharing between plugins
- Use `useResolvedExtensions()` to detect available plugins
- Share atoms, selectors, and utilities via plugin context using `usePluginDataContextValue`
