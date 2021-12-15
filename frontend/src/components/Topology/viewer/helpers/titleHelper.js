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

import * as d3 from 'd3'
import SVG from 'svg.js'
import { counterZoom } from '../../utils/diagram-helpers'
import { attrs, styles } from './multipleHelper'

export default class TitleHelper {
    /**
     * Helper class to be used by TopologyDiagram.
     *
     * Contains functions to draw and manage nodes in the diagram.
     */
    constructor(svg, titles) {
        this.svg = svg
        this.titles = titles
    }

    updateDiagramTitles = (currentZoom) => {
        const draw =
            typeof SVG === 'function' ? SVG(document.createElementNS('http://www.w3.org/2000/svg', 'svg')) : undefined

        // Add title groups to diagram
        const titles = this.svg
            .select('g.titles')
            .selectAll('g.title')
            .data(this.titles, (t) => {
                return t.hashCode
            })

        // remove titles that no longer have data (in exit array)
        titles.exit().remove()

        // add new titles
        const newTitles = titles
            .enter()
            .append('g')
            .style('opacity', 0.0)
            .attr('class', 'title')
            .attr('transform', currentZoom)

        newTitles.append('title').text((t) => {
            return t.title
        })

        // create label
        newTitles
            .append('g')
            .attr('class', 'titleLabel')
            .html((d) => {
                const { title } = d
                const text = draw.text((add) => {
                    title.split('\n').forEach((line, idx) => {
                        if (line) {
                            add.tspan(line)
                                .addClass('counter-zoom')
                                .addClass(idx === 0 ? 'first-line' : '')
                                .newLine()
                        }
                    })
                })
                return text.svg()
            })
    }

    moveTitles = (transition, currentZoom, searchChanged) => {
        const titles = this.svg
            .select('g.titles')
            .selectAll('g.title')
            .attr('transform', currentZoom)
            .call(styles, () => {
                return {
                    opacity: searchChanged ? 0.0 : 1.0,
                }
            })

        titles.transition(transition).call(styles, () => {
            return {
                opacity: 1.0,
            }
        })

        titles.selectAll('g.titleLabel').each((d, i, ns) => {
            const { x, y } = d
            const titleLabel = d3.select(ns[i])
            titleLabel.selectAll('text').call(attrs, () => {
                return {
                    x: x,
                    y: y,
                }
            })
            titleLabel.selectAll('tspan').attr('x', () => {
                return x
            })
        })
    }
}

// interrupt any transition and make sure it has its final value
export const interruptTitles = (svg) => {
    svg.select('g.titles')
        .selectAll('g.title')
        .interrupt()
        .call((selection) => {
            selection.each((d, i, ns) => {
                d3.select(ns[i]).style('opacity', 1.0)
            })
        })
}

export const counterZoomTitles = (svg, currentZoom) => {
    if (svg) {
        const fontSize = counterZoom(currentZoom.k, 0.2, 0.85, 14, 32)
        const titles = svg.select('g.titles')
        titles.selectAll('tspan.counter-zoom').style('font-size', `${fontSize}px`)
        titles
            .selectAll('tspan.first-line.counter-zoom')
            .style('font-size', `${fontSize + 5}px`)
            .style('font-weight', 'bold')
    }
}
