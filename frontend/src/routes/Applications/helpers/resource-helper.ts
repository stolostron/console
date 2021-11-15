/* Copyright Contributors to the Open Cluster Management project */

import _ from "lodash"
import { useTranslation } from 'react-i18next'
import moment from "moment"
import { IResource } from "../../../resources"

export const CHANNEL_TYPES = ['git', 'helmrepo', 'namespace', 'objectbucket']

export const normalizeRepoType = (type: string) => {
    const repoType = (type && type.toLowerCase()) || ''
    return repoType === 'github' ? 'git' : repoType
}

export const groupByRepoType = (repos: any) =>
    _.groupBy(repos, repo => normalizeRepoType(repo.type))

export const getResourceLabel = (type: string, count: number) => {
    const { t } = useTranslation(['application'])
    const label = t(`resource.type.${type}`)
    const optionalCount = count > 1 ? ` (${count})` : ''
    return label + optionalCount
}

export const getMoment = (timestamp: string, locale = '') => {
  const momentObj = moment(
    timestamp,
    timestamp.includes('T') ? 'YYYY-MM-DDTHH:mm:ssZ' : 'YYYY-MM-DD HH:mm:ss'
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
