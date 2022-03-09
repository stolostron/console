/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'i18next'
import _ from 'lodash'
import moment, { Moment } from 'moment'
import queryString from 'query-string'
import { IResource } from '../../../resources'

export const CHANNEL_TYPES = ['git', 'helmrepo', 'namespace', 'objectbucket']

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
    const momentObj = moment(timestamp, timestamp.includes('T') ? 'YYYY-MM-DDTHH:mm:ssZ' : 'YYYY-MM-DD HH:mm:ss')
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
