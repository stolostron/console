/* Copyright Contributors to the Open Cluster Management project */
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const ROSAControlPlaneApiVersion = 'controlplane.cluster.x-k8s.io/v1beta2'
export type ROSAControlPlaneApiVersionType = 'controlplane.cluster.x-k8s.io/v1beta2'

export const ROSAControlPlaneKind = 'ROSAControlPlane'
export type ROSAControlPlaneKindType = 'ROSAControlPlane'

export const ROSAControlPlaneDefinition: IResourceDefinition = {
  apiVersion: ROSAControlPlaneApiVersion,
  kind: ROSAControlPlaneKind,
}

export interface ROSAControlPlane extends IResource {
  apiVersion: ROSAControlPlaneApiVersionType
  kind: ROSAControlPlaneKindType
  metadata: Metadata
  spec?: {
    rosaClusterName?: string
    version?: string
    versionGate?: 'Acknowledge' | 'WaitForAcknowledge' | 'AlwaysAcknowledge'
    channel?: string
    channelGroup?: string
    region?: string
    domainPrefix?: string
    billingAccount?: string
    deleteProtection?: 'Enabled' | 'Disabled'
    endpointAccess?: 'Public' | 'Private'
    fips?: 'Enabled' | 'Disabled'
    installerRoleARN?: string
    supportRoleARN?: string
    workerRoleARN?: string
    trustPolicyExternalID?: string
    oidcID?: string
    rosaRoleConfigRef?: { name?: string }
    rosaNetworkRef?: { name?: string }
    autoNode?: {
      mode?: 'Enabled' | 'Disabled'
      roleARN?: string
    }
    network?: {
      machineCIDR?: string
      serviceCIDR?: string
      podCIDR?: string
      hostPrefix?: number
      networkType?: 'OVNKubernetes' | 'Other'
    }
    availabilityZones?: string[]
    subnets?: string[]
    rolesRef?: {
      controlPlaneOperatorARN?: string
      imageRegistryARN?: string
      ingressARN?: string
      kmsProviderARN?: string
      kubeCloudControllerARN?: string
      networkARN?: string
      nodePoolManagementARN?: string
      storageARN?: string
    }
    defaultMachinePoolSpec?: {
      instanceType?: string
      volumeSize?: number
      autoscaling?: { minReplicas?: number; maxReplicas?: number }
    }
    etcdEncryptionKMSARN?: string
    additionalTags?: Record<string, string>
    credentialsSecretRef?: { name?: string }
  }
  status?: {
    ready?: boolean
    id?: string
    consoleURL?: string
    version?: string
    oidcEndpointURL?: string
    availableChannels?: string[]
    availableUpgrades?: string[]
    conditions?: {
      type: string
      status: string
      lastTransitionTime: string
      reason?: string
      message?: string
      severity?: string
    }[]
  }
}
