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
import { getConnectedLayoutOptions, getUnconnectedLayoutOptions } from '../layouts'
import { getNodeGroups } from './grouping'
import { getNodeTooltips } from './tooltips'
import { getNodeDescription } from './descriptions'
import { getNodeTitle, getSectionTitles } from './titles'
import { getNodeDetails } from './details.js'
import { updateNodeIcons, updateNodeStatus } from './status.js'
import { getAllFilters, getAvailableFilters, getSearchFilter, filterNodes } from './filtering.js'

export const getResourceDefinitions = (styles = {}, options = {}, searchUrl) => {
    const typeToShapeMap = { ...defaultShapes, ...(styles.shapes || {}) }
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
    const def = {
        diagramCloneTypes: ['internet', 'host'],
        shapeTypeOrder,
        typeToShapeMap,
        diagramOptions: options,
        getNodeTooltips: getNodeTooltips.bind(null, searchUrl),
        getNodeDescription: getNodeDescription,
        getNodeTitle: getNodeTitle,
        getSectionTitles: getSectionTitles,
        getNodeDetails: getNodeDetails,
        updateNodeStatus: updateNodeStatus,
        updateNodeIcons: updateNodeIcons,
        getAllFilters: getAllFilters.bind(null, options.filtering, typeToShapeMap),
        getAvailableFilters: getAvailableFilters.bind(null, options.filtering),
        getNodeGroups: getNodeGroups.bind(null, options.filtering),
        getSearchFilter: getSearchFilter.bind(null, options.filtering),
        filterNodes: filterNodes.bind(null, options.filtering),
        getConnectedLayoutOptions: getConnectedLayoutOptions.bind(null, options.layout, typeToShapeMap),
        getUnconnectedLayoutOptions,
    }

    // overrides
    def.typeToShapeMap = typeToShapeMap
    return def
}
