/* Copyright Contributors to the Open Cluster Management project */

import { useState, useEffect } from 'react'
import { useRecoilState } from 'recoil'
import { managedClusterSetsState } from '../../../../atoms'
import { ManagedClusterSet } from '../../../../resources/managed-cluster-set'
import { canUser, checkAdminAccess } from '../../../../lib/rbac-util'

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
                    return setCanJoinClusterSets(managedClusterSets)
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
                        return setCanJoinClusterSets(authorizedClusterSets)
                    })
                }
            })
        } else {
            setIsLoading(false)
        }
    }, [canJoinClusterSets, managedClusterSets])

    return { canJoinClusterSets, isLoading }
}
