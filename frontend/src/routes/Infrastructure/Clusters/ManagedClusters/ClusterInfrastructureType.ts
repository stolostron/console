/* Copyright Contributors to the Open Cluster Management project */
import { NavigationPath } from '../../../../NavigationPath'
import { Provider } from '../../../../ui-components'
import { CredentialsType } from '../../../Credentials/CredentialsType'

export enum HostInventoryInfrastructureType {
  CIMHypershift = 'cimhypershift',
  CIM = 'cim',
  AI = 'ai',
  NutanixAI = 'nutanix-ai',
  NutanixCIM = 'nutanix-cim',
}

const clusterInfrastructureTypes = [
  Provider.aws,
  Provider.awss3,
  Provider.azure,
  Provider.gcp,
  Provider.kubevirt,
  Provider.vmware,
  Provider.openstack,
  Provider.redhatvirtualization,
  HostInventoryInfrastructureType.CIMHypershift,
  HostInventoryInfrastructureType.CIM,
  HostInventoryInfrastructureType.AI,
  HostInventoryInfrastructureType.NutanixCIM,
  HostInventoryInfrastructureType.NutanixAI,
] as const

export type ClusterInfrastructureType = typeof clusterInfrastructureTypes[number]

export const isClusterInfrastructureType = (
  infrastructureType: string
): infrastructureType is ClusterInfrastructureType =>
  (clusterInfrastructureTypes as unknown as string[]).includes(infrastructureType)

export const getCredentialsTypeForClusterInfrastructureType = (
  infrastructureType: ClusterInfrastructureType
): CredentialsType => {
  if (
    [HostInventoryInfrastructureType.NutanixAI, HostInventoryInfrastructureType.NutanixCIM].includes(
      infrastructureType as any
    )
  ) {
    return Provider.nutanix
  }
  if (
    [
      HostInventoryInfrastructureType.AI,
      HostInventoryInfrastructureType.CIM,
      HostInventoryInfrastructureType.CIMHypershift,
    ].includes(infrastructureType as any)
  ) {
    return Provider.hostinventory
  }
  return infrastructureType as CredentialsType
}

export const CLUSTER_INFRA_TYPE_PARAM = 'type'

export const getTypedCreateClusterPath = (infrastructureType: ClusterInfrastructureType) => {
  return {
    pathname: NavigationPath.createCluster,
    search: `?${CLUSTER_INFRA_TYPE_PARAM}=${infrastructureType}`,
  }
}
