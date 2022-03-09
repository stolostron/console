/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import _ from 'lodash'
import moment, { Moment } from 'moment'
import queryString from 'query-string'
import { IResource } from '../../../resources'
import { useTranslation } from '../../../lib/acm-i18next'
import {
    ApplicationKind,
    ApplicationSetKind,
    ArgoApplication,
    ArgoApplicationApiVersion,
    ArgoApplicationKind,
    IResource,
    ManagedCluster,
    PlacementRule,
    Subscription,
} from '../../../resources'

export const CHANNEL_TYPES = ['git', 'helmrepo', 'namespace', 'objectbucket']
export const subAnnotationStr = 'apps.open-cluster-management.io/subscriptions'
const localSubSuffixStr = '-local'
const localClusterStr = 'local-cluster'

export function isArgoApp(item: IResource) {
    return item.apiVersion === ArgoApplicationApiVersion && item.kind === ArgoApplicationKind
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
    const query = queryString.stringify(queryParams)
    const search = query ? `?${query}` : ''
    return `/multicloud/home/search${search}`
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
