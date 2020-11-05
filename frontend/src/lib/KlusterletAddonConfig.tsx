import { V1ObjectMeta } from '@kubernetes/client-node'
import { ClusterLabels } from './ManagedCluster'
import { IResource, resourceMethods } from './Resource'

export interface KlusterletAddonConfig extends IResource {
    apiVersion: 'agent.open-cluster-management.io/v1'
    kind: 'KlusterletAddonConfig'
    metadata: V1ObjectMeta
    spec: {
        clusterName: string
        clusterNamespace: string
        clusterLabels: ClusterLabels
        applicationManager: { enabled: boolean }
        policyController: { enabled: boolean }
        searchCollector: { enabled: boolean }
        certPolicyController: { enabled: boolean }
        iamPolicyController: { enabled: boolean }
        version: string
    }
}

export const klusterletAddonConfigMethodss = resourceMethods<KlusterletAddonConfig>({
    path: '/apis/agent.open-cluster-management.io/v1',
    plural: 'klusterletaddonconfigs',
})

export const createKlusterletAddonConfig = (data: {
    clusterName: string | undefined
    clusterLabels: ClusterLabels
}) => {
    if (!data.clusterName) throw new Error('Cluster name not set')
    return klusterletAddonConfigMethodss.create({
        apiVersion: 'agent.open-cluster-management.io/v1',
        kind: 'KlusterletAddonConfig',
        metadata: { name: data.clusterName, namespace: data.clusterName },
        spec: {
            clusterName: data.clusterName,
            clusterNamespace: data.clusterName,
            clusterLabels: { ...data.clusterLabels },
            applicationManager: { enabled: true },
            policyController: { enabled: true },
            searchCollector: { enabled: true },
            certPolicyController: { enabled: true },
            iamPolicyController: { enabled: true },
            version: '2.1.0',
        },
    })
}
