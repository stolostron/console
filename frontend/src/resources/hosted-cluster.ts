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
    infrastructureAvailabilityPolicy: string
    platform: {
      type: string
      kubevirt: {
        baseDomainPassthrough: boolean
        credentials?: {
          infraKubeConfigSecret: {
            name: string
            key: string
          }
          infraNamespace: string
        }
        storageDriver?: {
          type?: 'None' | 'Default' | 'Manual'
          manual?: {
            storageClassMapping?: {
              infraStorageClassName: string
              guestStorageClassName: string
              group?: string
            }[]
            volumeSnapshotClassMapping?: {
              infraVolumeSnapshotClassName: string
              guestVolumeSnapshotClassName: string
              group?: string
            }[]
          }
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

type OwnerReference = {
  name: string
  kind: string
  uid: string
  apiVersion: string
  controller?: boolean
  blockOwnerDeletion?: boolean
}
type ObjectMetadata = {
  annotations?: {
    [key: string]: string
  }
  clusterName?: string
  creationTimestamp?: string
  deletionGracePeriodSeconds?: number
  deletionTimestamp?: string
  finalizers?: string[]
  generateName?: string
  generation?: number
  labels?: {
    [key: string]: string
  }
  managedFields?: any[]
  name?: string
  namespace?: string
  ownerReferences?: OwnerReference[]
  resourceVersion?: string
  uid?: string
}

type K8sResourceCommon = {
  apiVersion?: string
  kind?: string
  metadata?: ObjectMetadata
}
type StatusCondition<ConditionType> = {
  lastTransitionTime: string
  observedGeneration?: number
  message?: string
  reason?: string
  status: 'True' | 'False' | 'Unknown'
  type: ConditionType
}

export type HostedClusterK8sResource = K8sResourceCommon & {
  spec: {
    autoscaling?: {
      maxNodeProvisionTime?: string
      maxNodesTotal?: number
      maxPodGracePeriod?: number
      podPriorityThreshold?: number
    }
    clusterID?: string
    controllerAvailabilityPolicy?: string
    dns: {
      baseDomain: string
      privateZoneID?: string
      publicZoneID?: string
    }
    etcd?: {
      managementType: 'Managed' | 'Unmanaged'
      managed?: Record<string, unknown>
      unmanaged?: Record<string, unknown>
    }
    networking?: {
      apiServer?: {
        advertiseAddress?: string
        allowedCIDRBlocks?: string
        port?: number
      }
      clusterNetwork?: {
        cidr: string
        hostPrefix?: number
      }[]
      machineCIDR?: string
      machineNetwork?: {
        cidr: string
      }[]
      networkType: 'OpenShiftSDN' | 'Calico' | 'OVNKubernetes' | 'Other'
      podCIDR?: string
      serviceCIDR?: string
      serviceNetwork?: {
        cidr: string
      }[]
    }
    fips?: boolean
    infraID?: string
    infrastructureAvailabilityPolicy?: string
    issuerURL?: string
    olmCatalogPlacement?: 'management' | 'guest'
    release: {
      image: string
    }
    secretEncryption?: Record<string, unknown>
    services: {
      service: 'APIServer' | 'OAuthServer' | 'OIDC' | 'Konnectivity' | 'Ignition' | 'OVNSbDb'
      servicePublishingStrategy: {
        loadBalancer?: {
          hostname?: string
        }
        nodePort?: {
          address: string
          port?: number
        }
        route?: {
          hostname?: string
        }
        type: 'LoadBalancer' | 'NodePort' | 'Route' | 'None' | 'S3'
      }
    }[]
    platform: {
      agent?: {
        agentNamespace: string
      }
      aws?: {
        cloudProviderConfig: {
          subnet: {
            id: string
          }
          vpc: string
          zone: string
        }
        controlPlaneOperatorCreds: { name?: string }
        endpointAccess: 'Public'
        kubeCloudControllerCreds: { name?: string }
        nodePoolManagementCreds: { name?: string }
        region: 'us-west-2'
        resourceTags: [
          {
            key: 'kubernetes.io/cluster/feng-hs-scale-74zxh'
            value: 'owned'
          },
        ]
      }
      powervs?: Record<string, unknown>
      azure?: Record<string, unknown>
      type?: 'AWS' | 'None' | 'IBMCloud' | 'Agent' | 'KubeVirt' | 'Azure' | 'PowerVS'
    }
    sshKey: {
      name: string
    }
    pullSecret: {
      name: string
    }
  }
  status?: {
    conditions?: StatusCondition<string>[]
    kubeconfig?: {
      name: string
    }
    customkubeconfig?: {
      name: string
    }
    kubeadminPassword?: {
      name: string
    }
    ignitionEndpoint?: string
    oauthCallbackURLTemplate?: string
    version?: {
      desired: {
        image: string
      }
      history: {
        acceptedRisks?: string
        completionTime: string
        image: string
        startedTime: string
        state: string
        verified: boolean
        version?: string
      }[]
      observedGeneration: number
    }
  }
}
