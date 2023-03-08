/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import _ from 'lodash'
import moment, { Moment } from 'moment'
import queryString from 'query-string'
import { Link } from 'react-router-dom'
import { generatePath } from 'react-router'
import { NavigationPath } from '../../../NavigationPath'
import {
  Application,
  ApplicationDefinition,
  ApplicationSet,
  ApplicationSetDefinition,
  ArgoApplication,
  ArgoApplicationApiVersion,
  ArgoApplicationDefinition,
  ArgoApplicationKind,
  Channel,
  Cluster,
  CronJobKind,
  DaemonSetKind,
  DeploymentConfigKind,
  DeploymentKind,
  IResource,
  IResourceDefinition,
  JobKind,
  Placement,
  PlacementDecision,
  PlacementKind,
  PlacementRule,
  PlacementRuleKind,
  StatefulSetKind,
  Subscription,
  SubscriptionApiVersion,
  SubscriptionKind,
} from '../../../resources'
import { getArgoDestinationCluster } from '../ApplicationDetails/ApplicationTopology/model/topologyArgo'
import { getSubscriptionAnnotations, isLocalSubscription } from './subscriptions'
export const CHANNEL_TYPES = ['git', 'helmrepo', 'namespace', 'objectbucket']
const localClusterStr = 'local-cluster'
const appSetPlacementStr =
  'clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]'
export const hostingSubAnnotationStr = 'apps.open-cluster-management.io/hosting-subscription'
const hostingDeployableAnnotationStr = 'apps.open-cluster-management.io/hosting-deployable'

export function isArgoApp(item: IResource) {
  return item.apiVersion === ArgoApplicationApiVersion && item.kind === ArgoApplicationKind
}

export function isResourceTypeOf(resource: IResource, resourceType: IResourceDefinition | IResourceDefinition[]) {
  if (Array.isArray(resourceType)) {
    let isTypeOf = false
    resourceType.forEach((rt) => {
      if (rt.apiVersion === resource.apiVersion && rt.kind === resource.kind) {
        isTypeOf = true
      }
    })
    return isTypeOf
  } else {
    return resource.apiVersion === resourceType.apiVersion && resource.kind === resourceType.kind
  }
}

export function getSubscriptionsFromAnnotation(app: IResource) {
  return getSubscriptionAnnotations(app) as string[]
}

export type ClusterCount = {
  remoteCount: number
  localPlacement: boolean
}

const getArgoClusterList = (
  resources: ArgoApplication[],
  localCluster: Cluster | undefined,
  managedClusters: Cluster[]
) => {
  const clusterSet = new Set<string>()

  resources.forEach((resource) => {
    const isRemoteArgoApp = resource.status?.cluster ? true : false

    if (
      (resource.spec.destination?.name === 'in-cluster' ||
        resource.spec.destination?.name === localClusterStr ||
        isLocalClusterURL(resource.spec.destination?.server || '', localCluster)) &&
      !isRemoteArgoApp
    ) {
      clusterSet.add(localClusterStr)
    } else {
      if (isRemoteArgoApp) {
        clusterSet.add(getArgoDestinationCluster(resource.spec.destination, managedClusters, resource.status.cluster))
      } else {
        clusterSet.add(getArgoDestinationCluster(resource.spec.destination, managedClusters))
      }
    }
  })

  return Array.from(clusterSet)
}

const getSubscriptionsClusterList = (
  resource: Application,
  placementDecisions: PlacementDecision[],
  subscriptions: Subscription[]
) => {
  const subAnnotationArray = getSubscriptionsFromAnnotation(resource)
  const clusterSet = new Set<string>()

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
          decisions.forEach((cluster) => {
            clusterSet.add(cluster.clusterName)
          })
        }
      }
    })
  }
  return Array.from(clusterSet)
}

export const getClusterList = (
  resource: IResource,
  argoApplications: ArgoApplication[],
  placementDecisions: PlacementDecision[],
  subscriptions: Subscription[],
  localCluster: Cluster | undefined,
  managedClusters: Cluster[]
) => {
  // managed resources using search to fetch
  if (isOCPAppResourceKind(resource.kind)) {
    const clusterSet = new Set<string>()
    if (resource.status.cluster) {
      clusterSet.add(resource.status.cluster)
    }
    return Array.from(clusterSet)
  }

  if (isResourceTypeOf(resource, ArgoApplicationDefinition)) {
    return getArgoClusterList([resource as ArgoApplication], localCluster, managedClusters)
  } else if (isResourceTypeOf(resource, ApplicationSetDefinition)) {
    return getArgoClusterList(
      argoApplications.filter(
        (app) => app.metadata?.ownerReferences && app.metadata.ownerReferences[0].name === resource.metadata?.name
      ),
      localCluster,
      managedClusters
    )
  } else if (isResourceTypeOf(resource, ApplicationDefinition)) {
    return getSubscriptionsClusterList(resource as Application, placementDecisions, subscriptions)
  }

  return [] as string[]
}

export const getClusterCount = (clusterList: string[]): ClusterCount => {
  const localPlacement = clusterList.includes(localClusterStr)
  return { localPlacement, remoteCount: clusterList.length - (localPlacement ? 1 : 0) }
}

// Check if server URL matches hub URL
function isLocalClusterURL(url: string, localCluster: Cluster | undefined) {
  if (url === 'https://kubernetes.default.svc') {
    return true
  }

  let argoServerURL
  const localClusterURL = new URL(
    localCluster ? _.get(localCluster, 'consoleURL', 'https://localhost') : 'https://localhost'
  )

  try {
    argoServerURL = new URL(url)
  } catch (_err) {
    return false
  }

  const hostnameWithOutAPI = argoServerURL.hostname.substring(argoServerURL.hostname.indexOf('api.') + 4)

  if (localClusterURL.host.indexOf(hostnameWithOutAPI) > -1) {
    return true
  }
  return false
}

export const normalizeRepoType = (type: string) => {
  const repoType = (type && type.toLowerCase()) || ''
  return repoType === 'github' ? 'git' : repoType
}

export const groupByRepoType = (repos: any) => _.groupBy(repos, (repo) => normalizeRepoType(repo.type))

export function isOCPAppResourceKind(kind: string) {
  const ocpAppResourceKinds = [
    CronJobKind,
    DaemonSetKind,
    DeploymentKind,
    DeploymentConfigKind,
    JobKind,
    StatefulSetKind,
  ]

  return ocpAppResourceKinds.includes(kind)
}

export function getClusterCountString(
  t: TFunction,
  clusterCount: ClusterCount,
  clusterList?: string[],
  resource?: IResource
) {
  if (resource && (isArgoApp(resource) || isOCPAppResourceKind(resource.kind))) {
    return clusterList?.length ? clusterList[0] : t('None')
  } else if (clusterCount.remoteCount && clusterCount.localPlacement) {
    return t('{{remoteCount}} Remote, 1 Local', { remoteCount: clusterCount.remoteCount })
  } else if (clusterCount.remoteCount) {
    return t('{{remoteCount}} Remote', { remoteCount: clusterCount.remoteCount })
  } else if (clusterCount.localPlacement) {
    return t('Local')
  } else {
    return t('None')
  }
}

export function getClusterCountSearchLink(resource: IResource, clusterCount: ClusterCount, clusterList?: string[]) {
  if (isOCPAppResourceKind(resource.kind)) {
    const cluster = clusterList ? clusterList[0] : ''
    return generatePath(NavigationPath.clusterDetails, { name: cluster, namespace: cluster })
  }
  if ((isArgoApp(resource) && !clusterList?.length) || (!clusterCount.remoteCount && !clusterCount.localPlacement)) {
    return undefined
  }
  return getSearchLink(
    isResourceTypeOf(resource, ApplicationDefinition)
      ? {
          properties: {
            apigroup: 'app.k8s.io',
            kind: 'application',
            name: resource.metadata?.name,
            namespace: resource.metadata?.namespace,
          },
          showRelated: 'cluster',
        }
      : {
          properties: {
            name: clusterList,
            kind: 'cluster',
          },
        }
  )
}

export function getClusterCountField(
  clusterCount: ClusterCount,
  clusterCountString: string,
  clusterCountSearchLink?: string
) {
  return clusterCountSearchLink && clusterCount.remoteCount ? (
    <Link className="cluster-count-link" to={clusterCountSearchLink}>
      {clusterCountString}
    </Link>
  ) : (
    clusterCountString
  )
}

export function getResourceType(type: string, t: TFunction) {
  switch (type) {
    case 'github':
      return t('Git')
    case 'git':
      return t('Git')
    case 'helmrepo':
      return t('Helm')
    case 'namespace':
      return t('Namespace')
    case 'objectbucket':
      return t('Object storage')
    default:
      return '-'
  }
}

export const getResourceLabel = (type: string, count: number, t: TFunction) => {
  const label = getResourceType(type, t)
  const optionalCount = count > 1 ? ` (${count})` : ''
  return label + optionalCount
}

export const getMoment = (timestamp: string, locale = '') => {
  const momentObj = moment(
    timestamp,
    timestamp.toString().includes('T') ? 'YYYY-MM-DDTHH:mm:ssZ' : 'YYYY-MM-DD HH:mm:ss'
  )
  momentObj.locale(locale.toLowerCase())
  return momentObj
}

export const getAge = (item: IResource, locale: string, timestampKey: string) => {
  const key = timestampKey ? timestampKey : 'created'
  const createdTime = _.get(item, key)
  if (createdTime) {
    return getMoment(createdTime, locale).fromNow()
  }
  return '-'
}

export const getSearchLink = (params: any) => {
  const { properties, showRelated } = params
  const queryParams: { filters?: string; showrelated?: string } = {}
  let textSearch = ''

  _.entries(properties).forEach(([key, value]) => {
    if (value) {
      textSearch = `${textSearch}${textSearch ? ' ' : ''}${key}:${Array.isArray(value) ? value.join() : value}`
    }
  })

  if (textSearch) {
    queryParams.filters = `{"textsearch":"${textSearch}"}`
  }
  if (showRelated) {
    queryParams.showrelated = showRelated
  }
  const query = queryString.stringify(queryParams, { strict: true })
  const search = query ? `?${query}` : ''
  return `${NavigationPath.search}${search}`
}

export const getEditLink = (params: {
  properties: {
    name: string
    namespace: string
    kind: string
    apiversion: string
    cluster: string
  }
}) => {
  const {
    properties: { name, namespace, kind, apiversion, cluster },
  } = params
  return `${NavigationPath.resourceYAML}?${queryString.stringify({
    cluster,
    name,
    namespace,
    kind,
    apiversion,
  })}`
}

export const getShortDateTime = (timestamp: string, now?: Moment) => {
  const timeFormat = 'h:mm a'
  const monthDayFormat = 'MMM D'
  const yearFormat = 'YYYY'
  if (!timestamp) {
    return '-'
  }
  if (!now) {
    now = moment()
  }
  const date = getMoment(timestamp)
  if (date.isSame(now, 'day')) {
    return date.format(timeFormat)
  } else if (date.isSame(now, 'year')) {
    return date.format(`${monthDayFormat}, ${timeFormat}`)
  } else {
    return date.format(`${monthDayFormat} ${yearFormat}, ${timeFormat}`)
  }
}

export const getAppSetRelatedResources = (appSet: IResource, applicationSets: ApplicationSet[]) => {
  const appSetsSharingPlacement: string[] = []
  const currentAppSetGenerators = (appSet as ApplicationSet).spec.generators
  const currentAppSetPlacement = currentAppSetGenerators
    ? _.get(currentAppSetGenerators[0], appSetPlacementStr, '')
    : undefined

  if (!currentAppSetPlacement) {
    return ['', []]
  }

  applicationSets.forEach((item) => {
    const appSetGenerators = item.spec.generators
    const appSetPlacement = appSetGenerators ? _.get(appSetGenerators[0], appSetPlacementStr, '') : ''
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

export const getAppChildResources = (
  app: IResource,
  applications: Application[],
  subscriptions: Subscription[],
  placementRules: PlacementRule[],
  placements: Placement[],
  channels: Channel[]
) => {
  const subAnnotationArray = getSubscriptionsFromAnnotation(app)
  const removableSubs: any[] = []
  const children: any[] = []
  const sharedChildren: any[] = []
  const rules: any[] = []

  for (const sa of subAnnotationArray) {
    const siblingApps: string[] = []
    const subChildResources: string[] = []
    if (isLocalSubscription(sa, subAnnotationArray)) {
      // skip local sub
      continue
    }
    const subDetails = sa.split('/')

    // Find apps sharing the same sub
    applications.forEach((item) => {
      if (item.metadata.uid !== app.metadata?.uid && item.metadata.namespace === app.metadata?.namespace) {
        if (item.metadata.name && getSubscriptionsFromAnnotation(item).find((sub) => sub === sa)) {
          siblingApps.push(item.metadata.name)
        }
        const appHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

        if (appHostingSubAnnotation && appHostingSubAnnotation.indexOf(sa) > -1) {
          subChildResources.push(`${item.metadata.name} [${item.kind}]`)
        }
      }
    })

    // Find current sub and subs deployed by this sub
    let currentSub: IResource | undefined = undefined
    subscriptions.forEach((item) => {
      if (
        item.metadata.name !== subDetails[1] ||
        (item.metadata.name === subDetails[1] && item.metadata.namespace !== subDetails[0])
      ) {
        const subHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)
        const subHostingDeployableAnnotation = getAnnotation(item, hostingDeployableAnnotationStr)

        if (
          subHostingSubAnnotation &&
          subHostingSubAnnotation.indexOf(sa) > -1 &&
          !(subHostingDeployableAnnotation && subHostingDeployableAnnotation.startsWith(localClusterStr))
        ) {
          subChildResources.push(`${item.metadata.name} [${item.kind}]`)
        }
      } else if (item.metadata.name === subDetails[1] && item.metadata.namespace === subDetails[0]) {
        currentSub = item
      }
    })

    // Find PRs referenced/deployed by this sub
    let subWithPR
    const referencedPR = currentSub ? (currentSub as Subscription).spec.placement?.placementRef : undefined
    let targetPlacements: any[] = []
    if (referencedPR?.kind === PlacementRuleKind) {
      targetPlacements = placementRules
    } else if (referencedPR?.kind === PlacementKind) {
      targetPlacements = placements
    }
    targetPlacements?.forEach((item) => {
      if (
        referencedPR &&
        referencedPR.name === item.metadata.name &&
        currentSub?.metadata?.namespace === item.metadata.namespace
      ) {
        subWithPR = { ...currentSub, rule: item }
      }
      const prHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

      if (prHostingSubAnnotation && prHostingSubAnnotation.indexOf(sa) > -1) {
        subChildResources.push(`${item.metadata.name} [${item.kind}]`)
      }
    })

    // Find channels deployed by this sub
    channels.forEach((item) => {
      const channelHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

      if (channelHostingSubAnnotation && channelHostingSubAnnotation === sa) {
        subChildResources.push(`${item.metadata.name} [${item.kind}]`)
      }
    })

    if (siblingApps.length === 0) {
      removableSubs.push(subWithPR || currentSub)
      children.push({
        id: `subscriptions-${subDetails[0]}-${subDetails[1]}`,
        name: subDetails[1],
        namespace: subDetails[0],
        kind: SubscriptionKind,
        apiVersion: SubscriptionApiVersion,
        label: `${subDetails[1]} [${SubscriptionKind}]`,
        subChildResources: subChildResources,
      })
    } else {
      sharedChildren.push({
        id: `subscriptions-${subDetails[0]}-${subDetails[1]}`,
        label: `${subDetails[1]} [${SubscriptionKind}]`,
        siblingApps: siblingApps,
      })
    }
  }

  removableSubs.forEach((sub) => {
    const prName = sub.rule?.metadata.name
    const prNamespace = sub.rule?.metadata.namespace
    if (prName) {
      rules.push({
        id: `rules-${prNamespace}-${prName}`,
        name: prName,
        namespace: prNamespace,
        kind: sub.rule.kind,
        apiVersion: sub.rule.apiVersion,
        label: `${prName} [${sub.rule.kind}]`,
      })
    }
  })

  // Find subs sharing the PR
  rules.forEach((rule) => {
    const siblingSubs: string[] = []
    for (const sub of subscriptions) {
      const item = sub
      const subHostingDeployableAnnotation = getAnnotation(item, hostingDeployableAnnotationStr)

      if (subHostingDeployableAnnotation && subHostingDeployableAnnotation.startsWith(localClusterStr)) {
        continue
      }

      const foundSub = removableSubs.find((sub) => sub.metadata.uid === item.metadata.uid)
      if (
        foundSub === undefined &&
        item.spec.placement?.placementRef?.name === rule.name &&
        item.metadata.namespace === rule.namespace &&
        item.metadata.name
      ) {
        siblingSubs.push(item.metadata.name)
      }
    }

    if (siblingSubs.length === 0) {
      children.push(rule)
    } else {
      sharedChildren.push({
        id: rule.id,
        label: rule.label,
        siblingSubs: siblingSubs,
      })
    }
  })

  return [children.sort((a, b) => a.label.localeCompare(b.label)), sharedChildren]
}

export function getAnnotation(resource: IResource, annotationString: string) {
  return resource.metadata?.annotations !== undefined ? resource.metadata?.annotations[annotationString] : undefined
}
