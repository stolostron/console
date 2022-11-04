/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import CreateClusterPool from './CreateClusterPool/CreateClusterPool'
import { CLUSTER_POOL_INFRA_TYPE_PARAM, isClusterPoolInfrastructureType } from './ClusterPoolInfrastructureType'
import { CreateClusterPoolInfrastructure } from './CreateClusterPool/CreateClusterPoolInfrastructure'

export function CreateClusterPoolPage() {
    const { search } = useLocation()
    const searchParams = useMemo(() => new URLSearchParams(search), [search])
    const infrastructureType = (searchParams.get(CLUSTER_POOL_INFRA_TYPE_PARAM) || '').toLowerCase()
    return isClusterPoolInfrastructureType(infrastructureType) ? (
        <CreateClusterPool infrastructureType={infrastructureType} />
    ) : (
        <CreateClusterPoolInfrastructure />
    )
}
