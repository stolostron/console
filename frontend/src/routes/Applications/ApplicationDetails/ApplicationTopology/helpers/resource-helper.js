/* Copyright Contributors to the Open Cluster Management project */
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
import _ from 'lodash'
import queryString from 'query-string'
import { isYAMLEditAvailable } from './search-helper'
import { getSearchLink } from '../../../helpers/resource-helper'
/*
 * UI helpers to help with data transformations
 * */

export const getClusterCount = ({
    t,
    remoteCount,
    localPlacement,
    name,
    namespace,
    kind,
    apigroup = 'apps.open-cluster-management.io',
    clusterNames = [],
}) => {
    const clusterCountString = getClusterCountString(t, remoteCount, localPlacement)

    if (remoteCount) {
        const isArgoApp = apigroup.includes('argoproj.io')
        const searchParams = isArgoApp
            ? {
                  properties: {
                      name: clusterNames,
                      kind: 'cluster',
                  },
              }
            : {
                  properties: {
                      name: name,
                      namespace: namespace,
                      kind,
                      apigroup,
                  },
                  showRelated: 'cluster',
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

export const getClusterCountString = (t, remoteCount, localPlacement) => {
    if (remoteCount) {
        return t(localPlacement ? 'cluster.count.remote_and_local' : 'cluster.count.remote', [remoteCount])
    } else if (localPlacement) {
        return t('cluster.count.local')
    } else {
        return t('cluster.count.none')
    }
}

export const normalizeChannelType = (chType) => {
    const channelType = (chType && chType.toLowerCase()) || ''
    return channelType === 'github' ? 'git' : channelType
}

export const groupByChannelType = (channels) => _.groupBy(channels, (ch) => normalizeChannelType(ch.type))

export const getChannelLabel = (chType, count, t) => {
    const label = t(`channel.type.${chType}`)
    const optionalCount = count > 1 ? ` (${count})` : ''
    return label + optionalCount
}

export const CHANNEL_TYPES = ['git', 'helmrepo', 'namespace', 'objectbucket']

export const getEditLink = ({ name, namespace, kind, apiVersion, cluster = 'local-cluster' }) => {
    return `/resources?${queryString.stringify({
        cluster,
        name,
        namespace,
        kind,
        apiversion: apiVersion,
    })}`
}

export const createEditLink = (item) => {
    return isYAMLEditAvailable() ? <a href={getEditLink(item)}>{item.name}</a> : item.name
}

export const getResourceType = (item, locale, key) => {
    return key ? _.get(item, key) : item.resourceType
}
