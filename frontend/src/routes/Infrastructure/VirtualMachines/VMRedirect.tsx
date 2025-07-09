/* Copyright Contributors to the Open Cluster Management project */
import { Navigate, useParams } from 'react-router-dom-v5-compat'
import { useFlag } from '@openshift-console/dynamic-plugin-sdk'
import { GetUrlSearchParam } from '../../Search/searchDefinitions'

/**
 * VMRedirect - Virtual Machine URL redirect component for ACM KubeVirt integration
 *
 * This component handles redirection from legacy VM URLs to the ACM search page,
 * providing a transition mechanism for environments with KubeVirt integration.
 *
 * @example
 * ```tsx
 * // Route configuration
 * <Route
 *   path="/multicloud/infrastructure/virtualmachines/:cluster/:namespace/:name"
 *   component={VMRedirect}
 * />
 * ```
 *
 * @behavior
 * - **Always redirects** to `/multicloud/search/resources` with VM-specific filters
 * - **Preserves URL parameters**: cluster, namespace, name from route params
 * - **Hardcoded resource type**: Always searches for `VirtualMachine` kind
 * - **Replace navigation**: Uses `replace={true}` to avoid back button issues
 *
 * @param none - Component reads URL parameters via useParams hook
 * @returns Navigate component with redirect to search page
 *
 * @route_params
 * - cluster: Target cluster name
 * - namespace: VM namespace
 * - name: VM name
 *
 * @flag_integration
 * - Uses `KUBEVIRT_DYNAMIC_ACM` feature flag
 * - Currently redirects to search regardless of flag value
 * - Future enhancement: Flag-based routing to different VM detail pages
 *
 * @see {@link VMRedirect.test.tsx} for comprehensive test coverage
 */

export default function VMRedirect() {
  const { cluster, namespace, name } = useParams()
  const kubevirtDynamicACMEnabled = useFlag('KUBEVIRT_DYNAMIC_ACM')

  const searchParams = GetUrlSearchParam({
    cluster,
    namespace,
    name,
    kind: 'VirtualMachine',
    apigroup: 'kubevirt.io',
    apiversion: 'v1',
  })

  // If KUBEVIRT_DYNAMIC_ACM is enabled, redirect to search page
  // otherwise, the route won't be available and this component won't be rendered
  if (kubevirtDynamicACMEnabled) {
    return <Navigate to={`/multicloud/search/resources${searchParams}`} replace />
  }

  // this shouldn't happen in normal flow since the route is disabled when KUBEVIRT_DYNAMIC_ACM is enabled
  return <Navigate to={`/multicloud/search/resources${searchParams}`} replace />
}
