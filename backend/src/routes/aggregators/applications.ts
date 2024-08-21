/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources } from '../events'
import { getOCPApps, isSystemApp } from './applicationsOCP'
import { getArgoApps } from './applicationsArgo'
import { IResource } from '../../resources/resource'
import { FilterSelections, FilterCounts, ITransformedResource } from '../../lib/pagination'

interface IArgoApplication extends IResource {
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
interface IOCPApplication extends IResource {
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

let stopping = false
export function stopAggregatingApplications(): void {
  stopping = true
}

export type ApplicationCache = {
  items: ITransformedResource[]
  filterCounts: FilterCounts
}
export type ApplicationCacheType = {
  [type: string]: ApplicationCache
}
const applicationCache: ApplicationCacheType = {}
const appKeys = ['subscription', 'appset', 'localArgoApps', 'remoteArgoApps', 'localOCPApps', 'remoteOCPApps']
appKeys.forEach((key) => {
  applicationCache[key] = { items: [], filterCounts: {} }
})

export function startAggregatingApplications() {
  void localKubeLoop()
  void searchAPILoop()
}

// aggregate local applications found in kube every 5 seconds
async function localKubeLoop(): Promise<void> {
  while (!stopping) {
    aggregateKubeApplications()
    await new Promise((r) => setTimeout(r, 5000))
  }
}

async function searchAPILoop(): Promise<void> {
  let pass = 1
  while (!stopping) {
    await aggregatSearchAPIApplications(pass)
    pass++
  }
}

export function aggregateKubeApplications() {
  // ACM Apps
  applicationCache['subscription'] = generateTransforms(getKubeResources('Application', 'app.k8s.io/v1beta1'))

  // AppSets
  applicationCache['appset'] = generateTransforms(getKubeResources('ApplicationSet', 'argoproj.io/v1alpha1'))
}

export async function aggregatSearchAPIApplications(pass: number) {
  // Argo Apps
  const argoAppSet = await getArgoApps(applicationCache, pass)

  // OCP Apps/FLUX
  await getOCPApps(applicationCache, argoAppSet, pass)
}

export function generateTransforms(items: ITransformedResource[], isRemote?: boolean): ApplicationCache {
  const filterCounts: FilterCounts = {}
  const subscriptions = getKubeResources('Subscription', 'apps.open-cluster-management.io/v1')
  const placementDecisions = getKubeResources('PlacementDecision', 'cluster.open-cluster-management.io/v1beta1')
  items.forEach((app) => {
    const type = getApplicationType(app)
    const clusters = getApplicationClusters(app, type, subscriptions, placementDecisions)
    app.transform = [
      [app.metadata.name],
      [type],
      [getAppNamespace(app)],
      clusters,
      ['r'],
      ['t'],
      [app.metadata.creationTimestamp as string],
    ]
    app.isRemote = isRemote
    incFilterCounts(filterCounts, 'type', [type])
    incFilterCounts(filterCounts, 'cluster', clusters)
  })
  return { items, filterCounts }
}

export function getApplications() {
  const items: ITransformedResource[] = []
  const filterCounts: FilterCounts = {}
  Object.keys(applicationCache).forEach((key) => {
    items.push(...applicationCache[key].items)
    const cnts = applicationCache[key].filterCounts
    Object.keys(cnts).forEach((parent) => {
      let category = filterCounts[parent]
      if (!category) {
        category = filterCounts[parent] = {}
      }
      const types = cnts[parent] //type/cluster
      Object.keys(types).forEach((child: string) => {
        if (!category[child]) {
          category[child] = 0
        }
        category[child] += types[child]
      })
    })
  })
  return { items, filterCounts }
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
          isMatch = filters['type'].some((value: string) => value === item.transform[1][0])
          break
        case 'cluster':
          isMatch = filters['cluster'].some((value: string) => item.transform[3].indexOf(value) !== -1)
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

// add to filters count that appears in filter dropdown
function incFilterCounts(mapmap: FilterCounts, id: string, keys: string[]) {
  let map = mapmap[id]
  if (!map) map = mapmap[id] = {}
  keys.forEach((key) => {
    if (key in map) {
      map[key]++
    } else {
      map[key] = 1
    }
  })
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
  placementDecisions: IResource[]
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
        return [getArgoCluster(resource)]
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
  const clusterDecisions = placementDecision?.status.decisions || []

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

function getArgoCluster(resource: IArgoApplication) {
  if (resource.status?.cluster) {
    return resource.status?.cluster
  } else if (
    resource.spec.destination?.name === 'in-cluster' ||
    resource.spec.destination?.name === 'local-cluster' ||
    resource.spec.destination?.server === 'https://kubernetes.default.svc'
  ) {
    return 'local-cluster'
  } else {
    return getArgoDestinationCluster(resource.spec.destination, resource.status.cluster)
  }
}

function getArgoDestinationCluster(
  destination: { name?: string; namespace: string; server?: string },
  cluster?: string
) {
  // cluster is the name of the managed cluster where the Argo app is defined
  let clusterName = ''
  const serverApi = destination?.server
  if (serverApi) {
    if (serverApi === 'https://kubernetes.default.svc') {
      clusterName = cluster ? cluster : 'local-cluster'
    } else {
      // const server = managedClusters.find((cls) => cls.kubeApiServer === serverApi)
      // clusterName = server ? server.name : 'unknown'
      clusterName = 'unknown'
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
