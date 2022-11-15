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

export interface SubmarinerConfig extends IResource {
    apiVersion: SubmarinerConfigApiVersionType
    kind: SubmarinerConfigKindType
    metadata: Metadata
    spec: {
        IPSecNATTPort?: number
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
    }
}

type SubmarinerConfigDefaults = {
    nattPort: number
    nattEnable: boolean
    cableDriver: CableDriver
    gateways: number
    awsInstanceType: string
    azureInstanceType: string
    openStackInstanceType: string
}

export const submarinerConfigDefault: SubmarinerConfigDefaults = {
    nattPort: 4500,
    nattEnable: true,
    cableDriver: CableDriver.libreswan,
    gateways: 1,
    awsInstanceType: 'c5d.large',
    azureInstanceType: 'Standard_F4s_v2',
    openStackInstanceType: 'PnTAE.CPU_4_Memory_8192_Disk_50',
}
