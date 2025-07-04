/* Copyright Contributors to the Open Cluster Management project */
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { UseHubClusterName } from '../types'
import { LOCAL_CLUSTER_LABEL } from '../internal/constants'
import { ManagedClusterListGroupVersionKind } from '../internal/models'
import { useMemo } from 'react'

export const useHubClusterName: UseHubClusterName = () => {
  const [clusters, loaded, error] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: ManagedClusterListGroupVersionKind,
    isList: true,
  })

  const hubClusterName = useMemo(
    () => clusters?.find((cluster) => cluster.metadata?.labels?.[LOCAL_CLUSTER_LABEL] === 'true')?.metadata?.name,
    [clusters]
  )

  return useMemo(() => [hubClusterName, loaded, error], [hubClusterName, loaded, error])
}
