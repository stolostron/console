/* Copyright Contributors to the Open Cluster Management project */
import { logger } from '../../lib/logger'
import { Cluster, IResource } from '../../resources/resource'
import { getKubeResources } from '../events'
import { ApplicationCacheType, IQuery } from './applications'
import { getClusters, transform } from './utils'

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

export function addArgoQueryInputs(query: IQuery, searchLimit: number) {
  query.variables.input.push({
    filters: [
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
        values: ['!local-cluster'],
      },
    ],
    limit: searchLimit,
  })
  return searchLimit
}

export function cacheArgoApplications(applicationCache: ApplicationCacheType, remoteArgoApps: IResource[]) {
  const argoAppSet = new Set<string>()
  const clusters: Cluster[] = getClusters()
  try {
    applicationCache['localArgoApps'] = transform(getLocalArgoApps(argoAppSet, clusters))
  } catch (e) {
    logger.error(`getLocalArgoApps exception ${e}`)
  }
  try {
    applicationCache['remoteArgoApps'] = transform(getRemoteArgoApps(argoAppSet, remoteArgoApps), clusters, true)
  } catch (e) {
    logger.error(`getRemoteArgoApps exception ${e}`)
  }
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
        definedNamespace ? definedNamespace : argoApp.spec.destination.namespace
      }-${getArgoDestinationCluster(argoApp.spec.destination, clusters, 'local-cluster')}`
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
    if (serverApi === 'https://kubernetes.default.svc') {
      clusterName = cluster ?? 'Local'
    } else {
      const server = clusters.find((cls) => cls.kubeApiServer === serverApi)
      clusterName = server ? server.name : 'unknown'
    }
  } else {
    // target destination was set using the name property
    clusterName = destination?.name || 'unknown'
    if (cluster && (clusterName === 'in-cluster' || clusterName === 'local-cluster')) {
      clusterName = cluster
    }

    if (clusterName === 'in-cluster') {
      clusterName = 'local-cluster'
    }
  }
  return clusterName
}
