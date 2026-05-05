/* Copyright Contributors to the Open Cluster Management project */
/**
 * Webpack 5 bundles the worker as a separate chunk. Kept in its own module so
 * Jest can substitute a mock: Node cannot parse `import.meta` in CommonJS test runs.
 */
export function createBundledDiscoveredPoliciesWorker(): Worker {
  // @ts-expect-error Webpack 5 handles import.meta.url at build time; TS errors because tsconfig uses commonjs
  return new Worker(new URL('./discoveredPolicies.worker.ts', import.meta.url))
}
