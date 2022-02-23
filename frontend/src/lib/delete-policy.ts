// Copyright Contributors to the Open Cluster Management project

import {
    IResource,
    Placement,
    PlacementBinding,
    PlacementRule,
    Policy,
    ResourceError,
    ResourceErrorCode,
} from '../resources'
import {
    getPlacementBindingsForResource,
    getPlacementRulesForResource,
    getPlacementsForResource,
} from '../routes/Governance/common/util'
import { deleteResources } from './delete-resources'

export function deletePolicy(
    policy: Policy,
    placements: Placement[],
    placementRules: PlacementRule[],
    placementBindings: PlacementBinding[],
    deletePlacements?: Boolean,
    deletePlacementBindings?: Boolean
) {
    let resources: IResource[] = [policy]

    const bindings = getPlacementBindingsForResource(policy, placementBindings)

    if (deletePlacementBindings) {
        resources = [...resources, ...bindings]
    }

    if (deletePlacements) {
        resources = [...resources, ...getPlacementsForResource(policy, bindings, placements)]
        resources = [...resources, ...getPlacementRulesForResource(policy, bindings, placementRules)]
    }

    const deleteResourcesResult = deleteResources(resources)

    return {
        promise: new Promise((resolve, reject) => {
            deleteResourcesResult.promise.then((promisesSettledResult) => {
                if (promisesSettledResult[0]?.status === 'rejected') {
                    const error = promisesSettledResult[0].reason
                    if (error instanceof ResourceError) {
                        if (error.code === ResourceErrorCode.NotFound) {
                            // DO NOTHING
                        } else {
                            reject(promisesSettledResult[0].reason)
                            return
                        }
                    }
                }
                if (promisesSettledResult[1]?.status === 'rejected') {
                    reject(promisesSettledResult[1].reason)
                    return
                }
                resolve(promisesSettledResult)
            })
        }),
        abort: deleteResourcesResult.abort,
    }
}
