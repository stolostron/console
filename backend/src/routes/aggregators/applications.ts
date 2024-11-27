/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources } from '../events'
import { getOCPApps, isSystemApp, discoverSystemAppNamespacePrefixes } from './applicationsOCP'
import { getArgoApps } from './applicationsArgo'
import { Cluster, ClusterDeployment, IResource, ManagedClusterInfo } from '../../resources/resource'
import { FilterSelections, ITransformedResource } from '../../lib/pagination'
import { logger } from '../../lib/logger'
import { pingSearchAPI } from '../../lib/search'

export enum AppColumns {
  'name' = 0,
  'type',
  'namespace',
  'clusters',
  'repo',
  'timeWindow',
  'created',
}
export interface IArgoApplication extends IResource {
  cluster?: string
  spec: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [x: string]: any
    destination: {
      name?: string
      namespace: string
      server?: string
    }
  }
  status?: {
    cluster?: string
    decisions?: [{ clusterName: string }]
  }
}
export interface IOCPApplication extends IResource {
  label?: string
  status?: {
    cluster?: string
  }
}
interface IDecision extends IResource {
  status?: {
    decisions?: [{ clusterName: string }]
  }
}
interface ISubscription extends IResource {
  spec?: {
    placement?: {
      placementRef?: {
        name: string
      }
    }
  }
  status?: {
    decisions?: [{ clusterName: string }]
  }
}

export enum MODE {
  OnlySystemApps,
  ExcludeSystemApps,
}

let stopping = false
export function stopAggregatingApplications(): void {
  stopping = true
}

export type ApplicationCache = {
  resources?: ITransformedResource[]
  resourceMap?: { [key: string]: ITransformedResource[] }
}
export type ApplicationCacheType = {
  [type: string]: ApplicationCache
}
const applicationCache: ApplicationCacheType = {}
const appKeys = [
  'subscription',
  'appset',
  'localArgoApps',
  'remoteArgoApps',
  'localOCPApps',
  'remoteOCPApps',
  'localSysApps',
  'remoteSysApps',
]
appKeys.forEach((key) => {
  applicationCache[key] = { resources: [] }
})
export type SearchCountType = {
  [type: string]: number
}
const searchCount: SearchCountType = {}
const searchKeys = ['localArgoApps', 'remoteArgoApps', 'localOCPApps', 'remoteOCPApps', 'localSysApps', 'remoteSysApps']
searchKeys.forEach((key) => {
  searchCount[key] = 0
})

export function getApplications() {
  const items: ITransformedResource[] = []
  aggregateKubeApplications()
  Object.keys(applicationCache).forEach((key) => {
    if (applicationCache[key].resources) {
      items.push(...applicationCache[key].resources)
    } else if (Object.keys(applicationCache[key].resourceMap).length) {
      const allResources = Object.values(applicationCache[key].resourceMap)
      items.push(...allResources.flat())
    }
  })
  return items
}

export function startAggregatingApplications() {
  void discoverSystemAppNamespacePrefixes()
  void searchAPILoop()
}

// timeout failsafe to make sure search loop keeps running
const SEARCH_TIMEOUT = 5 * 60 * 1000
const promiseTimeout = <T>(promise: Promise<T>, delay: number) => {
  let timeoutID: string | number | NodeJS.Timeout
  const promises = [
    new Promise<void>((_resolve, reject) => {
      timeoutID = setTimeout(() => reject(new Error(`timeout of ${delay} exceeded`)), delay)
    }),
    promise.then((data) => {
      clearTimeout(timeoutID)
      return data
    }),
  ]
  return Promise.race(promises)
}

async function searchAPILoop() {
  let pass = 1
  let searchAPIMissing = false
  while (!stopping) {
    // make sure there's an active search api
    // otherwise there's no point
    let exists
    do {
      try {
        exists = await pingSearchAPI()
      } catch (e) {
        logger.error(`pingSearchAPI ${e}`)
        exists = false
      }
      if (!exists) {
        if (!searchAPIMissing) {
          logger.error('search API missing')
          searchAPIMissing = true
        }
        await new Promise((r) => setTimeout(r, 5 * 60 * 1000))
      }
    } while (!exists)
    if (searchAPIMissing) {
      logger.info('search API found')
      searchAPIMissing = false
    }

    try {
      await promiseTimeout(aggregateSearchAPIApplications(pass), SEARCH_TIMEOUT * 2).catch((e) =>
        logger.error(`searchAPILoop exception ${e}`)
      )
    } catch (e) {
      logger.error(`searchAPILoop exception ${e}`)
    }
    pass++
  }
}

export function aggregateKubeApplications() {
  // ACM Apps
  try {
    applicationCache['subscription'] = generateTransforms(
      structuredClone(getKubeResources('Application', 'app.k8s.io/v1beta1'))
    )
  } catch (e) {
    logger.error(`aggregateKubeApplications subscription exception ${e}`)
  }

  // AppSets
  try {
    applicationCache['appset'] = generateTransforms(
      structuredClone(getKubeResources('ApplicationSet', 'argoproj.io/v1alpha1'))
    )
  } catch (e) {
    logger.error(`aggregateKubeApplications appset exception ${e}`)
  }
}

let argoAppSet = new Set<string>()
export async function aggregateSearchAPIApplications(pass: number) {
  const clusters: Cluster[] = getClusters()
  // Argo Apps
  await promiseTimeout(getArgoApps(applicationCache, clusters, pass), SEARCH_TIMEOUT)
    .then((data) => {
      if (data) argoAppSet = data
    })
    .catch((e) => logger.error(`aggregateSearchAPIApplications ArgoCD exception ${e}`))

  // OCP Apps/FLUX
  await promiseTimeout(getOCPApps(applicationCache, argoAppSet, MODE.ExcludeSystemApps, pass), SEARCH_TIMEOUT).catch(
    (e) => logger.error(`aggregateSearchAPIApplications OCP/Flux exception ${e}`)
  )

  // system apps -- because system apps shouldn't change much, don't do it every time
  if (pass <= 3 || pass % 3 === 0) {
    await promiseTimeout(getOCPApps(applicationCache, argoAppSet, MODE.OnlySystemApps, pass), SEARCH_TIMEOUT).catch(
      (e) => logger.error(`aggregateSearchAPIApplications OCP/Flux exception ${e}`)
    )
  }
  logSearchCountChanges(pass)
}

function logSearchCountChanges(pass: number) {
  let change = false
  searchKeys.forEach((key) => {
    let count
    if (key !== 'remoteSysApps') {
      count = applicationCache[key].resources.length
    } else {
      count = Object.values(applicationCache['remoteSysApps'].resourceMap).flat().length
    }
    if (count !== searchCount[key]) {
      change = true
      searchCount[key] = count
    }
  })
  if (change) {
    logger.info({
      msg: 'search change',
      searchCount,
    })
  } else if (pass % 50 === 0) {
    logger.info({
      msg: 'search',
      searchCount,
    })
  }
}

export function generateTransforms(
  items: ITransformedResource[],
  clusters?: Cluster[],
  isRemote?: boolean
): ApplicationCache {
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

export function filterApplications(filters: FilterSelections, items: ITransformedResource[]) {
  const filterCategories = Object.keys(filters)
  items = items.filter((item) => {
    let isFilterMatch = true
    // Item must match 1 filter of each category
    filterCategories.forEach((filter: string) => {
      let isMatch = true
      switch (filter) {
        case 'type':
          isMatch = filters['type'].some((value: string) => value === item.transform[AppColumns.type][0])
          break
        case 'cluster':
          isMatch = filters['cluster'].some(
            (value: string) => item.transform[AppColumns.clusters].indexOf(value) !== -1
          )
          break
      }
      if (!isMatch) {
        isFilterMatch = false
      }
    })
    return isFilterMatch
  })
  return items
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
    return 'Local'
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

// /////////////////// MINI useAllClusters from frontend /////////////////

// stream lined version of map clusters in frontend
function getClusters(): Cluster[] {
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

///////////////// A LITTLE BIT OF LODASH ////////////////
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
