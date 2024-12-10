// Copyright Contributors to the Open Cluster Management project

import { IResource, Placement, PlacementBinding, PlacementRule, PolicySet } from '../resources'
import { ResourceError, ResourceErrorCode } from '../resources/utils'
import { getPlacementBindingsForResource, getPlacementsForResource } from '../routes/Governance/common/util'
import { deleteResources } from './delete-resources'

export function deletePolicySet(
  policySet: PolicySet,
  placements: Placement[],
  placementRules: PlacementRule[],
  placementBindings: PlacementBinding[],
  deletePlacements?: boolean,
  deletePlacementBindings?: boolean
) {
  let resources: IResource[] = [policySet]

  const bindings = getPlacementBindingsForResource(policySet, placementBindings)

  if (deletePlacementBindings) {
    resources = [...resources, ...bindings]
  }

  if (deletePlacements) {
    resources = [...resources, ...getPlacementsForResource(policySet, bindings, placements)]
    resources = [...resources, ...getPlacementsForResource(policySet, bindings, placementRules)]
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
