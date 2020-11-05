import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, resourceMethods, useQueryWrapper, ResourceList } from './Resource'

export interface Project extends IResource {
    apiVersion: 'project.openshift.io/v1'
    kind: 'Project'
    metadata: V1ObjectMeta
}

export interface ProjectRequest extends IResource {
    metadata: V1ObjectMeta
}

export const projectMethods = resourceMethods<Project>({
    path: '/apis/project.openshift.io/v1',
    plural: 'projects',
})

export const projectRequestMethods = resourceMethods<ProjectRequest>({
    path: '/apis/project.openshift.io/v1',
    plural: 'projectrequests',
})

export function useProjects() {
    return useQueryWrapper<ResourceList<Project>>(projectMethods.listCluster)
}

export const createProject = (name: string | undefined) => {
    if (!name) throw new Error('Project name is undefined')
    return projectRequestMethods.create({ metadata: { name } })
}
