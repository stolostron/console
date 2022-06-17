/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const KustomizationApiVersion = 'kustomize.toolkit.fluxcd.io/v1beta2'
export type KustomizationApiVersionType = 'kustomize.toolkit.fluxcd.io/v1beta2'

export const KustomizationKind = 'Kustomization'
export type KustomizationKindType = 'Kustomization'

export const KustomizationDefinition: IResourceDefinition = {
    apiVersion: KustomizationApiVersion,
    kind: KustomizationKind,
}

export interface Kustomization extends IResource {
    apiVersion: KustomizationApiVersionType
    kind: KustomizationKindType
    metadata: Metadata
}
