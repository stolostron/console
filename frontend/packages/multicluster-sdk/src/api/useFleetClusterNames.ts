/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { UseFleetClusterNames } from '../types/fleet'

const ManagedClusterListGroupVersionKind = {
  group: 'clusterview.open-cluster-management.io',
  version: 'v1',
  kind: 'ManagedCluster',
}
export const useFleetClusterNames: UseFleetClusterNames = () => {
  const [clusters] = useK8sWatchResource<[]>({
    groupVersionKind: ManagedClusterListGroupVersionKind,
    isList: true,
  })

  return clusters
}
