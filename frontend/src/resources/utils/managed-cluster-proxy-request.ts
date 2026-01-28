/* Copyright Contributors to the Open Cluster Management project */

import { getResourceNameApiPath, IResource } from '../resource'
import { fetchRetry, getBackendUrl } from './resource-request'

export async function managedClusterProxyRequest(
  method: 'PUT' | 'GET' | 'POST' | 'PATCH' | 'DELETE',
  cluster: string,
  resource: { apiVersion: string; kind: string; namespace?: string; name: string },
  data?: any
): Promise<IResource | { errorMessage: string }> {
  const { apiVersion, kind, namespace, name } = resource

  if (!cluster || !apiVersion || !kind || !name) {
    return { errorMessage: 'Invalid request parameters' }
  }

  const resourceAPIPath = await getResourceNameApiPath({
    apiVersion,
    kind,
    metadata: { namespace, name },
  })

  const abortController = new AbortController()
  const managedClusterProxyURL = getBackendUrl() + `/managedclusterproxy/${cluster}${resourceAPIPath}`
  const response = await fetchRetry({
    method,
    url: managedClusterProxyURL,
    signal: abortController.signal,
    retries: process.env.NODE_ENV === 'production' ? 2 : 0,
    headers: { Accept: '*/*' },
    disableRedirectUnauthorizedLogin: true,
    data,
  })
    .then((res) => res.data as IResource)
    .catch((error) => {
      return { errorMessage: error?.message ?? 'Unknown error occurred' }
    })

  return response
}
