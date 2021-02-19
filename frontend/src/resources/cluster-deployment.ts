import { V1CustomResourceDefinitionCondition, V1ObjectMeta } from '@kubernetes/client-node'
import { getResource, listResources } from '../lib/resource-request'

export const ClusterDeploymentApiVersion = 'hive.openshift.io/v1'
export type ClusterDeploymentApiVersionType = 'hive.openshift.io/v1'

export const ClusterDeploymentKind = 'ClusterDeployment'
export type ClusterDeploymentKindType = 'ClusterDeployment'

export interface ClusterDeployment {
    apiVersion: ClusterDeploymentApiVersionType
    kind: ClusterDeploymentKindType
    metadata: V1ObjectMeta
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
        }
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
        pullSecretRef: {
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
        provisionRef?: {
            name: string
        }
        webConsoleURL?: string
    }
}

export function listClusterDeployments() {
    return listResources<ClusterDeployment>(
        {
            apiVersion: ClusterDeploymentApiVersion,
            kind: ClusterDeploymentKind,
        },
        undefined,
        { managedNamespacesOnly: '' }
    )
}

export function getClusterDeployment(namespace: string, name: string) {
    return getResource<ClusterDeployment>({
        apiVersion: ClusterDeploymentApiVersion,
        kind: ClusterDeploymentKind,
        metadata: { name, namespace },
    })
}
