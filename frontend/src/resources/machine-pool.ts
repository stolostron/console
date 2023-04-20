/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
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
  metadata: Metadata
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
        rootVolume?: {
          size: number
          type: string
        }
      }
      ovirt?: {
        cpu?: {}
        memoryMB?: number
        osDisk?: {
          sizeGB: number
        }
        vmType?: '' | 'desktop' | 'server' | 'high_performance'
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
      readyReplicas?: number
    }[]
    replicas: number
  }
}

export function getReadyReplicas(machinePool: MachinePool): number {
  const machineSets = machinePool.status?.machineSets || []
  return machineSets.reduce((sum, machineSet) => sum + (machineSet.readyReplicas || 0), 0)
}
