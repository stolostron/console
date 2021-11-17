/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { createResource, replaceResource } from './utils/resource-request'
import { IResource, IResourceDefinition } from './resource'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '.'

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

export const createProject = (name: string | undefined, labels?: V1ObjectMeta['labels']) => {
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
