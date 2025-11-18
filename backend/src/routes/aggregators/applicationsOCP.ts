/* Copyright Contributors to the Open Cluster Management project */
import { logger } from '../../lib/logger'
import { IResource, ISearchResource, SearchResult } from '../../resources/resource'
import { getKubeResources, getHubClusterName } from '../events'
import {
  AppColumns,
  ApplicationCacheType,
  ApplicationClusterStatusMap,
  ApplicationStatuses,
  IQuery,
  ScoreColumnSize,
  SEARCH_QUERY_LIMIT,
} from './applications'
import { appOwnerLabels, computeDeployedPodStatuses, getAppNameFromLabel } from './utils'
import {
  transform,
  getClusterMap,
  ApplicationPageChunk,
  getNextApplicationPageChunk,
  cacheRemoteApps,
  getApplicationType,
} from './utils'

// getting system apps by its cluster name in cluster chunks
const REMOTE_CLUSTER_CHUNKS = 10
const clusterNameChunks: string[][] = []

let ocpPageChunk: ApplicationPageChunk
const ocpPageChunks: ApplicationPageChunk[] = []

let clusterNameChunk: string[]

// Openshift/Flux
export function addOCPQueryInputs(applicationCache: ApplicationCacheType, query: IQuery) {
  ocpPageChunk = getNextApplicationPageChunk(applicationCache, ocpPageChunks, 'remoteOCPApps')
  const filters = [
    {
      property: 'kind',
      values: ['Deployment'],
    },
    {
      property: 'label',
      values: [...appOwnerLabels.map((label) => `${label}*`)],
    },
    {
      property: 'namespace',
      values: ['!openshift*'],
    },
    {
      property: 'namespace',
      values: ['!open-cluster-management*'],
    },
  ]
  if (ocpPageChunk?.keys) {
    filters.push({
      property: 'name',
      values: ocpPageChunk.keys,
    })
  }
  query.variables.input.push({
    filters,
    relatedKinds: ['pod', 'replicaset', 'statefulset'],
    limit: SEARCH_QUERY_LIMIT,
  })
}

export function addSystemQueryInputs(applicationCache: ApplicationCacheType, query: IQuery) {
  clusterNameChunk = getNextClusterNameChunk(applicationCache)
  query.variables.input.push({
    filters: [
      {
        property: 'kind',
        values: ['Deployment'],
      },
      {
        property: 'label',
        values: [...appOwnerLabels.map((label) => `${label}*`)],
      },
      {
        property: 'namespace',
        values: ['openshift*', 'open-cluster-management*'],
      },
      {
        property: 'cluster',
        values: clusterNameChunk,
      },
    ],
    relatedKinds: ['pod', 'replicaset', 'statefulset'],
    limit: SEARCH_QUERY_LIMIT,
  })
}

export function cacheOCPApplications(
  applicationCache: ApplicationCacheType,
  searchResult: SearchResult,
  ocpArgoAppFilter: Set<string>,
  isSystemMode?: boolean
) {
  const helmReleases = getKubeResources('HelmRelease', 'apps.open-cluster-management.io/v1')

  // filter ocp apps from this search
  const localOCPApps: IResource[] = []
  const remoteOCPApps: IResource[] = []
  const ocpApps: ISearchResource[] = []
  try {
    const openShiftAppResourceMaps: Record<string, ISearchResource> = {}
    searchResult.items.forEach((ocpApp: ISearchResource) => {
      if (ocpApp._hostingSubscription) {
        // don't list subscription apps as ocp
        return
      }

      const labels = (ocpApp.label || '')
        .replace(/\s/g, '')
        .split(';')
        .map((label: string) => {
          const [annotation, value] = label.split('=')
          return { annotation, value } as { annotation: string; value: string }
        })

      const { itemLabel, isManagedByHelm, argoInstanceLabelValue } = getValues(labels)

      if (itemLabel && isManagedByHelm) {
        const helmRelease = helmReleases.find(
          (hr) => hr.metadata.name === itemLabel && hr.metadata.namespace === ocpApp.namespace
        )
        if (helmRelease?.metadata.annotations?.['apps.open-cluster-management.io/hosting-subscription']) {
          // don't list helm subscription apps as ocp
          return
        }
      }
      if (itemLabel) {
        const key = `${itemLabel}-${ocpApp.namespace}-${ocpApp.cluster}`
        const argoKey = `${argoInstanceLabelValue}-${ocpApp.namespace}-${ocpApp.cluster}`
        // filter out ocp apps that are argo apps
        if (!ocpArgoAppFilter.has(argoKey)) {
          openShiftAppResourceMaps[key] = ocpApp
        }
      }
    })

    Object.entries(openShiftAppResourceMaps).forEach(([, value]) => {
      const appLabel = getAppNameFromLabel(value.label, value.name)
      const resourceName = value.name
      let apps
      if (value.cluster === getHubClusterName()) {
        apps = localOCPApps
      } else {
        apps = remoteOCPApps
      }
      const app = {
        apiVersion: value.apigroup ? `${value.apigroup}/${value.apiversion}` : value.apiversion,
        kind: value.kind,
        label: value.label,
        metadata: {
          name: appLabel,
          namespace: value.namespace,
          creationTimestamp: value.created,
        },
        status: {
          cluster: value.cluster,
          resourceName,
        },
      }
      apps.push(app)
      value.type = getApplicationType(app)
      ocpApps.push(value)
    })
  } catch (e) {
    logger.error(`processing ${isSystemMode ? 'system' : 'ocp/flex'} exception ${e}`)
  }
  const ocpStatusMap = createOCPStatusMap(ocpApps, searchResult.related)

  if (!isSystemMode) {
    try {
      applicationCache['localOCPApps'] = transform(localOCPApps, ocpStatusMap)
    } catch (e) {
      logger.error(`getLocalOCPApps exception ${e}`)
    }
    try {
      cacheRemoteApps(applicationCache, ocpStatusMap, remoteOCPApps, ocpPageChunk, 'remoteOCPApps')
    } catch (e) {
      logger.error(`getRemoteOCPApps exception ${e}`)
    }
  } else {
    // if we just got remote clusters this time, don't touch localSysApps
    if (localOCPApps.length) {
      try {
        applicationCache['localSysApps'] = transform(localOCPApps, ocpStatusMap)
      } catch (e) {
        logger.error(`getLocalSystemApps exception ${e}`)
      }
    }
    try {
      // cache remote system apps
      cacheRemoteSystemApps(applicationCache, ocpStatusMap, remoteOCPApps, clusterNameChunk)
    } catch (e) {
      logger.error(`cacheRemoteSystemApps exception ${e}`)
    }
  }
}

function cacheRemoteSystemApps(
  applicationCache: ApplicationCacheType,
  ocpStatusMap: ApplicationClusterStatusMap,
  remoteSysApps: IResource[],
  clusterNameChunk: string[]
) {
  // initialize map
  clusterNameChunk.forEach((clustername) => {
    applicationCache['remoteSysApps'].resourceMap[clustername] = []
  })
  const resources = transform(remoteSysApps, ocpStatusMap, true).resources
  resources.forEach((resource) => {
    const clustername = (resource.transform[AppColumns.clusters] as string[]).join()
    const clusterResources = applicationCache['remoteSysApps'].resourceMap[clustername]
    clusterResources.push(resource)
  })
}

function getNextClusterNameChunk(applicationCache: ApplicationCacheType): string[] {
  // if no cluster name chucks left, create a new array of chunks
  if (clusterNameChunks.length === 0) {
    const clusterMap = getClusterMap()
    const clusterNames = Object.keys(clusterMap)
    if (clusterNames.length > 0) {
      const chunks = clusterNames.reduce((chunks: string[][], clusterName, index) => {
        const cindex = Math.floor(index / REMOTE_CLUSTER_CHUNKS)
        chunks[cindex] = (chunks[cindex] ?? []).concat(clusterName)
        return chunks
      }, [])
      clusterNameChunks.push(...chunks)
    } else {
      clusterNameChunks.push([getHubClusterName()])
    }

    // update remoteSysApps map
    const remoteSysMap = applicationCache['remoteSysApps'].resourceMap
    if (applicationCache['remoteSysApps'].resources) {
      delete applicationCache['remoteSysApps'].resources
      applicationCache['remoteSysApps'].resourceMap = {}
    } else if (Object.keys(remoteSysMap).length) {
      // purge resource map of clusters that no longer exist
      Object.keys(remoteSysMap).forEach((name) => {
        if (!clusterMap[name]) {
          delete remoteSysMap[name]
        }
      })
    }
  }
  return clusterNameChunks.shift()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValues(labels: { annotation: any; value: any }[]) {
  let itemLabel = ''
  let argoInstanceLabelValue = ''
  let isManagedByHelm

  labels?.forEach(({ annotation, value }) => {
    value = value as string
    if (annotation === 'app') {
      itemLabel = value as string
    } else if (annotation === 'app.kubernetes.io/part-of') {
      if (!itemLabel) {
        itemLabel = value as string
      }
    }
    if (annotation === 'app.kubernetes.io/instance') {
      argoInstanceLabelValue = value as string
    }
    if (annotation === 'app.kubernetes.io/managed-by' && value === 'Helm') {
      isManagedByHelm = true
    }
  })
  return {
    itemLabel,
    isManagedByHelm,
    argoInstanceLabelValue,
  }
}

export function createOCPStatusMap(ocpApps: ISearchResource[], relatedResources: SearchResult['related']) {
  const ocpClusterStatusMap: ApplicationClusterStatusMap = {}
  const statuses2IDMap = new WeakMap<ApplicationStatuses, { appName: string; uids: string[] }>()

  // create an app map with syncs and health
  ocpApps.forEach((app: ISearchResource) => {
    const appName = `${app.namespace}/${getAppNameFromLabel(app.label, app.name)}`
    const appKey = `${app.type}/${appName}`
    let appStatusMap = ocpClusterStatusMap[appKey]
    if (!appStatusMap) {
      appStatusMap = ocpClusterStatusMap[appKey] = {}
    }
    let appStatuses = appStatusMap[app.cluster]
    if (!appStatuses) {
      appStatuses = appStatusMap[app.cluster] = {
        health: [Array(ScoreColumnSize).fill(0) as number[], []],
        synced: [Array(ScoreColumnSize).fill(0) as number[], []],
        deployed: [Array(ScoreColumnSize).fill(0) as number[], []],
      }
    }
    let appIDMap = statuses2IDMap.get(appStatuses)
    if (!appIDMap) {
      appIDMap = { appName, uids: [] }
      statuses2IDMap.set(appStatuses, appIDMap)
    }
    appIDMap.uids.push(app._uid)
  })

  // compute pod statuses
  computeDeployedPodStatuses(relatedResources, ocpClusterStatusMap, statuses2IDMap, true)

  return ocpClusterStatusMap
}
