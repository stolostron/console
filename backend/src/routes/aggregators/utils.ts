/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources } from '../events'
import { Cluster, ClusterDeployment, IResource, ManagedClusterInfo } from '../../resources/resource'
import { ITransformedResource } from '../../lib/pagination'
import {
  AppColumns,
  ApplicationCache,
  ApplicationCacheType,
  IArgoApplication,
  IDecision,
  IOCPApplication,
  ISubscription,
} from './applications'
import { logger } from '../../lib/logger'
import { getMultiClusterHub } from '../../lib/multi-cluster-hub'
import { getMultiClusterEngine } from '../../lib/multi-cluster-engine'

//////////////////////////////////////////////////////////////////
////////////// TRANSFORM /////////////////////////////////////////
//////////////////////////////////////////////////////////////////

export function transform(items: ITransformedResource[], clusters?: Cluster[], isRemote?: boolean): ApplicationCache {
  const subscriptions = getKubeResources('Subscription', 'apps.open-cluster-management.io/v1')
  const placementDecisions = getKubeResources('PlacementDecision', 'cluster.open-cluster-management.io/v1beta1')
  items.forEach((app) => {
    const type = getApplicationType(app)
    const _clusters = getApplicationClusters(app, type, subscriptions, placementDecisions, clusters)
    app.transform = [
      [app.metadata.name],
      [type],
      [getAppNamespace(app)],
      _clusters,
      ['r'], // repo
      ['t'], // time window
      [app.metadata.creationTimestamp as string],
    ]
    app.isRemote = isRemote
  })
  return { resources: items }
}

function getAppNamespace(resource: IResource): string {
  let namespace = resource.metadata?.namespace
  if (resource.apiVersion === 'argoproj.io/v1alpha1' && resource.kind === 'Application') {
    const argoApp = resource as IArgoApplication
    namespace = argoApp.spec.destination.namespace
  }
  return namespace
}
function getApplicationType(resource: IResource | IOCPApplication) {
  if (resource.apiVersion === 'app.k8s.io/v1beta1') {
    if (resource.kind === 'Application') {
      return 'subscription'
    }
  } else if (resource.apiVersion === 'argoproj.io/v1alpha1') {
    if (resource.kind === 'Application') {
      return 'argo'
    } else if (resource.kind === 'ApplicationSet') {
      return 'appset'
    }
  } else if ('label' in resource) {
    const isFlux = isFluxApplication(resource.label)
    if (isFlux) {
      return 'flux'
    } else if (isSystemApp(resource.metadata?.namespace)) {
      return 'openshift-default'
    }
    return 'openshift'
  }
  return '-'
}

const fluxAnnotations = {
  helm: ['helm.toolkit.fluxcd.io/name', 'helm.toolkit.fluxcd.io/namespace'],
  git: ['kustomize.toolkit.fluxcd.io/name', 'kustomize.toolkit.fluxcd.io/namespace'],
}

function isFluxApplication(label: string) {
  let isFlux = false
  Object.entries(fluxAnnotations).forEach(([, values]) => {
    const [nameAnnotation, namespaceAnnotation] = values
    if (label.includes(nameAnnotation) && label.includes(namespaceAnnotation)) {
      isFlux = true
    }
  })
  return isFlux
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

function getApplicationClusters(
  resource: IResource | IOCPApplication | IArgoApplication,
  type: string,
  subscriptions: IResource[],
  placementDecisions: IResource[],
  clusters: Cluster[] = []
) {
  switch (type) {
    case 'flux':
    case 'openshift':
    case 'openshift-default':
      if ('status' in resource) {
        return [resource?.status?.cluster]
      }
      break
    case 'argo':
      if ('spec' in resource) {
        return [getArgoCluster(resource, clusters)]
      }
      break
    case 'appset': //(also argo)
      if ('spec' in resource) {
        return getAppSetCluster(resource, placementDecisions as IArgoApplication[])
      }
      break
    case 'subscription':
      return getSubscriptionCluster(resource, subscriptions, placementDecisions)
  }
  return ['local-cluster']
}

function getAppSetCluster(resource: IArgoApplication, placementDecisions: IDecision[]) {
  const clusterSet = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const placementName =
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    resource?.spec.generators[0].clusterDecisionResource.labelSelector.matchLabels[
      'cluster.open-cluster-management.io/placement'
    ] || ''
  const placementNamespace = resource?.metadata.namespace || ''
  const placementDecision = placementDecisions.find(
    (pd) =>
      pd.metadata.labels?.['cluster.open-cluster-management.io/placement'] === placementName &&
      pd.metadata.namespace === placementNamespace
  )
  /* istanbul ignore next */
  const clusterDecisions = placementDecision?.status?.decisions || []

  clusterDecisions.forEach((cd: { clusterName: string }) => {
    if (cd.clusterName !== 'local-cluster') {
      clusterSet.add(cd.clusterName)
    }
  })
  return Array.from(clusterSet)
}

function getSubscriptionCluster(resource: IResource, subscriptions: ISubscription[], placementDecisions: IDecision[]) {
  const clusterSet = new Set<string>()
  const subAnnotationArray = getSubscriptionAnnotations(resource)
  for (const sa of subAnnotationArray) {
    if (isLocalSubscription(sa, subAnnotationArray)) {
      // skip local sub
      continue
    }

    const subDetails = sa.split('/')
    subscriptions.forEach((sub) => {
      if (sub.metadata.name === subDetails[1] && sub.metadata.namespace === subDetails[0]) {
        const placementRef = sub.spec.placement?.placementRef
        const placement = placementDecisions.find(
          (placementDecision) =>
            placementDecision.metadata.labels?.['cluster.open-cluster-management.io/placement'] ===
              placementRef?.name ||
            placementDecision.metadata.labels?.['cluster.open-cluster-management.io/placementrule'] ===
              placementRef?.name
        )

        const decisions = placement?.status?.decisions

        if (decisions) {
          decisions.forEach((cluster: { clusterName: string }) => {
            clusterSet.add(cluster.clusterName)
          })
        }
      }
    })
  }
  return Array.from(clusterSet)
}

const localSubSuffixStr = '-local'
const subAnnotationStr = 'apps.open-cluster-management.io/subscriptions'

function getSubscriptionAnnotations(resource: IResource) {
  const subAnnotation = resource.metadata?.annotations ? resource.metadata?.annotations[subAnnotationStr] : undefined
  return subAnnotation ? subAnnotation.split(',') : []
}

const isLocalSubscription = (subName: string, subList: string[]) => {
  return subName.endsWith(localSubSuffixStr) && subList.indexOf(subName.replace(localSubSuffixStr, '')) !== -1
}

function getArgoCluster(resource: IArgoApplication, clusters: Cluster[]) {
  if (resource.status?.cluster) {
    return resource.status?.cluster
  } else if (
    resource.spec.destination?.name === 'in-cluster' ||
    resource.spec.destination?.name === 'local-cluster' ||
    resource.spec.destination?.server === 'https://kubernetes.default.svc'
  ) {
    return 'local-cluster'
  } else {
    return getArgoDestinationCluster(resource.spec.destination, clusters, resource.status.cluster)
  }
}

export function getArgoDestinationCluster(
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

//////////////////////////////////////////////////////////////////
// /////////////////// map created from events.ts /////////////////
//////////////////////////////////////////////////////////////////
export type ClusterMapType = {
  [key: string]: IResource
}
export function getClusterMap(): ClusterMapType {
  const managedClusters = getKubeResources('ManagedCluster', 'cluster.open-cluster-management.io/v1')
  return managedClusters.reduce((clusterMap, cluster) => {
    if (cluster.metadata.name) {
      clusterMap[cluster.metadata.name] = cluster
    }
    return clusterMap
  }, {} as ClusterMapType)
}

/////////////////////////////////////////////////////////////////////////////////
// ///////// DISTRIBUTE APP QUERIES OVER MULTIPLE SEARCHES /////////////////////
////////////////////////////////////////////////////////////////////////////////
export type ApplicationPageChunk = {
  keys?: string[]
  limit: number
}

export function getNextApplicationPageChunk(
  applicationCache: ApplicationCacheType,
  applicationPageChunks: ApplicationPageChunk[],
  remoteCacheKey: string
): ApplicationPageChunk {
  // if no cluster name chucks left, create a new array of chunks
  if (applicationPageChunks.length === 0) {
    // get all apps
    let applications: ITransformedResource[] = []
    if (applicationCache[remoteCacheKey].resources) {
      applications = applicationCache[remoteCacheKey].resources
    } else if (applicationCache[remoteCacheKey].resourceMap) {
      applications = Object.values(applicationCache[remoteCacheKey].resourceMap).flat()
    }
    if (applications.length) {
      // create array of frequency of name prefixes
      const a = 'a'.charCodeAt(0)
      const z = '0'.charCodeAt(0)
      const sz = 26 + 10
      const prefixFrequency = new Array(sz).fill(0) as number[]
      applications.forEach((app) => {
        const name = app.transform[AppColumns.name][0]
        const ltr = name.charCodeAt(0)
        const index = ltr < a ? ltr - z + 26 : ltr - a
        prefixFrequency[index]++
      })

      // create applicationPageChunks
      const pageChunks = Math.ceil(applications.length / Number(process.env.APP_SEARCH_LIMIT))
      const appsPerChunk = Math.ceil(applications.length / pageChunks)
      let currentPageChunk: ApplicationPageChunk = {
        limit: 0,
        keys: [],
      }
      prefixFrequency.forEach((n, inx) => {
        currentPageChunk.keys.push(`${String.fromCharCode(inx + (inx < 26 ? a : z - 26))}*`)
        currentPageChunk.limit += n
        // start a new page if limit exceeds page maximum
        // but consolidate letters that have no occurance with this one
        if (currentPageChunk.limit > appsPerChunk && inx < sz && prefixFrequency[inx + 1]) {
          applicationPageChunks.push(currentPageChunk)
          currentPageChunk = {
            limit: 0,
            keys: [],
          }
        }
      })
      // unless there are multiple pages, ignore paging
      if (applicationPageChunks.length) {
        applicationPageChunks.push(currentPageChunk)
      }
    }

    // REDISTRIBUTE apps
    if (applicationPageChunks.length) {
      delete applicationCache[remoteCacheKey].resources

      // if there were no keys before, or the keys changed, redistribute apps
      if (
        !applicationCache[remoteCacheKey].resourceMap ||
        !applicationPageChunks.every(({ keys }) => !!applicationCache[remoteCacheKey].resourceMap[keys.join()])
      ) {
        applicationCache[remoteCacheKey].resourceMap = {}
        applicationPageChunks.forEach(({ keys }) => {
          applicationCache[remoteCacheKey].resourceMap[keys.join()] = []
        })

        // create a key to values map
        const reverse: Record<string, IResource[]> = {}
        Object.entries(applicationCache[remoteCacheKey].resourceMap).forEach(([key, value]) => {
          key.split(',').forEach((k) => {
            reverse[k[0]] = value
          })
        })
        // for each app name, stuff it into the array that belongs to that key
        applications.forEach((app) => {
          const name = app.transform[AppColumns.name][0]
          const ltr = name[0]
          reverse[ltr].push(app)
        })
      }
    } else {
      // if no keys but there were keys before, delete old resourceMap
      delete applicationCache[remoteCacheKey].resourceMap
      return
    }
  }
  return applicationPageChunks.shift()
}

export function cacheRemoteApps(
  applicationCache: ApplicationCacheType,
  remoteApps: IResource[],
  applicationPageChunk: ApplicationPageChunk,
  remoteCacheKey: string
) {
  const resources = transform(remoteApps, undefined, true).resources
  if (!applicationPageChunk) {
    applicationCache[remoteCacheKey].resources = resources
  } else {
    applicationCache[remoteCacheKey].resourceMap[applicationPageChunk.keys.join()] = resources
  }
}

//////////////////////////////////////////////////////////////////
// /////////////////// MINI useAllClusters from frontend /////////////////
//////////////////////////////////////////////////////////////////

// stream lined version of map clusters in frontend
export function getClusters(): Cluster[] {
  const managedClusters = getKubeResources('ManagedCluster', 'cluster.open-cluster-management.io/v1')
  const clusterDeployments = getKubeResources('ClusterDeployment', 'hive.openshift.io/v1')
  const managedClusterInfos = getKubeResources('ManagedClusterInfo', 'internal.open-cluster-management.io/v1beta1')
  const hostedClusters = getKubeResources('HostedCluster', 'hypershift.openshift.io/v1beta1')
  const mcs = managedClusters.filter((mc) => mc.metadata?.name) ?? []
  const cds = clusterDeployments.filter(
    // CDs with AgentCluster as owner are just meta objects for AI. We can ignore them.
    (cd) => (cd.metadata.ownerReferences ? !cd.metadata.ownerReferences.some((o) => o.kind === 'AgentCluster') : true)
  )
  const uniqueClusterNames = Array.from(
    new Set([
      ...cds.map((cd) => cd.metadata.name),
      ...managedClusterInfos.map((mc) => mc.metadata.name),
      ...mcs.map((mc) => mc.metadata.name),
      ...hostedClusters.map((hc) => hc.metadata?.name),
    ])
  )
  const managedClusterMap = keyBy(managedClusters, 'metadata.name')
  const hostedClusterMap = keyBy(hostedClusters, 'metadata.name')
  const clusterDeploymentsMap = keyBy(cds, 'metadata.name')
  const managedClusterInfosMap = keyBy(managedClusterInfos, 'metadata.name')
  return uniqueClusterNames.map((cluster) => {
    const managedCluster = managedClusterMap[cluster]
    const hostedCluster = hostedClusterMap[cluster]
    const clusterDeployment = clusterDeploymentsMap[cluster]
    const managedClusterInfo = managedClusterInfosMap[cluster]
    return {
      name:
        clusterDeployment?.metadata.name ??
        managedCluster?.metadata.name ??
        managedClusterInfo?.metadata.name ??
        hostedCluster?.metadata?.name ??
        '',
      kubeApiServer: getKubeApiServer(clusterDeployment, managedClusterInfo),
    }
  })
}

function getKubeApiServer(clusterDeployment?: ClusterDeployment, managedClusterInfo?: ManagedClusterInfo) {
  return (
    clusterDeployment?.status?.apiURL ??
    managedClusterInfo?.spec?.masterEndpoint ??
    `https://api.${clusterDeployment?.spec?.clusterName || ''}.${clusterDeployment?.spec?.baseDomain || ''}`
  )
}

//////////////////////////////////////////////////////////////////
///////////////////////////// LOGGING ////////////////////////////
//////////////////////////////////////////////////////////////////

type AppCountType = {
  [type: string]: number
}
const appCount: AppCountType = {}
const appCountKeys = [
  'localArgoApps',
  'remoteArgoApps',
  'localOCPApps',
  'remoteOCPApps',
  'localSysApps',
  'remoteSysApps',
]
appCountKeys.forEach((key) => {
  appCount[key] = 0
})

export function logApplicationCountChanges(applicationCache: ApplicationCacheType, pass: number) {
  let change = false
  appCountKeys.forEach((key) => {
    let count
    if (applicationCache[key].resourceMap) {
      count = Object.values(applicationCache[key].resourceMap).flat().length
    } else {
      count = applicationCache[key].resources.length
    }
    if (count !== appCount[key]) {
      change = true
      appCount[key] = count
    }
  })
  if (change) {
    logger.info({
      msg: 'search change',
      appCount,
    })
  } else if (pass % 50 === 0) {
    logger.info({
      msg: 'search',
      appCount,
    })
  }
}

//////////////////////////////////////////////////////////////////
///////////////// A LITTLE BIT OF LODASH ////////////////
//////////////////////////////////////////////////////////////////
interface ResultType {
  [key: string]: IResource
}

type SelectorType = string | ((item: IResource) => string)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function get(obj: any, path: string): string {
  const keys = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let current = obj
  for (const key of keys) {
    if (current && key in current) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      current = current[key]
    } else {
      return undefined // Path not found
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return current
}

function keyBy(array: IResource[], selector: SelectorType) {
  const result: ResultType = {}
  for (const item of array) {
    const key = typeof selector === 'string' ? get(item, selector) : selector(item)
    result[key] = item
  }
  return result
}
