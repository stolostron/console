/* Copyright Contributors to the Open Cluster Management project */
import { Provider } from '../../../../ui-components'

const clusterPoolInfrastructureTypes = [Provider.aws, Provider.azure, Provider.gcp] as const

export type ClusterPoolInfrastructureType = typeof clusterPoolInfrastructureTypes[number]

export const isClusterPoolInfrastructureType = (
  infrastructureType: string
): infrastructureType is ClusterPoolInfrastructureType =>
  (clusterPoolInfrastructureTypes as unknown as string[]).includes(infrastructureType)

export const CLUSTER_POOL_INFRA_TYPE_PARAM = 'type'
