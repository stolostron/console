import { V1ObjectMeta } from '@kubernetes/client-node'
import { resourceMethods } from '../../lib/Resource'

export interface ClusterDeployment {
    apiVersion: string
    kind: 'ClusterDeployment'
    metadata: V1ObjectMeta
    spec: {
        clusterName: string
        baseDomain: string
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
        apiURL: string
        cliImage: string
        clusterVersionStatus: {
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
        conditions: {
            lastProbeTime: string
            lastTransitionTime: string
            message: string
            reason: string
            status: string
            type: string
        }[]
        installedTimestamp: string
        installerImage: string
        provisionRef: {
            name: string
        }
        webConsoleURL: string
    }
}

export const clusterDeploymentMethods = resourceMethods<ClusterDeployment>({
    path: '/apis/hive.openshift.io/v1',
    plural: 'clusterdeployments',
})
