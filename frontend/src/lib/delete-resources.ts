/* Copyright Contributors to the Open Cluster Management project */

import { deleteResource, IRequestResult, IResource } from '../resources'

export function deleteResources(resources: IResource[]): IRequestResult<PromiseSettledResult<unknown>[]> {
    const results = resources.map((resource) => deleteResource(resource))
    return {
        promise: Promise.allSettled(results.map(async (result) => (await result).promise)),
        abort: () => results.forEach(async (result) => (await result).abort()),
    }
}
