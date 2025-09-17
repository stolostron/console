/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 ******************************************************************************/
'use strict'

import _ from 'lodash'
import { TFunction } from './types'

// Get a node title if preset in node specs
export const getNodeTitle = (node: any): string => {
  return _.get(node, 'specs.title', '')
}

// Resolve section titles based on present types
export const getSectionTitles = (clusters: any, types: string[], environs: string, t: TFunction): string => {
  const set = new Set<string>()
  types.forEach((type) => {
    switch (type) {
      case 'cluster':
        set.add(environs)
        break

      case 'pod':
        set.add(t('pods'))
        break

      case 'service':
        set.add(t('services'))
        break

      case 'container':
        set.add(t('containers'))
        break

      case 'host':
        set.add(t('hosts'))
        break

      case 'internet':
        set.add(t('internet'))
        break

      case 'deployment':
      case 'daemonset':
      case 'statefulset':
      case 'cronjob':
        set.add(t('controllers'))
        break

      default:
        break
    }
  })
  return Array.from(set).sort().join(', ')
}

// Convert a type to a legend title
export const getLegendTitle = (type?: string): string => {
  if (type === undefined) {
    return ''
  }
  return (type.charAt(0).toUpperCase() + type.slice(1))
    .replace('stream', ' Stream')
    .replace('channel', ' Channel')
    .replace('controller', 'Controller')
}
