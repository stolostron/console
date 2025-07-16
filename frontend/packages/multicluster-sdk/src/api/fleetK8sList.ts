/* Copyright Contributors to the Open Cluster Management project */
import { FleetK8sListOptions, FleetK8sResourceCommon } from '../types'
import { consoleFetchJSON, k8sList } from '@openshift-console/dynamic-plugin-sdk'
import { getClusterFromOptions, getOptionsWithoutCluster, getResourceURLFromOptions } from '../internal/apiRequests'

import { isHubRequest } from '../internal/isHubRequest'

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

export async function fleetK8sListItems<R extends FleetK8sResourceCommon>(options: FleetK8sListOptions): Promise<R[]> {
  return fleetK8sList(options)
}
