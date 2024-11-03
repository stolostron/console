/* Copyright Contributors to the Open Cluster Management project */
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const HostedClusterApiVersion = 'hypershift.openshift.io/v1beta1'
export type HostedClusterApiVersionType = 'hypershift.openshift.io/v1beta1'

export const HostedClusterKind = 'HostedCluster'
export type HostedClusterKindType = 'HostedCluster'

export const HostedClusterDefinition: IResourceDefinition = {
  apiVersion: HostedClusterApiVersion,
  kind: HostedClusterKind,
}

export interface HostedCluster extends IResource {
  apiVersion: HostedClusterApiVersionType
  kind: HostedClusterKindType
  metadata: Metadata & {
    labels?: Record<string, string>
  }
  spec?: {
    etcd: {
      managed: {
        storage: {
          persistentVolume: {
            size: string
          }
          type: string
        }
      }
      managementType: string
    }
    release: {
      image: string
    }
    pullSecret: {
      name: string
    }
    sshKey: {
      name: string
    }
    networking: {
      clusterNetwork: {
        cidr: string
      }[]
      serviceNetwork: {
        cidr: string
      }[]
      networkType: string
    }
    controllerAvailabilityPolicy: string
    platform: {
      type: string
      kubevirt: {
        baseDomainPassthrough: boolean
        credentials: {
          infraKubeConfigSecret: {
            name: string
            key: string
          }
          infraNamespace: string
        }
      }
    }
    infraID: string
    services: {
      service: string
      servicePublishingStrategy: {
        type: string
      }
    }[]
  }
}
