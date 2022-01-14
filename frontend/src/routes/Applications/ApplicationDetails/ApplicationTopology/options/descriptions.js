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
import _ from 'lodash'

import { getWrappedNodeLabel } from '../../../../../components/Topology/helpers/diagram-helpers'

export const getNodeDescription = (node) => {
    const { layout = {} } = node

    let description = getWrappedNodeLabel((node && node.name) || '', 12, 2)
    if (_.get(node, 'type', '') === 'cluster' && _.get(node, 'specs.clusterNames', []).length > 1) {
        description = '' //don't show cluster names if more than 1
    }

    // hubs are drawn bigger
    if (layout.isMajorHub) {
        layout.scale = 1.6
    } else if (layout.isMinorHub) {
        layout.scale = 1.4
    }

    return description
}
