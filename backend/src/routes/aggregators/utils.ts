/* Copyright Contributors to the Open Cluster Management project */
import { getKubeResources } from '../events'
import { Cluster, ClusterDeployment, IResource, ManagedClusterInfo } from '../../resources/resource'
import { ITransformedResource } from '../../lib/pagination'
import {
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

export const pagedSearchQueries: string[][] = [
  ['a*', 'i*', 'n*'],
  ['e*', 'r*', 'o*'],
  ['s*', 't*', 'u*', 'l*', 'm*', 'c*'],
  ['d*', 'b*', 'g*', '0*', '1*', '2*', '3*', '4*'],
  ['h*', 'p*', 'k*', 'y*', 'v*', 'z*', 'w*', 'f*'],
  ['j*', 'q*', 'x*', '5*', '6*', '7*', '8*', '9*'],
]

export const promiseTimeout = <T>(promise: Promise<T>, delay: number) => {
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

// /////////////////// map created from events.ts /////////////////
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

// /////////////////// MINI useAllClusters from frontend /////////////////

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

///////////////// LOGGING ////////////////

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
    if (key !== 'remoteSysApps') {
      count = applicationCache[key].resources.length
    } else {
      count = Object.values(applicationCache['remoteSysApps'].resourceMap).flat().length
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
