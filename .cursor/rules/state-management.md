# State Management Rules for ACM Console

## Recoil Patterns

### Atom Definitions
- Use the established AtomArray and AtomMap patterns from atoms.ts:
```typescript
// For arrays of resources
export const managedClustersState = AtomArray<ManagedCluster>()
export const policiesState = AtomArray<Policy>()

// For mapped resources (by cluster name)
export const managedClusterAddonsState = AtomMap<ManagedClusterAddOn>()
```

### Accessing Atoms
- **REQUIRED**: Use shared atoms through useSharedAtoms() (ESLint enforced)
- **DO NOT** import from 'recoil' directly - ESLint will error
- **DO NOT** import atoms directly - ESLint will error
```typescript
// ✅ Correct way (ESLint enforced)
import { useRecoilValue } from '../shared-recoil'
const { managedClustersState, policiesState } = useSharedAtoms()
const clusters = useRecoilValue(managedClustersState)

// ❌ Wrong - ESLint will error
import { useRecoilValue } from 'recoil'
import { managedClustersState } from '../atoms'
```

### Async Operations
- Use useRecoilValueGetter() for async operations:
```typescript
const clustersGetter = useRecoilValueGetter(managedClustersState)

const handleAsyncOperation = useCallback(async () => {
  const clusters = clustersGetter()
  // Process clusters asynchronously
}, [clustersGetter])
```

### State Updates
- Follow established patterns for resource updates via server-side events
- Use THROTTLE_EVENTS_DELAY (500ms) for event throttling
- Handle WatchEvent types: 'ADDED', 'DELETED', 'MODIFIED', 'EOP'
- Use ServerSideEventData interface for event processing

### Selectors
- Create selectors for derived state:
```typescript
const filteredClustersSelector = selector({
  key: 'filteredClusters',
  get: ({ get }) => {
    const clusters = get(managedClustersState)
    const filter = get(clusterFilterState)
    return clusters.filter(cluster => matchesFilter(cluster, filter))
  }
})
```

### Error Handling
- Implement proper error states in atoms
- Use error boundaries for state-related errors
- Handle loading states appropriately
- Provide fallback values for failed state

### Performance
- Use Recoil's built-in performance optimizations
- Avoid unnecessary atom subscriptions
- Implement proper cleanup in effects
- Use atom families for dynamic state

### Resource Management
- Follow established patterns for Kubernetes resources
- Implement proper resource lifecycle management
- Handle resource events efficiently
- Use consistent resource state patterns

### Testing State
- Mock Recoil atoms in tests
- Test state updates and synchronization
- Verify selector behavior
- Test error handling in state management

### State Persistence
- Use appropriate persistence strategies
- Handle state hydration properly
- Implement proper state migration
- Consider state size and performance implications
