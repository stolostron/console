/* Copyright Contributors to the Open Cluster Management project */
import get from 'get-value'
import { logger } from '../../lib/logger'
import { ITransformedResource } from '../../lib/pagination'
import { Cluster, IApplicationSet, IResource } from '../../resources/resource'
import { getKubeResources, getHubClusterName } from '../events'
import { ApplicationCacheType, IQuery, SEARCH_QUERY_LIMIT } from './applications'
import {
  cacheRemoteApps,
  getClusters,
  getNextApplicationPageChunk,
  ApplicationPageChunk,
  transform,
  getApplicationsHelper,
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
export let appSetAppsMap: Record<string, string[]> = {}

let argoPageChunk: ApplicationPageChunk
const argoPageChunks: ApplicationPageChunk[] = []

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
  const argoAppSet = new Set<string>()
  const clusters: Cluster[] = getClusters()
  try {
    applicationCache['localArgoApps'] = transform(getLocalArgoApps(argoAppSet, clusters), clusters)
  } catch (e) {
    logger.error(`getLocalArgoApps exception ${e}`)
  }
  try {
    // cache remote argo apps
    cacheRemoteApps(applicationCache, getRemoteArgoApps(argoAppSet, remoteArgoApps), argoPageChunk, 'remoteArgoApps')
  } catch (e) {
    logger.error(`cacheRemoteApps exception ${e}`)
  }

  ///////// CREATE APPSET MAPS TO BE USED IN APPSET DETAILS////////////////////////
  createAppSetAppsMap(applicationCache)

  return argoAppSet
}

function getLocalArgoApps(argoAppSet: Set<string>, clusters: Cluster[]) {
  const argoApps = getKubeResources('Application', 'argoproj.io/v1alpha1')
  return argoApps.filter((app) => {
    const argoApp = app as IArgoAppLocalResource
    const resources = argoApp.status ? argoApp.status.resources : undefined
    const definedNamespace = resources?.[0].namespace

    // cache Argo app signature for filtering OCP apps later
    argoAppSet.add(
      `${argoApp.metadata.name}-${
        definedNamespace ?? argoApp.spec.destination.namespace
      }-${getArgoDestinationCluster(argoApp.spec.destination, clusters, getHubClusterName())}`
    )
    const isChildOfAppset =
      argoApp.metadata.ownerReferences && argoApp.metadata?.ownerReferences[0].kind === 'ApplicationSet'
    if (!argoApp.metadata.ownerReferences || !isChildOfAppset) {
      return true
    }
    return false
  })
}

function getRemoteArgoApps(argoAppSet: Set<string>, remoteArgoApps: IResource[]) {
  const argoApps = remoteArgoApps as unknown as IArgoAppRemoteResource[]
  const apps: IResource[] = []
  argoApps.forEach((argoApp: IArgoAppRemoteResource) => {
    argoAppSet.add(`${argoApp.name}-${argoApp.destinationNamespace}-${argoApp.cluster}`)
    if (!argoApp._hostingResource) {
      // Skip apps created by Argo pull model
      apps.push({
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
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

//////////////////////////////////////////////////////////////////
////////////// APP SET DATA /////////////////////////////////////////
//////////////////////////////////////////////////////////////////

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

//////// CREATE APPSET MAPS TO BE USED IN APP SET DETAILS////////////////////////
// apps: argo apps created by this appset
// clusters: clusters on which this appset has deployed
export function getAppSetAppsMap() {
  return appSetAppsMap || {}
}

function createAppSetAppsMap(applicationCache: ApplicationCacheType) {
  const argoApps: ITransformedResource[] = getApplicationsHelper(applicationCache, ['localArgoApps', 'remoteArgoApps'])
  appSetAppsMap = argoApps.reduce(
    (obj, argoApp) => {
      const appSetName = get(argoApp, 'metadata.ownerReferences[0].name') as string
      if (appSetName) {
        if (!obj[appSetName]) obj[appSetName] = []
        obj[appSetName].push(get(argoApp, 'metadata.name', 'unknown') as string)
      }
      return obj
    },
    {} as Record<string, string[]>
  )
}
