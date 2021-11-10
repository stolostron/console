/* Copyright Contributors to the Open Cluster Management project */
import { listResources } from './utils/resource-request'
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const GitOpsClusterApiVersion = 'apps.open-cluster-management.io/v1beta1'
export type GitOpsClusterApiVersionType = 'apps.open-cluster-management.io/v1beta1'

export const GitOpsClusterKind = 'GitOpsCluster'
export type GitOpsClusterKindType = 'GitOpsCluster'

export const GitopsClusterDefinition: IResourceDefinition = {
    apiVersion: GitOpsClusterApiVersion,
    kind: GitOpsClusterKind,
}

export interface GitOpsCluster extends IResource {
    apiVersion: GitOpsClusterApiVersionType
    kind: GitOpsClusterKindType
    metadata: Metadata
    spec?: {
        argoServer?: {
            argoNamespace: string
            cluster?: string
        }
    }
}

export function listGitOpsClusters() {
    return listResources<GitOpsCluster>({
        apiVersion: GitOpsClusterApiVersion,
        kind: GitOpsClusterKind,
    })
}