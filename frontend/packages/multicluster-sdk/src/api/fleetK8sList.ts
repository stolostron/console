/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sListOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sList } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

/**
 * A fleet version of [`k8sList`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8slist) from
 * the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that lists the resources as an array in the specified cluster, based on the provided options.
 *
 * If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.
 * @param options Which are passed as key-value pairs in the map.
 * @param options.cluster - the cluster from which to list the resources
 * @param options.model - Kubernetes model
 * @param options.queryParams - The query parameters to be included in the URL. It can also pass label selectors by using the `labelSelector` key.
 * @param options.requestInit - The fetch init object to use. This can have request headers, method, redirect, and so forth. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html
 * @returns A promise that resolves to the response
 */
export async function fleetK8sList<R extends FleetK8sResourceCommon>(options: FleetK8sListOptions): Promise<R[]> {
  const cluster = getClusterFromOptions(options)
  const optionsWithoutCluster = getOptionsWithoutCluster(options)

  const items = (await isHubRequest(cluster))
    ? (k8sList(optionsWithoutCluster) as Promise<R[]>)
    : (
        consoleFetchJSON(await getResourceURLFromOptions(options), 'GET', options.requestInit) as Promise<
          K8sResourceCommon & {
            items: R[]
          }
        >
      ).then((result) =>
        result.items?.map((i) => ({
          kind: options.model.kind,
          apiVersion: result.apiVersion,
          ...i,
        }))
      )
  return (await items)?.map((i) => ({ ...i, cluster }))
}

/**
 * A fleet version of [`k8sListItems`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8slistitems) from
 * the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that lists the resources as an array in the specified cluster, based on the provided options.
 *
 * If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.
 * @param options Which are passed as key-value pairs in the map.
 * @param options.cluster - the cluster from which to list the resources
 * @param options.model - Kubernetes model
 * @param options.queryParams - The query parameters to be included in the URL. It can also pass label selectors by using the `labelSelector` key.
 * @param options.requestInit - The fetch init object to use. This can have request headers, method, redirect, and so forth. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html
 * @returns A promise that resolves to the response
 */
export async function fleetK8sListItems<R extends FleetK8sResourceCommon>(options: FleetK8sListOptions): Promise<R[]> {
  return fleetK8sList(options)
}
