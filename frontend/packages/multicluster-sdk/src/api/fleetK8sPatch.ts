/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sPatchOptions, FleetK8sResourceCommon } from '../types'
import { compact, isEmpty } from 'lodash'
import { consoleFetchJSON, k8sPatch } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

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
