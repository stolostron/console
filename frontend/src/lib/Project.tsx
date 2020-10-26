import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, resourceMethods, GetWrapper } from './Resource'

export interface Project extends IResource {
    apiVersion: 'project.openshift.io/v1'
    kind: 'Project'
    metadata: V1ObjectMeta
}

export const projects = resourceMethods<Project>({
    path: '/apis/project.openshift.io/v1',
    plural: 'projects',
})

export function Projects() {
    return GetWrapper<Project[]>(projects.listCluster)
}
