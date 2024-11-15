/* Copyright Contributors to the Open Cluster Management project */

import { IResource } from '../resources'
import { deleteResource, IRequestResult } from '../resources/utils'

export function deleteResources(resources: IResource[]): IRequestResult<PromiseSettledResult<unknown>[]> {
  const results = resources.map((resource) => deleteResource(resource))
  return {
    promise: Promise.allSettled(results.map((result) => result.promise)),
    abort: () => results.forEach((result) => result.abort()),
  }
}
