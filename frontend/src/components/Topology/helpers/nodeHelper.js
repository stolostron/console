/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'

import * as d3 from 'd3'
import SVG from 'svg.js'
import { dragLinks } from './linkHelper'
import { attrs, styles, kubeNaming, titleBeautify, counterZoom, getTooltip } from './utilities'
import _ from 'lodash'

import { FilterResults, RELATED_OPACITY, NODE_RADIUS, NODE_SIZE } from '../constants.js'

const TITLE_RADIUS = NODE_RADIUS + 28
const textNodeStatus = 'text.nodeStatus'
const gNodeTitle = 'g.nodeTitle'
const gNodeLabel = 'g.nodeLabel'
const gClusterCountText = 'g.clusterCountText'
const useNodeIcon = 'use.nodeIcon'
const useClusterCountIcon = 'use.clusterCountIcon'
const dotClusterCountIcon = '.clusterCountIcon'
const useArgoAppCountIcon = 'use.argoAppCountIcon'
const dotArgoAppCountIcon = '.argoAppCountIcon'

const hideTooltip = () => {
    return {
        display: 'none',
        opacity: 0,
    }
}

export const tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .call(styles, () => {
        return hideTooltip()
    })
    .on('mouseover', () => {
        tooltip.interrupt().style('opacity', 1)
    })
    .on('mouseleave', () => {
        tooltip.call(styles, () => {
            return hideTooltip()
        })
    })
export default class NodeHelper {
    /**
     * Helper class to be used by TopologyDiagram.
     *
     * Contains functions to draw and manage nodes in the diagram.
     */
    constructor(svg, nodes, typeToShapeMap, showsShapeTitles, t, getClientRef) {
        this.svg = svg
        this.nodes = nodes
        this.typeToShapeMap = typeToShapeMap
        this.getClientRef = getClientRef
        this.showsShapeTitles = showsShapeTitles
        this.t = t
    }

    // add or remove nodes based on data in this.nodes
    updateDiagramNodes = (currentZoom, nodeClickHandler, nodeDragHandler) => {
        const draw =
            typeof SVG === 'function' ? SVG(document.createElementNS('http://www.w3.org/2000/svg', 'svg')) : undefined
        const filteredNodes = this.nodes.filter((node) => !!node.layout)

        // join data to svg groups
        // creates enter and exit arrays
        // if already exists, updates its __data__ with data
        // based on creating a map '$n.layout.uid'
        const nodes = this.svg
            .select('g.nodes')
            .selectAll('g.node')
            .data(filteredNodes, (n) => {
                return n.layout ? n.layout.uid : ''
            })

        // remove node groups that no longer have data (in exit array)
        // or any nodes with a duplicate key ($n.layout.uid)
        nodes.exit().remove()

        // add node groups for new data (in enter array)
        const newNodes = nodes
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', currentZoom)
            .attr('type', (d) => {
                return d.name
            })
            .attr('id', (d) => {
                return d.id
            })
            .style('opacity', 0.0)
            .on('click', (d) => {
                tooltip.style('display', 'none')
                nodeClickHandler(d)
            })
            // tooltip
            .on('mouseover', ({ currentTarget }, { layout }) => {
                const bb = currentTarget.getBoundingClientRect()
                if (layout.tooltips && layout.tooltips.length > 0) {
                    tooltip.style('display', undefined)
                    tooltip.interrupt().transition().delay(200).duration(100).style('opacity', 1)
                    tooltip
                        .html(() => {
                            return getTooltip(layout.tooltips)
                        })
                        .call(styles, (d, j, ts) => {
                            const { width, height } = ts[j].getBoundingClientRect()
                            if (navigator.userAgent.indexOf('Firefox') !== -1) {
                                return {
                                    top: bb.top - height + window.scrollY - 6 + 'px',
                                    left: bb.left + (bb.width * 0.72) / 2 - (width * 1.02) / 2 + 'px',
                                }
                            } else {
                                return {
                                    top: bb.top - height + window.scrollY - 6 + 'px',
                                    left: bb.left + bb.width / 2 - width / 2 + 'px',
                                }
                            }
                        })
                } else {
                    tooltip.style('opacity', 0)
                }
            })
            .on('mouseout', () => {
                tooltip
                    .transition()
                    .delay(1000)
                    .duration(100)
                    .style('opacity', 0)
                    .on('end', () => {
                        tooltip.style('display', 'none')
                    })
            })

        // node hover/select shape
        this.createNodeHilites(newNodes)

        // node pulse shape
        this.createNodePulse(newNodes)

        // node shape
        this.createNodeShapes(newNodes, nodeDragHandler)

        // node labels
        if (draw) {
            if (this.showsShapeTitles) {
                this.createTitles(draw, newNodes)
            }
            this.createLabels(draw, newNodes)
        }

        // update node icons
        this.updateNodeIcons()

        // cluster count text - can't use newNodes for initial render
        // as it won't get the latest cluster count value
        this.createClusterCountText(draw, nodes, newNodes)
    }

    createNodePulse = (nodes) => {
        nodes.append('use').call(attrs, () => {
            return {
                href: '#diagramShapes_pulse',
                width: NODE_SIZE * 2,
                height: NODE_SIZE * 2,
                visibility: 'hidden',
                tabindex: -1,
                class: 'pulse',
            }
        })
    }

    createNodeHilites = (nodes) => {
        nodes.append('use').call(attrs, () => {
            return {
                href: '#diagramShapes_circle',
                width: NODE_SIZE - 4,
                height: NODE_SIZE - 4,
                tabindex: -1,
                class: 'shadow',
            }
        })
    }

    addElementsForNodes = (nodes, nodeDragHandler) => {
        nodes
            .append('use')
            .call(attrs, (d) => {
                const { layout, specs } = d
                const shapeType = specs.shapeType || layout.type
                const shape = this.typeToShapeMap[shapeType] ? this.typeToShapeMap[shapeType].shape : 'other'
                const classType = this.typeToShapeMap[shapeType] ? this.typeToShapeMap[shapeType].className : 'default'
                return {
                    href: `#diagramShapes_${shape}`,
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                    tabindex: 1,
                    class: `shape ${classType}`,
                }
            })
            .call(
                d3
                    .drag()
                    .on('drag', this.dragNode)
                    .on('start', () => {
                        if (nodeDragHandler) {
                            nodeDragHandler(true)
                        }
                    })
                    .on('end', () => {
                        if (nodeDragHandler) {
                            nodeDragHandler(false)
                        }
                    })
            )
    }

    createNodeShapes = (nodes, nodeDragHandler) => {
        this.addElementsForNodes(nodes, nodeDragHandler)

        //Make sure the subscription node updates
        const subscriptionNode = this.svg
            .select('g.nodes')
            .selectAll('g.node')
            .filter((d) => {
                const { layout } = d
                return layout.type === 'subscription' || layout.type === 'subscriptionblocked'
            })
        subscriptionNode.select('use.shape').remove()
        const subscriptionNodeShape = subscriptionNode.selectAll('use.shape').data((d) => {
            return [d]
        })
        const subscriptionNodeShapeEnter = subscriptionNodeShape.enter()

        this.addElementsForNodes(subscriptionNodeShapeEnter, nodeDragHandler)
    }

    createTitles = (draw, nodes) => {
        // create label
        nodes
            .filter(({ layout: { title } }) => {
                return !!title
            })
            .append('g')
            .attr('class', 'nodeTitle')
            .html(({ layout }) => {
                const nodeTitleGroup = draw.group()

                // title
                nodeTitleGroup.text((add) => {
                    add.tspan(layout.title).addClass('counter-zoom title beg').newLine()
                })

                return nodeTitleGroup.svg()
            })
            .call(d3.drag().on('drag', this.dragNode))
    }

    createLabels = (draw, nodes) => {
        // create label
        nodes
            .append('g')
            .attr('class', 'nodeLabel')
            .html(({ layout }) => {
                const nodeLabelGroup = draw.group()

                // white background
                nodeLabelGroup.rect()

                // normal label
                nodeLabelGroup
                    .text((add) => {
                        if (layout.type) {
                            titleBeautify(layout.label.indexOf('\n'), kubeNaming(layout.type, this.t))
                                .split('\n')
                                .forEach((line) => {
                                    add.tspan(line)
                                        .addClass('counter-zoom beg')
                                        .font({ 'font-weight': 'bold' })
                                        .newLine()
                                })
                        }
                        if (layout.description) {
                            layout.description.split('\n').forEach((line) => {
                                if (line) {
                                    add.tspan(line)
                                        .addClass('description beg')
                                        .font({ size: 14 })

                                        .newLine()
                                }
                            })
                        }
                    })
                    .addClass('regularLabel')
                    .leading(1)

                // compact label
                nodeLabelGroup
                    .text((add) => {
                        layout.compactLabel.split('\n').forEach((line) => {
                            if (line) {
                                add.tspan(line).addClass('counter-zoom beg').newLine()
                            }
                        })
                    })
                    .addClass('compactLabel')

                return nodeLabelGroup.svg()
            })
            .call(d3.drag().on('drag', this.dragNode))

            // determine sizes of white opaque background
            .call(this.layoutBackgroundRect)
    }

    // Only for cluster nodes, put the cluster count text
    createClusterCountText = (draw, nodes, newNodes) => {
        let clusterNode = nodes.filter((d) => {
            const { layout } = d
            console.log(layout.type)
            return layout.type === 'cluster'
        })

        // Need this when we switch tabs Overview -> Topology
        if (clusterNode.empty()) {
            clusterNode = newNodes.filter((d) => {
                const { layout } = d
                console.log(layout.type)
                return layout.type === 'cluster'
            })
        }
        const clusterCountTextNodes = clusterNode.selectAll(gClusterCountText)
        clusterCountTextNodes.remove()

        clusterNode
            .append('g')
            .attr('class', 'clusterCountText')
            .html(({ layout }) => {
                const clusterCountTextGroup = draw.group()
                // Generate text SVG on the fly
                clusterCountTextGroup.text((add) => {
                    add.tspan(layout.clusterCount)
                        .addClass('count')
                        .font({ fill: 'white', 'font-weight': 'bold' })
                        .newLine()
                })

                return clusterCountTextGroup.svg()
            })
            .call(d3.drag().on('drag', this.dragNode))
    }

    layoutBackgroundRect = (selectionB) => {
        selectionB.each(({ layout }, i, ns) => {
            layout.textBBox = ns[i].getBBox()
            d3.select(ns[i])
                .select('rect')
                .call(attrs, ({ layout: { textBBox } }) => {
                    return {
                        x: textBBox.x,
                        y: textBBox.y,
                        width: textBBox.width,
                        height: textBBox.height,
                        tabindex: -1,
                    }
                })
        })
    }

    // update node icons
    updateNodeIcons = () => {
        const nodes = this.svg.select('g.nodes').selectAll('g.node')

        // svg icons
        nodes.selectAll(useNodeIcon).remove()
        const svgIcons = nodes.selectAll(useNodeIcon).data(({ layout: { nodeIcons } }) => {
            return nodeIcons
                ? Object.values(nodeIcons).filter(({ icon }) => {
                      return !!icon
                  })
                : []
        })
        svgIcons
            .enter()
            .append('use')
            .call(attrs, ({ icon, classType, width, height }) => {
                return {
                    href: `#diagramIcons_${icon}`,
                    width: `${width}px`,
                    height: `${height}px`,
                    'pointer-events': 'none',
                    tabindex: -1,
                    class: `nodeIcon ${classType}`,
                }
            })

        // special icon for the cluster node count
        const clusterNode = this.svg
            .select('g.nodes')
            .selectAll('g.node')
            .filter((d) => {
                const { layout } = d
                return layout.type === 'cluster'
            })
        const clusterSVGIcon = clusterNode.selectAll(useClusterCountIcon).data(({ layout: { clusterCountIcon } }) => {
            return clusterCountIcon ? [clusterCountIcon] : []
        })
        clusterSVGIcon
            .enter()
            .append('use')
            .call(attrs, ({ icon, classType, width, height }) => {
                return {
                    href: `#diagramIcons_${icon}`,
                    width: `${width}px`,
                    height: `${height}px`,
                    'pointer-events': 'none',
                    tabindex: -1,
                    class: `clusterCountIcon ${classType}`,
                }
            })

        // png icons
        nodes.selectAll('image.nodeIcon').remove()
        const pngIcons = nodes.selectAll('image.nodeIcon').data(({ layout: { nodeIcons } }) => {
            return nodeIcons
                ? Object.values(nodeIcons).filter(({ href }) => {
                      return !!href
                  })
                : []
        })
        pngIcons
            .enter()
            .append('image')
            .call(attrs, ({ href, width, height }) => {
                return {
                    href: href,
                    width: `${width}px`,
                    height: `${height}px`,
                    'pointer-events': 'none',
                    tabindex: -1,
                    class: 'nodeIcon',
                }
            })

        // node status message
        const nodeStatusT = nodes
            .selectAll(textNodeStatus)
            .data(({ layout: { y, scale, search, nodeStatus = '', textBBox, uid } }) => {
                return nodeStatus ? [{ y, scale, search, nodeStatus, textBBox, uid }] : []
            })
        nodeStatusT.exit().remove()
        nodeStatusT
            .enter()
            .append('text')
            .text(({ nodeStatus }) => {
                return Array.isArray(nodeStatus) ? nodeStatus[0] : nodeStatus
            })
            .call(attrs, ({ nodeStatus }) => {
                return {
                    'pointer-events': 'none',
                    tabindex: -1,
                    class: `nodeStatus ${Array.isArray(nodeStatus) ? 'red' : ''}`,
                }
            })
            .append('tspan')
            .text(({ nodeStatus }) => {
                return Array.isArray(nodeStatus) ? `  ${nodeStatus[1]}` : ''
            })
            .call(attrs, () => {
                return {
                    'pointer-events': 'none',
                    tabindex: -1,
                    class: 'nodeStatus',
                }
            })

        // update disabled shape
        nodes.selectAll('use.shape').classed('disabled', ({ layout: { isDisabled } }) => {
            return isDisabled
        })
    }

    moveNodes = (transition, currentZoom, searchChanged) => {
        const nodeLayer = this.svg.select('g.nodes')

        // move node shapes
        const nodes = nodeLayer
            .selectAll('g.node')
            .call(styles, ({ layout }) => {
                // set opacity to 0 if search changed or node moved
                // we will transition it back when in new position
                let opacity = 1.0
                const { x, y, lastPosition, search = FilterResults.nosearch } = layout
                if (!lastPosition || Math.abs(lastPosition.x - x) > 10 || Math.abs(lastPosition.y - y) > 10) {
                    opacity = 0.1
                }
                layout.lastPosition = { x, y }

                const related = search === FilterResults.related ? RELATED_OPACITY : opacity

                return {
                    visibility: search === FilterResults.hidden ? 'hidden' : 'visible',
                    opacity: searchChanged ? 0.0 : related,
                }
            })
            .attr('transform', currentZoom)

        nodes.transition(transition).call(styles, ({ layout: { search = FilterResults.nosearch } }) => {
            return {
                opacity: search === FilterResults.related ? RELATED_OPACITY : 1.0,
            }
        })

        // clean up any selections if search changed
        if (searchChanged) {
            nodes.classed('selected', ({ layout }) => {
                layout.selected = false
                return false
            })
        }

        // if name search only position visible nodes
        const visible = nodes
            .filter(({ layout: { search = FilterResults.nosearch } }) => {
                return search !== FilterResults.hidden
            })
            .classed('selected', ({ layout }) => {
                const { search = FilterResults.nosearch, selected } = layout
                if (search === FilterResults.matched || selected) {
                    return true
                }
                return false
            })

        // move pulse shape
        nodes.selectAll('use.pulse').call(attrs, ({ layout, specs }) => {
            const { x = 0, y = 0, scale = 1, search = FilterResults.nosearch } = layout
            const pulse = specs !== null && specs.pulse
            const sz = NODE_SIZE * scale * 2 + 20
            return {
                width: sz,
                height: sz,
                transform: `translate(${x - sz / 2}, ${y - sz / 2})`,
                visibility: pulse && search !== FilterResults.hidden ? 'visible' : 'hidden',
                class: `pulse ${pulse}`,
            }
        })

        // move node shape
        visible.selectAll('use.shape').call(attrs, ({ layout }) => {
            const { x, y, scale = 1 } = layout
            const sz = NODE_SIZE * scale
            return {
                width: sz,
                height: sz,
                transform: `translate(${x - sz / 2}, ${y - sz / 2})`,
            }
        })

        // move highlight/select shape
        visible.selectAll('use.shadow').call(attrs, ({ layout }) => {
            const { x, y, scale = 1 } = layout
            const sz = NODE_SIZE * scale + 20
            return {
                width: sz,
                height: sz,
                transform: `translate(${x - sz / 2}, ${y - sz / 2})`,
            }
        })

        // move icons
        this.moveIcons(visible, '.nodeIcon')

        // move cluster count icon
        this.moveIcons(nodeLayer, dotClusterCountIcon)

        // move argo app count icon
        this.moveIcons(nodeLayer, dotArgoAppCountIcon)

        if (this.showsShapeTitles) {
            moveTitles(this.svg)
        }
        // move labels
        moveLabels(this.svg)
        // move clusterCountText
        moveClusterCountText(this.svg)
    }

    moveIcons = (nodeLayer, iconClass) => {
        nodeLayer.selectAll(iconClass).call(attrs, ({ dx, dy, width, height }, i, ns) => {
            const {
                layout: { x = 0, y = 0, scale = 1 },
            } = d3.select(ns[i].parentNode).datum()
            return {
                transform: `translate(${x + dx * scale - width / 2}, ${y + dy * scale - height / 2})`,
            }
        })
    }

    dragNode = (evt, dp) => {
        const { layout } = dp
        const node = d3.select(`#${dp.id}`)
        tooltip.style('display', 'none')

        // don't consider it dragged until more then 5 pixels away from original
        if (!layout.undragged) {
            layout.undragged = {
                x: layout.x,
                y: layout.y,
            }
        }

        layout.x += evt.dx
        layout.y += evt.dy
        if (Math.hypot(layout.x - layout.undragged.x, layout.y - layout.undragged.y) > 5) {
            // keep dragged distance relative to it section in case the whole section moves
            layout.dragged = {
                x: layout.x - layout.section.x,
                y: layout.y - layout.section.y,
            }

            // drag pulse
            node.selectAll('use.pulse').attr('transform', () => {
                const { x, y, scale = 1 } = layout
                const sz = NODE_SIZE * scale * 2 + 20
                return `translate(${x - sz / 2}, ${y - sz / 2})`
            })

            // drag shape
            node.selectAll('use.shape').attr('transform', () => {
                const { x, y, scale = 1 } = layout
                const sz = NODE_SIZE * scale
                return `translate(${x - sz / 2}, ${y - sz / 2})`
            })

            // drag hilights
            node.selectAll('use.shadow').attr('transform', () => {
                const { x, y, scale = 1 } = layout
                const sz = NODE_SIZE * scale + 20
                return `translate(${x - sz / 2}, ${y - sz / 2})`
            })

            // drag icons
            this.dragIcons(node, '.nodeIcon')

            // drag cluster count icon
            this.dragIcons(node, dotClusterCountIcon)

            // drag argo app count icon
            this.dragIcons(node, dotArgoAppCountIcon)

            // drag status message
            node.selectAll(textNodeStatus).call(attrs, ({ textBBox: { dy } }, i, ns) => {
                const {
                    layout: { x, y },
                } = d3.select(ns[i].parentNode).datum()
                return {
                    x: x,
                    y: y + dy,
                }
            })

            if (this.showsShapeTitles) {
                // drag node title if any
                const nodeTitles = node.selectAll(gNodeTitle)
                nodeTitles.each((d, i, ns) => {
                    d3.select(ns[i])
                        .selectAll('text')
                        .attr('x', () => {
                            return layout.x
                        })
                        .attr('y', () => {
                            return layout.y - TITLE_RADIUS
                        })
                    d3.select(ns[i])
                        .selectAll('tspan')
                        .attr('x', () => {
                            return layout.x
                        })
                })
            }

            //drag cluster count text
            const clusterCountText = node.selectAll(gClusterCountText)
            clusterCountText.each((d, i, ns) => {
                d3.select(ns[i])
                    .selectAll('text')
                    .attr('x', () => {
                        return layout.x + NODE_RADIUS - 2
                    })
                    .attr('y', () => {
                        return layout.y + 4 * (layout.scale || 1)
                    })
                d3.select(ns[i])
                    .selectAll('rect')
                    .attr('x', () => {
                        return layout.x - layout.textBBox.width / 2
                    })
                    .attr('y', () => {
                        return layout.y + NODE_RADIUS * (layout.scale || 1) + 2
                    })
                d3.select(ns[i])
                    .selectAll('tspan')
                    .attr('x', () => {
                        return layout.x + NODE_RADIUS - 2
                    })
                    .attr('y', () => {
                        return layout.y + 4 * (layout.scale || 1)
                    })
            })

            // drag node label
            const nodeLabels = node.selectAll(gNodeLabel)
            nodeLabels.each((d, i, ns) => {
                d3.select(ns[i])
                    .selectAll('text')
                    .attr('x', () => {
                        return layout.x
                    })
                    .attr('y', () => {
                        return layout.y + NODE_RADIUS * (layout.scale || 1)
                    })
                d3.select(ns[i])
                    .selectAll('rect')
                    .attr('x', () => {
                        return layout.x - layout.textBBox.width / 2
                    })
                    .attr('y', () => {
                        return layout.y + NODE_RADIUS * (layout.scale || 1) + 2
                    })
                d3.select(ns[i])
                    .selectAll('tspan')
                    .attr('x', () => {
                        return layout.x
                    })
            })

            // drag any connecting links
            dragLinks(this.svg, dp, this.typeToShapeMap)
        }
    }

    dragIcons = (node, iconClass) => {
        node.selectAll(iconClass).call(attrs, ({ dx, dy, width, height }, i, ns) => {
            const {
                layout: { x, y },
            } = d3.select(ns[i].parentNode).datum()
            return {
                transform: `translate(${x + dx - width / 2}, ${y + dy - height / 2})`,
            }
        })
    }
}

export const setSelections = (svg, selected) => {
    svg.select('g.nodes')
        .selectAll('g.node')
        .classed('selected', (node) => {
            const { layout } = node
            layout.selected = selected && _.get(selected, 'id') === _.get(node, 'id')
            return layout.selected
        })
}

// interrupt any transition and make sure it has its final value
export const interruptNodes = (svg) => {
    svg.select('g.nodes')
        .selectAll('g.node')
        .interrupt()
        .call((selectionN) => {
            selectionN.each(({ layout }, i, ns) => {
                if (layout) {
                    const { search = FilterResults.nosearch } = layout
                    d3.select(ns[i]).style('opacity', search === FilterResults.related ? RELATED_OPACITY : 1.0)
                }
            })
        })
}

// counter zoom labels-- if smaller, show an abbreviated smaller label
export const counterZoomLabels = (svg, currentZoom) => {
    if (svg) {
        const s = currentZoom.k
        const fontSize = counterZoom(s, 0.35, 0.85, 12, 22)
        const nodeLayer = svg.select('g.nodes')

        ////////// LABELS //////////////////////////////
        let showClass, hideClass
        if (s > 0.4) {
            showClass = 'regularLabel'
            hideClass = 'compactLabel'
        } else {
            showClass = 'compactLabel'
            hideClass = 'regularLabel'
        }

        // set label visibility based on search or zoom
        const labelBBox = {}
        nodeLayer.selectAll(gNodeLabel).each(({ layout }, i, ns) => {
            const { uid, search = FilterResults.nosearch } = layout
            const nodeLabel = d3.select(ns[i])

            // not in search mode, selectively show labels based on zoom
            let shownLabel
            if (search === FilterResults.nosearch) {
                shownLabel = nodeLabel.selectAll(`text.${showClass}`)
                shownLabel.style('display', '')

                // hide compact label if regular should show and vice versa
                nodeLabel.selectAll(`text.${hideClass}`).style('display', 'none')
            } else {
                // show labels only if matched or related
                // if match, always show regular label and hide compact
                shownLabel = nodeLabel.selectAll('text.regularLabel').style('display', () => {
                    return search === FilterResults.hidden ? 'none' : ''
                })

                nodeLabel.selectAll('text.compactLabel').style('display', 'none')
            }

            // counter zoom whatever is still visible
            // apply counter zoom font
            shownLabel.selectAll('tspan.counter-zoom').style('font-size', `${fontSize}px`)

            // if hub, make font even bigger
            shownLabel.selectAll('tspan.hub-label').style('font-size', `${fontSize + 4}px`)
            shownLabel.selectAll('tspan.sub-label').style('font-size', `${fontSize - 2}px`)

            // if description make smaller
            shownLabel.selectAll('tspan.description').style('font-size', `${fontSize - 2}px`)

            // fix leading between lines
            let height
            shownLabel.selectAll('tspan.beg').each((d, j, ts) => {
                ts[j].setAttribute('dy', fontSize)
                height = ts.length * fontSize
            })
            layout.textBBox.height = height

            // fix opaque background behind label
            let padding = 2
            if (s < 1) {
                padding *= 1 / s
            }
            if (s > 1) {
                padding *= s
            }
            let textRect
            shownLabel.each((d, k, txt) => {
                textRect = txt[k].getBBox()
            })
            nodeLabel.selectAll('rect').each((d, k, rc) => {
                d3.select(rc[k]).call(attrs, () => {
                    return {
                        x: textRect.x - padding,
                        y: textRect.y - padding,
                        height: textRect.height + padding * 2,
                        width: textRect.width + padding * 2,
                    }
                })
            })

            labelBBox[uid] = ns[i].getBBox()
        })

        ///////// TITLES //////////////////
        nodeLayer.selectAll(gNodeTitle).each(({ layout: { search = FilterResults.nosearch } }, i, ns) => {
            const nodeTitle = d3.select(ns[i])
            nodeTitle.style('visibility', () => {
                return search === FilterResults.hidden ? 'hidden' : 'visible'
            })

            // apply counter zoom font
            nodeTitle.selectAll('tspan.counter-zoom').style('font-size', `${fontSize + 4}px`)
        })

        //////////// ICONS /////////////////////////////
        setIconVisibility(nodeLayer, useNodeIcon)

        // cluster count icon
        setIconVisibility(nodeLayer, useClusterCountIcon)

        // argo app count icon
        setIconVisibility(nodeLayer, useArgoAppCountIcon)

        ///////// STATUS //////////////////
        nodeLayer.selectAll(textNodeStatus).each(({ y, search, uid, textBBox }, i, ns) => {
            const labelBB = labelBBox[uid]
            const nodeStatus = d3.select(ns[i])
            textBBox.dy = labelBB.y + labelBB.height + ns[i].getBBox().height - y
            nodeStatus.attr('y', y + textBBox.dy).call(styles, () => {
                return {
                    visibility: search === FilterResults.hidden ? 'hidden' : 'visible',
                    'font-size': `${fontSize}px`,
                }
            })
        })
    }
}

export const setIconVisibility = (nodeLayer, iconClass) => {
    nodeLayer.selectAll(iconClass).style('visibility', (d, i, ns) => {
        const {
            layout: { search = FilterResults.nosearch },
        } = d3.select(ns[i].parentNode).datum()
        return search === FilterResults.hidden ? 'hidden' : 'visible'
    })
}

const getSplitName = (search, line, acrossLines, idx, name, searchNames, regex) => {
    if (search === FilterResults.match) {
        // if match falls across label lines, put result in middle line
        if (acrossLines) {
            if (idx === 1) {
                return name
                    .split(regex)
                    .filter((str) => searchNames.indexOf(str) !== -1)
                    .concat(line.substr(searchNames[0].length))
            } else {
                return [line]
            }
        } else {
            return line.split(regex).filter((s) => !!s)
        }
    } else {
        return [line]
    }
}

// during search mode, show match in label in boldface
export const showMatches = (svg, searchNames) => {
    if (svg) {
        searchNames = searchNames.filter((s) => !!s)
        const draw =
            typeof SVG === 'function' ? SVG(document.createElementNS('http://www.w3.org/2000/svg', 'svg')) : undefined
        svg.select('g.nodes')
            .selectAll(gNodeLabel)
            .each((d, i, ns) => {
                const { name, layout } = d
                const { x, y, scale = 1, search = FilterResults.nosearch } = layout
                if (search !== FilterResults.hidden && x && y) {
                    const label = layout.label.toLowerCase()
                    const regex = new RegExp(`(${searchNames.join('|')})`, 'g')
                    const acrossLines = search === FilterResults.match && label.split(regex).length <= 1
                    d3.select(ns[i])
                        .selectAll('text.regularLabel')
                        .each((d1, j, ln) => {
                            ln[j].outerHTML = draw
                                .text((add) => {
                                    const lines = label.split('\n').map((line, idx) => {
                                        return getSplitName(search, line, acrossLines, idx, name, searchNames, regex)
                                    })
                                    lines.forEach((strs) => {
                                        strs.forEach((str, idx) => {
                                            const tspan = add.tspan(str)
                                            if (searchNames.indexOf(str) !== -1) {
                                                tspan.addClass('matched')
                                            }
                                            tspan.addClass('counter-zoom')
                                            if (scale > 1) {
                                                tspan.addClass('hub-label')
                                            } else if (scale < 1) {
                                                tspan.addClass('sub-label')
                                            }
                                            if (idx === 0) {
                                                tspan.addClass('beg').newLine()
                                            }
                                        })
                                    })
                                    if (layout.description) {
                                        add.tspan(layout.description)
                                            .fill('gray')
                                            .font({ size: 9 })
                                            .addClass('description beg')
                                            .newLine()
                                    }
                                })
                                .addClass('regularLabel')
                                .svg()
                        })
                }
            })
        moveTitles(svg)
        moveLabels(svg)
    }
}

export const moveLabels = (svg) => {
    const nodeLayer = svg.select('g.nodes')
    nodeLayer
        .selectAll(gNodeLabel)
        .filter(({ layout: { x, y } }) => {
            return x !== undefined && y !== undefined
        })
        .each(({ layout }, i, ns) => {
            const { x, y, textBBox, scale = 1 } = layout
            let dy = NODE_RADIUS
            if (scale > 1) {
                dy *= scale
            }
            if (scale < 1) {
                dy *= scale
            }
            const nodeLabel = d3.select(ns[i])
            nodeLabel
                .selectAll('tspan')
                .classed('hub-label', scale > 1)
                .classed('sub-label', scale < 1)

            nodeLabel.selectAll('text').call(attrs, () => {
                return {
                    x: x,
                    y: y + dy,
                }
            })
            nodeLabel.selectAll('rect').call(attrs, () => {
                return {
                    x: x - textBBox.width / 2,
                    y: y + dy,
                }
            })
            nodeLabel.selectAll('tspan.beg').attr('x', () => {
                return x
            })
        })

    nodeLayer.selectAll(textNodeStatus).call(attrs, (l, i, ns) => {
        const {
            layout: { x, y, textBBox, scale = 1 },
        } = d3.select(ns[i].parentNode).datum()
        let dy = NODE_RADIUS + textBBox.height + 10
        if (scale > 1) {
            dy *= scale
        }
        if (scale < 1) {
            dy *= scale
        }
        return {
            x: x,
            y: y + dy,
        }
    })
}

// shape titles are over the shape
// diagram titles are supported by titleHelper
export const moveTitles = (svg) => {
    svg.select('g.nodes')
        .selectAll(gNodeTitle)
        .filter(({ layout: { x, y } }) => {
            return x !== undefined && y !== undefined
        })
        .each(({ layout }, i, ns) => {
            const { x, y } = layout
            const nodeTitle = d3.select(ns[i])

            nodeTitle.selectAll('text').call(attrs, () => {
                return {
                    x: x,
                    y: y - TITLE_RADIUS,
                }
            })
            nodeTitle.selectAll('tspan.beg').attr('x', () => {
                return x
            })
        })
}

export const moveClusterCountText = (svg) => {
    svg.select('g.nodes')
        .selectAll(gClusterCountText)
        .filter(({ layout: { x, y } }) => {
            return x !== undefined && y !== undefined
        })
        .each(({ layout }, i, ns) => {
            const { x, y } = layout
            const clusterCountText = d3.select(ns[i])

            clusterCountText.selectAll('text').call(attrs, () => {
                return {
                    x: x + NODE_RADIUS - 2,
                    y: y + 4,
                }
            })
            clusterCountText.selectAll('tspan.count').call(attrs, () => {
                return {
                    x: x + NODE_RADIUS - 2,
                    y: y + 4,
                    dy: 0,
                }
            })
        })
}
