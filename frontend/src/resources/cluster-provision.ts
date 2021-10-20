/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResourceDefinition } from './resource'

export const ClusterProvisionApiVersion = 'hive.openshift.io/v1'
export type ClusterProvisionApiVersionType = 'hive.openshift.io/v1'

export const ClusterProvisionKind = 'ClusterProvision'
export type ClusterProvisionKindType = 'ClusterProvision'

export const ClusterProvisionDefinition: IResourceDefinition = {
    apiVersion: ClusterProvisionApiVersion,
    kind: ClusterProvisionKind,
}

export interface ClusterProvision {
    apiVersion: ClusterProvisionApiVersionType
    kind: ClusterProvisionKindType
    metadata: Metadata
    spec?: {
        attempt: number
        clusterDeploymentRef: {
            name: string
        }
        installLog: string
    }
    status?: {
        conditions: {
            lastTransitionTime?: string
            message?: string
            reason?: string
            status: string
            type: string
        }[]
    }
}
