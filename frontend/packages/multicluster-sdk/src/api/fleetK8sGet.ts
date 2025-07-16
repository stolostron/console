/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sGetOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sGet } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

export async function fleetK8sGet<R extends FleetK8sResourceCommon>(options: FleetK8sGetOptions): Promise<R> {
  const cluster = getClusterFromOptions(options)
  const optionsWithoutCluster = getOptionsWithoutCluster(options)

  const result = (await isHubRequest(cluster))
    ? k8sGet<R>(optionsWithoutCluster)
    : (consoleFetchJSON(await getResourceURLFromOptions(options), 'GET', options.requestInit) as Promise<R>)
  return { ...(await result), cluster }
}
