/* Copyright Contributors to the Open Cluster Management project */

import _ from 'lodash'
import { useTranslation } from 'react-i18next'
import queryString from 'query-string'
import moment from 'moment'
import { IResource } from '../../../resources'

export const CHANNEL_TYPES = ['git', 'helmrepo', 'namespace', 'objectbucket']

export const normalizeRepoType = (type: string) => {
    const repoType = (type && type.toLowerCase()) || ''
    return repoType === 'github' ? 'git' : repoType
}

export const groupByRepoType = (repos: any) => _.groupBy(repos, (repo) => normalizeRepoType(repo.type))

function getResourceType(type: String, t: (arg: String) => String) {
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

export const getResourceLabel = (type: string, count: number) => {
    const { t } = useTranslation()
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
    const queryParams = []
    let textSearch = ''

    _.entries(properties).forEach(([key, value]) => {
        textSearch = `${textSearch}${textSearch ? ' ' : ''}${key}:${Array.isArray(value) ? value.join() : value}`
    })

    if (textSearch) {
        queryParams.push(`filters={"textsearch":"${encodeURIComponent(textSearch)}"}`)
    }
    if (showRelated) {
        queryParams.push(`showrelated=${showRelated}`)
    }
    return `/search${queryParams.length ? '?' : ''}${queryParams.join('&')}`
}

export const getEditLink = (params: {
    name: string
    namespace: string
    kind: string
    apiversion: string
    cluster: string
}) => {
    const { name, namespace, kind, apiversion, cluster } = params
    return `/resources?${queryString.stringify({
        cluster,
        name,
        namespace,
        kind,
        apiversion,
    })}`
}
