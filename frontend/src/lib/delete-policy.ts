// Copyright Contributors to the Open Cluster Management project

import { IResource, Placement, PlacementBinding, PlacementRule, Policy } from '../resources'
import { ResourceError, ResourceErrorCode } from '../resources/utils'
import { deleteResources } from './delete-resources'

export function deletePolicy(
  policy: Policy,
  placements: Placement[],
  placementRules: PlacementRule[],
  placementBindings: PlacementBinding[],
  deletePlacements?: boolean,
  deletePlacementBindings?: boolean
) {
  let resources: IResource[] = [policy]

  if (deletePlacementBindings) {
    resources = [...resources, ...placementBindings]
  }

  if (deletePlacements) {
    resources = [...resources, ...placementRules]
    resources = [...resources, ...placements]
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
