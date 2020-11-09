export const ClusterCuratorApiVersion = 'cluster.open-cluster-management.io/v1'
export type ClusterCuratorApiVersionType = 'cluster.open-cluster-management.io/v1'

export const ClusterCuratorKind = 'ClusterCurator'
export type ClusterCuratorKindType = 'ClusterCurator'

export interface ClusterCurator {
    apiVersion: ClusterCuratorApiVersionType
    kind: ClusterCuratorKindType
    metadata: {
        name: string
        namespace: string
    }
    spec: {
        action: string
        job: {
            name: string // job name
            image?: string // job name
            values: {
                providerConnection: string
                openshiftImage?: {
                    imageSetName: string
                    imageMirror?: string
                    additionalTrustBundle?: string
                }
                networking?: {
                    networkType?: string
                    clusterCidr?: string
                    machineCidr?: string
                    serviceCidr?: string
                    hostPrefix?: number
                }
                aws?: {
                    region: string
                    baseDomain: string
                    controlPlane: {
                        instanceType: string
                        zones?: string[]
                        storage?: number
                        iops?: number // OPTIONAL DEFAULT: 100
                        type?: string // OPTIONAL DEFAULT: gp2
                    }
                    workerPools: {
                        name: string
                        zones: string[]
                        instanceType: string
                        nodeCount: number
                        storage: number
                        iops: number // OPTIONAL DEFAULT: 100
                        type: string // OPTIONAL DEFAULT: gp2
                    }[]
                }
            }
        }
    }
}
