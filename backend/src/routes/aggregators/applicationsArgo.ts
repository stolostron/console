/* Copyright Contributors to the Open Cluster Management project */
import get from 'get-value'
import { logger } from '../../lib/logger'
import {
  ApplicationKind,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  type Cluster,
  type IApplicationSet,
  type IResource,
} from '../../resources/resource'
import { getKubeResources, getHubClusterName } from '../events'
import {
  applicationCache,
  type ApplicationCacheType,
  getAppDict,
  type IArgoApplication,
  type IQuery,
  type ITransformedResource,
  SEARCH_QUERY_LIMIT,
} from './applications'
import {
  cacheRemoteApps,
  getClusters,
  getNextApplicationPageChunk,
  type ApplicationPageChunk,
  transform,
  getApplicationsHelper,
  getApplicationType,
  getApplicationClusters,
  getTransform,
} from './utils'
import { deflateResource, inflateApp, inflateApps } from '../../lib/compression'
import type { IWatchOptions } from '../../resources/watch-options'

/** Compressed ApplicationSet child app — full resource is deflated; cluster fields kept for transforms. */
export interface IAppSetAppCompressed {
  uid: string
  name: string
  signature: string
  destination: {
    name?: string
    namespace: string
    server?: string
  }
  statusCluster?: string
  compressed: Buffer
}

interface IArgoAppLocalResource extends IResource {
  spec: {
    destination: {
      name?: string
      namespace: string
      server?: string
    }
  }
  status?: {
    resources?: [{ namespace: string }]
    cluster?: string
  }
}

interface IArgoAppRemoteResource {
  _hostingResource: string
  name: string
  namespace: string
  created: string
  destinationNamespace: string
  destinationName: string
  destinationCluster: string
  destinationServer: string
  path: string
  repoURL: string
  targetRevision: string
  chart: string
  cluster: string
  healthStatus: string
  syncStatus: string
}

// a map from an appset name to the apps that it created
export function getAppSetAppsMap() {
  return appSetAppsMap || {}
}
let appSetAppsMap: Record<string, IAppSetAppCompressed[]> = {}
let tempAppSetAppsMap: Record<string, IAppSetAppCompressed[]> = {}

let argoPageChunk: ApplicationPageChunk
const argoPageChunks: ApplicationPageChunk[] = []

const oldResourceUidSets: Record<string, Set<string>> = {}

/** Reset all Argo application module-level state. Used for test isolation. */
export function resetArgoApplicationState() {
  hubClusterName = undefined as unknown as string
  clusters = undefined as unknown as Cluster[]
  localCluster = undefined as unknown as Cluster
  placementDecisions = undefined as unknown as IResource[]
  argoPageChunks.length = 0
  localArgoAppSet.clear()
  appSetAppsMap = {}
  tempAppSetAppsMap = {}
  for (const key in oldResourceUidSets) {
    delete oldResourceUidSets[key]
  }
}

export function appSetAppRefToArgoApplication(ref: IAppSetAppCompressed): IArgoApplication {
  return {
    apiVersion: ArgoApplicationApiVersion,
    kind: ArgoApplicationKind,
    metadata: { name: ref.name, uid: ref.uid },
    spec: { destination: ref.destination },
    status: ref.statusCluster ? { cluster: ref.statusCluster } : undefined,
  } as IArgoApplication
}

export async function inflateAppSetApps(appSetName: string): Promise<IArgoApplication[]> {
  const entries = appSetAppsMap[appSetName] || []
  return Promise.all(entries.map(async (entry) => (await inflateApp(entry)) as IArgoApplication))
}

export function addArgoQueryInputs(applicationCache: ApplicationCacheType, query: IQuery) {
  argoPageChunk = getNextApplicationPageChunk(applicationCache, argoPageChunks, 'remoteArgoApps')
  const filters = [
    {
      property: 'kind',
      values: ['Application'],
    },
    {
      property: 'apigroup',
      values: ['argoproj.io'],
    },
    {
      property: 'cluster',
      values: [`!${getHubClusterName()}`],
    },
  ]
  /* istanbul ignore if */
  if (argoPageChunk?.keys) {
    filters.push({
      property: 'name',
      values: argoPageChunk.keys,
    })
  }
  query.variables.input.push({
    filters,
    limit: SEARCH_QUERY_LIMIT,
  })
}

export async function cacheArgoApplications(applicationCache: ApplicationCacheType, remoteArgoApps: IResource[]) {
  const hubClusterName = getHubClusterName()
  const clusters: Cluster[] = await getClusters()
  const localCluster = clusters.find((cls) => cls.name === hubClusterName)

  await rebuildLocalArgoAppSet(applicationCache, clusters)

  const argoAppSet = localArgoAppSet

  if (applicationCache['localArgoApps']?.resourceUidMap) {
    try {
      await transform(Object.values(applicationCache['localArgoApps'].resourceUidMap), false, localCluster, clusters)
    } catch (e) {
      logger.error(`getLocalArgoApps exception ${e}`)
    }
  }
  try {
    // cache remote argo apps
    await cacheRemoteApps(
      applicationCache,
      getRemoteArgoApps(argoAppSet, remoteArgoApps),
      argoPageChunk,
      'remoteArgoApps'
    )
  } catch (e) {
    logger.error(`cacheRemoteApps exception ${e}`)
  }

  try {
    await transform(getApplicationsHelper(applicationCache, ['appset']), false, localCluster, clusters)
  } catch (e) {
    logger.error(`aggregateLocalApplications appset exception ${e}`)
  }

  return argoAppSet
}

let hubClusterName: string
let clusters: Cluster[]
let localCluster: Cluster
let placementDecisions: IResource[]
const localArgoAppSet: Set<string> = new Set()

export async function polledArgoApplicationAggregation(
  options: IWatchOptions,
  items: ITransformedResource[],
  shouldPostProcess: boolean
): Promise<void> {
  const { kind } = options

  // get resourceUidMap
  const appKey = kind === ApplicationKind ? 'localArgoApps' : 'appset'
  let resourceUidMap = applicationCache[appKey]?.resourceUidMap
  if (!resourceUidMap) {
    delete applicationCache[appKey].resources
    resourceUidMap = applicationCache[appKey].resourceUidMap = {}
  }

  // initialize data for this pass (pass continues until  shouldPostProcess)
  if (!oldResourceUidSets[appKey]) {
    oldResourceUidSets[appKey] = new Set(Object.keys(resourceUidMap))
    hubClusterName = getHubClusterName()
    clusters = await getClusters()
    localCluster = clusters.find((cls) => cls.name === hubClusterName)
    placementDecisions = await getKubeResources('PlacementDecision', 'cluster.open-cluster-management.io/v1beta1')
    if (kind === ApplicationKind) {
      localArgoAppSet.clear()
    }
  }

  // filter out apps that belong to an appset
  if (kind === ApplicationKind) {
    items = await filterArgoApps(items, clusters, localArgoAppSet, tempAppSetAppsMap)
  }

  // add uidata transforms
  await Promise.all(
    items.map(async (item) => {
      const uid = get(item, 'metadata.uid') as string
      let transform = resourceUidMap[uid]?.transform
      if (!transform) {
        const type = getApplicationType(item)
        const _clusters = getApplicationClusters(item, type, [], placementDecisions, localCluster, clusters)
        transform = getTransform(item, type, _clusters)
      }
      resourceUidMap[uid] = { compressed: await deflateResource(item, getAppDict()), transform }
      oldResourceUidSets[appKey].delete(uid)
    })
  )

  if (shouldPostProcess) {
    // cleanup resourceUidMap
    for (const uid of oldResourceUidSets[appKey]) {
      delete resourceUidMap[uid]
    }
    delete oldResourceUidSets[appKey]

    // we have built up a map of appsets -> a list of its argo apps
    // if argo apps have finished polling, set that temp appset map into the real one
    // the real one will be used while a new temp map is being created
    // this fixes the problem where the argo app moves to a new appset of the same name in a new cluster
    if (kind === ApplicationKind) {
      for (const key of Object.keys(appSetAppsMap)) {
        if (!(key in tempAppSetAppsMap)) {
          delete appSetAppsMap[key]
        }
      }
      Object.assign(appSetAppsMap, tempAppSetAppsMap)
      tempAppSetAppsMap = {}
    }
  }
}

function getLocalArgoAppSignature(argoApp: IArgoAppLocalResource, clusters: Cluster[]): string {
  const resources = argoApp.status ? argoApp.status.resources : undefined
  const definedNamespace = resources?.[0]?.namespace
  return `${argoApp.metadata.name}-${
    definedNamespace ?? argoApp.spec.destination.namespace
  }-${getArgoDestinationCluster(argoApp.spec.destination, clusters, getHubClusterName())}`
}

async function rebuildLocalArgoAppSet(applicationCache: ApplicationCacheType, clusters: Cluster[]) {
  localArgoAppSet.clear()

  const appsMap = oldResourceUidSets['localArgoApps'] ? tempAppSetAppsMap : appSetAppsMap
  for (const apps of Object.values(appsMap)) {
    for (const entry of apps) {
      localArgoAppSet.add(entry.signature)
    }
  }

  if (applicationCache['localArgoApps']?.resourceUidMap) {
    const localApps = await inflateApps(Object.values(applicationCache['localArgoApps'].resourceUidMap))
    for (const app of localApps) {
      localArgoAppSet.add(getLocalArgoAppSignature(app as IArgoAppLocalResource, clusters))
    }
  }
}

async function createAppSetAppEntry(app: IArgoAppLocalResource, clusters: Cluster[]): Promise<IAppSetAppCompressed> {
  const signature = getLocalArgoAppSignature(app, clusters)
  const uid = app.metadata?.uid
  const name = app.metadata?.name
  if (!uid || !name) {
    throw new Error('Argo application missing metadata uid or name')
  }
  return {
    uid,
    name,
    signature,
    destination: app.spec.destination,
    statusCluster: app.status?.cluster,
    compressed: await deflateResource(app, getAppDict()),
  }
}

async function filterArgoApps(
  items: IResource[],
  clusters: Cluster[],
  localArgoAppSet: Set<string>,
  appSetAppsMap: Record<string, IAppSetAppCompressed[]>
) {
  const filtered: IResource[] = []
  for (const app of items) {
    const argoApp = app as IArgoAppLocalResource

    // cache Argo app signature for filtering OCP apps later
    localArgoAppSet.add(getLocalArgoAppSignature(argoApp, clusters))

    const isChildOfAppset =
      argoApp.metadata?.ownerReferences && argoApp.metadata.ownerReferences[0].kind === 'ApplicationSet'
    if (!argoApp.metadata?.ownerReferences || !isChildOfAppset) {
      filtered.push(app)
      continue
    }
    const appSetName = get(argoApp, ['metadata', 'ownerReferences', '0', 'name']) as string
    let apps = appSetAppsMap[appSetName]
    if (!apps) {
      apps = appSetAppsMap[appSetName] = []
    }
    const entry = await createAppSetAppEntry(argoApp, clusters)
    const inx = apps.findIndex((itm) => itm.uid === entry.uid)
    if (inx !== -1) {
      apps[inx] = entry
    } else {
      apps.push(entry)
    }
  }
  return filtered
}

function getRemoteArgoApps(argoAppSet: Set<string>, remoteArgoApps: IResource[]) {
  const argoApps = remoteArgoApps as unknown as IArgoAppRemoteResource[]
  const apps: IResource[] = []
  argoApps.forEach((argoApp: IArgoAppRemoteResource) => {
    // cache Argo app signature for filtering OCP apps later
    argoAppSet.add(`${argoApp.name}-${argoApp.destinationNamespace}-${argoApp.cluster}`)
    if (!argoApp._hostingResource) {
      // Skip apps created by Argo pull model
      apps.push({
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: {
          name: argoApp.name,
          namespace: argoApp.namespace,
          creationTimestamp: argoApp.created,
        },
        spec: {
          destination: {
            namespace: argoApp.destinationNamespace,
            name: argoApp.destinationName,
            server: argoApp.destinationCluster || argoApp.destinationServer,
          },
          source: {
            path: argoApp.path,
            repoURL: argoApp.repoURL,
            targetRevision: argoApp.targetRevision,
            chart: argoApp.chart,
          },
        },
        status: {
          cluster: argoApp.cluster,
          health: {
            status: argoApp.healthStatus,
          },
          sync: {
            status: argoApp.syncStatus,
          },
        },
      } as IResource)
    }
  })

  return apps
}

function getArgoDestinationCluster(
  destination: { name?: string; namespace: string; server?: string },
  clusters: Cluster[],
  cluster?: string
) {
  // cluster is the name of the managed cluster where the Argo app is defined
  let clusterName = ''
  const serverApi = destination?.server
  if (serverApi) {
    /* istanbul ignore if */
    if (serverApi === 'https://kubernetes.default.svc') {
      clusterName = cluster ?? getHubClusterName()
    } else {
      const server = clusters.find((cls) => cls.kubeApiServer === serverApi)
      /* istanbul ignore next */ clusterName = server ? server.name : 'unknown'
    }
  } else {
    // target destination was set using the name property
    /* istanbul ignore next */ clusterName = destination?.name || 'unknown'
    /* istanbul ignore next */ if (cluster && (clusterName === 'in-cluster' || clusterName === getHubClusterName())) {
      clusterName = cluster
    }

    /* istanbul ignore next */ if (clusterName === 'in-cluster') {
      clusterName = getHubClusterName()
    }
  }
  return clusterName
}

const appSetPlacementStr = [
  'clusterDecisionResource',
  'labelSelector',
  'matchLabels',
  'cluster.open-cluster-management.io/placement',
]
export function getAppSetRelatedResources(appSet: IResource, applicationSets: IApplicationSet[]) {
  const appSetsSharingPlacement: string[] = []
  const currentAppSetGenerators = (appSet as IApplicationSet).spec?.generators
  /* istanbul ignore next */
  const currentAppSetPlacement = currentAppSetGenerators
    ? (get(currentAppSetGenerators[0], appSetPlacementStr, { default: '' }) as string)
    : undefined

  /* istanbul ignore if */
  if (!currentAppSetPlacement) {
    return ['', []]
  }

  applicationSets.forEach((item) => {
    const appSetGenerators = item.spec.generators
    /* istanbul ignore next */
    const appSetPlacement = appSetGenerators
      ? (get(appSetGenerators[0], appSetPlacementStr, { default: '' }) as string)
      : ''
    /* istanbul ignore if */
    if (
      item.metadata.name !== appSet.metadata?.name ||
      (item.metadata.name === appSet.metadata?.name && item.metadata.namespace !== appSet.metadata?.namespace)
    ) {
      if (appSetPlacement && appSetPlacement === currentAppSetPlacement && item.metadata.name) {
        appSetsSharingPlacement.push(item.metadata.name)
      }
    }
  })

  return [currentAppSetPlacement, appSetsSharingPlacement]
}
