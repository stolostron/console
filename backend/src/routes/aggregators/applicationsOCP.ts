/* Copyright Contributors to the Open Cluster Management project */
import { getClusterMap } from '../../lib/clusters'
import { getMultiClusterEngine } from '../../lib/multi-cluster-engine'
import { getMultiClusterHub } from '../../lib/multi-cluster-hub'
import { getPagedSearchResources } from '../../lib/search'
import { IResource } from '../../resources/resource'
import { getKubeResources } from '../events'
import { AppColumns, ApplicationCacheType, generateTransforms, MODE } from './applications'

// query limit per letter group
const OCP_APP_QUERY_LIMIT = 20000

// getting system apps by its cluster name in cluster chunks
const REMOTE_CLUSTER_CHUNKS = 25
const clusterNameChunks: string[][] = []

const labelArr: string[] = [
  'kustomize.toolkit.fluxcd.io/name=',
  'helm.toolkit.fluxcd.io/name=',
  'app=',
  'app.kubernetes.io/part-of=',
]

const query = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          {
            property: 'kind',
            values: ['Deployment'],
          },
          {
            property: 'label',
            values: [...labelArr.map((label) => `${label}*`)],
          },
        ],
        limit: OCP_APP_QUERY_LIMIT,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
}

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

let usePagedQuery = true
export async function getOCPApps(
  applicationCache: ApplicationCacheType,
  argAppSet: Set<string>,
  mode: MODE,
  pass: number
) {
  const _query = structuredClone(query)
  const filters = _query.variables.input[0].filters
  let clusterNameChunk
  if (mode === MODE.ExcludeSystemApps) {
    // NO system apps
    filters.push(
      {
        property: 'namespace',
        values: ['!openshift*'],
      },
      {
        property: 'namespace',
        values: ['!open-cluster-management*'],
      }
    )
  } else if (mode === MODE.OnlySystemApps) {
    // ONLY system apps
    filters.push({
      property: 'namespace',
      values: ['openshift*', 'open-cluster-management*'],
    })

    // get chuck of cluster names to search for sys apps
    clusterNameChunk = getNextClusterNameChunk(applicationCache)
    filters.push({
      property: 'cluster',
      values: clusterNameChunk,
    })
  }

  // if system mode, don't use paged
  // if not but last ocp apps > 1000, use paged
  const isSystemMode = mode === MODE.OnlySystemApps
  const pagedQuery = isSystemMode ? false : usePagedQuery
  const ocpApps = (await getPagedSearchResources(_query, pagedQuery, pass)) as unknown as IOCPAppResource[]
  usePagedQuery = !isSystemMode && ocpApps.length > 1000
  const helmReleases = getKubeResources('HelmRelease', 'apps.open-cluster-management.io/v1')

  // filter ocp apps from this search
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

  const localOCPApps: IResource[] = []
  const remoteOCPApps: IResource[] = []
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
  if (mode === MODE.ExcludeSystemApps) {
    applicationCache['localOCPApps'] = generateTransforms(localOCPApps)
    applicationCache['remoteOCPApps'] = generateTransforms(remoteOCPApps, true)
  } else if (mode === MODE.OnlySystemApps) {
    // if we just got remote clusters this time, don't touch localSysApps
    if (localOCPApps.length) {
      applicationCache['localSysApps'] = generateTransforms(localOCPApps)
    }
    // fill in remote system apps
    fillRemoteSystemCache(applicationCache, remoteOCPApps, clusterNameChunk)
  }
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

function fillRemoteSystemCache(
  applicationCache: ApplicationCacheType,
  remoteSysApps: IResource[],
  clusterNameChunk: string[]
) {
  // initialize map
  clusterNameChunk.forEach((clustername) => {
    applicationCache['remoteSysApps'].resourceMap[clustername] = []
  })
  const resources = generateTransforms(remoteSysApps, true).resources
  resources.forEach((transform) => {
    const clustername = transform.transform[AppColumns.clusters].join()
    const transforms = applicationCache['remoteSysApps'].resourceMap[clustername]
    transforms.push(transform)
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getValues(labels: { annotation: any; value: any }[]) {
  let itemLabel = ''
  let argoInstanceLabelValue = ''
  let isManagedByHelm

  labels &&
    labels.forEach(({ annotation, value }) => {
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

export const systemAppNamespacePrefixes: string[] = []
export async function discoverSystemAppNamespacePrefixes() {
  if (!systemAppNamespacePrefixes.length) {
    systemAppNamespacePrefixes.push('openshift')
    systemAppNamespacePrefixes.push('hive')
    systemAppNamespacePrefixes.push('open-cluster-management')
    const mch = await getMultiClusterHub()
    if (mch?.metadata?.namespace && mch.metadata.namespace !== 'open-cluster-management') {
      systemAppNamespacePrefixes.push(mch.metadata.namespace)
    }
    const mce = await getMultiClusterEngine()
    systemAppNamespacePrefixes.push(mce?.spec?.targetNamespace || 'multicluster-engine')
  }
  return systemAppNamespacePrefixes
}

export function isSystemApp(namespace?: string) {
  return namespace && systemAppNamespacePrefixes.some((prefix) => namespace.startsWith(prefix))
}
