/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import _ from 'lodash'

export const getNodeTitle = (node) => {
    return _.get(node, 'specs.title', '')
}

export const getSectionTitles = (clusters, types, environs, t) => {
    const set = new Set()
    types.forEach((type) => {
        switch (type) {
            case 'cluster':
                set.add(environs)
                break

            case 'pod':
                set.add(t('pods'))
                break

            case 'service':
                set.add(t('services'))
                break

            case 'container':
                set.add(t('containers'))
                break

            case 'host':
                set.add(t('hosts'))
                break

            case 'internet':
                set.add(t('internet'))
                break

            case 'deployment':
            case 'daemonset':
            case 'statefulset':
            case 'cronjob':
                set.add(t('controllers'))
                break

            default:
                break
        }
    })
    return Array.from(set).sort().join(', ')
}

export const getLegendTitle = (type) => {
    if (type === undefined) {
        return ''
    }
    return (type.charAt(0).toUpperCase() + type.slice(1))
        .replace('stream', ' Stream')
        .replace('channel', ' Channel')
        .replace('controller', 'Controller')
    //}
}
