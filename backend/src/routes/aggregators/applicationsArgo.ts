/* Copyright Contributors to the Open Cluster Management project */
import get from 'get-value'
import { logger } from '../../lib/logger'
import { ITransformedResource } from '../../lib/pagination'
import {
  ApplicationKind,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  Cluster,
  IApplicationSet,
  IResource,
} from '../../resources/resource'
import { getKubeResources, getHubClusterName, IWatchOptions } from '../events'
import { applicationCache, ApplicationCacheType, IArgoApplication, IQuery, SEARCH_QUERY_LIMIT } from './applications'
import {
  cacheRemoteApps,
  getClusters,
  getNextApplicationPageChunk,
  ApplicationPageChunk,
  transform,
  getApplicationsHelper,
  getApplicationType,
  getApplicationClusters,
  getTransform,
} from './utils'

interface IArgoAppLocalResource extends IResource {
  spec: {
    destination: {
      name?: string
      namespace: string
      server?: string
    }
  }
  status?: {
    resources: [{ namespace: string }]
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
const appSetAppsMap: Record<string, IArgoApplication[]> = {}

let argoPageChunk: ApplicationPageChunk
const argoPageChunks: ApplicationPageChunk[] = []

const oldResourceUidSets: Record<string, Set<string>> = {}

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

export function cacheArgoApplications(applicationCache: ApplicationCacheType, remoteArgoApps: IResource[]) {
  const argoAppSet = localArgoAppSet
  const hubClusterName = getHubClusterName()
  const clusters: Cluster[] = getClusters()
  const localCluster = clusters.find((cls) => cls.name === hubClusterName)

  if (applicationCache['localArgoApps']?.resourceUidMap) {
    try {
      transform(Object.values(applicationCache['localArgoApps'].resourceUidMap), false, localCluster, clusters)
    } catch (e) {
      logger.error(`getLocalArgoApps exception ${e}`)
    }
  }
  try {
    // cache remote argo apps
    cacheRemoteApps(applicationCache, getRemoteArgoApps(argoAppSet, remoteArgoApps), argoPageChunk, 'remoteArgoApps')
  } catch (e) {
    logger.error(`cacheRemoteApps exception ${e}`)
  }

  try {
    transform(getApplicationsHelper(applicationCache, ['appset']), false, localCluster, clusters)
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

export function polledArgoApplicationAggregation(
  options: IWatchOptions,
  items: ITransformedResource[],
  shouldPostProcess: boolean
): void {
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
    clusters = getClusters()
    localCluster = clusters.find((cls) => cls.name === hubClusterName)
    placementDecisions = getKubeResources('PlacementDecision', 'cluster.open-cluster-management.io/v1beta1')
  }

  // filter out apps that belong to an appset
  if (kind === ApplicationKind) {
    items = filterArgoApps(items, clusters, localArgoAppSet, appSetAppsMap)
  }

  // add uidata transforms
  items.forEach((item) => {
    const uid = get(item, 'metadata.uid') as string
    let transform = resourceUidMap[uid]?.transform
    if (!transform) {
      const type = getApplicationType(item)
      const _clusters = getApplicationClusters(item, type, [], placementDecisions, localCluster, clusters)
      transform = getTransform(item, type, _clusters)
    }
    resourceUidMap[uid] = item
    item.transform = transform
    oldResourceUidSets[appKey].delete(uid)
  })

  if (shouldPostProcess) {
    // cleanup resourceUidMap
    for (const uid of oldResourceUidSets[appKey]) {
      delete resourceUidMap[uid]
    }
    delete oldResourceUidSets[appKey]
  }
}

function filterArgoApps(
  items: IResource[],
  clusters: Cluster[],
  localArgoAppSet: Set<string>,
  appSetAppsMap: Record<string, IResource[]>
) {
  return items.filter((app) => {
    const argoApp = app as IArgoAppLocalResource
    const resources = argoApp.status ? argoApp.status.resources : undefined
    const definedNamespace = resources?.[0].namespace

    // cache Argo app signature for filtering OCP apps later
    localArgoAppSet.add(
      `${argoApp.metadata.name}-${
        definedNamespace ?? argoApp.spec.destination.namespace
      }-${getArgoDestinationCluster(argoApp.spec.destination, clusters, getHubClusterName())}`
    )
    const isChildOfAppset =
      argoApp.metadata.ownerReferences && argoApp.metadata?.ownerReferences[0].kind === 'ApplicationSet'
    if (!argoApp.metadata.ownerReferences || !isChildOfAppset) {
      return true
    }
    const appSetName = get(argoApp, ['metadata', 'ownerReferences', '0', 'name']) as string
    let apps = appSetAppsMap[appSetName]
    if (!apps) {
      apps = appSetAppsMap[appSetName] = []
    }
    const inx = apps.findIndex((itm) => itm.metadata.uid === app.metadata.uid)
    if (inx !== -1) {
      apps[inx] = app
    } else {
      apps.push(app)
    }
    return false
  })
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
