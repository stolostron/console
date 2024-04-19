/* Copyright Contributors to the Open Cluster Management project */
import { createResource } from './utils/resource-request'
import { IResource, IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const KlusterletAddonConfigApiVersion = 'agent.open-cluster-management.io/v1'
export type KlusterletAddonConfigApiVersionType = 'agent.open-cluster-management.io/v1'

export const KlusterletAddonConfigKind = 'KlusterletAddonConfig'
export type KlusterletAddonConfigKindType = 'KlusterletAddonConfig'

export const KlusterletAddonConfigDefinition: IResourceDefinition = {
  apiVersion: KlusterletAddonConfigApiVersion,
  kind: KlusterletAddonConfigKind,
}

export interface KlusterletAddonConfig extends IResource {
  apiVersion: KlusterletAddonConfigApiVersionType
  kind: KlusterletAddonConfigKindType
  metadata: Metadata
  spec: {
    clusterName: string
    clusterNamespace: string
    clusterLabels: Record<string, string>
    applicationManager: { enabled: boolean }
    policyController: { enabled: boolean }
    searchCollector: { enabled: boolean }
    certPolicyController: { enabled: boolean }
  }
}

export const createKlusterletAddonConfig = (data: {
  clusterName: string | undefined
  clusterLabels: Record<string, string>
}) => {
  if (!data.clusterName) throw new Error('Cluster name not set')
  return createResource<KlusterletAddonConfig>({
    apiVersion: KlusterletAddonConfigApiVersion,
    kind: KlusterletAddonConfigKind,
    metadata: { name: data.clusterName, namespace: data.clusterName },
    spec: {
      clusterName: data.clusterName,
      clusterNamespace: data.clusterName,
      clusterLabels: { ...data.clusterLabels },
      applicationManager: { enabled: true },
      policyController: { enabled: true },
      searchCollector: { enabled: true },
      certPolicyController: { enabled: true },
    },
  })
}
