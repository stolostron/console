# React Rules for ACM Console

## Component Patterns

### Functional Components
- Use functional components with hooks exclusively
- Implement proper prop interfaces with TypeScript
- Use React.memo for expensive components
- Follow established naming conventions (PascalCase)

### Hook Usage
- Use custom hooks for business logic separation
- Implement proper dependency arrays in useEffect
- Use useCallback for event handlers passed as props
- Leverage useMemo for expensive computations

### State Management
- Use Recoil atoms through useSharedAtoms() pattern
- Access atoms with useRecoilValue() for reading
- Use useRecoilValueGetter() for async operations
- Follow established atom naming conventions

Example (based on actual codebase patterns):
```typescript
/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useRecoilValue } from 'recoil'
import { useTranslation } from '../lib/acm-i18next'
import { useSharedAtoms } from '../shared-recoil'
import { AcmTable } from '../ui-components'

export function ClusterList() {
  const { t } = useTranslation()
  const { managedClustersState } = useSharedAtoms()
  const clusters = useRecoilValue(managedClustersState)
  
  const filteredClusters = useMemo(
    () => clusters.filter(cluster => cluster.status?.conditions),
    [clusters]
  )
  
  return (
    <AcmTable
      items={filteredClusters}
      columns={clusterColumns}
      keyFn={cluster => cluster.metadata.uid}
    />
  )
}
```

### Conditional Rendering
- Use logical AND (`&&`) for simple conditional rendering (ACM standard pattern):
  ```typescript
  {condition && <Component />}
  {props.additionalLabels && (<span><AcmLabels /></span>)}
  {expandable && itemCount > columnCount && (<AcmButton />)}
  ```
- Use ternary operators for either/or scenarios:
  ```typescript
  {props.isCompact ? <Popover /> : renderLabelGroup()}
  {showAll ? t('Show less') : t('Show all')}
  ```
- Early returns for major conditional logic:
  ```typescript
  if (props.hidden) return <></>
  if (!data) return <LoadingState />
  ```

### Performance
- Use `React.memo` for components that receive the same props frequently
- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed to child components
- Implement lazy loading for heavy components
- Avoid inline object/array creation in render
- Avoid using index as the key prop value
- Avoid using inline functions in JSX or TSX blocks
- Use proper key props for list items

### Error Boundaries
- Implement error boundaries for route-level components
- Use proper error state management
- Provide user-friendly error messages
- Log errors for debugging purposes

### Accessibility
- Use semantic HTML elements
- Implement proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers

### Component Organization
- Keep components small and focused on a single responsibility
- Use PascalCase for component names and component files
- Use descriptive component names that indicate the component's purpose
- Avoid abbreviations in component names
- Separate presentation from business logic
- Use proper file structure (components/, ui-components/, routes/)
- Export components properly with named exports
- Avoid props drilling where props are only passed down to child components
- Do not mutate props or state - create a copy array or object if possible
