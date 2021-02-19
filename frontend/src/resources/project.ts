import { V1ObjectMeta } from '@kubernetes/client-node'
import { createResource, listClusterResources } from '../lib/resource-request'
import { IResource, IResourceDefinition } from './resource'

export const ProjectApiVersion = 'project.openshift.io/v1'
export type ProjectApiVersionType = 'project.openshift.io/v1'

export const ProjectKind = 'Project'
export type ProjectKindType = 'Project'

export interface Project extends IResource {
    apiVersion: ProjectApiVersionType
    kind: 'Project'
    metadata: V1ObjectMeta
}

export const ProjectDefinition: IResourceDefinition = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
}

export const ProjectRequestApiVersion = 'project.openshift.io/v1'
export type ProjectRequestApiVersionType = 'project.openshift.io/v1'

export const ProjectRequestKind = 'ProjectRequest'
export type ProjectRequestKindType = 'ProjectRequest'

export const ProjectRequestDefinition: IResourceDefinition = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
}

export interface ProjectRequest extends IResource {
    apiVersion: ProjectRequestApiVersionType
    kind: ProjectRequestKindType
    metadata: V1ObjectMeta
}

export const createProject = (name: string | undefined) => {
    if (!name) throw new Error('Project name is undefined')
    return createResource<ProjectRequest, Project>({
        apiVersion: ProjectRequestApiVersion,
        kind: ProjectRequestKind,
        metadata: { name },
    })
}

export function listProjects() {
    return listClusterResources<Project>({
        apiVersion: ProjectApiVersion,
        kind: ProjectKind,
    })
}
