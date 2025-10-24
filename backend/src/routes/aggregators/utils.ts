/* Copyright Contributors to the Open Cluster Management project */
import get from 'get-value'
import { getKubeResources, getHubClusterName, getEventCache, getEventDict } from '../events'
import {
  Cluster,
  IResource,
  ManagedClusterInfo,
  IArgoApplication,
  IPlacementDecision,
  ISubscription,
  IOCPApplication,
  IApplicationSet,
  ManagedCluster,
  ClusterDeployment,
  HostedClusterK8sResource,
  ISearchResource,
  SearchResult,
} from '../../resources/resource'
import {
  AppColumns,
  ApplicationCache,
  ApplicationCacheType,
  ApplicationClusterStatusMap,
  ScoreColumn,
  ApplicationStatuses,
  ApplicationStatusMap,
  getAppDict,
  ICompressedResource,
  ITransformedResource,
  Transform,
  StatusColumn,
  ApplicationStatusEntry,
} from './applications'
import { logger } from '../../lib/logger'
import { getMultiClusterHub } from '../../lib/multi-cluster-hub'
import { getMultiClusterEngine } from '../../lib/multi-cluster-engine'
import { ServerSideEvents } from '../../lib/server-side-events'
import { getPulledAppSetMap, getPushedAppSetMap, IArgoAppRemoteResource } from './applicationsArgo'
import { deflateResource, inflateApp } from '../../lib/compression'

//////////////////////////////////////////////////////////////////
////////////// TRANSFORM /////////////////////////////////////////
//////////////////////////////////////////////////////////////////

export function transform(
  items: ITransformedResource[] | ICompressedResource[],
  argoClusterStatusMap: ApplicationClusterStatusMap,
  isRemote?: boolean,
  localCluster?: Cluster,
  clusters?: Cluster[],
  itemMap?: Record<string, ICompressedResource>
): ApplicationCache {
  const subscriptions = getKubeResources('Subscription', 'apps.open-cluster-management.io/v1')
  const placementDecisions = getKubeResources('PlacementDecision', 'cluster.open-cluster-management.io/v1beta1')
  const localClusterName = getHubClusterName()
  items.forEach((app, inx) => {
    app = inflateApp(app)
    const type = getApplicationType(app)
    const _clusters = getApplicationClusters(app, type, subscriptions, placementDecisions, localCluster, clusters)
    items[inx] = {
      transform: getTransform(app, type, argoClusterStatusMap, _clusters),
      remoteClusters:
        (isRemote || (type === 'subscription' && _clusters.filter((n) => n !== localClusterName)).length > 0) &&
        _clusters,
      compressed: deflateResource(app, getAppDict()),
    }
    if (itemMap) {
      itemMap[app.metadata.uid] = items[inx]
    }
  }) as unknown as ICompressedResource[]
  return { resources: items as unknown as ICompressedResource[] }
}

export function getTransform(
  app: IResource,
  type: string,
  clusterStatusMap: ApplicationClusterStatusMap,
  clusters: string[]
): Transform {
  const statusKey = `${type}/${app.metadata.namespace}/${app.metadata.name}`
  const appStatuses = clusterStatusMap[statusKey] || {}
  const appScores = getAppStatusScores(clusters, appStatuses)
  return [
    [app.metadata.name],
    [type],
    [getAppNamespace(app)],
    clusters,
    [appStatuses],
    [appScores],
    [app.metadata.creationTimestamp as string],
  ]
}

export function getAppNamespace(resource: IResource): string {
  let namespace = resource.metadata?.namespace
  if (resource.apiVersion === 'argoproj.io/v1alpha1' && resource.kind === 'Application') {
    const argoApp = resource as IArgoApplication
    namespace = argoApp.spec.destination.namespace
  }
  return namespace
}
export function getApplicationType(resource: IResource | IOCPApplication) {
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

//////////////////////////////////////////////////////////////////
////////////// COMPUTE STATUSES /////////////////////////////////////////
//////////////////////////////////////////////////////////////////
const resErrorStates = [
  'err',
  'off',
  'invalid',
  'kill',
  'propagationfailed',
  'imagepullbackoff',
  'crashloopbackoff',
  'lost',
]
const resWarningStates = ['pending', 'creating', 'terminating']

export function computeAppHealthStatus(health: ApplicationStatusEntry, app: ISearchResource) {
  switch (app.healthStatus) {
    case 'Healthy':
      health[StatusColumn.counts][ScoreColumn.healthy]++
      break
    case 'Degraded':
      health[StatusColumn.counts][ScoreColumn.danger]++
      extractMessages(health, app, app.healthStatus)
      break
    case 'Progressing':
      health[StatusColumn.counts][ScoreColumn.progress]++
      extractMessages(health, app, app.healthStatus)
      break
    default:
      health[StatusColumn.counts][ScoreColumn.warning]++
      extractMessages(health, app, app.healthStatus)
      break
  }
}

export function computeAppSyncStatus(synced: ApplicationStatusEntry, app: ISearchResource) {
  switch (app.syncStatus) {
    case 'Synced':
      synced[StatusColumn.counts][ScoreColumn.healthy]++
      break
    case 'OutOfSync':
      synced[StatusColumn.counts][ScoreColumn.danger]++
      extractMessages(synced, app, app.syncStatus)
      break
    case 'Unknown':
      synced[StatusColumn.counts][ScoreColumn.warning]++
      extractMessages(synced, app, app.syncStatus)
      break
    default:
      synced[StatusColumn.counts][ScoreColumn.danger]++
      extractMessages(synced, app, app.syncStatus)
      break
  }
}

function createResourceMap(related: SearchResult['related'], kind: string): Map<string, ISearchResource[]> {
  const map = new Map<string, ISearchResource[]>()
  const relatedItems = related?.find((r) => r.kind === kind)
  relatedItems?.items.forEach((item: ISearchResource) => {
    item._relatedUids.forEach((uid) => {
      if (map.has(uid)) {
        map.get(uid).push(item)
      } else {
        map.set(uid, [item])
      }
    })
  })
  return map
}

export function computeDeployedPodStatuses(
  related: SearchResult['related'],
  app2AppsetMap: Record<string, ApplicationStatuses>
) {
  // create maps for deployment and replica set
  const deploymentMap = createResourceMap(related, 'Deployment')
  const replicaSetMap = createResourceMap(related, 'ReplicaSet')
  const podMap = createResourceMap(related, 'Pod')
  Object.keys(app2AppsetMap).forEach((appUid) => {
    const appStatuses = app2AppsetMap[appUid]
    if (appStatuses) {
      if (
        appStatuses.health[StatusColumn.counts][ScoreColumn.healthy] > 0 &&
        appStatuses.synced[StatusColumn.counts][ScoreColumn.healthy] > 0
      ) {
        if (computepDeployedStatus(appStatuses.deployed, deploymentMap.get(appUid))) {
          if (computepDeployedStatus(appStatuses.deployed, replicaSetMap.get(appUid))) {
            const pods = podMap.get(appUid)
            if (pods) {
              computePodStatus(appStatuses.deployed, pods)
            } else {
              const replicaSet = replicaSetMap.get(appUid)?.[0]
              if (replicaSet) {
                appStatuses.deployed[StatusColumn.counts][ScoreColumn.warning] += Number(replicaSet.desired)
              } else {
                appStatuses.deployed[StatusColumn.counts] = [0, 0, 0, 0]
              }
            }
          }
        }
      }
    }
  })
}

export function computepDeployedStatus(deployed: ApplicationStatusEntry, items: ISearchResource[]) {
  let allHealthy = true
  if (items && items.length) {
    items.forEach((item) => {
      const available = Number(item.available || item.current || 0)
      const desired = Number(item.desired ?? 0)

      if (available === desired) {
        // nothing--drop through to success
      } else if (available < desired) {
        deployed[StatusColumn.counts][ScoreColumn.progress]++
        extractMessages(deployed, item)
        allHealthy = false
      } else if (desired <= 0) {
        deployed[StatusColumn.counts][ScoreColumn.progress]++
        extractMessages(deployed, item)
        allHealthy = false
      } else if (!desired && available === 0) {
        deployed[StatusColumn.counts][ScoreColumn.danger]++
        extractMessages(deployed, item)
        allHealthy = false
      }
    })
  }
  return allHealthy
}

export function computePodStatuses(
  related: SearchResult['related'],
  app2AppsetMap: Record<string, ApplicationStatuses>
) {
  const podMap = createResourceMap(related, 'Pod')
  Object.keys(app2AppsetMap).forEach((appUid) => {
    const appStatuses = app2AppsetMap[appUid]
    if (appStatuses) {
      const pods = podMap.get(appUid)
      if (pods) {
        computePodStatus(appStatuses.deployed, pods)
      }
    }
  })
}

function computePodStatus(deployed: ApplicationStatusEntry, pods: ISearchResource[]) {
  pods.forEach((pod) => {
    const status = pod.status.toLocaleLowerCase()
    if (resErrorStates.includes(status)) {
      deployed[StatusColumn.counts][ScoreColumn.danger]++
      extractMessages(deployed, pod, status)
    } else if (resWarningStates.includes(status)) {
      deployed[StatusColumn.counts][ScoreColumn.warning]++
      extractMessages(deployed, pod, status)
    }
    deployed[StatusColumn.counts][ScoreColumn.healthy]++
  })
}

function getAppStatusScores(clusters: string[], appStatuses: ApplicationStatusMap) {
  return {
    [AppColumns.health]: getAppStatusScore(clusters, appStatuses, AppColumns.health),
    [AppColumns.synced]: getAppStatusScore(clusters, appStatuses, AppColumns.synced),
    [AppColumns.deployed]: getAppStatusScore(clusters, appStatuses, AppColumns.deployed),
  }
}

function getAppStatusScore(clusters: string[], statuses: ApplicationStatusMap, index: AppColumns) {
  let score = 0
  clusters.forEach((cluster) => {
    const stats = statuses[cluster]
    if (stats) {
      let column: number[]
      switch (index) {
        case AppColumns.health:
          column = stats.health[StatusColumn.counts]
          break
        case AppColumns.synced:
          column = stats.synced[StatusColumn.counts]
          break
        case AppColumns.deployed:
          column = stats.deployed[StatusColumn.counts]
          break
      }
      if (column) {
        score =
          column[ScoreColumn.danger] * 100000 +
          column[ScoreColumn.warning] * 10000 +
          column[ScoreColumn.progress] * 1000 +
          column[ScoreColumn.healthy]
      }
    }
  })
  return score
}

export function extractMessages(ase: ApplicationStatusEntry, app: ISearchResource, status?: string) {
  if (status) {
    ase[StatusColumn.messages].push({ key: 'Status', value: status })
  }
  Object.entries(app).forEach((entry: [string, string]) => {
    if (entry[0].startsWith('_') && (entry[0].includes('condition') || entry[0].includes('missing'))) {
      ase[StatusColumn.messages].push({ key: entry[0], value: entry[1] })
    }
  })
}

//////////////////////////////////////////////////////////////////
////////////// OTHER /////////////////////////////////////////
//////////////////////////////////////////////////////////////////

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

export function getApplicationClusters(
  resource: IResource | IOCPApplication | IArgoApplication,
  type: string,
  subscriptions: IResource[],
  placementDecisions: IResource[],
  localCluster: Cluster,
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
    case 'appset':
      if ('spec' in resource) {
        if (isArgoPullModel(resource as IApplicationSet)) {
          const apps = getPulledAppSetMap()[resource.metadata?.name] || []
          return getArgoPullModelClusterList(apps)
        } else {
          const apps = getPushedAppSetMap()[resource.metadata?.name] || []
          return getArgoPushModelClusterList(apps, localCluster, clusters)
        }
      }
      break
    case 'subscription':
      return getSubscriptionCluster(resource, subscriptions, placementDecisions)
  }
  return [getHubClusterName()]
}

const isArgoPullModel = (resource: IApplicationSet) => {
  if (
    get(resource, [
      'spec',
      'template',
      'metadata',
      'annotations',
      'apps.open-cluster-management.io/ocm-managed-cluster',
    ])
  ) {
    return true
  }
  return false
}

function getArgoPullModelClusterList(apps: IArgoAppRemoteResource[]) {
  const clusterSet = new Set<string>()
  apps.forEach((app) => {
    clusterSet.add(app.cluster)
  })
  return Array.from(clusterSet)
}

export const getArgoPushModelClusterList = (
  resources: IArgoApplication[],
  localCluster: Cluster | undefined,
  managedClusters: Cluster[]
) => {
  const clusterSet = new Set<string>()

  resources.forEach((resource) => {
    const isRemoteArgoApp = !!resource.status?.cluster

    if (isLocalClusterURL(resource.spec.destination?.server ?? '', localCluster) || !isRemoteArgoApp) {
      clusterSet.add(localCluster?.name ?? '')
    } else if (isRemoteArgoApp) {
      clusterSet.add(
        getArgoDestinationCluster(
          resource.spec.destination,
          managedClusters,
          resource.status.cluster,
          localCluster?.name
        )
      )
    } else {
      clusterSet.add(
        getArgoDestinationCluster(resource.spec.destination, managedClusters, undefined, localCluster?.name)
      )
    }
  })

  return Array.from(clusterSet)
}

function isLocalClusterURL(url: string, localCluster: Cluster | undefined) {
  if (url === 'https://kubernetes.default.svc') {
    return true
  }

  let argoServerURL
  const localClusterURL = new URL(
    (get(localCluster || {}, 'consoleURL', { default: 'https://localhost' }) as string) || 'https://localhost'
  )

  try {
    argoServerURL = new URL(url)
  } catch {
    return false
  }

  const hostnameWithOutAPI = argoServerURL.hostname.substring(argoServerURL.hostname.indexOf('api.') + 4)

  if (localClusterURL.host.indexOf(hostnameWithOutAPI) > -1) {
    return true
  }
  return false
}

function getSubscriptionCluster(
  resource: IResource,
  subscriptions: ISubscription[],
  placementDecisions: IPlacementDecision[]
) {
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
  return subName.endsWith(localSubSuffixStr) && subList.indexOf(subName.slice(0, -localSubSuffixStr.length)) !== -1
}

function getArgoCluster(resource: IArgoApplication, clusters: Cluster[]) {
  if (resource.status?.cluster) {
    return resource.status?.cluster
  } else if (
    resource.spec.destination?.name === 'in-cluster' ||
    resource.spec.destination?.name === getHubClusterName() ||
    resource.spec.destination?.server === 'https://kubernetes.default.svc'
  ) {
    return getHubClusterName()
  } else {
    return getArgoDestinationCluster(resource.spec.destination, clusters, resource.status.cluster)
  }
}

export function getArgoDestinationCluster(
  destination: { name?: string; namespace: string; server?: string },
  clusters: Cluster[],
  cluster?: string,
  hubClusterName?: string
) {
  // cluster is the name of the managed cluster where the Argo app is defined
  let clusterName
  const serverApi = destination?.server
  if (serverApi) {
    if (serverApi === 'https://kubernetes.default.svc') {
      clusterName = cluster || hubClusterName
    } else {
      const server = clusters.find((cls) => cls.kubeApiServer === serverApi)
      clusterName = server ? server.name : 'unknown'
    }
  } else {
    // target destination was set using the name property
    clusterName = destination?.name || 'unknown'
    if (cluster && (clusterName === 'in-cluster' || clusterName === hubClusterName)) {
      clusterName = cluster
    }

    if (clusterName === 'in-cluster') {
      clusterName = hubClusterName
    }
  }

  return clusterName
}

////////////////////////////////////////////////////////////////////////////////////////////////
// /////////////////// map created from cluster kube resources collected by events.ts /////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
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
    let applications: ICompressedResource[] = []
    if (applicationCache[remoteCacheKey]?.resources) {
      applications = applicationCache[remoteCacheKey].resources
    } else if (applicationCache[remoteCacheKey]?.resourceMap) {
      applications = Object.values(applicationCache[remoteCacheKey].resourceMap).flat()
    }
    if (applications.length) {
      // create array of frequency of name prefixes
      const a = 'a'.charCodeAt(0)
      const z = '0'.charCodeAt(0)
      const sz = 26 + 10
      const prefixFrequency = new Array(sz).fill(0) as number[]
      applications.forEach((app) => {
        const name = app.transform[AppColumns.name][0] as string
        const ltr = name.charCodeAt(0)
        const index = ltr < a ? ltr - z + 26 : ltr - a
        prefixFrequency[index]++
      })

      // create applicationPageChunks
      let currentPageChunk: ApplicationPageChunk = {
        limit: 0,
        keys: [],
      }
      prefixFrequency.forEach((n, inx) => {
        currentPageChunk.keys.push(`${String.fromCharCode(inx + (inx < 26 ? a : z - 26))}*`)
        currentPageChunk.limit += n
        // start a new page if limit exceeds page maximum
        // but consolidate letters that have no occurance with this one
        if (
          currentPageChunk.limit + (inx < sz ? prefixFrequency[inx + 1] : 0) >
          (Number(process.env.APP_SEARCH_LIMIT) || 5000)
        ) {
          applicationPageChunks.push(currentPageChunk)
          currentPageChunk = {
            limit: 0,
            keys: [],
          }
        }
      })

      if (currentPageChunk.limit === 0 && applicationPageChunks.length && applicationPageChunks.length === 1) {
        applicationPageChunks.length = 0
      }
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
        const reverse: Record<string, ICompressedResource[]> = {}
        Object.entries(applicationCache[remoteCacheKey].resourceMap).forEach(([key, value]) => {
          key.split(',').forEach((k) => {
            reverse[k[0]] = value
          })
        })
        // for each app name, stuff it into the array that belongs to that key
        applications.forEach((app) => {
          const name = app.transform[AppColumns.name][0] as string
          reverse[name[0]].push(app)
        })
      }
    } else if (applicationCache[remoteCacheKey]?.resources) {
      // if no keys but there were keys before, delete old resourceMap
      applicationCache[remoteCacheKey].resources = applications
      delete applicationCache[remoteCacheKey].resourceMap
      return
    }
  }
  return applicationPageChunks.shift()
}

export function cacheRemoteApps(
  applicationCache: ApplicationCacheType,
  argoClusterStatusMap: ApplicationClusterStatusMap,
  remoteApps: IResource[],
  applicationPageChunk: ApplicationPageChunk,
  remoteCacheKey: string
) {
  const resources = transform(remoteApps, argoClusterStatusMap, true).resources
  if (!applicationPageChunk) {
    applicationCache[remoteCacheKey].resources = resources
  } else {
    applicationCache[remoteCacheKey].resourceMap[applicationPageChunk.keys.join()] = resources
  }
}

export function getApplicationsHelper(applicationCache: ApplicationCacheType, keys: string[]) {
  const items: ICompressedResource[] = []
  keys.forEach((key) => {
    if (applicationCache[key]?.resources) {
      items.push(...applicationCache[key].resources)
    } else if (applicationCache[key]?.resourceUidMap) {
      const allResources = Object.values(applicationCache[key].resourceUidMap)
      items.push(...allResources)
    } else if (applicationCache[key]?.resourceMap) {
      const allResources = Object.values(applicationCache[key].resourceMap)
      items.push(...allResources.flat())
    }
  })
  return items
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
    const managedCluster = managedClusterMap[cluster] as ManagedCluster
    const hostedCluster = hostedClusterMap[cluster]
    const clusterDeployment = clusterDeploymentsMap[cluster] as ClusterDeployment
    const managedClusterInfo = managedClusterInfosMap[cluster] as ManagedClusterInfo
    const consoleURL = getConsoleUrl(clusterDeployment, managedClusterInfo, managedCluster, hostedCluster)
    return {
      name:
        clusterDeployment?.metadata.name ??
        managedCluster?.metadata.name ??
        managedClusterInfo?.metadata.name ??
        hostedCluster?.metadata?.name ??
        '',
      kubeApiServer: getKubeApiServer(clusterDeployment, managedClusterInfo),
      consoleURL,
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
export function getConsoleUrl(
  clusterDeployment?: ClusterDeployment,
  managedClusterInfo?: ManagedClusterInfo,
  managedCluster?: ManagedCluster,
  hostedCluster?: HostedClusterK8sResource
) {
  const consoleUrlClaim = managedCluster?.status?.clusterClaims?.find(
    (cc) => cc.name === 'consoleurl.cluster.open-cluster-management.io'
  )
  if (consoleUrlClaim) return consoleUrlClaim.value
  return (
    clusterDeployment?.status?.webConsoleURL ??
    managedClusterInfo?.status?.consoleURL ??
    getHypershiftConsoleURL(hostedCluster)
  )
}

const getHypershiftConsoleURL = (hostedCluster?: HostedClusterK8sResource) => {
  if (!hostedCluster) {
    return undefined
  }
  return `https://console-openshift-console.apps.${hostedCluster.metadata?.name}.${hostedCluster.spec?.dns.baseDomain}`
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
    if (applicationCache[key]?.resourceMap) {
      count = Object.values(applicationCache[key].resourceMap).flat().length
    } else if (applicationCache[key]?.resourceUidMap) {
      count = Object.values(applicationCache[key].resourceUidMap).length
    } else if (applicationCache[key]?.resources) {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memUsed = (cache: any) => {
    return `${Math.round(sizeOf(cache) / 1024)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')} KB`
  }
  logger.info({
    msg: 'memory',
    caches: {
      clients: Object.keys(ServerSideEvents.getClients()).length,
      appCache: memUsed(applicationCache),
      appDict: memUsed(getAppDict()),
      eventCache: memUsed(getEventCache()),
      eventDict: memUsed(getEventDict()),
    },
  })
}

export function sizeOf(data: unknown) {
  let arraySize = 0
  const serializedObj = JSON.stringify(data, (key, value) => {
    if (key === 'data' && Array.isArray(value)) {
      arraySize += value.length
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return value
    }
  })
  return Buffer.byteLength(serializedObj ?? '', 'utf8') + arraySize
}

//////////////////////////////////////////////////////////////////
///////////////// A LITTLE BIT OF LODASH ////////////////
//////////////////////////////////////////////////////////////////
interface ResultType {
  [key: string]: IResource
}
type SelectorType = string | ((item: IResource) => string)
export function keyBy(array: IResource[], selector: SelectorType) {
  const result: ResultType = {}
  for (const item of array) {
    const key = typeof selector === 'string' ? (get(item, selector) as string) : selector(item)
    result[key] = item
  }
  return result
}
