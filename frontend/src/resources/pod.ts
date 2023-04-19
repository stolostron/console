/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { ClusterStatus } from './utils/get-cluster'
import { listNamespacedResources } from './utils/resource-request'
import { getLatest } from './utils/utils'

export const PodApiVersion = 'v1'
export type PodApiVersionType = 'v1'

export const PodKind = 'Pod'
export type PodKindType = 'Pod'

export const PodDefinition: IResourceDefinition = {
  apiVersion: PodApiVersion,
  kind: PodKind,
}

export interface Pod extends IResource {
  apiVersion: PodApiVersionType
  kind: PodKindType
  metadata: Metadata
}

export const PodListApiVersion = 'v1'
export type PodListApiVersionType = 'v1'

export const PodListKind = 'PodList'
export type PodListKindType = 'PodList'

export interface PodList extends IResource {
  apiVersion: PodListApiVersionType
  kind: PodListKindType
  items: Pod[]
}

export function listPods(namespace: string, labels?: string[]) {
  return listNamespacedResources<Pod>(
    {
      apiVersion: PodApiVersion,
      kind: PodKind,
      metadata: { namespace },
    },
    labels
  )
}

const getClusterDeploymentNameSelector = (name: string) => {
  return `hive.openshift.io/cluster-deployment-name=${name}`
}

export async function getProvisionPod(namespace: string, name: string) {
  const provisionJobSelector = 'hive.openshift.io/job-type=provision'
  const response = listPods(namespace, [getClusterDeploymentNameSelector(name), provisionJobSelector])
  return await response.promise.then((result) => {
    const latestProvisionJob = getLatest<Pod>(result, 'metadata.creationTimestamp')
    return latestProvisionJob
  })
}

export async function getDeprovisionPod(namespace: string, name: string) {
  const deprovisionJobSelector = `job-name=${name}-uninstall`
  const response = listPods(namespace, [getClusterDeploymentNameSelector(name), deprovisionJobSelector])
  return await response.promise.then((result) => {
    const latestDeprovisionJob = getLatest<Pod>(result, 'metadata.creationTimestamp')
    return latestDeprovisionJob
  })
}

export async function getLatestHivePod(namespace: string, name: string) {
  const response = listPods(namespace, [getClusterDeploymentNameSelector(name)])
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
  } else if (
    status === ClusterStatus.provisionfailed ||
    status === ClusterStatus.deprovisionfailed ||
    status === ClusterStatus.posthookjob ||
    status === ClusterStatus.posthookfailed
  ) {
    hiveJob = await getLatestHivePod(namespace, name)
  } else if (status === ClusterStatus.destroying) {
    hiveJob = await getDeprovisionPod(namespace, name)
  }
  return hiveJob
}

export async function getMostRecentAnsibleJobPod(namespace: string, jobName: string) {
  const response = listPods(namespace, [`job-name=${jobName}`])
  return await response.promise.then((result) => {
    return result.find((pod) => pod.metadata.name?.includes(jobName))
  })
}
