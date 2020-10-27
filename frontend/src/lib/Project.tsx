import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, resourceMethods, GetWrapper } from './Resource'

export interface Project extends IResource {
    apiVersion: 'project.openshift.io/v1'
    kind: 'Project'
    metadata: V1ObjectMeta
}

export interface ProjectRequest extends IResource {
    metadata: V1ObjectMeta
}

export const projects = resourceMethods<Project>({
    path: '/apis/project.openshift.io/v1',
    plural: 'projects',
})

export const projectRequests = resourceMethods<ProjectRequest>({
    path: '/apis/project.openshift.io/v1',
    plural: 'projectrequests',
})

export function Projects() {
    return GetWrapper<Project[]>(projects.listCluster)
}

export const createProject = (name: string | undefined) => {
    if (!name) throw new Error ('Project name is undefined')
    return projectRequests.create({ metadata: { name } })
}
