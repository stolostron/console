/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import CreateCluster, { isClusterInfrastructureType } from './CreateCluster/CreateCluster'
import { CreateInfrastructure } from './CreateInfrastructure/CreateInfrastructure'

export function CreateClusterPage() {
    const { search } = useLocation()
    const searchParams = useMemo(() => new URLSearchParams(search), [search])
    const infrastructureType = (searchParams.get('infrastructureType') || '').toLowerCase()
    return isClusterInfrastructureType(infrastructureType) ? (
        <CreateCluster infrastructureType={infrastructureType} />
    ) : (
        <CreateInfrastructure />
    )
}
