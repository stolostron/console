/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sPatchOptions, FleetK8sResourceCommon } from '../types'
import { compact, isEmpty } from 'lodash'
import { consoleFetchJSON, k8sPatch } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

/**
 * A fleet version of [`k8sPatch`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8slist) from
 * the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that patches any resource on the specified cluster, based on the provided options.
 *
 * The cluster name can be specified in options or the resource, with the value from options taking precedence.
 * If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.
 *
 * When a client needs to perform the partial update, the client can use `fleetK8sPatch`.
 * Alternatively, the client can use `fleetK8sUpdate` to replace an existing resource entirely.
 * See more https://datatracker.ietf.org/doc/html/rfc6902
 * @param options Which are passed as key-value pairs in the map.
 * @param options.cluster - the cluster on which to patch the resource
 * @param options.model - Kubernetes model
 * @param options.resource - The resource to be patched.
 * @param options.data - Only the data to be patched on existing resource with the operation, path, and value.
 * @param options.path - Appends as subpath if provided.
 * @param options.queryParams - The query parameters to be included in the URL.
 * @returns A promise that resolves to the response of the resource patched.
 * In case of failure promise gets rejected with HTTP error response.
 */
export async function fleetK8sPatch<R extends FleetK8sResourceCommon>(options: FleetK8sPatchOptions<R>): Promise<R> {
  const cluster = getClusterFromOptions(options)
  const optionsWithoutCluster = getOptionsWithoutCluster(options)

  const patches = compact(options.data)

  const result = (await isHubRequest(cluster))
    ? k8sPatch(optionsWithoutCluster)
    : isEmpty(patches)
      ? Promise.resolve(options.resource)
      : (consoleFetchJSON.patch(await getResourceURLFromOptions(options), patches) as Promise<R>)
  return { ...(await result), cluster }
}
