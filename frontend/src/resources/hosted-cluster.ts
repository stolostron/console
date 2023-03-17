/* Copyright Contributors to the Open Cluster Management project */
import { IResourceDefinition } from './resource'

export const HostedClusterApiVersion = 'hypershift.openshift.io/v1beta1'
export const HostedClusterKind = 'HostedCluster'

export const HostedClusterDefinition: IResourceDefinition = {
  apiVersion: HostedClusterApiVersion,
  kind: HostedClusterKind,
}
