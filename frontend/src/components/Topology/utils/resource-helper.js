/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2017, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import React from 'react'
import moment from 'moment'
import 'moment/min/locales'
import _ from 'lodash'
import queryString from 'query-string'
import { isYAMLEditAvailable } from './search-helper'
/*
* UI helpers to help with data transformations
* */

export const transform = (resource, key, locale, isSearch) => {
  let value = _.get(resource, key.resourceKey)
  if (key.type === 'timestamp') {
    return moment.unix(value).format('MMM Do YYYY \\at h:mm A')
  } else if (key.type === 'i18n') {
    return t(key.resourceKey)
  } else if (key.type === 'boolean') {
    value = new Boolean(value).toString()
    return t(value)
  } else if (
    key.transformFunction &&
    typeof key.transformFunction === 'function'
  ) {
    return key.transformFunction(resource, locale, key.resourceKey, isSearch)
  } else if (key.resourceKey === 'labels' && Array.isArray(value)) {
    return value.length >= 1 ? value.join(', ') : '-'
  } else {
    return value || value === 0 ? value : '-'
  }
}

const getMoment = (timestamp, locale = '') => {
  const momentObj = moment(
    timestamp,
    timestamp.includes('T') ? 'YYYY-MM-DDTHH:mm:ssZ' : 'YYYY-MM-DD HH:mm:ss'
  )
  momentObj.locale(locale.toLowerCase())
  return momentObj
}

export const getAge = (item, locale, timestampKey) => {
  const key = timestampKey ? timestampKey : 'created'
  const createdTime = _.get(item, key)
  if (createdTime) {
    return getMoment(createdTime, locale).fromNow()
  }
  return '-'
}

export const getShortDateTime = (timestamp, locale, now = null) => {
  const timeFormat = 'h:mm a'
  const monthDayFormat = 'MMM D'
  const yearFormat = 'YYYY'
  if (!timestamp) {
    return '-'
  }
  if (!now) {
    now = moment()
  }
  const date = getMoment(timestamp, locale)
  if (date.isSame(now, 'day')) {
    return date.format(timeFormat)
  } else if (date.isSame(now, 'year')) {
    return date.format(`${monthDayFormat}, ${timeFormat}`)
  } else {
    return date.format(`${monthDayFormat} ${yearFormat}, ${timeFormat}`)
  }
}

export const getClusterCount = ({
  locale,
  remoteCount,
  localPlacement,
  name,
  namespace,
  kind,
  apigroup = 'apps.open-cluster-management.io',
  clusterNames = []
}) => {
  const clusterCountString = getClusterCountString(
    locale,
    remoteCount,
    localPlacement
  )

  if (remoteCount) {
    const isArgoApp = apigroup.includes('argoproj.io')
    const searchParams = isArgoApp
      ? {
        properties: {
          name: clusterNames,
          kind: 'cluster'
        }
      }
      : {
        properties: {
          name: name,
          namespace: namespace,
          kind,
          apigroup
        },
        showRelated: 'cluster'
      }
    const searchLink = getSearchLink(searchParams)
    return (
      <a className="cluster-count-link" href={searchLink}>
        {clusterCountString}
      </a>
    )
  } else {
    return clusterCountString
  }
}

export const getClusterCountString = (locale, remoteCount, localPlacement) => {
  if (remoteCount) {
    return msgs.get(
      localPlacement
        ? 'cluster.count.remote_and_local'
        : 'cluster.count.remote',
      [remoteCount],
      locale
    )
  } else if (localPlacement) {
    return t('cluster.count.local')
  } else {
    return t('cluster.count.none')
  }
}

export const normalizeChannelType = chType => {
  const channelType = (chType && chType.toLowerCase()) || ''
  return channelType === 'github' ? 'git' : channelType
}

export const groupByChannelType = channels =>
  _.groupBy(channels, ch => normalizeChannelType(ch.type))

export const getChannelLabel = (chType, count, locale) => {
  const label = t(`channel.type.${chType}`)
  const optionalCount = count > 1 ? ` (${count})` : ''
  return label + optionalCount
}

export const CHANNEL_TYPES = ['git', 'helmrepo', 'namespace', 'objectbucket']

export const getSearchLink = (params = {}) => {
  const { properties, showRelated } = params
  let textsearch = ''

  _.entries(properties).forEach(([key, value]) => {
    textsearch = `${textsearch}${textsearch ? ' ' : ''}${key}:${
      Array.isArray(value) ? value.join() : value
    }`
  })

  const queryParams = []
  if (textsearch) {
    queryParams.push(
      `filters={"textsearch":"${encodeURIComponent(textsearch)}"}`
    )
  }
  if (showRelated) {
    queryParams.push(`showrelated=${showRelated}`)
  }
  return `/search${queryParams.length ? '?' : ''}${queryParams.join('&')}`
}

export const getEditLink = ({
  name,
  namespace,
  kind,
  apiVersion,
  cluster = 'local-cluster'
}) => {
  return `/resources?${queryString.stringify({
    cluster,
    name,
    namespace,
    kind,
    apiversion: apiVersion
  })}`
}

export const createEditLink = item => {
  return isYAMLEditAvailable() ? (
    <a href={getEditLink(item)}>{item.name}</a>
  ) : (
    item.name
  )
}

export const getResourceType = (item, locale, key) => {
  return key ? _.get(item, key) : item.resourceType
}

export const getStoredObject = storageKey => {
  try {
    storageKey = `${storageKey} ${window.location.href}`
    const sessionObject = JSON.parse(sessionStorage.getItem(storageKey))
    if (
      sessionObject &&
      sessionObject.expiresAt &&
      sessionObject.expiresAt > Date.now()
    ) {
      return sessionObject.sessionData
    } else {
      sessionStorage.removeItem(storageKey)
    }
  } catch (error) {
    // no privileges
  }
  return null
}

export const saveStoredObject = (storageKey, object, expiring = 60) => {
  try {
    storageKey = `${storageKey} ${window.location.href}`
    const sessionObject = {
      expiresAt: Date.now() + expiring * 60 * 1000, // expire in 30 minutes
      sessionData: object
    }
    sessionStorage.setItem(storageKey, JSON.stringify(sessionObject))
  } catch (error) {
    // no privileges
  }
}
