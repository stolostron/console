/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ******************************************************************************/
'use strict'

import _ from 'lodash'
import { getWrappedNodeLabel } from './utilities'
import { TopologyNode } from './types'

// Compute a node description and adjust layout scale for hubs
export const getNodeDescription = (node: TopologyNode): string => {
  const { layout = {} } = node

  let description = getWrappedNodeLabel((node && node.name) || '', 12, 2)
  if (_.get(node, 'type', '') === 'cluster' && _.get(node, 'specs.clusterNames', []).length > 1) {
    description = '' //don't show cluster names if more than 1
  }

  // hubs are drawn bigger
  if (layout.isMajorHub) {
    layout.scale = 1.6 as any
  } else if (layout.isMinorHub) {
    layout.scale = 1.4 as any
  }

  return description
}
