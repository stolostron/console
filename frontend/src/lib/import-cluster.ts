import { createManagedCluster } from '../resources/managed-cluster'
import { createKlusterletAddonConfig } from '../resources/klusterlet-add-on-config'
import { Cluster } from './get-cluster'

export const createImportResources = (cluster: Cluster) => {
    const clusterLabels = {
        cloud: 'auto-detect',
        vendor: 'auto-detect',
        name: cluster.name ?? '',
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
