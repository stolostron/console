/* Copyright Contributors to the Open Cluster Management project */
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

import { StatusIcon } from '../../../../../components/Topology/constants.js'
import _ from 'lodash'

const HOURS = 1000 * 60 * 60

const updateClusterNodeStatus = (node, t, sizes, startedAts, now) => {
    // collect data that will determine size of cluster
    const { specs = {} } = node
    const { cluster, violations = [] } = specs || {}
    if (cluster && _.get(cluster, 'metadata.name', '') !== 'local-cluster') {
        const { metadata = {}, usage, status } = cluster
        const { creationTimestamp } = metadata

        // determine status
        const clusterStatus = {
            isOffline: false,
            hasViolations: false,
            hasFailure: false,
            isRecent: false,
            isDisabled: false,
        }

        if (status !== 'offline') {
            if (status.toLowerCase() === 'pending') {
                clusterStatus.hasPending = true
            } else if (violations.length > 0) {
                clusterStatus.hasFailure = true
                clusterStatus.status = [`${violations.length}`, 'violations']
                clusterStatus.hasViolations = true
            }
        } else if (!creationTimestamp || now - new Date(creationTimestamp).getTime() > HOURS * 4) {
            clusterStatus.hasFailure = true
            clusterStatus.isDisabled = true
            clusterStatus.isOffline = true
            clusterStatus.status = t('cluster.status.offline')
        }
        _.set(node, 'specs.clusterStatus', clusterStatus)

        // collect data to show how big cluster is
        if (usage) {
            const { pods = 0 } = usage
            sizes.push({ pods: parseInt(pods, 10), node })
        }

        // collect data to detemine if cluster started recently
        if (creationTimestamp) {
            startedAts.push({
                started: now - new Date(creationTimestamp).getTime(),
                node,
            })
        }
    }
}

export const updateNodeStatus = (nodes, t) => {
    // collect statistics
    const sizes = []
    const startedAts = []
    const now = new Date().getTime()
    nodes.forEach((node) => {
        const { type } = node

        if (type === 'cluster') {
            updateClusterNodeStatus(node, t, sizes, startedAts, now)
        }
    })

    // update node size based on some metric
    updateNodeSize(sizes)

    // show green pulse for recently started node
    updateGreenPulse(startedAts)
}

const updateNodeSize = (sizes) => {
    if (sizes.length > 0) {
        // determine if a cluster is bigger then standard
        const { avg, std } = getStd(
            sizes.map(({ pods }) => {
                return pods
            })
        )
        sizes.forEach(({ pods, node }) => {
            let scale = 1
            if (pods > avg + std * 2) {
                scale = 1.8
            } else if (pods > avg + std) {
                scale = 1.4
            } else if (pods < avg - std) {
                scale = 0.8
            }
            _.set(node, 'specs.scale', scale)
        })
    }
}

const updateGreenPulse = (startedAts) => {
    if (startedAts.length > 0) {
        // calculate recent
        const { avg: a, std: s } = getStd(
            startedAts.map(({ started }) => {
                return started
            })
        )
        const threshold = Math.min(Math.max(a - s, HOURS * 4), HOURS * 8) // at least 6 but not more then 24 hours ago
        startedAts
            .sort(({ started: s1 }, { started: s2 }) => {
                return s1 - s2
            })
            .some(({ node, started }) => {
                if (started < threshold) {
                    const podStatus = _.get(node, 'specs.podStatus', {}) // for filtering
                    podStatus.isRecent = true
                    if (!node.specs.pulse) {
                        node.specs.pulse = 'green'
                    }
                    return false
                }
                return true
            })
    }
}

//a standard deviation function
const getStd = (array) => {
    const avg = _.sum(array) / array.length
    const std = Math.max(avg * 0.05, Math.sqrt(_.sum(_.map(array, (i) => Math.pow(i - avg, 2))) / array.length))
    return { avg, std }
}

export const updateNodeIcons = (nodes) => {
    nodes.forEach((node) => {
        const nodeIcons = {}
        const { type, layout = {}, specs = {} } = node

        // status icon
        let nodeStatus = ''
        let disabled = false

        if (type === 'cluster') {
            // determine icon
            if (specs.clusterStatus) {
                const { hasWarning, hasFailure, status, isDisabled, hasViolations, isOffline } = specs.clusterStatus
                let statusIcon = StatusIcon.success
                if (hasFailure || hasViolations || isOffline) {
                    statusIcon = StatusIcon.error
                } else if (hasWarning) {
                    statusIcon = StatusIcon.pending
                }
                nodeIcons['status'] = Object.assign({}, statusIcon)
                nodeStatus = status
                disabled = isDisabled
            }
        }

        const pulse = _.get(node, 'specs.pulse', '')

        switch (pulse) {
            case 'red':
                nodeIcons['status'] = Object.assign({}, StatusIcon.error)
                break
            case 'yellow':
                nodeIcons['status'] = Object.assign({}, StatusIcon.warning)
                break
            case 'orange':
                nodeIcons['status'] = Object.assign({}, StatusIcon.pending)
                break
            case 'green':
                nodeIcons['status'] = Object.assign({}, StatusIcon.success)
                break
            case 'spinner':
                nodeIcons['status'] = Object.assign({}, StatusIcon.spinner)
                break
            default:
                break
        }

        layout.nodeIcons = Object.assign(layout.nodeIcons || {}, nodeIcons)
        layout.nodeStatus = nodeStatus // description under label
        layout.isDisabled = disabled // show node grayed out
    })
}
