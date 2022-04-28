/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import _ from 'lodash'
import moment, { Moment } from 'moment'
import queryString from 'query-string'
import { Link } from 'react-router-dom'
import { NavigationPath } from '../../../NavigationPath'
import {
    Application,
    ApplicationSet,
    ArgoApplication,
    ArgoApplicationDefinition,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    Channel,
    Cluster,
    IResource,
    IResourceDefinition,
    PlacementRule,
    PlacementRuleApiVersion,
    PlacementRuleKind,
    Subscription,
    SubscriptionApiVersion,
    SubscriptionKind,
    ApplicationSetDefinition,
    ApplicationDefinition,
} from '../../../resources'
import { getArgoDestinationCluster } from '../ApplicationDetails/ApplicationTopology/model/topologyArgo'
import { getAnnotation } from '../Overview'

export const CHANNEL_TYPES = ['git', 'helmrepo', 'namespace', 'objectbucket']
export const subAnnotationStr = 'apps.open-cluster-management.io/subscriptions'
const localSubSuffixStr = '-local'
const localClusterStr = 'local-cluster'
const appSetPlacementStr =
    'clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]'
export const hostingSubAnnotationStr = 'apps.open-cluster-management.io/hosting-subscription'
const hostingDeployableAnnotationStr = 'apps.open-cluster-management.io/hosting-deployable'

export function isArgoApp(item: IResource) {
    return item.apiVersion === ArgoApplicationApiVersion && item.kind === ArgoApplicationKind
}

export function isResourceTypeOf(resource: IResource, resourceType: IResourceDefinition) {
    return resource.apiVersion === resourceType.apiVersion && resource.kind === resourceType.kind
}

export function getSubscriptionsFromAnnotation(app: IResource) {
    const subAnnotation =
        app.metadata?.annotations !== undefined ? app.metadata?.annotations[subAnnotationStr] : undefined

    return subAnnotation !== undefined ? subAnnotation.split(',') : []
}

const getArgoClusterList = (
    resources: ArgoApplication[],
    localCluster: Cluster | undefined,
    managedClusters: Cluster[]
) => {
    const clusterSet = new Set<string>()

    resources.forEach((resource) => {
        const isRemoteArgoApp = resource.status.cluster ? true : false

        if (
            (resource.spec.destination?.name === 'in-cluster' ||
                resource.spec.destination?.name === localClusterStr ||
                isLocalClusterURL(resource.spec.destination?.server || '', localCluster)) &&
            !isRemoteArgoApp
        ) {
            clusterSet.add(localClusterStr)
        } else {
            if (isRemoteArgoApp) {
                clusterSet.add(
                    getArgoDestinationCluster(resource.spec.destination, managedClusters, resource.status.cluster)
                )
            } else {
                clusterSet.add(getArgoDestinationCluster(resource.spec.destination, managedClusters))
            }
        }
    })

    return Array.from(clusterSet)
}

const getSubscriptionsClusterList = (
    resource: Application,
    placementRules: PlacementRule[],
    subscriptions: Subscription[]
) => {
    const subAnnotationArray = getSubscriptionsFromAnnotation(resource)
    const clusterSet = new Set<string>()

    for (let i = 0; i < subAnnotationArray.length; i++) {
        if (
            _.endsWith(subAnnotationArray[i], localSubSuffixStr) &&
            _.indexOf(subAnnotationArray, _.trimEnd(subAnnotationArray[i], localSubSuffixStr)) !== -1
        ) {
            // skip local sub
            continue
        }
        const subDetails = subAnnotationArray[i].split('/')

        subscriptions.forEach((sub) => {
            if (sub.metadata.name === subDetails[1] && sub.metadata.namespace === subDetails[0]) {
                const placementRef = sub.spec.placement?.placementRef
                if (placementRef) {
                    const placement = placementRules.find((rule) => rule.metadata.name === placementRef.name)
                    const decisions = placement?.status?.decisions

                    if (decisions) {
                        decisions.forEach((cluster) => {
                            clusterSet.add(cluster.clusterName)
                        })
                    }
                }
            }
        })
    }

    return Array.from(clusterSet)
}

export const getClusterList = (
    resource: IResource,
    argoApplications: ArgoApplication[],
    placementRules: PlacementRule[],
    subscriptions: Subscription[],
    localCluster: Cluster | undefined,
    managedClusters: Cluster[]
) => {
    if (isResourceTypeOf(resource, ArgoApplicationDefinition)) {
        return getArgoClusterList([resource as ArgoApplication], localCluster, managedClusters)
    } else if (isResourceTypeOf(resource, ApplicationSetDefinition)) {
        return getArgoClusterList(
            argoApplications.filter(
                (app) =>
                    app.metadata?.ownerReferences && app.metadata.ownerReferences[0].name === resource.metadata?.name
            ),
            localCluster,
            managedClusters
        )
    } else if (isResourceTypeOf(resource, ApplicationDefinition)) {
        return getSubscriptionsClusterList(resource as Application, placementRules, subscriptions)
    }
    return [] as string[]
}

export const getClusterCount = (clusterList: string[]) => {
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
    } catch (_) {
        return false
    }

    const hostnameWithOutAPI = argoServerURL.hostname.substr(argoServerURL.hostname.indexOf('api.') + 4)

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

export function getClusterCountString(
    t: TFunction,
    clusterCount: { remoteCount: number; localPlacement: boolean },
    clusterList?: string[],
    resource?: IResource
) {
    if (resource && isArgoApp(resource)) {
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

export function getClusterCountSearchLink(
    resource: IResource,
    clusterCount: { remoteCount: number; localPlacement: boolean },
    clusterList?: string[]
) {
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

export function getClusterCountField(clusterCountString: string, clusterCountSearchLink?: string) {
    return clusterCountSearchLink ? (
        <Link className="cluster-count-link" to={clusterCountSearchLink}>
            {clusterCountString}
        </Link>
    ) : (
        clusterCountString
    )
}

export function getResourceType(type: String, t: TFunction) {
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
            break
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
    return `${NavigationPath.resources}?${queryString.stringify({
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
            if (appSetPlacement && appSetPlacement === currentAppSetPlacement) {
                appSetsSharingPlacement.push(item.metadata.name!)
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
    channels: Channel[]
) => {
    const subAnnotationArray = getSubscriptionsFromAnnotation(app)
    const removableSubs: any[] = []
    const children: any[] = []
    const sharedChildren: any[] = []
    const rules: any[] = []

    for (let i = 0; i < subAnnotationArray.length; i++) {
        const related: IResource[] = []
        const siblingApps: string[] = []
        const subChildResources: string[] = []
        if (
            _.endsWith(subAnnotationArray[i], localSubSuffixStr) &&
            _.indexOf(subAnnotationArray, _.trimEnd(subAnnotationArray[i], localSubSuffixStr)) !== -1
        ) {
            // skip local sub
            continue
        }
        const subDetails = subAnnotationArray[i].split('/')

        // Find apps sharing the same sub
        applications.forEach((item) => {
            if (item.metadata.uid !== app.metadata?.uid && item.metadata.namespace === app.metadata?.namespace) {
                if (
                    item.metadata.annotations &&
                    item.metadata.annotations[subAnnotationStr] &&
                    item.metadata.annotations[subAnnotationStr].split(',').find((sub) => sub === subAnnotationArray[i])
                ) {
                    siblingApps.push(item.metadata.name!)
                    related.push(item)
                }
                const appHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

                if (appHostingSubAnnotation && appHostingSubAnnotation.indexOf(subAnnotationArray[i]) > -1) {
                    related.push(item)
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
                    subHostingSubAnnotation.indexOf(subAnnotationArray[i]) > -1 &&
                    !(subHostingDeployableAnnotation && subHostingDeployableAnnotation.startsWith(localClusterStr))
                ) {
                    related.push(item)
                    subChildResources.push(`${item.metadata.name} [${item.kind}]`)
                }
            } else if (item.metadata.name === subDetails[1] && item.metadata.namespace === subDetails[0]) {
                currentSub = item
            }
        })

        // Find PRs referenced/deployed by this sub
        let subWithPR
        const referencedPR = currentSub ? (currentSub as Subscription).spec.placement?.placementRef : undefined
        placementRules.forEach((item) => {
            if (referencedPR && referencedPR.name === item.metadata.name) {
                related.push(item)
                subWithPR = { ...currentSub, rule: item }
            }
            const prHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

            if (prHostingSubAnnotation && prHostingSubAnnotation.indexOf(subAnnotationArray[i]) > -1) {
                subChildResources.push(`${item.metadata.name} [${item.kind}]`)
            }
        })

        // Find channels deployed by this sub
        channels.forEach((item) => {
            const channelHostingSubAnnotation = getAnnotation(item, hostingSubAnnotationStr)

            if (channelHostingSubAnnotation && channelHostingSubAnnotation === subAnnotationArray[i]) {
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
                kind: PlacementRuleKind,
                apiVersion: PlacementRuleApiVersion,
                label: `${prName} [${PlacementRuleKind}]`,
            })
        }
    })

    // Find subs sharing the PR
    rules.forEach((rule) => {
        const siblingSubs: string[] = []
        for (let i = 0; i < subscriptions.length; i++) {
            const item = subscriptions[i]
            const subHostingDeployableAnnotation = getAnnotation(item, hostingDeployableAnnotationStr)

            if (subHostingDeployableAnnotation && subHostingDeployableAnnotation.startsWith(localClusterStr)) {
                continue
            }

            const foundSub = removableSubs.find((sub) => sub.metadata.uid === item.metadata.uid)
            if (
                foundSub === undefined &&
                item.spec.placement?.placementRef?.name === rule.name &&
                item.metadata.namespace === rule.namespace
            ) {
                siblingSubs.push(item.metadata.name!)
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
