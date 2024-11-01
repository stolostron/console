/* Copyright Contributors to the Open Cluster Management project */
import { logger } from '../../lib/logger'
import { getPagedSearchResources } from '../../lib/search'
import { IResource } from '../../resources/resource'
import { getKubeResources } from '../events'
import { ApplicationCacheType, generateTransforms } from './applications'

// query limit per letter
const ARGO_APP_QUERY_LIMIT = 20000
const query = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
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
        limit: ARGO_APP_QUERY_LIMIT,
      },
    ],
  },
  query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n  }\n}',
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

export async function getArgoApps(applicationCache: ApplicationCacheType, pass: number) {
  const argoAppSet = new Set<string>()
  try {
    applicationCache['localArgoApps'] = generateTransforms(getLocalArgoApps(argoAppSet))
  } catch (e) {
    logger.error(`getLocalArgoApps exception ${e}`)
  }
  try {
    applicationCache['remoteArgoApps'] = generateTransforms(await getRemoteArgoApps(argoAppSet, pass), true)
  } catch (e) {
    logger.error(`getRemoteArgoApps exception ${e}`)
  }
  return argoAppSet
}

function getLocalArgoApps(argoAppSet: Set<string>) {
  const argoApps = getKubeResources('Application', 'argoproj.io/v1alpha1')
  return argoApps.filter((app) => {
    const argoApp = app as IArgoAppLocalResource
    const resources = argoApp.status ? argoApp.status.resources : undefined
    const definedNamespace = resources?.[0].namespace

    // cache Argo app signature for filtering OCP apps later
    argoAppSet.add(
      `${argoApp.metadata.name}-${definedNamespace || argoApp.spec.destination.namespace}-local-cluster)}`
      // }-${getArgoDestinationCluster(argoApp.spec.destination, managedClusters, 'local-cluster')}`
    )
    const isChildOfAppset =
      argoApp.metadata.ownerReferences && argoApp.metadata?.ownerReferences[0].kind === 'ApplicationSet'
    if (!argoApp.metadata.ownerReferences || !isChildOfAppset) {
      return true
    }
    return false
  })
}

let usePagedQuery = true
async function getRemoteArgoApps(argoAppSet: Set<string>, pass: number) {
  const argoApps = (await getPagedSearchResources(
    query,
    usePagedQuery,
    'Remote ArgoCD',
    pass
  )) as unknown as IArgoAppRemoteResource[]
  usePagedQuery = argoApps.length > 1000

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
