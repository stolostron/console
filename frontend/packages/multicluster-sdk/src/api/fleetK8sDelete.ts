import { FleetK8sDeleteOptions, FleetK8sResourceCommon } from '../types'
/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON, k8sDelete } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

/**
 * A fleet version of [`k8sDelete`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8sdelete) from
 * the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that deletes resources from the specified cluster, based on the provided model and resource.
 *
 * The cluster name can be specified in options or the resource, with the value from options taking precedence.
 * If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.
 *
 *  The garbage collection works based on 'Foreground' | 'Background', can be configured with `propagationPolicy` property in provided model or passed in json.
 * @param options which are passed as key-value pair in the map.
 * @param options.cluster - the cluster from which to delete the resource
 * @param options.model - Kubernetes model
 * @param options.resource - The resource to be deleted.
 * @param options.path - Appends as subpath if provided.
 * @param options.queryParams - The query parameters to be included in the URL.
 * @param options.requestInit - The fetch init object to use. This can have request headers, method, redirect, etc. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html
 * @param options.json - Can control garbage collection of resources explicitly if provided else will default to model's `propagationPolicy`.
 * @example
 * ```
 * { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
 * ```
 * @returns A promise that resolves to the response of kind Status.
 * In case of failure promise gets rejected with HTTP error response.
 *  */
export async function fleetK8sDelete<R extends FleetK8sResourceCommon>(options: FleetK8sDeleteOptions<R>): Promise<R> {
  const cluster = getClusterFromOptions(options)
  const optionsWithoutCluster = getOptionsWithoutCluster(options)

  const { propagationPolicy } = options.model
  const jsonData = options.json ?? (propagationPolicy && { kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy })

  const result = (await isHubRequest(cluster))
    ? k8sDelete(optionsWithoutCluster)
    : (consoleFetchJSON.delete(await getResourceURLFromOptions(options), jsonData, options.requestInit) as Promise<R>)
  return { ...(await result), cluster }
}
