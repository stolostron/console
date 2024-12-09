/* Copyright Contributors to the Open Cluster Management project */
import { logger } from '../../lib/logger'
import { IResource } from '../../resources/resource'
import { getKubeResources } from '../events'
import { AppColumns, ApplicationCacheType, IQuery, SEARCH_QUERY_LIMIT } from './applications'
import { transform, getClusterMap, ApplicationPageChunk, getNextApplicationPageChunk, cacheRemoteApps } from './utils'

// getting system apps by its cluster name in cluster chunks
const REMOTE_CLUSTER_CHUNKS = 25
const clusterNameChunks: string[][] = []

const labelArr: string[] = [
  'kustomize.toolkit.fluxcd.io/name=',
  'helm.toolkit.fluxcd.io/name=',
  'app=',
  'app.kubernetes.io/part-of=',
]

export interface IOCPAppResource extends IResource {
  apigroup: string
  apiversion: string
  kind: string
  name: string
  namespace: string
  cluster: string
  label?: string
  created: string
  _hostingSubscription?: boolean
}

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
      values: [...labelArr.map((label) => `${label}*`)],
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
        values: [...labelArr.map((label) => `${label}*`)],
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
    limit: SEARCH_QUERY_LIMIT,
  })
}

export function cacheOCPApplications(
  applicationCache: ApplicationCacheType,
  searchedOcpApps: IResource[],
  argAppSet: Set<string>,
  isSystemMode?: boolean
) {
  const ocpApps = searchedOcpApps as unknown as IOCPAppResource[]
  const helmReleases = getKubeResources('HelmRelease', 'apps.open-cluster-management.io/v1')

  // filter ocp apps from this search
  const localOCPApps: IResource[] = []
  const remoteOCPApps: IResource[] = []
  try {
    const openShiftAppResourceMaps: Record<string, IOCPAppResource> = {}
    ocpApps.forEach((ocpApp: IOCPAppResource) => {
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
        if (helmRelease && helmRelease.metadata.annotations?.['apps.open-cluster-management.io/hosting-subscription']) {
          // don't list helm subscription apps as ocp
          return
        }
      }
      if (itemLabel) {
        const key = `${itemLabel}-${ocpApp.namespace}-${ocpApp.cluster}`
        const argoKey = `${argoInstanceLabelValue}-${ocpApp.namespace}-${ocpApp.cluster}`
        if (!argAppSet.has(argoKey)) {
          openShiftAppResourceMaps[key] = ocpApp
        }
      }
    })

    Object.entries(openShiftAppResourceMaps).forEach(([, value]) => {
      let labelIdx
      let i
      for (i = 0; i < labelArr.length; i++) {
        labelIdx = value.label?.indexOf(labelArr[i])
        if (labelIdx > -1) {
          break
        }
      }
      labelIdx += labelArr[i].length

      const semicolon = value.label?.indexOf(';', labelIdx)
      const appLabel = value.label?.substring(labelIdx, semicolon > -1 ? semicolon : value.label?.length)
      const resourceName = value.name
      let apps
      if (value.cluster === 'local-cluster') {
        apps = localOCPApps
      } else {
        apps = remoteOCPApps
      }
      apps.push({
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
      } as unknown as IResource)
    })
  } catch (e) {
    logger.error(`processing ${isSystemMode ? 'system' : 'ocp/flex'} exception ${e}`)
  }

  if (!isSystemMode) {
    try {
      applicationCache['localOCPApps'] = transform(localOCPApps)
    } catch (e) {
      logger.error(`getLocalOCPApps exception ${e}`)
    }
    try {
      cacheRemoteApps(applicationCache, remoteOCPApps, ocpPageChunk, 'remoteOCPApps')
    } catch (e) {
      logger.error(`getRemoteOCPApps exception ${e}`)
    }
  } else {
    // if we just got remote clusters this time, don't touch localSysApps
    if (localOCPApps.length) {
      try {
        applicationCache['localSysApps'] = transform(localOCPApps)
      } catch (e) {
        logger.error(`getLocalSystemApps exception ${e}`)
      }
    }
    try {
      // cache remote system apps
      cacheRemoteSystemApps(applicationCache, remoteOCPApps, clusterNameChunk)
    } catch (e) {
      logger.error(`cacheRemoteSystemApps exception ${e}`)
    }
  }
}

function cacheRemoteSystemApps(
  applicationCache: ApplicationCacheType,
  remoteSysApps: IResource[],
  clusterNameChunk: string[]
) {
  // initialize map
  clusterNameChunk.forEach((clustername) => {
    applicationCache['remoteSysApps'].resourceMap[clustername] = []
  })
  const resources = transform(remoteSysApps, undefined, true).resources
  resources.forEach((resource) => {
    const clustername = resource.transform[AppColumns.clusters].join()
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
      clusterNameChunks.push(['local-cluster'])
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
