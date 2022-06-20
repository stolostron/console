/* Copyright Contributors to the Open Cluster Management project */
import { IResourceDefinition } from './resource'

export const HostedClusterApiVersion = 'hypershift.openshift.io/v1alpha1'
export type HostedClusterApiVersionType = 'hypershift.openshift.io/v1alpha1'

export const HostedClusterKind = 'HostedCluster'
export type HostedClusterKindType = 'HostedCluster'

export const HostedClusterDefinition: IResourceDefinition = {
    apiVersion: HostedClusterApiVersion,
    kind: HostedClusterKind,
}
