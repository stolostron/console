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

export const getSectionTitles = (clusters, types, environs, locale) => {
    const set = new Set()
    types.forEach((type) => {
        switch (type) {
            case 'cluster':
                set.add(environs)
                break

            case 'pod':
                set.add(t('topology.title.pods'))
                break

            case 'service':
                set.add(t('topology.title.services'))
                break

            case 'container':
                set.add(t('topology.title.containers'))
                break

            case 'host':
                set.add(t('topology.title.hosts'))
                break

            case 'internet':
                set.add(t('topology.title.internet'))
                break

            case 'deployment':
            case 'daemonset':
            case 'statefulset':
            case 'cronjob':
                set.add(t('topology.title.controllers'))
                break

            default:
                break
        }
    })
    return Array.from(set).sort().join(', ')
}

export const getLegendTitle = (type, locale) => {
    if (type === undefined) {
        return ''
    }
    switch (type) {
        case 'deploymentconfig':
        case 'replicationcontroller':
        case 'daemonset':
        case 'replicaset':
        case 'configmap':
        case 'ansiblejob':
        case 'customresource':
        case 'statefulset':
        case 'storageclass':
        case 'serviceaccount':
        case 'securitycontextconstraints':
        case 'inmemorychannel':
        case 'integrationplatform':
        case 'persistentvolumeclaim':
            return t(`topology.legend.title.${type}`)

        default:
            return type.charAt(0).toUpperCase() + type.slice(1)
    }
}

// Convert types to OpenShift/Kube entities
export function kubeNaming(type) {
    if (type === undefined) {
        return ''
    }
    switch (type) {
        case 'deploymentconfig':
        case 'replicationcontroller':
        case 'daemonset':
        case 'replicaset':
        case 'configmap':
        case 'ansiblejob':
        case 'customresource':
        case 'statefulset':
        case 'storageclass':
        case 'serviceaccount':
        case 'securitycontextconstraints':
        case 'inmemorychannel':
        case 'integrationplatform':
        case 'persistentvolumeclaim':
        case 'imagestream':
            return t(`topology.legend.title.${type}`)

        default:
            return type.charAt(0).toUpperCase() + type.slice(1)
    }
}

// Make nice carriage return for long titles
export function titleBeautify(maxStringLength, resourceName) {
    const rx_regex = /[A-Z][a-z']+(?: [A-Z][a-z]+)*/g
    var wordsList = resourceName.match(rx_regex)
    if (Math.max(0, maxStringLength) / resourceName.length > 0) {
        for (let idx = wordsList.length - 1; idx > 0; idx--) {
            if (wordsList.slice(0, idx).join('').length <= maxStringLength) {
                wordsList.splice(idx, 0, '\n')
                return wordsList.join('')
            }
        }
        return resourceName
    } else {
        return resourceName
    }
}
