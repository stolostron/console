/* Copyright Contributors to the Open Cluster Management project */

import { V1ObjectMeta } from '@kubernetes/client-node/dist/gen/model/v1ObjectMeta'
import { IResourceDefinition } from './resource'

export const MachinePoolApiVersion = 'hive.openshift.io/v1'
export type MachinePoolApiVersionType = 'hive.openshift.io/v1'

export const MachinePoolKind = 'MachinePool'
export type MachinePoolKindType = 'MachinePool'

export const MachinePoolDefinition: IResourceDefinition = {
    apiVersion: MachinePoolApiVersion,
    kind: MachinePoolKind,
}

export interface MachinePool {
    apiVersion: MachinePoolApiVersionType
    kind: MachinePoolKindType
    metadata: V1ObjectMeta
    spec?: {
        clusterDeploymentRef: {
            name: string
        }
        name: string
        platform: {
            aws?: {
                rootVolume: {
                    iops: number
                    size: number
                    type: string
                }
                type: string
            }
            gcp?: {
                type: string
            }
            azure?: {
                osDisk: {
                    diskSizeGB: number
                }
                type: string
                zone: string[]
            }
            vsphere?: {
                cpus: number
                coresPerSocket: number
                memoryMB: number
                osDisk: {
                    diskSizeGB: number
                }
            }
            openstack?: {
                flavor: string
            }
        }
        autoscaling?: {
            minReplicas: number
            maxReplicas: number
        }
        replicas?: number
    }
    status?: {
        machineSets?: {
            maxReplicas: number
            minReplicas: number
            name: string
            replicas: number
        }[]
        replicas: number
    }
}
