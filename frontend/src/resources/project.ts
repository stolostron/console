/* Copyright Contributors to the Open Cluster Management project */
import { Namespace, NamespaceApiVersion, NamespaceKind } from '.'
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { createResource, replaceResource } from './utils/resource-request'
import { listResources } from '.'

export const ProjectApiVersion = 'project.openshift.io/v1'
export type ProjectApiVersionType = 'project.openshift.io/v1'

export const ProjectKind = 'Project'
export type ProjectKindType = 'Project'

export interface Project extends IResource {
    apiVersion: ProjectApiVersionType
    kind: 'Project'
    metadata: Metadata
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
    metadata: Metadata
}

export const createProject = (name: string | undefined, labels?: Metadata['labels']) => {
    if (!name) throw new Error('Project name is undefined')
    const response = createResource<ProjectRequest, Project>({
        apiVersion: ProjectRequestApiVersion,
        kind: ProjectRequestKind,
        metadata: { name },
    })
    if (labels) {
        response.promise
            .then((project) => {
                const metadata = { ...project.metadata, labels }
                return replaceResource<Namespace, Namespace>({
                    apiVersion: NamespaceApiVersion,
                    kind: NamespaceKind,
                    metadata,
                })
            })
            .catch(() => {
                return undefined // ignore; namespace already existed or error creating namespace
            })
    }
    return response
}

export function listProjects() {
    return listResources<Project>({
        apiVersion: ProjectApiVersion,
        kind: ProjectKind,
    })
}
