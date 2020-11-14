import { IResource } from '../resources/resource'
import { createResource } from './resource-request'

export async function applyResources(resources: IResource[]) {
    for (const resource of resources) {
        createResource(resource)
    }
}
