/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { listResources } from './utils/resource-request'

export const StorageClassApiVersion = 'storage.k8s.io/v1'
export type StorageClassApiVersionType = 'storage.k8s.io/v1'

export const StorageClassKind = 'StorageClass'
export type StorageClassKindType = 'StorageClass'

export type StorageClass = {
  apiVersion: StorageClassApiVersionType
  kind: StorageClassKindType
  metadata: Metadata
  spec?: { releaseImage: string }
}

export function listStorageClasses() {
  return listResources<StorageClass>({
    apiVersion: StorageClassApiVersion,
    kind: StorageClassKind,
  })
}
