/* Copyright Contributors to the Open Cluster Management project */

import { FleetK8sCreateUpdateOptions, FleetK8sResourceCommon } from '../types'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { consoleFetchJSON, k8sUpdate } from '@openshift-console/dynamic-plugin-sdk'
import { isHubRequest } from '../internal/isHubRequest'

/**
 * A fleet version of [`k8sPatch`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8slist) from
 * the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that updates the entire resource on the specified cluster, based on the provided options.
 *
 * The cluster name can be specified in options or the payload, with the value from options taking precedence.
 * If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.
 *
 * When a client needs to replace an existing resource entirely, the client can use `fleetK8sUpdate`.
 * Alternatively, the client can use `fleetK8sPatch` to perform the partial update.
 * @param options which are passed as key-value pair in the map
 * @param options.cluster - the cluster on which to update the resource
 * @param options.model - Kubernetes model
 * @param options.data - payload for the Kubernetes resource to be updated
 * @param options.ns - namespace to look into, it should not be specified for cluster-scoped resources.
 * @param options.name - resource name to be updated.
 * @param options.path - appends as subpath if provided.
 * @param options.queryParams - The query parameters to be included in the URL.
 * @returns A promise that resolves to the response of the resource updated.
 * In case of failure promise gets rejected with HTTP error response.
 */
export async function fleetK8sUpdate<R extends FleetK8sResourceCommon>(
  options: FleetK8sCreateUpdateOptions<R>
): Promise<R> {
  const cluster = getClusterFromOptions(options)
  const optionsWithoutCluster = getOptionsWithoutCluster(options)

  const result = (await isHubRequest(cluster))
    ? k8sUpdate(optionsWithoutCluster)
    : (consoleFetchJSON.put(await getResourceURLFromOptions(options), optionsWithoutCluster.data) as Promise<R>)
  return { ...(await result), cluster }
}
