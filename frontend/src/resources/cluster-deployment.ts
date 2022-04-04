/* Copyright Contributors to the Open Cluster Management project */
import { V1CustomResourceDefinitionCondition } from '@kubernetes/client-node/dist/gen/model/v1CustomResourceDefinitionCondition'
import { Metadata } from './metadata'
import { IResourceDefinition } from './resource'
import { Selector } from './selector'

export const ClusterDeploymentApiVersion = 'hive.openshift.io/v1'
export type ClusterDeploymentApiVersionType = 'hive.openshift.io/v1'

export const ClusterDeploymentKind = 'ClusterDeployment'
export type ClusterDeploymentKindType = 'ClusterDeployment'

export const ClusterDeploymentDefinition: IResourceDefinition = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
}

export interface ClusterDeployment {
    apiVersion: ClusterDeploymentApiVersionType
    kind: ClusterDeploymentKindType
    metadata: Metadata
    spec?: {
        clusterName: string
        baseDomain?: string
        installed: boolean
        clusterMetadata?: {
            adminKubeconfigSecretRef: {
                name: string
            }
            adminPasswordSecretRef: {
                name: string
            }
            clusterID: string
            infraID: string
        }
        platform?: {
            aws?: {
                credentialsSecretRef: {
                    name: string
                }
                region: string
            }
            agentBareMetal?: {
                agentSelector?: Selector
            }
        }
        powerState?: 'Running' | 'Hibernating'
        provisioning: {
            imageSetRef: {
                name: string
            }
            installConfigSecretRef: {
                name: string
            }
            sshPrivateKeySecretRef: {
                name: string
            }
        }
        clusterPoolRef?: {
            claimName?: string
            namespace: string
            poolName: string
        }
        pullSecretRef: {
            name: string
        }
        clusterInstallRef?: {
            group: string
            kind: string
            version: string
            name: string
        }
    }
    status?: {
        apiURL?: string
        cliImage: string
        clusterVersionStatus?: {
            availableUpdates: {
                force: boolean
                image: string
                version: string
            }[]
            conditions: {
                lastTransitionTime: string
                message: string
                status: string
                type: string
            }[]
            desired: {
                force: boolean
                image: string
                version: string
            }
            history: {
                completionTime: string
                image: string
                startedTime: string
                state: string
                verified: boolean
                version: string
            }[]
            observedGeneration: number
            versionHash: string
        }
        conditions: V1CustomResourceDefinitionCondition[]
        installedTimestamp?: string
        installerImage: string
        powerState: string
        provisionRef?: {
            name: string
        }
        webConsoleURL?: string
        installVersion?: string
    }
}
