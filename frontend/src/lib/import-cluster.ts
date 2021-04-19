/* Copyright Contributors to the Open Cluster Management project */

import { createManagedCluster } from '../resources/managed-cluster'
import { createKlusterletAddonConfig } from '../resources/klusterlet-add-on-config'
import { managedClusterSetLabel } from '../resources/managed-cluster-set'

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
