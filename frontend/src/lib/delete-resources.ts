/* Copyright Contributors to the Open Cluster Management project */

import { deleteResource, IRequestResult, IResource } from '@open-cluster-management/resources'

export function deleteResources(resources: IResource[]): IRequestResult<PromiseSettledResult<unknown>[]> {
    const results = resources.map((resource) => deleteResource(resource))
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}
