/* Copyright Contributors to the Open Cluster Management project */

import { FleetK8sCreateUpdateOptions, FleetK8sResourceCommon } from '../types'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { isHubRequest } from '../internal/isHubRequest'
import { k8sUpdate } from '@openshift-console/dynamic-plugin-sdk'

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
