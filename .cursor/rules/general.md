# General Coding Rules for ACM Console

## Code Quality & Structure

### Function and Method Design
- Keep methods and functions small and focused on a single responsibility
- Use an early return pattern in functions or methods
- Extract reusable logic into custom hooks, methods or functions
- Keep hooks, methods and functions focused on a single concern
- Handle loading and error states properly and provide user-friendly error messages

### Naming Conventions
- Use CamelCase for file names unless they are React files (jsx or tsx)
- Match the file name with the default exported component or function name exactly
- Use camelCase for function and variable names
- Use descriptive names for variable names - avoid abbreviations
- Use `UPPER_SNAKE_CASE` for constants that are truly constant values

Example:
```typescript
// Good
const MAX_RETRY_ATTEMPTS = 3
const userPreferences = getUserPreferences()
const handleClusterCreation = () => { ... }

// Bad
const maxRetries = 3  // Should be UPPER_SNAKE_CASE
const usrPrefs = getUserPrefs()  // Avoid abbreviations
const handleClusterCreate = () => { ... }  // Be descriptive
```

### Control Flow
- If possible, use ternary operators instead of if/else statements but do not nest ternary operators
- Use early return pattern to reduce nesting

Example:
```typescript
// Good - Early return
function validateCluster(cluster: ManagedCluster) {
  if (!cluster) return { valid: false, error: 'Cluster is required' }
  if (!cluster.metadata?.name) return { valid: false, error: 'Name is required' }
  
  return { valid: true }
}

// Good - Simple ternary
const statusIcon = cluster.status === 'Ready' ? <CheckIcon /> : <ErrorIcon />

// Bad - Nested ternary
const statusIcon = cluster.status === 'Ready' ? <CheckIcon /> : 
  cluster.status === 'Pending' ? <PendingIcon /> : <ErrorIcon />
```

### Testing Awareness
- If code has been modified or added, check to see if there are unit tests that cover these changes
- If no unit tests exist that cover the changes, suggest that unit tests be created or modified
- Ensure accessibility tests are included for UI components

## React Component Guidelines

### Component Structure
- Use functional components with hooks instead of class components
- Keep components small and focused on a single responsibility
- Use PascalCase for component names and component files
- Use descriptive component names that indicate the component's purpose
- Avoid abbreviations in component names

### Props and State Management
- Use camelCase for prop names
- Boolean props can use descriptive names (`expanded`, `hidden`, `disabled`) or prefixes (`is`, `has`, `can`, `should`) - follow existing component patterns
- Use optional props sparingly and provide defaults when needed
- Keep props interface small and focused
- Don't store derived data in state
- Do not mutate props or state - create a copy array or object if possible

Example:
```typescript
interface ClusterCardProps {
  cluster: ManagedCluster
  isSelected?: boolean
  hasErrors?: boolean
  canEdit?: boolean
  onSelect: (cluster: ManagedCluster) => void
  onEdit?: (cluster: ManagedCluster) => void
}

export function ClusterCard({ 
  cluster, 
  isSelected = false, 
  hasErrors = false,
  canEdit = false,
  onSelect,
  onEdit 
}: ClusterCardProps) {
  // Component implementation
}
```

### Hooks and Performance
- Name custom hooks with `use` prefix
- Keep useEffect effects focused and specific
- Use `React.memo` for components that receive the same props frequently
- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed to child components
- Implement proper cleanup in useEffect hooks when needed

### JSX Best Practices
- Avoid using index as the key prop value
- Avoid using inline functions in JSX or TSX blocks
- Use logical AND (`&&`) for simple conditional rendering: `{condition && <Component />}`
- Use ternary operators for either/or scenarios: `{condition ? <ComponentA /> : <ComponentB />}`
- Both patterns are acceptable in ACM - choose based on readability
- Avoid props drilling where props are only passed down to child components

Example:
```typescript
// Good
{isLoading ? <LoadingPage /> : null}
{clusters.length > 0 ? <ClusterTable clusters={clusters} /> : <EmptyState />}

// Bad
{isLoading && <LoadingPage />}  // Can cause issues with falsy values
{clusters.length && <ClusterTable clusters={clusters} />}  // Shows 0 when empty
```

### ACM-Specific State Management
- Use Recoil hooks (`useSharedAtoms`, `useSharedSelectors`) instead of direct imports
- Use shared React Query via plugin context for server state management
- Follow established ACM patterns for accessing shared state

Example:
```typescript
// Good - ACM pattern
import { useRecoilValue } from '../shared-recoil'
const { managedClustersState } = useSharedAtoms()
const clusters = useRecoilValue(managedClustersState)

// Bad - Direct import
import { useRecoilValue } from 'recoil'
import { managedClustersState } from '../atoms'
```

### Styling Guidelines
- Avoid using custom CSS when possible
- Use PatternFly components and variables
- Use ACM custom components (AcmTable, AcmButton, etc.) when available
- Follow PatternFly design patterns and accessibility guidelines
