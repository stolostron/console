import { IResource } from '../resources/resource'
import { deleteResource, IRequestResult } from './resource-request'

export function deleteResources(resources: IResource[]): IRequestResult<PromiseSettledResult<unknown>[]> {
    const results = resources.map((resource) => deleteResource(resource))
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}
