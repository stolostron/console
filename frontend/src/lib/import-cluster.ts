/* Copyright Contributors to the Open Cluster Management project */

import { createManagedCluster } from '../resources/managed-cluster'
import { createKlusterletAddonConfig } from '../resources/klusterlet-add-on-config'
import { Cluster } from './get-cluster'
import { IRequestResult } from './resource-request'

export const createImportResources = (cluster: Cluster) => {
    const clusterLabels = {
        cloud: 'auto-detect',
        vendor: 'auto-detect',
        name: cluster.name ?? '',
    }
    const results: IRequestResult[] = [
        createManagedCluster({ clusterName: cluster.name, clusterLabels }),
        createKlusterletAddonConfig({ clusterName: cluster.name, clusterLabels }),
    ]
    return {
        promise: Promise.allSettled(results.map((result) => result.promise)),
        abort: () => results.forEach((result) => result.abort()),
    }
}
