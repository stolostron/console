import { createManagedCluster } from '../resources/managed-cluster'
import { createKlusterletAddonConfig } from '../resources/klusterlet-add-on-config'
import { ResourceError, IRequestResult } from './resource-request'
import { Cluster } from './get-cluster'

export const createImportResources = (cluster: Cluster) => {
    const clusterLabels = {
        cloud: 'auto-detect',
        vendor: 'auto-detect',
        name: cluster.name ?? '',
    }
    const calls = [
        createManagedCluster({ clusterName: cluster.name, clusterLabels }),
        createKlusterletAddonConfig({ clusterName: cluster.name, clusterLabels }),
    ]
    const attachClusterResult: IRequestResult<PromiseSettledResult<unknown>[]> = {
        promise: Promise.allSettled(calls.map((result) => result.promise)),
        abort: () => calls.forEach((call) => call.abort()),
    }
    return {
        promise: new Promise((resolve, reject) => {
            attachClusterResult.promise.then((result) => {
                if (result.every((res) => res.status !== 'rejected')) {
                    resolve(result)
                } else {
                    const mcResult = result[0] as PromiseRejectedResult
                    const kacResult = result[1] as PromiseRejectedResult
                    if (mcResult.status === 'rejected' || kacResult.status === 'rejected') {
                        const error = mcResult.reason ?? kacResult.reason
                        if (error instanceof ResourceError) {
                            reject(mcResult.reason)
                        }
                    }
                }
            })
        }),
        abort: attachClusterResult.abort,
    }
}
