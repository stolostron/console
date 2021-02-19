import { V1ObjectMeta } from '@kubernetes/client-node'
import { IResource, IResourceDefinition } from './resource'
import { ClusterLabels } from './managed-cluster'
import { createResource } from '../lib/resource-request'

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
    metadata: V1ObjectMeta
    spec: {
        clusterName: string
        clusterNamespace: string
        clusterLabels: ClusterLabels
        applicationManager: { enabled: boolean; argocdCluster: boolean }
        policyController: { enabled: boolean }
        searchCollector: { enabled: boolean }
        certPolicyController: { enabled: boolean }
        iamPolicyController: { enabled: boolean }
        version: string
    }
}

export const createKlusterletAddonConfig = (data: {
    clusterName: string | undefined
    clusterLabels: ClusterLabels
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
            applicationManager: { enabled: true, argocdCluster: false },
            policyController: { enabled: true },
            searchCollector: { enabled: true },
            certPolicyController: { enabled: true },
            iamPolicyController: { enabled: true },
            version: '2.2.0',
        },
    })
}
