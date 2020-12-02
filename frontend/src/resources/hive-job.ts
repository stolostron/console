import { V1ObjectMeta, V1Pod } from '@kubernetes/client-node'
import { listNamespacedResources } from '../lib/resource-request'
import { IResource } from './resource'
import { getLatest } from '../lib/utils'
import { ClusterStatus } from '../lib/get-cluster'

// Although titled HiveJob it will refer to the pod that the Hive job deploys

export const HiveJobApiVersion = 'v1'
export type HiveJobApiVersionType = 'v1'

export const HiveJobKind = 'Pod'
export type HiveJobKindType = 'Pod'

export interface HiveJob extends V1Pod, IResource {
    apiVersion: HiveJobApiVersionType
    kind: HiveJobKindType
    metadata: V1ObjectMeta
}

export function listHiveJobs(namespace: string, labels?: string[]) {
    return listNamespacedResources<HiveJob>(
        {
            apiVersion: HiveJobApiVersion,
            kind: HiveJobKind,
            metadata: { namespace },
        },
        undefined,
        labels
    )
}

const getClusterDeploymentNameSelector = (name: string) => {
    return `hive.openshift.io/cluster-deployment-name=${name}`
}

export async function getProvisionJob(namespace: string, name: string) {
    const provisionJobSelector = 'hive.openshift.io/job-type=provision'
    const response = listHiveJobs(namespace, [getClusterDeploymentNameSelector(name), provisionJobSelector])
    return await response.promise.then((result) => {
        const latestProvisionJob = getLatest<HiveJob>(result, 'metadata.creationTimestamp')
        return latestProvisionJob
    })
}

export async function getDeprovisionJob(namespace: string, name: string) {
    const deprovisionJobSelector = `job-name=${name}-uninstall`
    const response = listHiveJobs(namespace, [getClusterDeploymentNameSelector(name), deprovisionJobSelector])
    return await response.promise.then((result) => {
        const latestDeprovisionJob = getLatest<HiveJob>(result, 'metadata.creationTimestamp')
        return latestDeprovisionJob
    })
}

export async function getLatestJob(namespace: string, name: string) {
    const response = listHiveJobs(namespace, [getClusterDeploymentNameSelector(name)])
    return await response.promise.then((result) => {
        const latestJob = getLatest<HiveJob>(result, 'metadata.creationTimestamp')
        return latestJob
    })
}

export async function getHiveJob(namespace: string, name: string, status: string) {
    let hiveJob: HiveJob | undefined
    if (status === ClusterStatus.creating) {
        hiveJob = await getProvisionJob(namespace, name)
    } else if (status === ClusterStatus.failed) {
        hiveJob = await getLatestJob(namespace, name)
    } else if (status === ClusterStatus.destroying) {
        hiveJob = await getDeprovisionJob(namespace, name)
    }
    return hiveJob
}
