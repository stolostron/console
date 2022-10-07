/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterSet, ManagedClusterSetDefinition, isGlobalClusterSet } from '../../../../../resources'
import { useEffect, useState } from 'react'
import { useRecoilState } from 'recoil'
import { managedClusterSetsState } from '../../../../../atoms'
import { canUser, checkAdminAccess } from '../../../../../lib/rbac-util'

// returns a list of cluster sets that the user is authorized to attach managed clusters to
export function useCanJoinClusterSets() {
    const [managedClusterSets] = useRecoilState(managedClusterSetsState)
    const [canJoinClusterSets, setCanJoinClusterSets] = useState<ManagedClusterSet[] | undefined>()
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        /* istanbul ignore else */
        if (canJoinClusterSets === undefined) {
            if (managedClusterSets.length === 0) {
                return setCanJoinClusterSets([])
            }
            const adminAccessCheck = checkAdminAccess()
            adminAccessCheck.then((adminAccess) => {
                if (adminAccess.status!.allowed) {
                    return setCanJoinClusterSets(
                        managedClusterSets.filter((managedClusterSet) => !isGlobalClusterSet(managedClusterSet))
                    )
                } else {
                    const requests = Promise.allSettled(
                        managedClusterSets.map((mcs) => {
                            return canUser('create', mcs, undefined, mcs.metadata.name, 'join').promise
                        })
                    )
                    requests.then((results) => {
                        const authorizedClusterSetNames: string[] = []
                        results.forEach((res) => {
                            if (res.status !== 'rejected' && res.value.status?.allowed) {
                                authorizedClusterSetNames.push(res.value.spec.resourceAttributes.name!)
                            }
                        })
                        const authorizedClusterSets = managedClusterSets.filter((mcs) =>
                            authorizedClusterSetNames.includes(mcs.metadata.name!)
                        )
                        return setCanJoinClusterSets(
                            authorizedClusterSets.filter((managedClusterSet) => !isGlobalClusterSet(managedClusterSet))
                        )
                    })
                }
            })
        } else {
            setIsLoading(false)
        }
    }, [canJoinClusterSets, managedClusterSets])

    return { canJoinClusterSets, isLoading }
}

// checks if a user must configure a cluster set for cluster/clusterpool creation
export function useMustJoinClusterSet() {
    const [required, setRequired] = useState<boolean | undefined>(undefined)
    useEffect(() => {
        canUser('create', ManagedClusterSetDefinition, undefined, '', 'join')
            .promise.then((result) => {
                return setRequired(!result.status?.allowed)
            })
            .catch(() => setRequired(true))
    })
    return required
}
