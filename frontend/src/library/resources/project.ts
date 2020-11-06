import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, ResourceList } from './resource'
import { resourceMethods } from '../utils/resource-methods'
import { useQuery } from '../../lib/useQuery'

export const ProjectApiVersion = 'project.openshift.io/v1'
export type ProjectApiVersionType = 'project.openshift.io/v1'

export const ProjectKind = 'Project'
export type ProjectKindType = 'Project'

export interface Project extends IResource {
    apiVersion: ProjectApiVersionType
    kind: 'Project'
    metadata: V1ObjectMeta
}

export const ProjectRequestApiVersion = 'project.openshift.io/v1'
export type ProjectRequestApiVersionType = 'project.openshift.io/v1'

export const ProjectRequestKind = 'ProjectRequest'
export type ProjectRequestKindType = 'ProjectRequest'

export interface ProjectRequest extends IResource {
    apiVersion: ProjectRequestApiVersionType
    kind: ProjectRequestKindType
    metadata: V1ObjectMeta
}

export const projectMethods = resourceMethods<Project>({
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
})

export const projectRequestMethods = resourceMethods<ProjectRequest>({
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
})

export function useProjects() {
    return useQuery<ResourceList<Project>>(projectMethods.listCluster)
}

export const createProject = (name: string | undefined) => {
    if (!name) throw new Error('Project name is undefined')
    return projectRequestMethods.create({
        apiVersion: ProjectRequestApiVersion,
        kind: ProjectRequestKind,
        metadata: { name },
    })
}
