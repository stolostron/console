/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

'use strict'

import R from 'ramda'
import _ from 'lodash'
import { getType } from '../../utils/diagram-helpers'

export const getNodeTooltips = (searchUrl, node, t) => {
    const tooltips = []
    const { name, namespace, type } = node

    if (!searchUrl || !type || type === '' || type === 'package') {
        return []
    }

    let kind = R.replace(/_/g, '')(type) //remove globally _ occurences
    if (kind === 'placements') {
        kind = 'placementrule'
    }

    if (kind === 'cluster') {
        addClustersTooltip(node, searchUrl, name, tooltips, t)
    } else {
        const pulse = _.get(node, 'specs.pulse', '')
        if (pulse === 'orange') {
            //not created, don't set the href to search page
            tooltips.push({ name: getType(type, t), value: name })
        } else {
            let href = ''
            const searchName = kind === 'helmrelease' ? name : `name:${name}`
            href = namespace
                ? `${searchUrl}?filters={"textsearch":"kind:${kind} ${searchName} namespace:${namespace}"}`
                : `${searchUrl}?filters={"textsearch":"kind:${kind} ${searchName}"}`

            tooltips.push({ name: getType(type, t), value: name, href })
        }
    }

    if (type !== 'namespace' && namespace) {
        //don't show this for Namespace resources
        const href = `${searchUrl}?filters={"textsearch":"kind:namespace name:${namespace}"}`
        tooltips.push({
            name: t('resource.namespace'),
            value: namespace,
            href,
        })
    }

    return tooltips
}

const addClustersTooltip = (node, searchUrl, name, tooltips, t) => {
    const kind = 'cluster'
    let href = `${searchUrl}?filters={"textsearch":"kind:${kind} name:${name}"}`
    if (name.includes(',')) {
        const clusterList = name.replace(/\s/g, '')
        href = `${searchUrl}?filters={"textsearch":"kind:${kind} name:${clusterList}"}`
    }

    const clusterNames = _.get(node, 'specs.clusterNames', [])
    //show only first 2 names
    const showName =
        clusterNames.length > 2 ? `${clusterNames[0]},${clusterNames[1]}...+${clusterNames.length - 2}` : name
    tooltips.push({ name: getType(kind, t), value: showName, href })
}
