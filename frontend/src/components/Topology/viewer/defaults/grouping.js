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

import { getWrappedNodeLabel, getType } from '../helpers/diagram-helpers'
import _ from 'lodash'

export const getNodeGroups = (mode, nodes, t) => {
    switch (mode) {
        case 'cluster':
            return getClusterNodeGroups(nodes || [])

        default:
            return getTypeNodeGroups(nodes || [], t)
    }
}

function getClusterNodeGroups(nodes) {
    // separate into environments
    const groupMap = {}
    const allNodeMap = {}
    nodes.forEach((node) => {
        allNodeMap[node.uid] = node
        const environ = _.get(node, 'specs.cluster.metadata.labels.environment', '')
        let group = groupMap[environ]
        if (!group) {
            group = groupMap[environ] = { nodes: [] }
        }
        const label = node.shortName || node.name || ''
        node.layout = Object.assign(node.layout || {}, {
            uid: node.uid,
            type: node.type,
            label: getWrappedNodeLabel(label, 14, 3),
            compactLabel: getWrappedNodeLabel(label, 12, 2),
        })
        delete node.layout.nodeIcons
        group.nodes.push(node)
    })
    return { nodeGroups: groupMap, allNodeMap }
}

const getNodeLabel = (node, t) => {
    let label = getType(node.type, t)

    if (label === 'Cluster') {
        const nbOfClusters = _.get(node, 'specs.clusterNames', []).length
        if (nbOfClusters > 1) {
            label = `${nbOfClusters} Clusters`
        }
    }

    return label
}

export function getTypeNodeGroups(nodes, t) {
    // separate into types
    const groupMap = {}
    const allNodeMap = {}
    nodes.forEach((node) => {
        allNodeMap[node.uid] = node
        const type = node.type

        let group = groupMap[type]
        if (!group) {
            group = groupMap[type] = { nodes: [] }
        }

        const label = getNodeLabel(node, t)
        node.layout = Object.assign(node.layout || {}, {
            uid: node.uid,
            type: node.type,
            label: getWrappedNodeLabel(label, 12, 3),
            compactLabel: getWrappedNodeLabel(label, 10, 2),
        })

        delete node.layout.source
        delete node.layout.target
        delete node.layout.nodeIcons
        delete node.layout.selfLink
        if (node.selfLink) {
            node.layout.selfLink = {
                link: node.selfLink,
                nodeLayout: node.layout,
            }
        }

        group.nodes.push(node)
    })

    return { nodeGroups: groupMap, allNodeMap }
}
