/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom-v5-compat'
import CreateCluster from './CreateCluster/CreateCluster'
import { CLUSTER_INFRA_TYPE_PARAM, isClusterInfrastructureType } from './ClusterInfrastructureType'
import { CreateClusterCatalog } from './CreateClusterCatalog/CreateClusterCatalog'

export function CreateClusterPage() {
  const { search } = useLocation()
  const searchParams = useMemo(() => new URLSearchParams(search), [search])
  const infrastructureType = (searchParams.get(CLUSTER_INFRA_TYPE_PARAM) || '').toLowerCase()
  return isClusterInfrastructureType(infrastructureType) ? (
    <CreateCluster infrastructureType={infrastructureType} />
  ) : (
    <CreateClusterCatalog />
  )
}
