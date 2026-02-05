/* Copyright Contributors to the Open Cluster Management project */

import { createSubjectAccessReview, ResourceAttributes } from '../self-subject-access-review'
import { fetchRetry, getBackendUrl } from './resource-request'

export interface FleetLogsRequestOptions {
  /** The name of the managed cluster */
  cluster: string
  /** The namespace where the pod is running */
  namespace: string
  /** The name of the pod */
  podName: string
  /** The container name within the pod */
  container: string
  /** Number of lines to tail from the end of the logs (default: 1000) */
  tailLines?: number
  /** Whether to fetch previous container logs (default: false) */
  previous?: boolean
  /** AbortSignal for canceling the request */
  signal?: AbortSignal
}

export interface FleetLogsRequestResult {
  data: string
  errorMessage?: string
}

/**
 * Fetches pod logs from a managed cluster using the appropriate endpoint based on user permissions.
 *
 * This function first checks if the user has permission to access the legacy clusterstatuses/logs API
 * in the proxy.open-cluster-management.io API group. If permitted, it uses that API. Otherwise, it
 * falls back to using the managed cluster proxy to fetch logs directly from the pod's logs subresource.
 *
 * @param options Configuration options for the logs request
 * @returns Promise that resolves to the logs content or an error message
 */
export async function fleetLogsRequest(options: FleetLogsRequestOptions): Promise<FleetLogsRequestResult> {
  const { cluster, namespace, podName, container, tailLines = 1000, previous = false, signal } = options

  if (!cluster || !namespace || !podName || !container) {
    return {
      data: '',
      errorMessage: 'Invalid request parameters: cluster, namespace, podName, and container are required',
    }
  }

  try {
    // Check if user has permission to get clusterstatuses/logs in proxy.open-cluster-management.io API group
    const resourceAttributes: ResourceAttributes = {
      resource: 'clusterstatuses',
      subresource: 'log',
      verb: 'get',
      group: 'proxy.open-cluster-management.io',
      version: 'v1beta1',
      namespace: cluster,
      name: cluster,
    }

    const accessReview = createSubjectAccessReview(resourceAttributes)
    const accessResult = await accessReview.promise

    const isAllowed = accessResult.status?.allowed ?? false

    if (isAllowed) {
      // Use legacy clusterstatuses/logs API
      return await fetchLogsViaClusterStatuses(cluster, namespace, podName, container, tailLines, previous, signal)
    } else {
      // Use managed cluster proxy to fetch logs directly from pod
      return await fetchLogsViaManagedClusterProxy(cluster, namespace, podName, container, tailLines, previous, signal)
    }
  } catch (err: any) {
    console.error(`Error fetching logs for pod ${podName} in namespace ${namespace} on cluster ${cluster}: `, err)
    return { data: '', errorMessage: err?.message ?? 'Unknown error occurred while fetching logs' }
  }
}

/**
 * Fetches logs using the legacy proxy.open-cluster-management.io clusterstatuses/logs API
 */
async function fetchLogsViaClusterStatuses(
  cluster: string,
  namespace: string,
  podName: string,
  container: string,
  tailLines: number,
  previous: boolean,
  signal?: AbortSignal
): Promise<FleetLogsRequestResult> {
  const url = `${getBackendUrl()}/apis/proxy.open-cluster-management.io/v1beta1/namespaces/${cluster}/clusterstatuses/${cluster}/log/${namespace}/${podName}/${container}?tailLines=${tailLines}${previous ? '&previous=true' : ''}`

  const result = await fetchRetry({
    method: 'GET',
    url,
    signal: signal ?? new AbortController().signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    headers: { Accept: '*/*' },
  })

  return { data: (result.data as string) ?? '' }
}

/**
 * Fetches logs using the managed cluster proxy to access the pod's logs subresource directly
 */
async function fetchLogsViaManagedClusterProxy(
  cluster: string,
  namespace: string,
  podName: string,
  container: string,
  tailLines: number,
  previous: boolean,
  signal?: AbortSignal
): Promise<FleetLogsRequestResult> {
  // Build the Kubernetes API path for pod logs
  const podLogsPath = `/api/v1/namespaces/${namespace}/pods/${podName}/log?container=${container}&tailLines=${tailLines}${previous ? '&previous=true' : ''}`
  const managedClusterProxyURL = `${getBackendUrl()}/managedclusterproxy/${cluster}${podLogsPath}`

  const result = await fetchRetry({
    method: 'GET',
    url: managedClusterProxyURL,
    signal: signal ?? new AbortController().signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    headers: { Accept: '*/*' },
    disableRedirectUnauthorizedLogin: true,
  })

  return { data: (result.data as string) ?? '' }
}
