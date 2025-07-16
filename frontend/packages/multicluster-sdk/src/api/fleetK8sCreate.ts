import { FleetK8sCreateUpdateOptions, FleetK8sResourceCommon } from '../types'
/* Copyright Contributors to the Open Cluster Management project */
import { consoleFetchJSON, k8sCreate } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

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
