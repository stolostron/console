/* Copyright Contributors to the Open Cluster Management project */

import { ManagedClusterAddOn } from '../resources/managed-cluster-add-on'
import { IResource } from '../resources/resource'
import { SubmarinerConfig } from '../resources/submariner-config'
import { deleteResources } from './delete-resources'
import { ResourceError, ResourceErrorCode } from './resource-request'

export function deleteSubmarinerAddon(managedClusterAddon: ManagedClusterAddOn, submarinerConfig?: SubmarinerConfig) {
    const resources: IResource[] = [managedClusterAddon]
    submarinerConfig && resources.push(submarinerConfig)
    const deleteResourcesResult = deleteResources(resources)

    return {
        promise: new Promise((resolve, reject) => {
            deleteResourcesResult.promise.then((promisesSettledResult) => {
                if (promisesSettledResult[0].status === 'rejected') {
                    reject(promisesSettledResult[0].reason)
                    return
                }
                if (promisesSettledResult[1]?.status === 'rejected') {
                    const error = promisesSettledResult[1].reason
                    if (error instanceof ResourceError) {
                        if (error.code === ResourceErrorCode.NotFound) {
                            // DO NOTHING
                        } else {
                            reject(promisesSettledResult[1].reason)
                            return
                        }
                    }
                }
                resolve(promisesSettledResult)
            })
        }),
        abort: deleteResourcesResult.abort,
    }
}
