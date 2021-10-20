// Copyright Contributors to the Open Cluster Management project

import {
    Policy,
    PolicyApiVersion,
    PolicyKind,
    IResource,
    ResourceError,
    ResourceErrorCode
} from '../resources'
import { PlacementBindingApiVersion, PlacementBindingKind } from '../resources/placement-binding'
// import { PlacementRuleApiVersion, PlacementRuleKind } from '../resources/placement-rule'

import { deleteResources } from './delete-resources'

export function deletePolicy(policy: Policy, checked: boolean) {
    console.log('checked in delete', checked)
    const resources: IResource[] = [
        {
            apiVersion: PolicyApiVersion,
            kind: PolicyKind,
            metadata: { name: policy.metadata.name!, namespace: policy.metadata.namespace!}
        },
    ]
    resources.push(
        {
            apiVersion: PlacementBindingApiVersion,
            kind: PlacementBindingKind,
            metadata: { name: policy.metadata.name },
        }
    // resources.push(
    //     {
    //         apiVersion: PlacementRuleApiVersion,
    //         kind: PlacementRuleKind,
    //     }
    // )

    )

    console.log('resources', resources)

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
        abort: deleteResourcesResult.abort
    }
}