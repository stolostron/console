/* Copyright Contributors to the Open Cluster Management project */

import { createManagedCluster } from '../resources/managed-cluster'
import { createKlusterletAddonConfig } from '../resources/klusterlet-add-on-config'
import { managedClusterSetLabel } from '../resources/managed-cluster-set'
import { Cluster } from './get-cluster'

export const createImportResources = (cluster: Cluster) => {
    const clusterLabels: Record<string, string> = {
        cloud: 'auto-detect',
        vendor: 'auto-detect',
        name: cluster.name ?? '',
    }
    if (cluster.clusterSet) {
        clusterLabels[managedClusterSetLabel] = cluster.clusterSet
    }
    return {
        promise: new Promise(async (resolve, reject) => {
            try {
                const managedCluster = await createManagedCluster({ clusterName: cluster.name, clusterLabels }).promise
                await createKlusterletAddonConfig({ clusterName: cluster.name, clusterLabels }).promise
                resolve(managedCluster)
            } catch (err) {
                reject(err)
            }
        }),
        abort: () => {},
    }
}
