/* Copyright Contributors to the Open Cluster Management project */

/**
 * Determines if a resource is a first-class ACM resource and generates its path.
 *
 * First-class ACM resources include core management resources that have specialized
 * detail pages in the ACM console, providing richer functionality than generic search results.
 *
 * @param kind - The Kubernetes resource kind
 * @param cluster - The target cluster name
 * @param namespace - The resource namespace (required for namespaced resources)
 * @param name - The resource name
 * @param kubevirtEnabled - Whether KUBEVIRT_DYNAMIC_ACM flag is enabled
 * @returns Object with isFirstClass boolean and path string or null
 *
 * @example
 * ```typescript
 * getFirstClassResourceRoute('ManagedCluster', 'hub', undefined, 'prod-cluster', false)
 * // returns { isFirstClass: true, path: '/multicloud/infrastructure/clusters/details/prod-cluster/prod-cluster/overview' }
 *
 * getFirstClassResourceRoute('Pod', 'cluster', 'default', 'my-pod', false)
 * // returns { isFirstClass: false, path: null }
 * ```
 */
export const getFirstClassResourceRoute = (
  kind: string | undefined,
  cluster: string | undefined,
  namespace: string | undefined,
  name: string | undefined,
  kubevirtEnabled: boolean
): { isFirstClass: boolean; path: string | null } => {
  if (!kind || !name) {
    return { isFirstClass: false, path: null }
  }

  switch (kind) {
    case 'ManagedCluster':
      return {
        isFirstClass: true,
        path: `/multicloud/infrastructure/clusters/details/${name}/${name}/overview`,
      }
    case 'VirtualMachine':
    case 'VirtualMachineInstance':
      // only return ACM VM path if kubevirt integration is enabled and we have cluster + namespace
      if (kubevirtEnabled && cluster && namespace) {
        return {
          isFirstClass: true,
          path: `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`,
        }
      }
      return { isFirstClass: false, path: null }
    default:
      return { isFirstClass: false, path: null }
  }
}
