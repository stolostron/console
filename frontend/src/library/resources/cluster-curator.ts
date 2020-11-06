export interface ClusterCurator {
    apiVersion: 'cluster.open-cluster-management.io/v1'
    kind: 'ClusterImageSet'
    metadata: {
        /** Cluster name*/
        name: string

        /** Cluster namespace*/
        namespace: string
    }
    spec: {
        job: {
            name: string // job name
            image: string // job name
            imageSetName: string
            providerConnection: {
                name: string
                namespace: string
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
                    zones: string
                    instanceType: string
                    storage: number
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
