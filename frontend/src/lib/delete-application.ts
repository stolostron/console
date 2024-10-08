/* Copyright Contributors to the Open Cluster Management project */

import { IResource, ResourceError, ResourceErrorCode } from '../resources'
import { deleteResources } from './delete-resources'

export function deleteApplication(app: IResource, childResources?: any[], deleted?: (resource: IResource) => void) {
  const allResources = [app]

  childResources?.forEach((resource) => {
    allResources.push({
      apiVersion: resource.apiVersion,
      kind: resource.kind,
      metadata: {
        name: resource.name,
        namespace: resource.namespace,
      },
    })
  })

  const deleteResourcesResult = deleteResources(allResources)

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
        deleted && deleted(app)
      })
    }),
    abort: deleteResourcesResult.abort,
  }
}
