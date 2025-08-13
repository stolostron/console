import { FleetK8sCreateUpdateOptions, FleetK8sResourceCommon } from '../types'
/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON, k8sCreate } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

/**
 * A fleet version of [`k8sCreate`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8screate) from
 * the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that creates a resource on the specified cluster.
 *
 * The cluster name can be specified in options or the payload, with the value from options taking precedence.
 * If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.
 *
 * @param options Which are passed as key-value pairs in the map
 * @param options.cluster - the cluster on which to create the resource
 * @param options.model - Kubernetes model
 * @param options.data - payload for the resource to be created
 * @param options.path - Appends as subpath if provided
 * @param options.queryParams - The query parameters to be included in the URL.
 * @returns A promise that resolves to the response of the resource created.
 * In case of failure, the promise gets rejected with HTTP error response.
 */
export async function fleetK8sCreate<R extends FleetK8sResourceCommon>(
  options: FleetK8sCreateUpdateOptions<R>
): Promise<R> {
  const cluster = getClusterFromOptions(options)
  const optionsWithoutCluster = getOptionsWithoutCluster(options)

  const result = (await isHubRequest(cluster))
    ? k8sCreate(optionsWithoutCluster)
    : (consoleFetchJSON.post(await getResourceURLFromOptions(options, true), optionsWithoutCluster.data) as Promise<R>)
  return { ...(await result), cluster }
}
