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

import { getConnectedApplicationLayoutOptions } from './application'

import { NODE_SIZE } from '../constants.js'

export const getConnectedLayoutOptions = (mode, typeToShapeMap, collection) => {
    return getConnectedApplicationLayoutOptions(typeToShapeMap, collection)
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
