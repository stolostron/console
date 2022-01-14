/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ****************************************************************************** */
// Copyright Contributors to the Open Cluster Management project
'use strict'

import { defaultShapes } from './shapes'
import { getConnectedApplicationLayoutOptions, getUnconnectedLayoutOptions } from './layouts'
import { getNodeGroups } from './grouping'
import { getNodeTooltips } from './tooltips'
import { getNodeDescription } from './descriptions'
import { getNodeTitle, getSectionTitles } from './titles'
import { getNodeDetails } from './details.js'
import { updateNodeIcons, updateNodeStatus } from './status.js'
import { getAllFilters, getAvailableFilters, getSearchFilter, filterNodes } from './filtering.js'

export const getOptions = (searchUrl) => {
    const typeToShapeMap = { ...defaultShapes }
    const shapeTypeOrder = [
        'internet',
        'host',
        'service',
        'deployment',
        'daemonset',
        'statefulset',
        'cronjob',
        'pod',
        'container',
    ]

    const diagramOptions = {
        showLineLabels: true, // show labels on lines
        showGroupTitles: false, // show titles over sections
    }

    const def = {
        diagramCloneTypes: ['internet', 'host'],
        shapeTypeOrder,
        typeToShapeMap,
        diagramOptions: diagramOptions,
        getNodeTooltips: getNodeTooltips.bind(null, searchUrl),
        getNodeDescription: getNodeDescription,
        getNodeTitle: getNodeTitle,
        getSectionTitles: getSectionTitles,
        getNodeDetails: getNodeDetails,
        updateNodeStatus: updateNodeStatus,
        updateNodeIcons: updateNodeIcons,
        getAllFilters: getAllFilters.bind(null, 'application', typeToShapeMap),
        getAvailableFilters: getAvailableFilters.bind(null, 'application'),
        getNodeGroups: getNodeGroups.bind(null, 'application'),
        getSearchFilter: getSearchFilter.bind(null, 'application'),
        filterNodes: filterNodes.bind(null, 'application'),
        getConnectedLayoutOptions: getConnectedApplicationLayoutOptions.bind(null, typeToShapeMap),
        getUnconnectedLayoutOptions,
    }

    // overrides
    def.typeToShapeMap = typeToShapeMap
    return def
}
