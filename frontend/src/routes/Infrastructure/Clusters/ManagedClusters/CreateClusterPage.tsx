/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import CreateCluster from './CreateCluster/CreateCluster'
import { CLUSTER_INFRA_TYPE_PARAM, isClusterInfrastructureType } from './ClusterInfrastructureType'
import { CreateInfrastructure } from './CreateInfrastructure/CreateInfrastructure'

export function CreateClusterPage() {
    const { search } = useLocation()
    const searchParams = useMemo(() => new URLSearchParams(search), [search])
    const infrastructureType = (searchParams.get(CLUSTER_INFRA_TYPE_PARAM) || '').toLowerCase()
    return isClusterInfrastructureType(infrastructureType) ? (
        <CreateCluster infrastructureType={infrastructureType} />
    ) : (
        <CreateInfrastructure />
    )
}
