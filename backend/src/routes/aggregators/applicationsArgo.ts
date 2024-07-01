/* Copyright Contributors to the Open Cluster Management project */
import { RequestOptions } from 'https'
import { ISearchResult, getSearchResults, getServiceAccountOptions } from '../../lib/search'
import { IResource } from '../../resources/resource'
import { getKubeResources } from '../events'

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
        limit: 20000,
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
}

export async function getArgoApps() {
  const argoAppSet = new Set<string>()
  const localArgoApps = getLocalArgoApps(argoAppSet)
  const remoteArgoApps = await getRemoteArgoApps(argoAppSet)
  return { localArgoApps, remoteArgoApps, argoAppSet }
}

function getLocalArgoApps(argoAppSet: Set<string>) {
  const argoApps = getKubeResources('Application', 'argoproj.io/v1alpha1')
  return argoApps.filter((app) => {
    const argoApp = app as IArgoAppLocalResource
    const resources = argoApp.status ? argoApp.status.resources : undefined
    const definedNamespace = resources?.[0].namespace

    // cache Argo app signature for filtering OCP apps later
    argoAppSet.add(
      `${argoApp.metadata.name}-${
        definedNamespace ? definedNamespace : argoApp.spec.destination.namespace
      }-local-cluster)}`
      // }-${getArgoDestinationCluster(argoApp.spec.destination, managedClusters, 'local-cluster')}` //TODO
    )
    const isChildOfAppset =
      argoApp.metadata.ownerReferences && argoApp.metadata?.ownerReferences[0].kind === 'ApplicationSet'
    if (!argoApp.metadata.ownerReferences || !isChildOfAppset) {
      return true
    }
    return false
  })
}

async function getRemoteArgoApps(argoAppSet: Set<string>) {
  const options = await getServiceAccountOptions()
  const argoApps = await getPagedRemoteArgoApps(options)

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
        },
      } as IResource)
    }
  })

  return apps
}

// get argo apps from search api in three queries with a second apart
async function getPagedRemoteArgoApps(options: RequestOptions) {
  // a,i,n,etc are used with the hope that the distribution of names is evenly matched between queries
  let _query = structuredClone(query)
  _query.variables.input[0].filters.push({
    property: 'name',
    values: ['a*', 'i*', 'n*', 'e*', 'r*', 'o*'],
  })
  let results: ISearchResult = await getSearchResults(options, JSON.stringify(_query))
  let argoApps: IArgoAppRemoteResource[] = (results.data?.searchResult?.[0]?.items || []) as IArgoAppRemoteResource[]
  await new Promise((r) => setTimeout(r, 1000))
  _query = structuredClone(query)
  _query.variables.input[0].filters.push({
    property: 'name',
    values: ['s*', 't*', 'u*', 'l*', 'm*', 'c*', 'd*', 'b*', 'g*', '0*', '1*', '2*', '3*', '4*'],
  })
  results = await getSearchResults(options, JSON.stringify(_query))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  argoApps = argoApps.concat(results.data?.searchResult?.[0]?.items || [])
  await new Promise((r) => setTimeout(r, 1000))
  _query = structuredClone(query)
  _query.variables.input[0].filters.push({
    property: 'name',
    values: ['h*', 'p*', 'k*', 'y*', 'v*', 'z*', 'w*', 'f*', 'j*', 'q*', 'x*', '5*', '6*', '7*', '8*', '9*'],
  })
  results = await getSearchResults(options, JSON.stringify(_query))
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  argoApps = argoApps.concat(results.data?.searchResult?.[0]?.items || [])
  return argoApps
}
