/* Copyright Contributors to the Open Cluster Management project */
export interface ISearchResource {
  _uid?: string
  _hostingResource?: string
  _relatedUids?: string[]
  _hostingSubscription?: boolean
  apigroup: string
  apiversion: string
  kind: string
  name: string
  namespace: string
  cluster: string
  label?: string
  created: string
  applicationSet?: string
  type?: string
  status?: string
  current?: string
  desired?: string
  available?: string
  ready?: string
  healthStatus?: string
  syncStatus?: string
  deployments?: ISearchResource[]
}

export type SearchResult = {
  items: ISearchResource[]
  related: {
    kind: string
    items: ISearchResource[]
  }[]
}

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
  consoleUrl?: string
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
  status: {
    webConsoleURL?: string
    // from ClusterDeployment
    apiURL?: string
    cluster?: string
  }
}
export interface ManagedCluster extends IResource {
  status: {
    clusterClaims: {
      name: string
      value: string
    }[]
  }
}
export interface ManagedClusterInfo extends IResource {
  spec?: {
    masterEndpoint: string
  }
  status: {
    consoleURL?: string
  }
}
export interface HostedClusterK8sResource extends IResource {
  spec?: {
    masterEndpoint: string
    dns: {
      baseDomain: string
    }
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
    source?: {
      path?: string
      repoURL: string
      targetRevision?: string
      chart?: string
    }
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

export interface Selector {
  matchLabels?: Record<string, string>
}
export interface IApplicationSet extends IResource {
  apiVersion: ApplicationSetApiVersionType
  kind: ApplicationSetKindType
  spec: {
    template?: {
      spec?: {
        destination?: {
          namespace: string
          server: string
        }
        project: string
        source?: {
          path?: string
          repoURL: string
          targetRevision?: string
          chart?: string
        }
        sources?: {
          path?: string
          repoURL: string
          targetRevision?: string
          chart?: string
          repositoryType?: string
        }[]
      }
    }
    generators?: {
      clusterDecisionResource?: {
        labelSelector?: Selector
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
export interface IService extends IResource {
  spec?: {
    ports?: {
      port: number
    }[]
  }
}
