# TypeScript Rules for ACM Console

## General TypeScript Standards

### Type Definitions
- Always define prop types using TypeScript interfaces in tsx files
- Define interfaces for all props and complex objects in tsx and ts files
- Use `interface` for object shapes that might be extended
- Use `type` for unions, primitives, and computed types
- Define return types for all functions and methods
- Use generic constraints appropriately
- Import types with `import type` syntax to avoid runtime imports

### Strict Typing
- Avoid `any` type - use `unknown` if type is truly unknown
- ESLint allows `any` in this codebase but prefer proper typing when possible
- Use `Partial<T>` for optional object properties instead of making each property optional
- Use `Record<string, T>` for object maps instead of `{ [key: string]: T }`
- Use proper TypeScript error types instead of generic Error objects
- Use type assertions sparingly and with type guards
- Implement proper error typing with discriminated unions
- Use utility types (Pick, Omit, Partial) for type transformations
- Non-null assertions are allowed but use judiciously

### Resource Types
- Define Kubernetes resource interfaces in `resources/` directory
- Use existing types from `src/resources` for Kubernetes resources
- Extend IResource interface for all custom resources
- Use consistent naming: `[ResourceName]Definition` for resource definitions
- Implement proper metadata typing using the Metadata interface

Example (based on actual codebase patterns):
```typescript
// Resource definition constants
export const ManagedClusterApiVersion = 'cluster.open-cluster-management.io/v1'
export const ManagedClusterKind = 'ManagedCluster'

// Resource definition
export const ManagedClusterDefinition: IResourceDefinition = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
}

// Resource interface extending IResource
export interface ManagedCluster extends IResource {
  apiVersion: typeof ManagedClusterApiVersion
  kind: typeof ManagedClusterKind
  spec?: {
    hubAcceptsClient?: boolean
    leaseDurationSeconds?: number
  }
  status?: {
    conditions?: Condition[]
    version?: {
      kubernetes?: string
    }
  }
}
```

### Hook Types
- Type custom hooks with proper return types
- Use generic hooks for reusable patterns
- Implement proper dependency typing for useEffect
- Type callback functions explicitly

### State Types
- Use proper typing for Recoil atoms and selectors
- Type async operations with proper error handling
- Implement loading states with discriminated unions
- Use readonly types for immutable data

### API Types
- Define request/response interfaces for all API calls
- Use proper error typing for API responses
- Implement pagination types consistently
- Type search and filter parameters explicitly
