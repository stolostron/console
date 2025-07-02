/* Copyright Contributors to the Open Cluster Management project */
import { useHubClusterName } from './useHubClusterName'
import { useFleetK8sWatchResource as useInternalFleetK8sWatchResource } from './use-fleet-k8s-watch-resource/use-fleet-k8s-watch-resource'
import { UseFleetK8sWatchResource } from '../types'

/**
 * A hook for watching Kubernetes resources with support for multi-cluster environments.
 *
 * This hook provides an interface for watching Kubernetes resources across multiple clusters.
 * It automatically detects the hub cluster and handles resource watching on both hub
 * and remote clusters using cached WebSocket connections for real-time updates.
 *
 * @param initResource - The resource to watch. Can be null to disable the watch.
 * @returns A tuple containing the watched resource data, a boolean indicating if the data is loaded,
 *          and any error that occurred. The hook returns live-updating data for remote clusters
 *          and standard K8s watch behavior for hub cluster resources.
 *
 * @example
 * ```typescript
 * // Watch pods on a remote cluster
 * const [pods, loaded, error] = useFleetK8sWatchResource({
 *   groupVersionKind: { version: 'v1', kind: 'Pod' },
 *   isList: true,
 *   cluster: 'remote-cluster',
 *   namespace: 'default'
 * })
 *
 * // Watch a specific deployment on hub cluster
 * const [deployment, loaded, error] = useFleetK8sWatchResource({
 *   groupVersionKind: { version: 'apps/v1', kind: 'Deployment' },
 *   name: 'my-app',
 *   namespace: 'default'
 * })
 * ```
 */
export const useFleetK8sWatchResource: UseFleetK8sWatchResource = (initResource) => {
  const [hubClusterName, loaded] = useHubClusterName()
  return useInternalFleetK8sWatchResource(hubClusterName || '', loaded ? initResource : null)
}
