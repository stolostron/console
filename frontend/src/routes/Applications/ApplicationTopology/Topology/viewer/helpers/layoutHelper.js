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

import cytoscape from 'cytoscape'
import cycola from 'cytoscape-cola'
import { getWrappedNodeLabel, getHashCode, computeNodeStatus } from '../../utils/diagram-helpers'
import { layoutEdges, setDraggedLineData } from './linkHelper'
import { getNodeGroups } from '../defaults/grouping'
import FilterHelper from './filterHelper'
import { NODE_SIZE } from '../constants.js'
import _ from 'lodash'
cytoscape.use(cycola)

export default class LayoutHelper {
    /**
     * Helper class to be used by TopologyDiagram.
     */

    constructor(staticResourceData, titles, t) {
        Object.assign(this, staticResourceData)
        this.filterHelper = new FilterHelper(staticResourceData)
        this.titles = titles
        this.t = t
        this.nodeClones = {}
        this.cachedAdapters = {}
        this.cachedLayouts = {}
        this.selfLinks = {}
        this.destroyed = false
    }

    destroy = () => {
        this.destroyed = true
    }

    layout = (nodes, links, hiddenLinks, options, isFilterOn, cb) => {
        Object.assign(this, options)

        // filter by currectly selected filters
        nodes = this.filterElements(nodes, links)

        // filter out nodes that can appear everywhere
        this.nodesToBeCloned = {}
        this.clonedIdSet = new Set()
        if (this.diagramCloneTypes) {
            nodes = nodes.filter((n) => {
                if (this.diagramCloneTypes.indexOf(n.type) !== -1) {
                    this.nodesToBeCloned[n.uid] = n
                    this.clonedIdSet.add(n.uid)
                    return false
                }
                return true
            })
        }

        // for each cluster, group into collections
        const groups = this.getNodeGroups ? this.getNodeGroups(nodes, this.t) : getNodeGroups('', nodes)

        // make sure shape type order can work from this
        this.shapeTypeOrder = _.union(this.shapeTypeOrder, Object.keys(groups.nodeGroups))

        // add node icons (ex: success)
        if (this.updateNodeIcons) {
            this.updateNodeIcons(nodes)
        }

        // group by connections which may pull nodes into other groups
        this.groupNodesByConnections(groups, links)

        // consolidate connected groups which are just a single node connected to clones
        this.consolidateNodes(groups, nodes)

        // re-add cloned nodes
        this.cloneNodes(groups, nodes)

        // consolidate smaller groups into one bigger group
        if (this.diagramOptions.consolidateSmallGroups) {
            this.consolidateGroups(groups)
        }

        //identify hubs
        this.markHubs(groups)

        // set the node's description and recompute node status
        nodes.forEach((node) => {
            if (node.layout) {
                if (this.getNodeTitle) {
                    node.layout.title = this.getNodeTitle(node)
                }
                if (this.getNodeDescription) {
                    node.layout.description = this.getNodeDescription(node)
                }
            }
            computeNodeStatus(node)
        })

        // create cytoscape element collections
        const cy = cytoscape({ headless: true }) // start headless cytoscape
        let collections = this.createCollections(cy, groups)

        // filter collections when searching
        const { searchNames, directedPath } = this.searchElements(cy, collections, nodes.length)

        // assign cytoscape layout options for each collection (ex: dagre, grid)
        this.setLayoutOptions(collections, directedPath)

        // run the cytoscape layouts
        collections = collections.connected.concat(collections.unconnected)
        this.runCollectionLayouts(collections, () => {
            // after all layouts run, fit the collections neatly in the diagram
            const layoutInfo = this.layoutCollections(collections, hiddenLinks, isFilterOn)

            // return to TopologyView to create/position the d3 svg shapes
            if (!this.destroyed) {
                cb({ laidoutNodes: nodes, searchNames, ...layoutInfo })
            }
        })
    }

    groupNodesByConnections = (groups, links) => {
        const { nodeGroups, allNodeMap } = groups
        const sourceMap = {}
        const targetMap = {}
        const anyConnectedSet = new Set()
        links
            .filter((link) => {
                return (
                    link.source &&
                    link.target &&
                    (allNodeMap[link.source] || this.nodesToBeCloned[link.source]) &&
                    (allNodeMap[link.target] || this.nodesToBeCloned[link.target])
                )
            })
            .forEach((link) => {
                // all sources of this target
                let sources = sourceMap[link.target]
                if (!sources) {
                    sources = sourceMap[link.target] = []
                }
                sources.push({ source: link.source, link })

                // all targets of this source
                let targets = targetMap[link.source]
                if (!targets) {
                    targets = targetMap[link.source] = []
                }
                targets.push({ target: link.target, link })

                // anything that's connected
                anyConnectedSet.add(link.source)
                anyConnectedSet.add(link.target)
            })
        const connectedSet = new Set()
        const directions = [
            { map: sourceMap, next: 'source', other: 'target' },
            { map: targetMap, next: 'target', other: 'source' },
        ]

        this.shapeTypeOrder.forEach((type) => {
            if (nodeGroups[type]) {
                const group = nodeGroups[type]
                // sort nodes/links into collections
                nodeGroups[type].connected = []
                nodeGroups[type].unconnected = []
                const connected = nodeGroups[type].connected
                const unconnected = nodeGroups[type].unconnected

                // find the connected nodes
                group.nodes.forEach((node) => {
                    const { uid } = node
                    // if this node is connected to anything start a new group
                    if (!connectedSet.has(uid) && anyConnectedSet.has(uid)) {
                        const grp = {
                            nodeMap: {},
                            edges: [],
                        }
                        connected.push(grp)

                        // then add everything connected to this node to this group
                        this.gatherNodesByConnections(uid, grp, directions, connectedSet, allNodeMap)
                    } else if (!anyConnectedSet.has(uid)) {
                        // the rest are unconnected
                        unconnected.push(node)
                    }
                })
            }
        })

        // remove any groups that are now empty
        Object.keys(nodeGroups).forEach((key) => {
            const { connected, unconnected } = nodeGroups[key]
            if (connected.length === 0 && unconnected.length === 0) {
                delete nodeGroups[key]
            }
        })

        // add all the edges that belong to connected nodes
        this.shapeTypeOrder.forEach((type) => {
            if (nodeGroups[type]) {
                const { connected } = nodeGroups[type]
                connected.forEach((connect) => {
                    const { nodeMap } = connect
                    const details = { clusterMap: {}, typeMap: {} }

                    // fill edges
                    const edgeMap = {}
                    for (const uid in nodeMap) {
                        if (nodeMap.hasOwnProperty(uid)) {
                            directions.forEach(({ map, next, other }) => {
                                if (map.hasOwnProperty(uid)) {
                                    map[uid].forEach((entry) => {
                                        const { link } = entry

                                        // add link-- use current layout if still relavent
                                        const theNext =
                                            this.nodesToBeCloned[link[next]] || allNodeMap[link[next]].layout
                                        const theOther =
                                            this.nodesToBeCloned[link[other]] || allNodeMap[link[other]].layout
                                        if (
                                            !link.layout ||
                                            link[next] !== theNext.uid ||
                                            link[other] !== theOther.uid
                                        ) {
                                            link.layout = {}
                                            link.layout[next] = theNext
                                            link.layout[other] = theOther
                                        }
                                        edgeMap[link.uid] = link

                                        // remember clusters
                                        this.gatherSectionDetails(allNodeMap, [theNext, theOther], details)
                                    })
                                }
                            })
                        }
                    }
                    this.setSectionDetails(connect, details, edgeMap)
                })
            }
        })
    }

    gatherNodesByConnections = (uid, grp, directions, connectedSet, allNodeMap) => {
        // already connected to another group??
        if (!connectedSet.has(uid)) {
            connectedSet.add(uid)

            // add this node to this group
            grp.nodeMap[uid] = allNodeMap[uid]

            // recurse up and down to get everything
            directions.forEach(({ map, next }) => {
                if (map[uid]) {
                    map[uid].forEach((entry) => {
                        const { link } = entry
                        const end = entry[next]
                        if (!connectedSet.has(end) && !this.nodesToBeCloned[end]) {
                            // reiterate until nothing else connected
                            this.gatherNodesByConnections(link[next], grp, directions, connectedSet, allNodeMap)
                        }
                    })
                }
            })
        }
    }

    markHubs = ({ nodeGroups }) => {
        if (this.diagramOptions.showHubs) {
            this.shapeTypeOrder.forEach((type) => {
                if (nodeGroups[type]) {
                    const { connected } = nodeGroups[type]
                    connected.forEach((c) => {
                        this.markHubsHelper(c)
                    })
                }
            })
        }
    }

    markHubsHelper = ({ nodeMap, details }) => {
        // build list of all the next nodes
        const hubArr = []
        const targets = {}
        const sources = {}
        const keys = Object.keys(nodeMap)
        keys.forEach((id) => {
            targets[id] = []
            sources[id] = []
        })
        const { edges } = details
        edges.forEach(
            ({
                layout: {
                    source: { uid: sid },
                    target: { uid: tid },
                },
            }) => {
                if (targets[sid]) {
                    targets[sid].push(tid)
                }
                if (sources[tid]) {
                    sources[tid].push(sid)
                }
            }
        )

        // a hub has 3 or more inputs or 6 ins and outs
        const nodes = Object.keys(targets)
        for (let i = 0; i < nodes.length; i++) {
            const id = nodes[i]
            let cnt = sources[id].length
            if (cnt < 4) {
                cnt += targets[id].length
                if (cnt < 6) {
                    cnt = 0
                }
            }
            if (cnt) {
                hubArr.push({
                    cnt,
                    nodeId: id,
                })
            }
        }

        // sort the largest hubs
        details.collectionHubs = []
        if (hubArr.length > 0) {
            hubArr.sort(({ cnt: ac }, { cnt: bc }) => {
                return bc - ac
            })
            details.collectionHubs = hubArr.filter(({ cnt }) => {
                return cnt >= 6
            })
            const majorThreshold = keys.length < 15 ? 2 : 3
            hubArr.forEach((hub, inx) => {
                const { nodeId } = hub
                const { layout } = nodeMap[nodeId]
                if (inx < majorThreshold) {
                    layout.isMajorHub = true
                } else {
                    layout.isMajorHub = false
                    layout.isMinorHub = true
                }
            })
        }
    }

    consolidateNodes = (groups) => {
        const { nodeGroups, allNodeMap } = groups

        // consolidate single nodes that just connect to clones
        const directions = [
            { next: 'source', other: 'target' },
            { next: 'target', other: 'source' },
        ]
        this.shapeTypeOrder.forEach((type) => {
            if (nodeGroups[type] && nodeGroups[type].connected) {
                // possibly create new consolidated connected groups
                const consolidatedGroups = {}

                nodeGroups[type].connected = nodeGroups[type].connected.filter(({ nodeMap, details: { edges } }) => {
                    // if single node cannot be in connected group unless it ONLY connects to clones
                    if (Object.keys(nodeMap).length === 1) {
                        for (let i = 0; i < edges.length; i++) {
                            const edge = edges[i]
                            directions.forEach(({ next, other }) => {
                                this.consolidateNodesHelper(consolidatedGroups, allNodeMap, nodeMap, edge, next, other)
                            })
                        }
                        return false
                    } else {
                        return true
                    }
                })
                // if not empty, add the new consolidated groups to this nodeGroup
                this.readdConsolidatedGroups(nodeGroups[type].connected, consolidatedGroups)
            }
        })
    }

    consolidateNodesHelper = (newGroups, allNodeMap, nodeMap, edge, next, other) => {
        const cloneNode = this.nodesToBeCloned[edge[next]]
        if (cloneNode) {
            // each cluster/clone type (ex: host)/ type (ex: controller) gets its own connected group
            const nodeId = edge[other]
            const { clusterName, type } = allNodeMap[nodeId]
            const key = `${next}/${clusterName}/${cloneNode.type}`
            let group = newGroups[key]
            if (!group) {
                group = newGroups[key] = {
                    nodeMap: {},
                    edges: [],
                    clusterName,
                    typeMap: {},
                }
            }
            group.edges.push(edge)
            group.typeMap[type] = true
            group.nodeMap = Object.assign(group.nodeMap, nodeMap)
            group.uid = group.uid || nodeId
        }
    }

    consolidateGroups = (groups) => {
        const { nodeGroups } = groups

        // consolidate small connected groups
        const canBeConsolidated = (nodeMap) => {
            if (Object.keys(nodeMap).length <= 4) {
                const map = _.keyBy(nodeMap, 'type')
                return !map['internet'] && !map['host']
            }
            return false
        }
        this.shapeTypeOrder.forEach((type) => {
            if (nodeGroups[type] && nodeGroups[type].connected) {
                let consolidatedGroup = null
                nodeGroups[type].connected = nodeGroups[type].connected.filter((connected) => {
                    const {
                        nodeMap,
                        details: { edges },
                    } = connected
                    if (canBeConsolidated(nodeMap)) {
                        if (!consolidatedGroup) {
                            consolidatedGroup = connected
                        } else {
                            consolidatedGroup.nodeMap = Object.assign(consolidatedGroup.nodeMap, nodeMap)
                            consolidatedGroup.details.edges = consolidatedGroup.details.edges.concat(edges)
                            consolidatedGroup.details.isConsolidation = true
                        }
                        return false
                    }
                    return true
                })
                if (consolidatedGroup) {
                    nodeGroups[type].connected.unshift(consolidatedGroup)
                }
            }
        })
    }

    readdConsolidatedGroups = (connected, newGroups) => {
        for (const key in newGroups) {
            if (newGroups.hasOwnProperty(key)) {
                const { nodeMap, edges, clusterName, typeMap } = newGroups[key]
                const clusters = [clusterName]
                const types = Object.keys(typeMap).sort()
                connected.unshift({
                    nodeMap,
                    details: {
                        edges,
                        clusters: clusters.join('/'),
                        title: this.getSectionTitle(clusters, types),
                    },
                })
            }
        }
    }

    cloneNodes = (groups, nodes) => {
        const { nodeGroups } = groups

        // clone objects for each section that has a link to that clone
        if (Object.keys(this.nodesToBeCloned).length) {
            const directions = ['source', 'target']
            this.shapeTypeOrder.forEach((type) => {
                if (nodeGroups[type] && nodeGroups[type].connected) {
                    nodeGroups[type].connected.forEach(({ nodeMap, details: { edges } }) => {
                        const hashCode = getHashCode(Object.keys(nodeMap).sort().join())
                        edges.forEach((edge) => {
                            directions.forEach((direction) => {
                                const next = edge[direction]
                                const cuid = `${next}_${type}_${hashCode}`
                                if (this.nodesToBeCloned[next] && !nodeMap[cuid]) {
                                    let clone = this.nodeClones[cuid]
                                    if (!clone) {
                                        clone = this.nodeClones[cuid] = _.cloneDeep(this.nodesToBeCloned[next])
                                        clone.layout = {
                                            uid: cuid,
                                            type: clone.type,
                                            label: clone.name,
                                            compactLabel: getWrappedNodeLabel(clone.name, 12, 2),
                                            cloned: true,
                                        }
                                    }
                                    nodeMap[cuid] = clone
                                    nodes.push(nodeMap[cuid])
                                }
                                if (this.nodesToBeCloned[next]) {
                                    edge.layout[direction] = nodeMap[cuid].layout
                                }
                            })
                        })
                    })
                }
            })
        }
    }

    // break large unconnected groups into smaller groups
    breakUnconnected = (cy, nodes, type, collections, details) => {
        let unconnectArr = [nodes]
        if (nodes.length > 48) {
            nodes.sort(({ layout: { label: a = '', uid: au } }, { layout: { label: b = '', uid: bu } }) => {
                const r = a.localeCompare(b)
                if (r !== 0) {
                    return r
                } else {
                    return au.localeCompare(bu)
                }
            })
            unconnectArr = _.chunk(nodes, 32)
        }
        unconnectArr.forEach((arr) => {
            const uidArr = []
            const elements = { nodes: [] }
            arr.forEach((node) => {
                elements.nodes.push({
                    data: {
                        id: node.uid,
                        node,
                    },
                })
                uidArr.push(node.uid)
            })
            if (elements.nodes.length > 0) {
                collections.unconnected.push({
                    type,
                    title: type,
                    elements: cy.add(elements),
                    hashCode: getHashCode(uidArr.sort().join()),
                    details,
                })
            }
        })
    }

    createCollections = (cy, groups) => {
        const { nodeGroups } = groups
        const collections = { connected: [], unconnected: [] }

        this.shapeTypeOrder.forEach((typeObj) => {
            if (nodeGroups[typeObj]) {
                const { connected } = nodeGroups[typeObj]
                let { unconnected } = nodeGroups[typeObj]
                connected.forEach(({ nodeMap, details }) => {
                    const uidArr = []
                    const { edges, title } = details
                    const elements = { nodes: [], edges: [] }
                    _.forOwn(nodeMap, (node) => {
                        const n = {
                            data: {
                                id: node.layout.uid,
                                node,
                            },
                        }
                        elements.nodes.push(n)
                        uidArr.push(node.layout.uid)
                    })
                    edges.forEach((edge) => {
                        const { layout, uid } = edge
                        elements.edges.push({
                            data: {
                                source: layout.source.uid,
                                target: layout.target.uid,
                                edge,
                            },
                        })
                        uidArr.push(uid)
                    })

                    elements.nodes.sort((a, b) => {
                        const {
                            node: { layout: la },
                        } = a.data
                        const {
                            node: { layout: lb },
                        } = b.data
                        const r = la.type.localeCompare(lb.type)
                        if (r !== 0) {
                            return r
                        }
                        return la.label.localeCompare(lb.label)
                    })

                    collections.connected.push({
                        typeObj,
                        title,
                        elements: cy.add(elements),
                        hashCode: getHashCode(uidArr.sort().join()),
                        details,
                    })
                })
                unconnected = unconnected.filter((u) => u.layout !== undefined)

                // break unconnected up by cluster
                const detailMap = {}
                unconnected.forEach((node) => {
                    const { clusterName = 'noclusters', type = 'notype' } = node
                    let details = detailMap[clusterName]
                    if (!details) {
                        const environment = _.get(node, 'specs.cluster.metadata.labels.environment', '')
                        details = detailMap[clusterName] = {
                            typeMap: {},
                            nodes: [],
                            environment,
                        }
                    }
                    details.typeMap[type] = true
                    details.nodes.push(node)
                })

                // for each cluster
                for (const clusterName in detailMap) {
                    if (detailMap.hasOwnProperty(clusterName)) {
                        const { typeMap, nodes, environment } = detailMap[clusterName]
                        const clusters = [clusterName]
                        const types = Object.keys(typeMap).sort()
                        const details = {
                            title: this.getSectionTitle(clusters, types, environment),
                            clusters: clusters.join('/'),
                        }
                        // break large unconnected groups into smaller groups
                        this.breakUnconnected(cy, nodes, typeObj, collections, details)
                    }
                }
            }
        })
        return collections
    }

    setLayoutOptions = ({ connected, unconnected }, directedSearchPath) => {
        this.setConnectedLayoutOptions(connected, {
            numOfSections: connected.length + unconnected.length,
            firstLayout: this.firstLayout,
            searchName: this.searchName,
            directedSearchPath,
        })
        this.setUnconnectedLayoutOptions(unconnected)
    }

    setConnectedLayoutOptions = (connected, options) => {
        connected.forEach((collection) => {
            collection.options =
                typeof this.getConnectedLayoutOptions === 'function'
                    ? this.getConnectedLayoutOptions(collection, options)
                    : {}
        })
    }

    setUnconnectedLayoutOptions = (unconnected) => {
        // get rough idea how many to allocate for each collection based on # of nodes
        const columns = unconnected.map((collection) => {
            const count = collection.elements.nodes().length
            const less18 = count <= 18 ? 6 : 8
            const less12 = count <= 12 ? 4 : less18
            return count <= 3 ? count : count <= 9 ? 3 : less12
        })
        unconnected.forEach((collection, index) => {
            collection.options =
                typeof this.getUnconnectedLayoutOptions === 'function'
                    ? this.getUnconnectedLayoutOptions(collection, columns, index)
                    : {}
        })
    }

    runCollectionLayouts = (collections, cb) => {
        // layout each collections
        const set = {}
        const newLayouts = collections.filter(({ hashCode }) => {
            set[hashCode] = true
            return !this.cachedLayouts[hashCode]
        })
        for (const hashCode in this.cachedLayouts) {
            if (!set[hashCode]) {
                delete this.cachedLayouts[hashCode]
            }
        }

        const totalLayouts = newLayouts.length
        if (totalLayouts) {
            // if there are big cola layouts, show layout loading icon
            const largeConnected = newLayouts.some(({ elements, options }) => {
                return elements.length > 50 && options.name === 'cola'
            })
            if (largeConnected) {
                this.showLayoutLoading()
                setTimeout(() => {
                    this.runCollectionLayoutsHelper(totalLayouts, newLayouts, cb)
                }, 500)
            } else {
                this.runCollectionLayoutsHelper(totalLayouts, newLayouts, cb)
            }
        } else {
            cb()
        }
    }

    runCollectionLayoutsHelper = (totalLayouts, newLayouts, cb) => {
        newLayouts.forEach((collection) => {
            const { elements, hashCode } = collection
            collection.options.hashCode = hashCode
            collection.layout = elements.layout(collection.options)

            const layout = collection.layout
            if (layout) {
                layout.pon('layoutstop').then(({ layout: { adaptor, options } }) => {
                    // save webcola adapter to layout edges later in linkHelper.layoutEdges
                    if (adaptor) {
                        this.cachedAdapters[options.hashCode] = adaptor
                    }
                    totalLayouts--
                    if (totalLayouts <= 0) {
                        cb()
                    }
                })
            }
            try {
                layout.run()
            } catch (e) {
                totalLayouts--
                if (totalLayouts <= 0) {
                    cb()
                }
            }
        })
    }

    // filter collections based on select active filters
    // completely removes elements from layout
    filterElements = (nodes, links) => {
        return this.filterHelper.filterElements(nodes, links, this.activeFilters, this.availableFilters, {
            resetLayout: () => {
                this.cachedLayouts = {}
                this.rowPositionCache = null
            },
        })
    }

    // filter collections based on name/select filters
    // like above except keeps related elements in layout and displays as faded
    searchElements = (cy, collections, numNodes) => {
        const { searchNames, directedPath } = this.filterHelper.searchElements(
            cy,
            collections,
            this.searchName,
            this.activeFilters,
            numNodes,
            {
                // search is starting, save positions and paths
                saveLayout: () => {
                    this.saveRestoreElementStates(collections, true)
                    this.saveCachedLayouts = this.cachedLayouts
                    this.saveRowPositionCache = this.rowPositionCache
                },
                // between searches, keep resetting cache
                resetLayout: () => {
                    this.cachedLayouts = {}
                    this.rowPositionCache = null
                },
                // when search is done, restore originals
                restoreLayout: () => {
                    this.cachedLayouts = this.saveCachedLayouts
                    this.rowPositionCache = this.saveRowPositionCache
                    this.saveRestoreElementStates(collections, false)
                },
            }
        )
        return { searchNames, directedPath }
    }

    saveRestoreElementStates = ({ connected, unconnected }, isSave) => {
        connected.concat(unconnected).forEach(({ elements }) => {
            elements.forEach((element) => {
                const data = element.data()
                if (element.isNode()) {
                    const {
                        node: { layout },
                    } = data
                    if (isSave) {
                        let { x, y } = layout
                        if (layout.undragged) {
                            ;({ x, y } = layout.undragged)
                            delete layout.dragged
                            delete layout.undragged
                        }
                        layout.savePosition = { x, y }
                    } else if (layout.savePosition) {
                        const {
                            savePosition: { x, y },
                        } = layout
                        layout.x = x
                        layout.y = y
                        delete layout.savePosition
                    }
                } else {
                    const {
                        edge: { layout },
                    } = data
                    if (isSave) {
                        if (layout.undragged) {
                            layout.savePath = layout.undragged.linePath
                            delete layout.undragged
                        } else {
                            layout.savePath = layout.linePath
                        }
                    } else {
                        layout.linePath = layout.savePath
                        delete layout.savePath
                    }
                }
            })
        })
        Object.values(this.selfLinks).forEach(({ layout }) => {
            if (isSave) {
                layout.savePath = layout.linePath
                layout.saveTransform = layout.transform
            } else {
                layout.linePath = layout.savePath
                layout.transform = layout.saveTransform
                delete layout.savePath
                delete layout.saveTransform
            }
        })
    }

    layoutCollections = (collections, hiddenLinks, isFilterOn) => {
        // cache layouts
        const clayouts = []
        collections.forEach(({ elements, details, hashCode, type, options: { name } }) => {
            // cache node positions
            let newLayout = false
            const { edges } = details
            let clayout = this.cachedLayouts[hashCode]
            if (!clayout) {
                newLayout = true
                this.cachedLayouts[hashCode] = clayout = {
                    bbox: elements.nodes().boundingBox(),
                    nodes: [],
                    hashCode,
                    type,
                    details,
                    name,
                }
                elements.forEach((element) => {
                    const data = element.data()
                    if (element.isNode()) {
                        const {
                            node: { layout },
                            id,
                        } = data
                        clayout.nodes.push({
                            layout,
                            id,
                            position: element.position(),
                        })
                    }
                })

                // layout and cache edge paths
                clayout.edges = layoutEdges(
                    newLayout,
                    clayout.nodes,
                    elements.edges(),
                    edges,
                    this.diagramOptions.showLineLabels,
                    this.selfLinks,
                    this.cachedAdapters[hashCode]
                )
                delete this.cachedAdapters[hashCode] //can only use once after a cytoscape layout
            }

            clayouts.push(this.cachedLayouts[hashCode])
        })

        // d3 latches onto the object so reuse old title objects
        const collectionMap = _.keyBy(collections, 'hashCode')
        // remove titles where collection is gone
        this.titles = this.titles.filter(({ hashCode }) => {
            return !!collectionMap[hashCode]
        })
        // add title for any new collection
        let titleMap = _.keyBy(this.titles, 'hashCode')
        for (const hashCodeM in collectionMap) {
            if (!titleMap[hashCodeM]) {
                const {
                    details: { title },
                } = collectionMap[hashCodeM]
                if (title) {
                    this.titles.push({
                        title,
                        hashCodeM,
                        position: {},
                    })
                }
            }
        }
        titleMap = _.keyBy(this.titles, 'hashCode')

        // for diagram stability when live:
        //  on first layout--or if lots of new sections, find best order for collections
        //  from then on try to remember a collection's order
        let hashCodeToPositionMap = null
        if (!this.rowPositionCache || clayouts.length > (this.lastCollectionSize || 0) + 6) {
            this.initialSortCollection(clayouts)
        } else {
            hashCodeToPositionMap = this.sortCollection(clayouts, this.rowPositionCache)
        }

        // determine rows
        let cols = 0
        let maxWidth = 0
        let maxHeight = 0
        let completeDiagramWidth = 0
        const xSpaceBetweenCells = NODE_SIZE * 4
        const ySpaceBetweenRows = NODE_SIZE * 2
        let currentX = 0
        const rowDimensions = []
        const collectionDimensions = []
        const collectionIndexToRowMap = {}
        const nodeMapToPositionMap = {}
        const breakWidth = this.getBreakWidth(clayouts)
        clayouts.forEach(({ bbox, name, nodes }, idx) => {
            const { w, h } = bbox
            const rowLength = rowDimensions.length
            collectionDimensions.push(bbox)
            collectionIndexToRowMap[idx] = rowLength
            cols++

            // keep track of the dimensions
            maxWidth = Math.max(currentX + w, maxWidth)
            completeDiagramWidth = Math.max(maxWidth, completeDiagramWidth)
            currentX += w + xSpaceBetweenCells
            maxHeight = Math.max(h, maxHeight)

            // keep track of each node's collection's row/col
            // for next layout--to try to keep collections from flying all over the place
            Object.assign(
                nodeMapToPositionMap,
                _.keyBy(
                    nodes.map(({ layout: { uid } }) => {
                        return { uid, rowLength, idx }
                    }),
                    'uid'
                )
            )

            // create new row?
            if (
                this.shouldCreateNewRow(
                    currentX,
                    breakWidth,
                    rowLength,
                    cols,
                    name,
                    clayouts,
                    idx,
                    hashCodeToPositionMap
                )
            ) {
                rowDimensions.push({
                    rowWidth: maxWidth,
                    rowHeight: maxHeight + NODE_SIZE * 2, // make room for title on tallest collection
                    cols,
                })
                maxHeight = maxWidth = cols = 0
                currentX = 0
            }
        })
        this.rowPositionCache = nodeMapToPositionMap
        this.lastCollectionSize = clayouts.length

        // layout collection columns
        let row1 = 0
        let currentY = 0
        const layoutMap = {}
        const layoutBBox = { x1: 0 }
        clayouts.forEach(({ nodes, edges, name, hashCodeC }, idx) => {
            // this collection's bounding box
            const { x1, y1, w, h } = collectionDimensions[idx]

            // figure out our row
            if (collectionIndexToRowMap[idx] > row1) {
                const { rowHeight1 } = rowDimensions[row1]
                row1 = collectionIndexToRowMap[idx]
                currentY += rowHeight1 + ySpaceBetweenRows
                currentX = 0
            }
            const { rowHeight2 } = rowDimensions[row1]

            // dyCell centers row vertically
            const isGrid = name === 'grid' ? ySpaceBetweenRows : (rowHeight2 - h) / 2
            const dyCell = row1 === 0 ? 0 : isGrid

            // needed to saved dragged position of node based relative to its cell
            const section = { name, hashCodeC, x: currentX, y: currentY + dyCell }
            const transform = { x: section.x - x1, y: section.y - y1 }

            // set title position
            // keep track of bounding box
            if (titleMap[hashCodeC]) {
                const title = titleMap[hashCodeC]
                title.x = section.x + w / 2
                title.y = currentY + dyCell - NODE_SIZE * 2
                layoutBBox.y1 = Math.min(layoutBBox.y1 || title.y, title.y)
            } else {
                layoutBBox.y1 = layoutBBox.y1 || -40
            }

            // set all node positions
            nodes.forEach((node) => {
                const {
                    layout,
                    position: { x, y },
                } = node
                layout.x = x + transform.x
                layout.y = y + transform.y

                // keep track of bounding box
                const nx = layout.x + (name === 'grid' ? NODE_SIZE : NODE_SIZE / 2)
                const ny = layout.y + (name === 'grid' ? NODE_SIZE * 2 : NODE_SIZE)
                layoutBBox.x2 = Math.max(layoutBBox.x2 || nx, nx)
                layoutBBox.y2 = Math.max(layoutBBox.y2 || ny, ny)

                // restore position of any node dragged by user but not when filtering
                if (layout.dragged && !isFilterOn) {
                    // if node is a member of a new section cancel the drag
                    if (layout.section.hashCode === hashCodeC) {
                        // else reconstitute drag using the current section x/y
                        layout.x = section.x + layout.dragged.x
                        layout.y = section.y + layout.dragged.y
                    } else {
                        delete layout.undragged
                        delete layout.dragged
                    }
                } else {
                    delete layout.undragged
                }
                layout.section = section
            })

            // set edge info
            edges.forEach((edge) => {
                const { layout, uid } = edge
                layout.transform = transform
                layout.hidden = hiddenLinks.has(uid)

                // if source or target was dragged, take all the kinks out of the line
                const {
                    source: { dragged: sdragged },
                    target: { dragged: tdragged },
                } = layout
                if (!layout.isLoop && (sdragged || tdragged)) {
                    setDraggedLineData(layout)
                }
            })

            currentX += w + xSpaceBetweenCells
        })
        layoutBBox.width = layoutBBox.x2 - layoutBBox.x1
        layoutBBox.height = (layoutBBox.y2 - layoutBBox.y1) * 1.1
        return {
            layoutMap,
            titles: this.titles,
            selfLinks: this.selfLinks,
            layoutBBox,
        }
    }

    shouldCreateNewRow = (currentX, breakWidth, row, cols, name, clayouts, idx, hashCodeToPositionMap) => {
        // if in a previous layout, the next section was in the next row
        if (
            hashCodeToPositionMap &&
            idx !== clayouts.length - 1 &&
            hashCodeToPositionMap[clayouts[idx + 1].hashCode] &&
            hashCodeToPositionMap[clayouts[idx + 1].hashCode].row > row
        ) {
            return true
        }

        // if last collection laid out--finish this row
        if (idx === clayouts.length - 1) {
            return true
        }

        // greater then the width we should break at
        if (currentX > breakWidth) {
            return true
        }

        // if 5 connected on this row and next is a grid
        if (cols > 5 && name !== 'grid' && clayouts[idx + 1].name === 'grid') {
            return true
        }
        return false
    }

    getBreakWidth = () => {
        return 3000
    }

    initialSortCollection = (clayouts) => {
        // keep types together in larger collections
        const typeSizeMap = {}
        clayouts.forEach(({ type, nodes }) => {
            if (!typeSizeMap[type]) {
                typeSizeMap[type] = 0
            }
            typeSizeMap[type] = typeSizeMap[type] + nodes.length
        })

        // sort layouts so they sort of appear at the same spots in diagram
        clayouts.sort((a, b) => {
            const { nodes: ae, hashCode: ac, type: at, name: an, details: ad } = a
            const { nodes: be, hashCode: bc, type: bt, name: bn, details: bd } = b
            const az = ae.length
            const bz = be.length
            // grids at end
            if (an !== 'grid' && bn === 'grid') {
                return -1
            } else if (an === 'grid' && bn !== 'grid') {
                return 1
            } else if (an === 'grid' && bn === 'grid') {
                // sort clusters by size
                if (az - bz !== 0) {
                    return bz - az
                }
                // sort clusters by name
                return ad.clusters.localeCompare(bd.clusters)
            } else {
                const ax = this.shapeTypeOrder.indexOf(at)
                const bx = this.shapeTypeOrder.indexOf(bt)
                const { clusters: al } = ad
                const { clusters: bl } = bd

                // consolidated smaller sections towards bottom
                if (!ad.isConsolidation && bd.isConsolidation) {
                    return -1
                } else if (ad.isConsolidation && !bd.isConsolidation) {
                    return 1
                }

                // sort larger collections by size
                if (az >= 5 && bz < 5) {
                    return -1
                } else if (az < 5 && bz >= 5) {
                    return 1
                } else if (az >= 5 && bz >= 5) {
                    let r = typeSizeMap[bt] - typeSizeMap[at]
                    if (r !== 0) {
                        return r
                    }
                    r = bz - az
                    if (r !== 0) {
                        return r
                    }
                }

                // else then sort by cluster name
                if (al && bl) {
                    const r = al.localeCompare(bl)
                    if (r !== 0) {
                        return r
                    }
                }

                // sort smaller connected scetions
                if (az - bz !== 0) {
                    return bz - az
                }

                // else sort by type
                if (ax - bx !== 0) {
                    return ax - bx
                }
            }
            // all else fails use hash code
            return ac - bc
        })
    }

    sortCollection = (clayouts, nodeMapToPositionMap) => {
        // since nodes can move from collection to collection, find a common
        // row/idx for all the nodes in this collection
        const hashCodeToPositionMap = {}
        clayouts.forEach(({ hashCode, nodes }) => {
            let row = Number.MAX_SAFE_INTEGER
            let idx = Number.MAX_SAFE_INTEGER
            nodes.forEach(({ layout: { uid } }) => {
                if (nodeMapToPositionMap[uid]) {
                    const { row: r, idx: i } = nodeMapToPositionMap[uid]
                    row = Math.min(row, r)
                    idx = Math.min(idx, i)
                }
            })
            if (row !== Number.MAX_SAFE_INTEGER) {
                hashCodeToPositionMap[hashCode] = { row, idx }
            }
        })

        // sort collections based on common idx
        clayouts.sort(({ hashCode: ah }, { hashCode: bh }) => {
            const adx = (hashCodeToPositionMap[ah] || {}).idx
            const bdx = (hashCodeToPositionMap[bh] || {}).idx
            return adx - bdx
        })
        return hashCodeToPositionMap
    }

    gatherSectionDetails = (allNodeMap, nodes, details) => {
        if (this.getSectionTitles) {
            nodes.forEach(({ uid }) => {
                if (allNodeMap[uid]) {
                    const { clusterName, type } = allNodeMap[uid]

                    if (clusterName) {
                        details.clusterMap[clusterName] = true
                    }
                    details.typeMap[type] = true
                }
            })
        }
    }

    setSectionDetails = (section, details, edgeMap) => {
        if (this.getSectionTitles) {
            const { clusterMap, typeMap } = details
            const clusters = Object.keys(clusterMap).sort()
            const types = Object.keys(typeMap).sort()
            section.details = {
                title: this.getSectionTitle(clusters, types),
                clusters: clusters.join('/'),
                edges: Object.values(edgeMap),
            }
        } else {
            section.details = {
                edges: Object.values(edgeMap),
            }
        }
    }

    // if showing multiple clusters in view, add cluster name to title
    // else just section types
    getSectionTitle = (clusters, types, environment) => {
        if (this.getSectionTitles) {
            return this.getSectionTitles(clusters, types, environment, this.locale)
        }
        return ''
    }
}
