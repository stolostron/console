/* Copyright Contributors to the Open Cluster Management project */

import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import CreateClusterPool, { isCreateClusterPoolInfrastructureType } from './CreateClusterPool/CreateClusterPool'
import { CreateClusterPoolInfrastructure } from './CreateClusterPool/CreateClusterPoolInfrastructure'

export function CreateClusterPoolPage() {
    const { search } = useLocation()
    const searchParams = useMemo(() => new URLSearchParams(search), [search])
    const infrastructureType = searchParams.get('infrastructureType') || ''
    return isCreateClusterPoolInfrastructureType(infrastructureType) ? (
        <CreateClusterPool infrastructureType={infrastructureType} />
    ) : (
        <CreateClusterPoolInfrastructure />
    )
}
