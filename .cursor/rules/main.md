You are a helpful AI assistant specializing in TypeScript, React, Node.js, and Red Hat Advanced Cluster Management (ACM) console development.

## Project Context
This is the Red Hat Advanced Cluster Management (ACM) console - a sophisticated React/TypeScript application for managing Kubernetes clusters at scale. The console operates in dual modes: as a standalone application and as an OpenShift Console dynamic plugin.

## Architecture Overview
- **Frontend**: React 18 + TypeScript with PatternFly components
- **State Management**: Recoil atoms for global state management
- **Backend**: Node.js with TypeScript, Express-like routing
- **Plugin System**: OpenShift Console dynamic plugins (ACM + MCE)
- **Build System**: Webpack with custom configurations for different modes
- **Testing**: Jest + React Testing Library with accessibility testing

## Code Style & Standards

### File Headers
Always start files with the copyright header:
```typescript
/* Copyright Contributors to the Open Cluster Management project */
```

### Import Organization
Follow this general import organization (flexibility allowed):
1. React imports (useState, useEffect, etc.)
2. Third-party libraries (PatternFly, lodash, etc.)
3. Internal utilities and shared components
4. Relative imports from local directories
5. CSS/SCSS imports and assets last

Example patterns found in codebase:
```typescript
/* Copyright Contributors to the Open Cluster Management project */
import { useState, useEffect, useMemo } from 'react'
import { Button, Alert, PageSection } from '@patternfly/react-core'
import { PlusIcon } from '@patternfly/react-icons'
import { cloneDeep, get } from 'lodash'
import { useTranslation } from '../lib/acm-i18next'
import { useSharedAtoms } from '../shared-recoil'
import { ManagedCluster } from '../resources'
import './ComponentName.css'
```

**Note**: The codebase shows flexibility in import ordering - focus on logical grouping rather than strict ordering.

### TypeScript Standards
- Use TypeScript for all new code (.tsx for React components, .ts for utilities)
- Prefer interfaces over types for object shapes
- Use proper generic constraints and utility types
- Avoid `any` - use `unknown` or proper typing
- Use strict TypeScript configuration

### React Patterns
- Prefer functional components with hooks
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect/useCallback
- Use React.Fragment or <> instead of unnecessary divs
- Follow the established custom hooks patterns

## State Management with Recoil

### Atom Patterns
- Use the established atom pattern from `atoms.ts`:
```typescript
export const managedClustersState = AtomArray<ManagedCluster>()
```
- Access atoms through shared patterns:
```typescript
const { managedClustersState } = useSharedAtoms()
const clusters = useRecoilValue(managedClustersState)
```

### State Updates
- Use `useRecoilValueGetter()` for async operations
- Throttle events using `THROTTLE_EVENTS_DELAY` constant
- Follow established patterns for resource watching and updates

## Component Architecture

### Directory Structure
- `components/`: Shared business logic components
- `ui-components/`: Reusable UI components with Acm prefix
- `routes/`: Page-level components organized by feature
- `resources/`: Kubernetes resource types and utilities
- `lib/`: Shared utilities and helpers

### Component Naming
- Use PascalCase for component names
- Prefix reusable UI components with "Acm" (e.g., `AcmButton`, `AcmTable`)
- Use descriptive names that indicate component purpose

### Props and Interfaces
- Define proper TypeScript interfaces for props
- Use optional props with default values appropriately
- Implement proper prop validation for complex components

## PatternFly Integration

### Component Usage
- Always use PatternFly components instead of custom HTML/CSS
- Import from `@patternfly/react-core` and `@patternfly/react-icons`
- Follow PatternFly design patterns and accessibility guidelines
- Use PatternFly layout components (Page, PageSection, Stack, etc.)

### Styling
- Avoid custom CSS modifications to PatternFly components
- Use PatternFly tokens for consistent theming
- Use emotion/css for custom styling when necessary
- Follow the established CSS class naming conventions

## Testing Requirements

### Test Structure
- Write tests for all new components using React Testing Library
- Include accessibility tests with jest-axe:
```typescript
test('has zero accessibility defects', async () => {
  const { container } = render(<Component />)
  expect(await axe(container)).toHaveNoViolations()
})
```

### Test Patterns
- Use proper test setup with setupTests.ts configuration
- Mock external dependencies with nock for HTTP calls
- Test internationalization with proper i18n setup
- Follow existing test file naming: `*.test.tsx`, `*.test.ts`

### Coverage Requirements
- Frontend: Coverage collection enabled with comprehensive file patterns
- Backend: Coverage thresholds currently set to 0 (branches, functions, lines, statements)
- Focus on critical paths and user workflows rather than strict percentage targets
- Include accessibility tests and error state coverage

## Internationalization (i18n)

### Translation Patterns
- Use acm-i18next for all user-facing strings
- Import and use the translation hook:
```typescript
import { useTranslation } from '../lib/acm-i18next'
const { t } = useTranslation()
```
- Use Trans component for complex translations with markup
- Store translations in `public/locales/en/translation.json`

### Translation Keys
- Use descriptive, hierarchical keys
- Externalize all display strings for localization
- Test translation key extraction with i18next-parser

## Backend Development

### API Patterns
- Use find-my-way router with HTTP/2 support
- Implement resource watching with server-side events
- Use proxy patterns for Kubernetes API access
- Handle managed cluster proxy routing through cluster-proxy-addon

### Security
- Validate all user inputs
- Use secure coding practices for sensitive data
- Follow established authentication patterns with cookie-based tokens
- Check permissions using SubjectAccessReview patterns

## Plugin Development

### Dynamic Plugin Architecture
- Separate ACM and MCE functionality appropriately
- Define plugin metadata in `console-plugin-metadata.ts`
- Register extensions in `console-extensions.ts`
- Use shared context patterns for cross-plugin communication

### Plugin Patterns
- Expose modules through plugin metadata for dynamic loading
- Test plugin functionality in both standalone and console modes
- Follow established webpack configurations for plugin builds

## Performance Optimization

### React Performance
- Use React.memo for expensive components
- Implement proper dependency arrays
- Avoid unnecessary re-renders through proper state management
- Use lazy loading for large components

### Resource Management
- Leverage Recoil's built-in performance optimizations
- Implement proper cleanup in useEffect hooks
- Use established patterns for resource throttling

## Error Handling

### Error Patterns
- Use proper TypeScript types for error states
- Implement user-friendly error messages with i18n
- Use AcmAlert components for displaying errors
- Log errors appropriately for debugging

### Validation
- Validate user inputs at form level
- Provide clear validation messages
- Handle async validation properly

## Development Workflow

### Local Development
- Use `npm start` for standalone development (starts both frontend and backend)
- Use `npm run plugins` for plugin development (includes OCP console)
- Run `npm run check` before committing (prettier, lint, tsc, copyright)
- Use `npm test` for running test suites (both frontend and backend)
- Use `npm run setup` for initial environment configuration

### Code Quality
- Follow ESLint configuration (@stolostron/eslint-config) with specific ACM rules:
  - Use `useTranslation()` from `../lib/acm-i18next` (not react-i18next directly)
  - Use `useSharedAtoms()` from `../shared-recoil` (not direct recoil imports)
  - Use custom Truncate component instead of PatternFly's Truncate
- Use Prettier for code formatting with automatic formatting on save
- TypeScript strict mode with specific rule overrides for ACM patterns
- Run accessibility audits with jsx-a11y ESLint plugin

### Git Practices
- Follow established branch and PR patterns
- Use meaningful commit messages
- Include ticket references in PR titles
- Follow the PR template requirements

## Feature Development

### Feature Flags
- Use established feature flag system in `utils/flags/`
- Add new flags to FEATURE_FLAGS constant in consts.ts
- Feature flags are controlled by MultiClusterHub components
- Use useFeatureFlags hook with SetFeatureFlag from OpenShift Console SDK

### Cluster Management Patterns
- Use established cluster lifecycle management patterns
- Follow cluster provisioning wizard patterns
- Implement proper cluster status handling
- Use established patterns for cluster add-ons and policies

## Documentation

### Code Documentation
- Add JSDoc comments for complex functions and interfaces
- Include inline comments for complex business logic
- Document any new architectural patterns
- Keep README files up to date

### API Documentation
- Document new API endpoints and changes
- Include request/response examples
- Document authentication and authorization requirements

## Security & RBAC

### Permission Handling
- Follow existing RBAC patterns (Rbac.tsx)
- Check permissions using established patterns
- Validate user access for all operations
- Handle permission errors gracefully

### Data Security
- Sanitize user inputs to prevent XSS
- Use secure storage for sensitive data
- Follow established authentication flows
- Implement proper session management

This cursor rules file provides comprehensive guidance for developing within the ACM console codebase while maintaining consistency with established patterns and Red Hat development standards.
