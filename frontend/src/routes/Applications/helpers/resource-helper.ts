/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import _ from 'lodash'
import moment, { Moment } from 'moment'
import queryString from 'query-string'
import { NavigationPath } from '../../../NavigationPath'
import {
    Application,
    ApplicationKind,
    ApplicationSet,
    ApplicationSetKind,
    ArgoApplication,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    Channel,
    IResource,
    IResourceDefinition,
    ManagedCluster,
    PlacementRule,
    PlacementRuleApiVersion,
    PlacementRuleKind,
    Subscription,
    SubscriptionApiVersion,
    SubscriptionKind,
} from '../../../resources'
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

const calculateClusterCount = (
    resource: ArgoApplication,
    clusterCount: any,
    clusterList: string[],
    localCluster: ManagedCluster | undefined
) => {
    const isRemoteArgoApp = resource.status.cluster ? true : false

    if (
        (resource.spec.destination?.name === 'in-cluster' ||
            resource.spec.destination?.name === localClusterStr ||
            isLocalClusterURL(resource.spec.destination?.server || '', localCluster)) &&
        !isRemoteArgoApp
    ) {
        clusterCount.localPlacement = true
        clusterList.push(localClusterStr)
    } else {
        clusterCount.remoteCount++
        if (isRemoteArgoApp) {
            clusterList.push(resource.status.cluster)
        } else if (resource.spec.destination?.name) {
            clusterList.push(resource.spec.destination?.name)
        }
    }
}

// Check if server URL matches hub URL
function isLocalClusterURL(url: string, localCluster: ManagedCluster | undefined) {
    let argoServerURL
    const localClusterConfigs = localCluster ? localCluster.spec?.managedClusterClientConfigs! : []
    const localClusterURL = new URL(localClusterConfigs.length > 0 ? localClusterConfigs[0].url : '')

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

export const createClustersText = (props: {
    resource: IResource
    clusterCount: any
    clusterList: string[]
    argoApplications: ArgoApplication[]
    placementRules: PlacementRule[]
    subscriptions: Subscription[]
    localCluster: ManagedCluster | undefined
}) => {
    const { resource, clusterCount, clusterList, argoApplications, placementRules, subscriptions, localCluster } = props
    if (resource.kind === ApplicationSetKind) {
        argoApplications!.forEach((app) => {
            if (app.metadata?.ownerReferences) {
                if (app.metadata.ownerReferences[0].name === resource.metadata?.name) {
                    calculateClusterCount(app, clusterCount, clusterList, localCluster)
                }
            }
        })
    }

    if (isArgoApp(resource)) {
        calculateClusterCount(resource as ArgoApplication, clusterCount, clusterList, localCluster)
    }

    if (resource.kind === ApplicationKind) {
        const subAnnotationArray = getSubscriptionsFromAnnotation(resource)

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
                                if (cluster.clusterName === localClusterStr) {
                                    clusterCount.localPlacement = true
                                } else {
                                    clusterCount.remoteCount++
                                }
                            })
                        }
                    }
                }
            })
        }
    }

    return isArgoApp(resource)
        ? clusterList.length > 0
            ? clusterList[0]
            : 'None'
        : getClusterCountString(clusterCount.remoteCount, clusterCount.localPlacement)
}

export const normalizeRepoType = (type: string) => {
    const repoType = (type && type.toLowerCase()) || ''
    return repoType === 'github' ? 'git' : repoType
}

export const groupByRepoType = (repos: any) => _.groupBy(repos, (repo) => normalizeRepoType(repo.type))

export function getClusterCountString(remoteCount: number, localPlacement: boolean) {
    if (remoteCount) {
        return localPlacement ? `${remoteCount} Remote, 1 Local` : `${remoteCount} Remote`
    } else if (localPlacement) {
        return 'Local'
    } else {
        return 'None'
    }
}

export function getResourceType(type: String, t: (arg: String) => String) {
    switch (type) {
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
    // const label = t(`resource.type.${type}`)
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
        textSearch = `${textSearch}${textSearch ? ' ' : ''}${key}:${Array.isArray(value) ? value.join() : value}`
    })

    if (textSearch) {
        queryParams.filters = `{"textsearch":"${textSearch}"}`
    }
    if (showRelated) {
        queryParams.showrelated = showRelated
    }
    const query = queryString.stringify(queryParams, { strict: true }).replace(/\./g, '%2E')
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
    return `/multicloud/home/search/resources?${queryString.stringify({
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
