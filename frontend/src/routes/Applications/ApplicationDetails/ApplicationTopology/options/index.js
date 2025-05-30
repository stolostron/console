/* Copyright Contributors to the Open Cluster Management project */
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

import { defaultShapes } from './constants'
import { computeNodeStatus } from '../model/computeStatuses'
import { getNodeDescription } from './descriptions'
import { getNodeTitle, getSectionTitles } from './titles'
import { getNodeDetails } from './details.js'
import { getAllFilters, getAvailableFilters, getSearchFilter } from './filtering.js'

export const getOptions = () => {
  return {
    typeToShapeMap: defaultShapes,
    diagramOptions: {
      showLineLabels: true, // show labels on lines
      showGroupTitles: false, // show titles over sections
    },
    computeNodeStatus,
    getNodeDescription,
    getNodeTitle,
    getSectionTitles,
    getNodeDetails,
    getAllFilters,
    getAvailableFilters,
    getSearchFilter,
  }
}
