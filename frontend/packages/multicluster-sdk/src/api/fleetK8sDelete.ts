import { FleetK8sDeleteOptions, FleetK8sResourceCommon } from '../types'
/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON, k8sDelete } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

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
