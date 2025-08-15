/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sGetOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sGet } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

/**
 * A fleet version of [`k8sGet`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8sget) from
 * the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that fetches a resource from the specified cluster, based on the provided options.
 *
 * If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.
 *
 * If the name is provided it returns resource, else it returns all the resources matching the model.
 * @param options Which are passed as key-value pairs in the map
 * @param options.cluster - the cluster from which to fetch the resource
 * @param options.model - Kubernetes model
 * @param options.name - The name of the resource, if not provided then it looks for all the resources matching the model.
 * @param options.ns - The namespace to look into, should not be specified for cluster-scoped resources.
 * @param options.path - Appends as subpath if provided
 * @param options.queryParams - The query parameters to be included in the URL.
 * @param options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html
 * @returns A promise that resolves to the response as JSON object with a resource if the name is provided, else it returns all the resources matching the model. In case of failure, the promise gets rejected with HTTP error response.
 */
export async function fleetK8sGet<R extends FleetK8sResourceCommon>(options: FleetK8sGetOptions): Promise<R> {
  const cluster = getClusterFromOptions(options)
  const optionsWithoutCluster = getOptionsWithoutCluster(options)

  const result = (await isHubRequest(cluster))
    ? k8sGet<R>(optionsWithoutCluster)
    : (consoleFetchJSON(await getResourceURLFromOptions(options), 'GET', options.requestInit) as Promise<R>)
  return { ...(await result), cluster }
}
