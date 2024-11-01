/* Copyright Contributors to the Open Cluster Management project */

interface OwnerReference {
  apiVersion: string
  blockOwnerDeletion?: boolean
  controller?: boolean
  kind: string
  name: string
  uid?: string
}
export interface IResource {
  kind: string
  apiVersion: string
  metadata?: {
    name: string
    namespace?: string
    resourceVersion?: string
    managedFields?: unknown
    selfLink?: string
    uid?: string
    labels?: Record<string, string>
    annotations?: Record<string, string>
    ownerReferences?: OwnerReference[]
    creationTimestamp?: string | number | Date
  }
}

export type Cluster = {
  name: string
  kubeApiServer?: string
}
export interface ClusterDeployment extends IResource {
  spec?: {
    // from ClusterDeployment
    baseDomain?: string
    clusterName?: string
    clusterInstallRef?: {
      group: string
      kind: string
      version: string
      name: string
    }
  }
  status?: {
    // from ClusterDeployment
    apiURL?: string
  }
}
export interface ManagedClusterInfo extends IResource {
  spec?: {
    masterEndpoint: string
  }
}
