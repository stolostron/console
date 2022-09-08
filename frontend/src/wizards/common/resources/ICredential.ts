/* Copyright Contributors to the Open Cluster Management project */
import { IResource } from './IResource'

export const ClusterSetBindingApiGroup = 'cluster.open-cluster-management.io'
export const ClusterSetBindingApiVersion = `${ClusterSetBindingApiGroup}/v1beta1`
export const ClusterSetBindingKind = 'ManagedClusterSetBinding'
export const ClusterSetBindingType = { apiVersion: ClusterSetBindingApiVersion, kind: ClusterSetBindingKind }

export type ICredential = IResource
