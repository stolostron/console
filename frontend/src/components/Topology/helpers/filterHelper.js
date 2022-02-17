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

import { FilterResults } from '../constants.js'
import _ from 'lodash'

export default class FilterHelper {
    constructor(options) {
        this.lastFilters = null
        this.lastSearch = { searchName: '', searchFilter: undefined }
        this.options = options
    }

    filterElements = (nodes, links, activeFilters, availableFilters, cbs) => {
        if (nodes.length > 0) {
            const { filters } = this.options.getSearchFilter
                ? this.options.getSearchFilter(activeFilters)
                : activeFilters
            if (this.lastFilters && !_.isEqual(this.lastFilters, filters)) {
                cbs.resetLayout()
            }
            this.lastFilters = filters
            const nodeMap = _.keyBy(nodes, 'uid')

            // hide and remove any nodes without the right filter
            nodes = this.options.filterNodes
                ? this.options.filterNodes(nodes, filters, availableFilters, FilterResults)
                : nodes

            // d3 hides the shape--easier to do then constantly creating and destroying svg elements
            links.forEach(({ source, target, layout }) => {
                const sourceSearch = _.get(nodeMap[source], 'layout.search')
                const targetSearch = _.get(nodeMap[target], 'layout.search')
                if (layout) {
                    // hide any links that now connect to a node that is hidden
                    if (sourceSearch === FilterResults.hidden || targetSearch === FilterResults.hidden) {
                        layout.search = FilterResults.hidden
                    } else if (layout.search === FilterResults.hidden) {
                        layout.search = FilterResults.nosearch
                    }
                }

                // show any nodes that have a visible link
                if (!layout || layout.search !== FilterResults.hidden) {
                    if (sourceSearch === FilterResults.hidden) {
                        nodeMap[source].layout.search = FilterResults.nosearch
                    }
                    if (targetSearch === FilterResults.hidden) {
                        nodeMap[target].layout.search = FilterResults.nosearch
                    }
                }
            })
        }
        return nodes
    }

    searchElements = (cy, collections, searchName = '', activeFilters, numNodes, cbs) => {
        // reset previous search
        this.cy = cy
        let searchNames = []
        const { search: searchFilter } = this.options.getSearchFilter
            ? this.options.getSearchFilter(activeFilters)
            : activeFilters
        const isSearching = searchName.length > 0 || !!searchFilter
        const wasSearching = this.lastSearch.searchName || !!this.lastSearch.searchFilter
        const isNewSearch = !_.isEqual(this.lastSearch, {
            searchName,
            searchFilter,
        })
        if (wasSearching && isNewSearch) {
            ;['connected', 'unconnected'].forEach((key) => {
                collections[key].forEach(({ elements }) => {
                    elements.forEach((element) => {
                        const data = element.data()
                        let layout
                        if (element.isNode()) {
                            ;({ layout } = data.node)
                        } else {
                            ;({ layout } = data.edge)
                        }
                        if (!searchName && layout.search === FilterResults.match) {
                            layout.search = FilterResults.matched // past tense
                        } else {
                            layout.search = FilterResults.nosearch
                        }
                    })
                })
            })
        }

        // if start of search, save layout
        // if new search, reset layout caches
        // if end of seach, restore original layout
        if (isNewSearch) {
            if (!isSearching) {
                cbs.restoreLayout()
            } else {
                if (!wasSearching) {
                    cbs.saveLayout()
                }
                cbs.resetLayout()
            }
        }

        // filter by name
        let directedPath = false
        if (isSearching) {
            this.caseSensitive = searchName.localeCompare(searchName.toLowerCase()) !== 0
            if (!this.caseSensitive) {
                searchName = searchName.toLowerCase()
            }
            ;({ searchNames, directedPath } = getSearchNames(searchName))
            if (directedPath) {
                collections['connected'] = this.findConnectedPath(collections['connected'], searchNames)
                collections['unconnected'] = this.hideUnconnected(collections['unconnected'])
            } else {
                searchNames = searchNames.filter((s) => !!s)
                collections['connected'] = this.filterConnected(collections['connected'], searchNames, searchFilter)
                collections['unconnected'] = this.filterUnconnected(
                    collections['unconnected'],
                    searchNames,
                    searchFilter
                )
            }
        } else {
            this.showUnconnected(collections['unconnected'])
        }
        this.lastSearch = { searchName, searchFilter }

        return { searchNames, directedPath }
    }

    manageRelatedMaps = (matchingMap, relatedMap, elementMap) => {
        // are there any paths between?
        // mark srcs and tgts that have a path between them as matches
        for (const id in matchingMap) {
            if (matchingMap[id]) {
                const {
                    node: { layout },
                } = matchingMap[id].data()
                layout.search = FilterResults.match
                delete relatedMap[id]
                delete elementMap[id]
            }
        }

        // mark elements between matched srcs and tgts as related
        for (const id in relatedMap) {
            if (relatedMap[id]) {
                const element = relatedMap[id]
                const data = element.data()
                let layout
                if (data) {
                    if (element.isNode()) {
                        ;({ layout } = data.node)
                    } else {
                        ;({ layout } = data.edge)
                    }
                    layout.search = FilterResults.match // FilterResults.related
                    delete elementMap[id]
                }
            }
        }
    }

    hideElementMap = (elementMap) => {
        // whatever is left in elementMap we hide
        Object.values(elementMap).forEach((element) => {
            const data = element.data()
            let layout
            if (element.isNode()) {
                ;({ layout } = data.node)
            } else {
                ;({ layout } = data.edge)
            }
            layout.search = FilterResults.hidden
        })
    }

    findConnectedPath = (connected, searchNames) => {
        return connected.filter((collection) => {
            const { elements } = collection
            const elementMap = {}
            elements.toArray().forEach((element) => {
                const { id } = element.data()
                elementMap[id] = element
            })

            // find matching sources and targets
            let srcs = []
            let tgts = []
            Object.values(elementMap).forEach((element) => {
                if (element.isNode()) {
                    const name = this.getName(element)
                    const arr = [0, 1]
                    arr.forEach((idx) => {
                        if (searchNames[idx] && name.indexOf(searchNames[idx]) !== -1) {
                            if (idx === 0) {
                                srcs.push(element)
                            } else {
                                tgts.push(element)
                            }
                        }
                    })
                }
            })

            const relatedMap = {}
            const matchingMap = {}
            if (srcs.length > 0 || tgts.length > 0) {
                // if 1st search name is blank, add roots to source
                if (!searchNames[0]) {
                    srcs = elements.roots()
                }
                // if 2nd search name is blank, add leaves to target
                if (!searchNames[1]) {
                    tgts = elements.leaves()
                }

                // if this collection has both a matching source and target, see if there's a path between them
                if (srcs.length > 0 && tgts.length > 0) {
                    // use floydWarshall algo from cytoscape to find paths between two nodes
                    const floydWarshall = elements.floydWarshall({ directed: true })
                    srcs.forEach((src) => {
                        tgts.forEach((tgt) => {
                            if (src.data().id !== tgt.data().id) {
                                const path = floydWarshall.path(src, tgt) || []
                                path.forEach((element, idx, arr) => {
                                    const { id } = element.data()
                                    if (idx === 0 || idx === arr.length - 1) {
                                        matchingMap[id] = element
                                    } else {
                                        relatedMap[id] = element
                                    }
                                })
                            }
                        })
                    })
                    // are there any paths between?
                    if (Object.keys(matchingMap).length > 0) {
                        this.manageRelatedMaps(matchingMap, relatedMap, elementMap)
                    }
                }
            }

            // whatever is left in elementMap we hide
            this.hideElementMap(elementMap)

            collection.elements = this.cy.add(Object.values(matchingMap).concat(Object.values(relatedMap)))
            return collection.elements.length > 0
        })
    }

    hideUnconnected = (unconnected) => {
        unconnected.forEach((collection) => {
            const { elements } = collection
            elements.nodes().forEach((element) => {
                const {
                    node: { layout },
                } = element.data()
                layout.search = FilterResults.hidden
            })
        })
        return []
    }

    showUnconnected = (unconnected) => {
        unconnected.forEach((collection) => {
            const { elements } = collection
            elements.nodes().forEach((element) => {
                const {
                    node: { layout },
                } = element.data()
                layout.search = FilterResults.nosearch
            })
        })
    }

    filterConnected = (connected, searchNames, searchFilter) => {
        return connected.filter((collection) => {
            const { elements } = collection
            const elementMap = {}
            elements.toArray().forEach((element) => {
                const { id } = element.data()
                elementMap[id] = element
            })

            // first find any matching nodes
            const processed = new Set()
            const matching = Object.values(elementMap).filter((element) => {
                if (element.isNode()) {
                    const data = element.data()
                    const {
                        id,
                        node: { layout },
                    } = data
                    if (this.isMatchFound(element, searchNames, searchFilter)) {
                        layout.search = FilterResults.match
                        processed.add(id)
                        delete elementMap[id]
                        return true
                    }
                }
                return false
            })

            // then find related nodes and edges
            const related = []
            matching.forEach((match) => {
                // use cytoscape to find related nodes and their edges
                ;[match.incomers(), match.outgoers()].forEach((collectionObj) => {
                    collectionObj.forEach((element) => {
                        const data = element.data()
                        const { id } = data
                        if (!processed.has(id)) {
                            let layout
                            if (element.isNode()) {
                                ;({ layout } = data.node)
                            } else {
                                ;({ layout } = data.edge)
                            }
                            layout.search = FilterResults.related
                            related.push(element)
                            processed.add(id)
                            delete elementMap[id]
                        }
                    })
                })
            })

            this.hideElementMap(elementMap)

            collection.elements = this.cy.add(matching.concat(related))
            return collection.elements.length > 0
        })
    }

    filterUnconnected = (unconnected, searchNames, searchFilter) => {
        return unconnected.filter((collection) => {
            const { elements } = collection

            // find any matching nodes
            const matching = elements.nodes().filter((element) => {
                const data = element.data()
                const {
                    node: { layout },
                } = data
                if (this.isMatchFound(element, searchNames, searchFilter)) {
                    layout.search = FilterResults.match
                    return true
                } else {
                    layout.search = FilterResults.hidden
                    return false
                }
            })
            collection.elements = matching
            return collection.elements.length > 0
        })
    }

    // filter all nodes that don't have a pulse animation
    filterStaticNodes = (unconnected) => {
        return unconnected.filter((collection) => {
            const { elements } = collection

            // find any interesting pods
            const matching = elements.nodes().filter((element) => {
                const data = element.data()
                const {
                    node: { layout, specs },
                } = data
                const pulse = specs && specs.pulse
                if (!pulse) {
                    layout.search = FilterResults.hidden
                }
                return pulse
            })

            collection.elements = matching
            return collection.elements.length > 0
        })
    }

    isMatchFound = (element, searchNames, searchFilter) => {
        // searching by filter
        if (searchFilter) {
            const { podStatuses, labels } = searchFilter
            const { node } = element.data()

            // searching by pod status
            if (podStatuses && podStatuses.size > 0) {
                const { hasPending, hasFailure, hasRestarts, isRecent } = _.get(node, 'specs.podStatus', {})
                if (
                    !(
                        (podStatuses.has('failed') && hasFailure) ||
                        (podStatuses.has('pending') && hasPending) ||
                        (podStatuses.has('restarts') && hasRestarts) ||
                        (podStatuses.has('recent') && isRecent)
                    )
                ) {
                    return false
                }
            }

            // searching by labels
            if (
                labels &&
                labels.size > 0 &&
                (node.labels || []).findIndex(({ name, value }) => {
                    return labels.has(`${name}: ${value}`)
                }) === -1
            ) {
                return false
            }
        }

        // searching by name
        if (searchNames.length > 0) {
            const name = this.getName(element)
            return searchNames.some((sn) => {
                return name.indexOf(sn) !== -1
            })
        }
        return true
    }

    getName = (element) => {
        const { node } = element.data()
        let name = node.name
        // if not case sensative, make all lower case
        if (!this.caseSensitive) {
            name = name.toLowerCase()
        }
        // if this is a pod, don't match it uid at the end
        if (node.type === 'pod') {
            name = name.split('-')
            name.pop()
            name = name.join('-')
        }
        return name
    }
}

export const getSearchNames = (searchName) => {
    let directedPath = false
    let searchNames = searchName.split(/(\+|>)+/)
    if (searchNames.length > 1) {
        directedPath = searchNames[1] === '>'
        searchNames = searchNames.filter((item) => {
            return item !== '+' && item !== '>'
        })
    }
    return { searchNames: searchNames.map((s) => s.trim()), directedPath }
}
