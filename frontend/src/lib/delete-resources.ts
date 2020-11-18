import { IResource } from '../resources/resource'
import { deleteResource } from './resource-request'

export function deleteResources(resources: IResource[]) {
    return resources.map((resource) => deleteResource(resource))
}
