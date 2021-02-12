import { V1ObjectMeta, V1Pod } from '@kubernetes/client-node'
import { listNamespacedResources } from '../lib/resource-request'
import { IResource } from './resource'
import { getLatest } from '../lib/utils'
import { ClusterStatus } from '../lib/get-cluster'

export const PodApiVersion = 'v1'
export type PodApiVersionType = 'v1'

export const PodKind = 'Pod'
export type PodKindType = 'Pod'

export interface Pod extends V1Pod, IResource {
    apiVersion: PodApiVersionType
    kind: PodKindType
    metadata: V1ObjectMeta
}

export const PodListApiVersion = 'v1'
export type PodListApiVersionType = 'v1'

export const PodListKind = 'PodList'
export type PodListKindType = 'PodList'

export interface PodList extends IResource {
    apiVersion: PodListApiVersionType
    kind: PodListKindType
    items: V1Pod[]
}

export function listHivePods(namespace: string, labels?: string[]) {
    return listNamespacedResources<Pod>(
        {
            apiVersion: PodApiVersion,
            kind: PodKind,
            metadata: { namespace },
        },
        undefined,
        labels
    )
}

const getClusterDeploymentNameSelector = (name: string) => {
    return `hive.openshift.io/cluster-deployment-name=${name}`
}

export async function getProvisionPod(namespace: string, name: string) {
    const provisionJobSelector = 'hive.openshift.io/job-type=provision'
    const response = listHivePods(namespace, [getClusterDeploymentNameSelector(name), provisionJobSelector])
    return await response.promise.then((result) => {
        const latestProvisionJob = getLatest<Pod>(result, 'metadata.creationTimestamp')
        return latestProvisionJob
    })
}

export async function getDeprovisionPod(namespace: string, name: string) {
    const deprovisionJobSelector = `job-name=${name}-uninstall`
    const response = listHivePods(namespace, [getClusterDeploymentNameSelector(name), deprovisionJobSelector])
    return await response.promise.then((result) => {
        const latestDeprovisionJob = getLatest<Pod>(result, 'metadata.creationTimestamp')
        return latestDeprovisionJob
    })
}

export async function getLatestHivePod(namespace: string, name: string) {
    const response = listHivePods(namespace, [getClusterDeploymentNameSelector(name)])
    return await response.promise.then((result) => {
        const latestJob = getLatest<Pod>(result, 'metadata.creationTimestamp')
        return latestJob
    })
}

export async function getHivePod(namespace: string, name: string, status: string) {
    let hiveJob: Pod | undefined
    /* istanbul ignore else */
    if (status === ClusterStatus.creating) {
        hiveJob = await getProvisionPod(namespace, name)
    } else if (status === ClusterStatus.provisionfailed || status === ClusterStatus.deprovisionfailed) {
        hiveJob = await getLatestHivePod(namespace, name)
    } else if (status === ClusterStatus.destroying) {
        hiveJob = await getDeprovisionPod(namespace, name)
    }
    return hiveJob
}
