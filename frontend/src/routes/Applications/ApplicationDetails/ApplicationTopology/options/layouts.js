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

import { defaultShapes } from '../../../../../components/Topology/shapes/constants'
import { NODE_SIZE } from '../../../../../components/Topology/constants.js'
import { getClusterName } from '../helpers/diagram-helpers-utils'
import _ from 'lodash'

export const getConnectedLayoutOptions = ({ elements }) => {
    // pre position elements to try to keep webcola from random layouts
    const typeToShapeMap = defaultShapes
    const nodes = elements.nodes()
    const roots = nodes
        .roots((n) => {
            // only have the application node as root
            const ndata = n.data()
            return ndata.node.type === 'application' || ndata.node.type === 'applicationset'
        })
        .toArray()
    positionApplicationRows(roots, typeToShapeMap)

    // let cola position them, nicely
    return {
        name: 'cola',
        animate: false,
        boundingBox: {
            x1: 0,
            y1: 0,
            w: 1000,
            h: 1000,
        },

        // do directed graph, top to bottom
        flow: { axis: 'y', minSeparation: NODE_SIZE * 1.2 },

        // running in headless mode, we need to provide node size here
        nodeSpacing: () => {
            return NODE_SIZE * 1.3
        },

        unconstrIter: 10, // works on positioning nodes to making edge lengths ideal
        userConstIter: 20, // works on flow constraints (lr(x axis)or tb(y axis))
        allConstIter: 20, // works on overlap
    }
}

export const positionApplicationRows = (row, typeToShapeMap) => {
    const placeLast = []
    const positionMap = {}
    const placedSet = new Set()

    // place rows from top to bottom
    positionRowsDown(0, 0, row, placedSet, positionMap, typeToShapeMap, placeLast)

    // place these nodes based on other nodes
    placeLast.forEach((n) => {
        const {
            node: { type },
        } = n.data()
        if (type === 'placements') {
            const subscriptions = n.incomers().nodes()
            let x,
                y,
                hooksExists = false,
                direction = 2
            subscriptions.forEach((subscription, idx) => {
                const pos = subscription.point()
                // place rules next to first subscription that uses it
                if (idx === 0) {
                    x = pos.x
                    y = pos.y
                    const subOutgoers = subscription.outgoers().nodes()
                    const subIncomers = subscription
                        .incomers((node) => {
                            const nodeData = node.data()
                            return nodeData.node
                                ? nodeData.node.type === 'application' || nodeData.node.type === 'applicationset'
                                : false
                        })
                        .nodes()
                    const appNode = subIncomers[0]
                    const appPos = appNode.point()
                    const appOutgoers = appNode.outgoers().nodes()
                    let subPos = 0
                    for (; subPos < appOutgoers.length; subPos++) {
                        const nodeData = appOutgoers[subPos].data()
                        if (nodeData.node && nodeData.node.uid === subscription.data().node.uid) {
                            break
                        }
                    }
                    if (appOutgoers.length > 1 && pos.x < appPos.x) {
                        direction = -2
                    }
                    if (subOutgoers.length > 2 || pos.x > appPos.x) {
                        hooksExists = true
                    }
                } else if (pos.x < x) {
                    x = pos.x
                }
            })
            x += hooksExists ? (NODE_SIZE * 3) / direction : NODE_SIZE * 3
            y += hooksExists ? (NODE_SIZE * 3) / 2 : 0
            n.position({ x, y })
        }
    })
}

export const processPos = (positionMap, pos, type, name, specs, id, hadRule, key, x, hasHooks) => {
    let posName, deploymentPos
    switch (type) {
        case 'subscription':
            key.value = `subscription/${name}`
            if (hadRule.value && !hasHooks) {
                x += NODE_SIZE * 3
                pos.x = x
            }
            hadRule.value = specs.hasRules
            break
        case 'cluster':
            pos.y += NODE_SIZE / 2
            break
        case 'route':
        case 'ingress':
        case 'daemonset':
        case 'statefulset':
        case 'deploymentconfig':
        case 'deployment':
            key.value = `${type}/${name}-${getClusterName(id)}`
            break
        case 'replicationcontroller':
        case 'service':
        case 'replicaset':
            if (specs.parent) {
                posName = type === 'service' ? specs.parent.parentName : name
                deploymentPos = positionMap[`${specs.parent.parentType}/${posName}-${getClusterName(id)}`]
            }
            if (deploymentPos !== undefined) {
                pos.x = deploymentPos.x
            }
            key.value = `${type}/${name}`
            break
        default:
            // do nothing
            break
    }
}

export const positionRowsDown = (idx, y, row, placedSet, positionMap, typeToShapeMap, placeLast, offsetRow = 0) => {
    if (row.length) {
        // place each node in this row
        const width = row.length * NODE_SIZE * 3

        // normally center the row
        let x = -(width / 2) + offsetRow
        if (row.length === 1) {
            // however if just node under one parent, center under its parent
            const incommers = row[0].incomers().nodes()
            if (incommers.length === 1) {
                x = incommers[0].point().x
            }
        }

        const hadRule = {
            value: false,
        }

        row.forEach((n) => {
            placedSet.add(n.id())
            const pos = { x, y }
            const {
                node: { type, name, specs, id },
            } = n.data()
            const key = {
                value: type,
            }
            let hasHooks = false
            if (type === 'subscription') {
                hasHooks = n.outgoers().nodes().length > 2
            }

            processPos(positionMap, pos, type, name, specs, id, hadRule, key, x, hasHooks)
            positionMap[key.value] = pos
            n.position(pos)
            x += NODE_SIZE * 3
        })

        // find and sort next row down
        let nextRow = []
        row.forEach((n) => {
            const outgoers = n
                .outgoers()
                .nodes()
                .filter((n1) => {
                    return !placedSet.has(n1.id())
                })
                .sort((a, b) => {
                    a = a.data().node
                    b = b.data().node
                    if (a.type === 'subscription' && b.type === 'subscription') {
                        if (a.specs.isPlaced && !b.specs.isPlaced) {
                            return -1
                        } else if (!a.specs.isPlaced && b.specs.isPlaced) {
                            return 1
                        }
                        return a.name.localeCompare(b.name)
                    }
                    return 0
                })
                .toArray()
            nextRow = [...nextRow, ...outgoers]
        })
        nextRow = _.uniqBy(nextRow, (n) => {
            return n.id()
        })

        // check for pre/post hooks on subscription nodes
        const rowWithHooks = []
        if (nextRow.length > 0 && nextRow[0].data().node.type === 'subscription') {
            nextRow.forEach((nr) => {
                const preHook = nr
                    .incomers((n) => {
                        const nodeData = n.data()
                        return nodeData.node ? nodeData.node.type === 'ansiblejob' : false
                    })
                    .nodes()
                Array.prototype.push.apply(rowWithHooks, preHook)
                rowWithHooks.push(nr)
                const postHook = nr
                    .outgoers((n) => {
                        const nodeData = n.data()
                        return nodeData.node ? nodeData.node.type === 'ansiblejob' : false
                    })
                    .nodes()
                Array.prototype.push.apply(rowWithHooks, postHook)
            })
        }

        if (rowWithHooks.length > 0) {
            nextRow.length = 0
            Array.prototype.push.apply(nextRow, rowWithHooks)
        }
        // don't put clusters and deployables on same row
        let clusterList = []
        nextRow = nextRow.filter((n) => {
            const { node } = n.data()
            const { type } = node
            if (type === 'placements') {
                placeLast.push(n)
                return false
            } else if (type === 'cluster') {
                clusterList.push(n)
                return false
            }
            return true
        })
        if (nextRow.length === 0) {
            nextRow = clusterList
            clusterList = []
        }
        const hybridRow = clusterList.length > 0 // deployables and clusters

        // place next row down
        y += NODE_SIZE * 2.4
        positionRowsDown(
            idx + 1,
            y,
            nextRow,
            placedSet,
            positionMap,
            typeToShapeMap,
            placeLast,
            hybridRow ? width / 2 : 0
        )
        if (hybridRow) {
            y += NODE_SIZE * 2.4
            positionRowsDown(idx + 1, y, clusterList, placedSet, positionMap, typeToShapeMap, placeLast)
        }
    }
}

////////////////////////// GRID //////////////////////////////////////////
export const getUnconnectedLayoutOptions = (collection, columns, index) => {
    const count = collection.elements.length
    const cols = Math.min(count, columns[index])
    const h = Math.ceil(count / columns[index]) * NODE_SIZE * 2.7
    const w = cols * NODE_SIZE * 3
    return {
        name: 'grid',
        avoidOverlap: false, // prevents node overlap, may overflow boundingBox if not enough space
        boundingBox: {
            x1: 0,
            y1: 0,
            w,
            h,
        },
        sort: (a, b) => {
            const {
                node: { layout: la, selfLink: aself },
            } = a.data()
            const {
                node: { layout: lb, selfLink: bself },
            } = b.data()
            if (la.nodeIcons && !lb.nodeIcons) {
                return -1
            } else if (!la.nodeIcons && lb.nodeIcons) {
                return 1
            } else if (aself && !bself) {
                return -1
            } else if (!aself && bself) {
                return 1
            }
            const r = la.type.localeCompare(lb.type)
            if (r !== 0) {
                return r
            }
            return la.label.localeCompare(lb.label)
        },
        cols,
    }
}
