/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
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
    strongswan = 'strongswan',
    wireguard = 'wireguard',
}

export interface SubmarinerConfig extends IResource {
    apiVersion: SubmarinerConfigApiVersionType
    kind: SubmarinerConfigKindType
    metadata: V1ObjectMeta
    spec: {
        IPSecIKEPort?: number
        IPSecNATTPort?: number
        cableDriver?: CableDriver
        credentialsSecret?: {
            name: string
        }
        gatewayConfig?: {
            aws?: {
                instanceType: string
            }
            gateways?: number
        }
    }
}

type SubmarinerConfigDefaults = {
    ikePort: number
    nattPort: number
    cableDriver: CableDriver
    gateways: number
    awsInstanceType: string
}

export const submarinerConfigDefault: SubmarinerConfigDefaults = {
    ikePort: 500,
    nattPort: 4500,
    cableDriver: CableDriver.libreswan,
    gateways: 1,
    awsInstanceType: 'm5n.large',
}
