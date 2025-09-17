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
import { defaultShapes } from './constants'

const TypeFilters = {
  application: {
    filterTypes: {
      resourceStatuses: 'resourceStatuses',
      resourceTypes: 'resourceTypes',
      clusterNames: 'clusterNames',
      namespaces: 'namespaces',
      hostIPs: 'hostIPs',
    },
    searchTypes: new Set(['podStatuses', 'labels']),
    ignored: new Set<string>(),
  },
} as const

export const getAllFilters = (
  isLoaded: boolean | undefined,
  nodes: any[] | undefined,
  options: any,
  activeFilters: Record<string, any>,
  knownTypes: string[] | undefined,
  userIsFiltering: boolean | undefined,
  t: (s: string) => string
) => {
  const availableFilters: Record<string, any> = {}
  let otherTypeFilters: string[] = []
  const typeToShapeMap = defaultShapes

  // if nothing loaded we can't calculate what types are available
  if (!nodes || nodes.length === 0) {
    return {
      availableFilters,
      otherTypeFilters,
      activeFilters,
    }
  }

  /////////////// AVAIALBLE TYPE FILTERS //////////////////////
  nodes = nodes || []
  const map = nodes
    .map(({ type }) => type)
    .reduce((acc: Record<string, number>, curr: string) => {
      if (typeof acc[curr] === 'undefined') {
        acc[curr] = 1
      } else {
        acc[curr] += 1
      }
      return acc
    }, {})
  const sorted = Object.keys(map).sort((a, b) => {
    const ret = map[b] - map[a]
    if (ret !== 0) {
      return ret
    }
    return a.localeCompare(b)
  })

  // determine what should go in main type filter bar and what should go in 'other' button
  const optionsTemp = options || {}
  let { availableTypes } = optionsTemp
  const unknownTypes: string[] = []
  if (availableTypes) {
    // other is any type not in available types
    const set = new Set(availableTypes as string[])
    otherTypeFilters = Object.keys(map).filter((a) => {
      return !set.has(a)
    })
  } else {
    // else take 8 most popular types, and any above is other
    otherTypeFilters = []
    availableTypes = sorted
      .filter((a) => {
        // anything w/o a shape is other automaically
        if (!(typeToShapeMap as any)[a]) {
          otherTypeFilters.push(a)
          unknownTypes.push(a)
          return false
        }
        return true
      })
      .filter((a, idx) => {
        if (idx > 7) {
          // then if the toolbar will be too full, put the rest in other
          otherTypeFilters.push(a)
          return false
        }
        return true
      })
      .sort()
  }

  // if there are still other shapes, add to available
  if (otherTypeFilters.length > 0) {
    availableTypes = _.union(availableTypes, ['other'])
  }
  availableFilters['type'] = availableTypes

  ///////////////// ACTIVE TYPE FILTERS //////////////////////////////////////////
  const { initialActiveTypes } = options || {}
  if (initialActiveTypes) {
    // if options specify initial active types use those in case no active types specified yet
    activeFilters = Object.assign({}, { type: initialActiveTypes }, activeFilters)
  } else {
    activeFilters = _.cloneDeep(activeFilters)
    if (!userIsFiltering) {
      activeFilters.type = availableTypes
    }
  }
  // if an other type it's active status is covered by 'other' type
  if (otherTypeFilters.length > 0) {
    const set = new Set(availableTypes)
    activeFilters.type = activeFilters.type.filter((a: string) => set.has(a))
  }

  // if using the filter view, get avaiable filters for that view
  // ex: purpose section when looking at filter view in clusters mode
  addAssortedAvailableFilters(availableFilters, activeFilters, nodes, t)

  return {
    availableFilters,
    otherTypeFilters,
    activeFilters,
  }
}

export const getAvailableFilters = (
  nodes: any[],
  options: any,
  activeFilters: Record<string, any>,
  t: (s: string) => string
) => {
  const availableFilters: Record<string, any> = {}
  addAssortedAvailableFilters(availableFilters, activeFilters, nodes, t)
  return availableFilters
}

//search filters also show related nodes, like searching on name
export const getSearchFilter = (filters: Record<string, any> = {}) => {
  const ret: { filters: Record<string, any>; search?: Record<string, any> } = { filters: {}, search: undefined }
  const searchTypes = _.get(TypeFilters, 'application.searchTypes', new Set()) as Set<string>
  Object.entries(filters).forEach(([type, value]) => {
    if (searchTypes.has(type)) {
      if (value && value.size > 0) {
        if (!ret.search) {
          ret.search = {}
        }
        ret.search[type] = value
      }
    } else {
      ret.filters[type] = value
    }
  })
  return ret
}

/////////////////////////////// AVAILABLE FILTERS //////////////////////////////////////////
const addAssortedAvailableFilters = (
  availableFilters: Record<string, any>,
  activeFilters: Record<string, any>,
  nodes: any[],
  t: (s: string) => string
) => {
  if (nodes && nodes.length > 0) {
    addAvailableRelationshipFilters(availableFilters, activeFilters, nodes, t)
  }
}

export const addAvailableRelationshipFilters = (
  availableFilters: Record<string, any>,
  activeFilters: Record<string, any>,
  nodes: any[],
  t: (s: string) => string
) => {
  // what k8 types are being shown
  const activeTypes = new Set(activeFilters.type || [])
  const ignoreNodeTypes = (TypeFilters as any)['application'].ignored || new Set()
  const filterTypes = (TypeFilters as any)['application'].filterTypes
  Object.keys(filterTypes).forEach((type) => {
    let name: string | null = null
    let availableSet: any = new Set()
    switch (type) {
      case 'resourceTypes':
        name = t('Resource Types')
        break
      case 'hostIPs':
        name = t('Host IPs')
        break
      case 'namespaces':
        name = t('Namespaces')
        break
      case 'resourceStatuses':
        name = t('Resource status')
        availableSet = new Map([
          ['green', t('Success')],
          ['orange', t('Unknown')],
          ['yellow', t('Warning')],
          ['red', t('Error')],
        ])
        break
      // case 'clusterNames':
      //   name = t('topology.filter.category.clustername')
      //   break
    }
    if (name) {
      availableFilters[type] = {
        name,
        availableSet,
      }
    }
  })

  let hasPods = false
  nodes.forEach((node) => {
    const { type, name: nodeName } = node
    let { namespace } = node
    if (!ignoreNodeTypes.has(type) && (activeTypes.has(type) || activeTypes.has('other'))) {
      namespace = namespace && namespace.length > 0 ? namespace : 'cluster-scoped'

      // filter filters
      const podStatus = _.get(node, 'specs.podModel')
      const design = _.get(node, 'specs.isDesign')
      hasPods |= !!podStatus
      Object.keys(filterTypes).forEach((filterType) => {
        const filter = availableFilters[filterType]
        if (filter) {
          switch (filterType) {
            case 'hostIPs':
              if (podStatus && Object.keys(podStatus).length > 0) {
                _.flatten(Object.values(podStatus)).forEach((pod: any) => {
                  filter.availableSet.add(pod.hostIP)
                })
              }
              break

            case 'namespaces':
              filter.availableSet.add(namespace)
              break

            case 'clusterNames':
              if (type === 'cluster') {
                filter.availableSet.add(nodeName)
              }
              break
            case 'resourceTypes':
              // Only filter none design and none cluster types
              if (!isDesignOrCluster(design, type)) {
                filter.availableSet.add(type)
              }
              break
          }
        }
      })
    }
  })

  // if no pods, remove pod filters
  if (!hasPods) {
    delete availableFilters['hostIPs']
  }
}

////////////////////////   FILTER NODES     ///////////////////////////////////

export const processResourceStatus = (resourceStatuses: Set<string>, resourceStatus: string) => {
  const orangeOrYellow = resourceStatus === 'orange' || resourceStatus === 'yellow'

  return (
    (resourceStatuses.has('green') && resourceStatus === 'green') ||
    (resourceStatuses.has('yellow') && resourceStatus === 'yellow') ||
    (resourceStatuses.has('orange') && orangeOrYellow) ||
    (resourceStatuses.has('red') && resourceStatus === 'red')
  )
}

export const notDesignNode = (nodeType: string) => {
  return nodeType !== 'application' && nodeType !== 'subscription' && nodeType !== 'placements'
}

export const isDesignOrCluster = (isDesign: boolean, nodeType: string) => {
  return isDesign === true || nodeType === 'cluster'
}

export const nodeParentExists = (nodeParent: any, includedNodes: Set<string>) => {
  return nodeParent !== undefined && nodeParent.parentType !== 'cluster' && !includedNodes.has(nodeParent.parentId)
}
