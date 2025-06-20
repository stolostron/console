/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { UseFleetClusterNames } from '../types/fleet'
import { ManagedClusterListGroupVersionKind } from './constants'

export const useFleetClusterNames: UseFleetClusterNames = () => {
  const [clusters, loaded, error] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: ManagedClusterListGroupVersionKind,
    isList: true,
  })
  const clusterNames = clusters.flatMap((cluster) => (cluster.metadata?.name ? [cluster.metadata.name] : []))

  return [clusterNames, loaded, error]
}
