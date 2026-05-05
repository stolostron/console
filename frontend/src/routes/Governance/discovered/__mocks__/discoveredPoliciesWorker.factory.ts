/* Copyright Contributors to the Open Cluster Management project */
/** Manual mock — tests use `NODE_ENV === 'test'` main-thread path; this should never run. */
export function createBundledDiscoveredPoliciesWorker(): Worker {
  throw new Error('createBundledDiscoveredPoliciesWorker must not be called under Jest')
}
