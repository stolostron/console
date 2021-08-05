/* Copyright Contributors to the Open Cluster Management project */

import {
    createKlusterletAddonConfig,
    createManagedCluster,
    managedClusterSetLabel,
} from '@open-cluster-management/resources'

export const createImportResources = (clusterName: string, clusterSet?: string) => {
    const clusterLabels: Record<string, string> = {
        cloud: 'auto-detect',
        vendor: 'auto-detect',
        name: clusterName,
    }
    if (clusterSet) {
        clusterLabels[managedClusterSetLabel] = clusterSet
    }
    return {
        promise: new Promise(async (resolve, reject) => {
            try {
                const managedCluster = await createManagedCluster({ clusterName, clusterLabels }).promise
                await createKlusterletAddonConfig({ clusterName, clusterLabels }).promise
                resolve(managedCluster)
            } catch (err) {
                reject(err)
            }
        }),
        abort: () => {},
    }
}
