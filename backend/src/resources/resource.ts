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
export interface IUIResource extends IResource {
  uidata: {
    clusterList: string[]
    appSetRelatedResources: unknown
    appSetApps: string[]
  }
}

export type Cluster = {
  name: string
  kubeApiServer?: string
}
export interface IStatusResource extends IResource {
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
    cluster?: string
  }
}
export interface ManagedClusterInfo extends IResource {
  spec?: {
    masterEndpoint: string
  }
}

export interface IResourceDefinition {
  apiVersion: string
  kind: string
}
export interface IPlacementDecision extends IResource {
  status?: {
    decisions?: [{ clusterName: string }]
  }
}
export interface ISubscription extends IResource {
  spec?: {
    placement?: {
      placementRef?: {
        name: string
      }
    }
  }
  status?: {
    decisions?: [{ clusterName: string }]
  }
}

export const ApplicationApiVersion = 'app.k8s.io/v1beta1'
export type ApplicationApiVersionType = 'app.k8s.io/v1beta1'

export const ApplicationKind = 'Application'
export type ApplicationKindType = 'Application'

export const ApplicationDefinition: IResourceDefinition = {
  apiVersion: ApplicationApiVersion,
  kind: ApplicationKind,
}

export const ArgoApplicationApiVersion = 'argoproj.io/v1alpha1'
export type ArgoApplicationApiVersionType = 'argoproj.io/v1alpha1'

export const ArgoApplicationKind = 'Application'
export type ArgoApplicationKindType = 'Application'

export const ArgoApplicationDefinition: IResourceDefinition = {
  apiVersion: ArgoApplicationApiVersion,
  kind: ArgoApplicationKind,
}
export interface IArgoApplication extends IResource {
  cluster?: string
  spec: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any
    destination: {
      name?: string
      namespace: string
      server?: string
    }
  }
  status?: {
    cluster?: string
    decisions?: [{ clusterName: string }]
  }
}

export const ApplicationSetApiVersion = 'argoproj.io/v1alpha1'
export type ApplicationSetApiVersionType = 'argoproj.io/v1alpha1'

export const ApplicationSetKind = 'ApplicationSet'
export type ApplicationSetKindType = 'ApplicationSet'

export const ApplicationSetDefinition: IResourceDefinition = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationSetKind,
}
export interface IApplicationSet extends IResource {
  apiVersion: ApplicationSetApiVersionType
  kind: ApplicationSetKindType
  spec: {
    generators?: {
      clusterDecisionResource?: {
        configMapRef?: string
        requeueAfterSeconds?: number
      }
    }[]
  }
  transformed?: {
    clusterCount?: string
  }
}
export interface IOCPApplication extends IResource {
  label?: string
  status?: {
    cluster?: string
  }
}
