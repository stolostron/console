/* Copyright Contributors to the Open Cluster Management project */
import { listResources } from './utils/resource-request'
import { IResourceDefinition } from './resource'
import { Metadata } from './metadata'

export const ClusterImageSetApiVersion = 'hive.openshift.io/v1'
export type ClusterImageSetApiVersionType = 'hive.openshift.io/v1'

export const ClusterImageSetKind = 'ClusterImageSet'
export type ClusterImageSetKindType = 'ClusterImageSet'

export const ClusterImageSetDefinition: IResourceDefinition = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
}

export type ClusterImageSet = {
  apiVersion: ClusterImageSetApiVersionType
  kind: ClusterImageSetKindType
  metadata: Metadata
  spec?: { releaseImage: string }
}

export function listClusterImageSets() {
  return listResources<ClusterImageSet>({
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
  })
}

const getFullVersionFromReleaseString = (value = '') => {
  const match = /(\d+\.\d+(?:\.\d+)?(?:-\w+)?)/gm.exec(value)
  if (match && match.length > 1 && match[1]) {
    return match[1]
  } else {
    return undefined
  }
}

export const getVersionFromReleaseString = (value = '') => {
  const match = /(\d+\.\d+(?:\.\d+)?)/gm.exec(value)
  if (match && match.length > 1 && match[1]) {
    return match[1]
  } else {
    return undefined
  }
}

export function getChannelFromVersion(version?: string, stream = 'fast') {
  if (version) {
    // Extract major.minor (e.g., "4.20" from "4.20.8" or "4.20")
    const [major, minor] = version.split('.')
    if (major && minor) return `${stream}-${major}.${minor}`
  }
  return undefined
}

export function getClusterImageSetVersion(clusterImageSet: ClusterImageSet) {
  const { metadata, spec } = clusterImageSet
  const { name, labels } = metadata
  const { releaseTag } = labels ?? {}
  const { releaseImage } = spec ?? {}
  return (
    getVersionFromReleaseString(releaseTag) ??
    getVersionFromReleaseString(releaseImage) ??
    getVersionFromReleaseString(name)
  )
}

export function getClusterImageSetFullVersion(clusterImageSet: ClusterImageSet) {
  const { metadata, spec } = clusterImageSet
  const { name, labels } = metadata
  const { releaseTag } = labels ?? {}
  const { releaseImage } = spec ?? {}
  return (
    getFullVersionFromReleaseString(releaseTag) ??
    getFullVersionFromReleaseString(releaseImage) ??
    getFullVersionFromReleaseString(name)
  )
}
