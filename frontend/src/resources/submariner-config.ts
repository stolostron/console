/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const SubmarinerConfigApiVersion: SubmarinerConfigApiVersionType =
  'submarineraddon.open-cluster-management.io/v1alpha1'
export type SubmarinerConfigApiVersionType = 'submarineraddon.open-cluster-management.io/v1alpha1'

export const SubmarinerConfigKind: SubmarinerConfigKindType = 'SubmarinerConfig'
export type SubmarinerConfigKindType = 'SubmarinerConfig'

export const SubmarinerConfigDefinition: IResourceDefinition = {
  apiVersion: SubmarinerConfigApiVersion,
  kind: SubmarinerConfigKind,
}

export enum CableDriver {
  libreswan = 'libreswan',
  vxlan = 'vxlan',
}

export enum InstallPlanApproval {
  automatic = 'automatic',
  manual = 'manual',
}

export interface SubscriptionConfig {
  source: string
  sourceNamespace: string
  channel?: string
  startingCSV?: string
  installPlanApproval: InstallPlanApproval
}

export interface SubmarinerConfig extends IResource {
  apiVersion: SubmarinerConfigApiVersionType
  kind: SubmarinerConfigKindType
  metadata: Metadata
  spec: {
    IPSecNATTPort?: number
    airGappedDeployment?: boolean
    NATTEnable?: boolean
    cableDriver?: CableDriver
    credentialsSecret?: {
      name: string
    }
    gatewayConfig?: {
      aws?: {
        instanceType: string
      }
      gcp?: {
        instanceType: string
      }
      azure?: {
        instanceType: string
      }
      rhos?: {
        instanceType: string
      }
      gateways?: number
    }
    globalCIDR?: string
    loadBalancerEnable?: boolean
    subscriptionConfig?: SubscriptionConfig
  }
}

type SubmarinerConfigDefaults = {
  nattPort: number
  airGappedDeployment: boolean
  nattEnable: boolean
  cableDriver: CableDriver
  gateways: number
  awsInstanceType: string
  azureInstanceType: string
  openStackInstanceType: string
  loadBalancerEnable: boolean
  brokerGlobalnetCIDR: string
  source: string
  sourceNamespace: string
  installPlanApporval: InstallPlanApproval
}

export const submarinerConfigDefault: SubmarinerConfigDefaults = {
  nattPort: 4500,
  airGappedDeployment: false,
  nattEnable: true,
  cableDriver: CableDriver.libreswan,
  gateways: 1,
  awsInstanceType: 'c5d.large',
  azureInstanceType: 'Standard_F4s_v2',
  openStackInstanceType: 'PnTAE.CPU_4_Memory_8192_Disk_50',
  loadBalancerEnable: false,
  brokerGlobalnetCIDR: '242.0.0.0/8', //NOSONAR
  source: 'redhat-operators',
  sourceNamespace: 'openshift-marketplace',
  installPlanApporval: InstallPlanApproval.automatic,
}
