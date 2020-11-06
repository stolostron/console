export type ClusterCuratorApi = 'TODO'
export type ClusterCuratorKind = 'ClusterCurator'
export type ClusterCuratorPlural = 'clustercurators'

export interface ClusterCurator {
    api: ClusterCuratorApi
    kind: ClusterCuratorKind
    metadata: {
        name: string
        namespace: string
    }
    spec: {
        job: {
            name: string // job name
            image: string // job name
            values: {
                baseDomain: string
                imageSetName: string
                providerConnectionName: string
            }
            providerConnectionName: string
            providerConnectionNamespace: string
            region: string
            networking: {
                networkType: string
                clusterCidr: string
                machineCidr: string
                serviceCidr: string
                hostPrefix: string
            }
            aws: {
                controlPlane: {
                    zones: string
                    instanceType: string
                    storage: number
                    iops: number // OPTIONAL DEFAULT: 100
                    type: string // OPTIONAL DEFAULT: gp2
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
