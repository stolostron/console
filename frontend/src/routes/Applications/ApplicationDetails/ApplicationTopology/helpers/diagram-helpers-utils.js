/* Copyright Contributors to the Open Cluster Management project */
/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import R from 'ramda'
import _ from 'lodash'
import {
  warningStatus,
  pendingStatus,
  checkmarkCode,
  warningCode,
  pendingCode,
  failureCode,
  metadataName,
} from '../model/computeStatuses'

export const isDeployableResource = (node) => {
  //check if this node has been created using a deployable object
  //used to differentiate between app, subscription, rules deployed using an app deployable
  return _.get(node, 'id', '').indexOf('--member--deployable--') !== -1
}

export const nodeMustHavePods = (node) => {
  //returns true if the node should deploy pods

  if (!node || !node.type || R.includes(node.type, ['application', 'placements', 'subscription'])) {
    return false
  }

  if (
    R.includes(R.pathOr('', ['type'])(node), [
      'pod',
      //'replicaset',
      'daemonset',
      'statefulset',
      //'replicationcontroller',
      //'deployment',
      //'deploymentconfig',
      'controllerrevision',
    ])
  ) {
    //pod deployables must have pods
    return true
  }
  const hasContainers = R.pathOr([], ['specs', 'raw', 'spec', 'template', 'spec', 'containers'])(node).length > 0
  const hasReplicas = R.pathOr(undefined, ['specs', 'raw', 'spec', 'replicas'])(node) //pods will go under replica object
  const hasDesired = R.pathOr(undefined, ['specs', 'raw', 'spec', 'desired'])(node) //deployables from subscription package have this set only, not containers
  if ((hasContainers || hasDesired) && !hasReplicas) {
    return true
  }

  if (hasReplicas) {
    return true
  }

  return false
}

export const getClusterName = (nodeId, node, findAll) => {
  if (node) {
    //cluster info is not set on the node id, get it from here
    if (findAll) {
      //get all cluster names as set by argo target, ignore deployable status
      return _.union(_.get(node, 'specs.clustersNames', []), _.get(node, 'clusters.specs.appClusters', [])).join(',')
    }

    const clusterNames = _.get(node, 'specs.clustersNames', [])
    if (clusterNames.length > 0) {
      //default to using nodeId if clusterNames array is empty
      return clusterNames.join(',')
    }
  }

  if (nodeId === undefined) {
    return ''
  }
  const clusterIndex = nodeId.indexOf('--clusters--')
  if (clusterIndex !== -1) {
    const startPos = nodeId.indexOf('--clusters--') + 12
    const endPos = nodeId.indexOf('--', startPos)
    return nodeId.slice(startPos, endPos > 0 ? endPos : nodeId.length)
  }
  //node must be deployed locally on hub, such as ansible jobs
  return 'local-cluster'
}

/*
 * If this is a route generated from an Ingress resource, remove generated hash
 * relatedKind = Route object deployed on remote cluster
 * relateKindName = relatedKind.name, processed by other routines prior to this call
 */
export const getRouteNameWithoutIngressHash = (relatedKind, relateKindName) => {
  let name = relateKindName
  const isRouteGeneratedByIngress =
    relatedKind.kind.toLowerCase() === 'route' && !_.get(relatedKind, '_hostingDeployable', '').endsWith(name)
  if (isRouteGeneratedByIngress) {
    //this is a route generated from an Ingress resource, remove generated hash
    const names = _.get(relatedKind, '_hostingDeployable', '').split('Ingress-')
    if (names.length === 2) {
      name = names[1]
    }
  }

  return name
}

export const getActiveFilterCodes = (resourceStatuses) => {
  const activeFilterCodes = new Set()
  resourceStatuses.forEach((rStatus) => {
    if (rStatus === 'green') {
      activeFilterCodes.add(checkmarkCode)
    } else if (rStatus === 'yellow') {
      activeFilterCodes.add(warningCode)
    } else if (rStatus === 'orange') {
      activeFilterCodes.add(pendingCode)
    } else if (rStatus === 'red') {
      activeFilterCodes.add(failureCode)
    }
  })

  return activeFilterCodes
}

export const filterSubscriptionObject = (resourceMap, activeFilterCodes) => {
  const filteredObject = {}
  Object.entries(resourceMap).forEach(([key, values]) => {
    values.forEach((value) => {
      if (value.status === 'Subscribed' && activeFilterCodes.has(checkmarkCode)) {
        filteredObject[key] = value
      }
      if (value.status === 'Propagated' && activeFilterCodes.has(warningCode)) {
        filteredObject[key] = value
      }
      if (value.status === 'Fail' && activeFilterCodes.has(failureCode)) {
        filteredObject[key] = value
      }
    })
  })
  return filteredObject
}

export const getClusterHost = (consoleURL) => {
  if (!consoleURL) {
    return ''
  }
  const consoleURLInstance = new URL(consoleURL)
  const ocpIdx = consoleURL ? consoleURLInstance.host.indexOf('.') : -1
  if (ocpIdx < 0) {
    return ''
  }
  return consoleURLInstance.host.substr(ocpIdx + 1)
}

//for items with pods and not getting ready or available state, default those values to the current state
//this is a workaround for defect 8935, search doesn't return ready and available state for resources such as StatefulSets
export const fixMissingStateOptions = (items) => {
  items.forEach((item) => {
    if (_.get(item, 'available') === undefined) {
      item.available = item.current //default to current state
    }
    if (_.get(item, 'ready') === undefined) {
      item.ready = item.current //default to current state
    }
  })
  return items
}

//last attempt to match the resource namespace with the server target namespace ( argo )
export const namespaceMatchTargetServer = (relatedKind, resourceMapForObject) => {
  const namespace = _.get(relatedKind, 'namespace', '')
  const findTargetClustersByNS = _.filter(
    _.get(resourceMapForObject, 'clusters.specs.clusters', []),
    (filtertype) => _.get(filtertype, 'destination.namespace', '') === namespace
  )
  //fix up the cluster on this object
  if (findTargetClustersByNS.length > 0) {
    relatedKind.cluster = _.get(findTargetClustersByNS[0], metadataName, '')
  }
  return findTargetClustersByNS.length > 0
}

// try to match app destination clusters with hub clusters using search data
export const updateAppClustersMatchingSearch = (node, searchClusters) => {
  if (node.type !== 'cluster') {
    //acm cluster node
    _.set(node, 'specs.clusters', searchClusters)
    return node
  }
  //get only clusters in a url format looking like a cluster api url
  const appClusters = _.get(node, 'specs.appClusters', [])
  const appClustersUsingURL = _.filter(appClusters, (cls) => getValidHttpUrl(cls) !== null)

  appClustersUsingURL.forEach((appCls) => {
    try {
      let possibleMatch
      const clsUrl = new URL(appCls)
      const isOCPUrl = _.startsWith(clsUrl.hostname, 'api')
      const clusterIdx = appCls.indexOf(':cluster/')
      if (clusterIdx !== -1) {
        const kubeClusterName = appCls.substring(clusterIdx + 9)
        // this is a non ocp cluster, server destination set by name
        possibleMatch = _.find(searchClusters, (cls) => {
          const clsName = _.get(cls, 'name', '_')
          return _.includes([clsName, `${clsName}-cluster`], kubeClusterName)
        })
      } else {
        if (isOCPUrl) {
          possibleMatch = _.find(searchClusters, (cls) =>
            _.endsWith(_.get(cls, 'consoleURL', '_'), clsUrl.hostname.substring(3))
          )
        }
      }
      if (possibleMatch || !isOCPUrl) {
        // remove the URL cluster destination only for matched clusters or non ocp clusters
        _.pull(appClusters, appCls)
      }
      if (possibleMatch) {
        //found the cluster matching the app destination server url, use the cluster name
        const matchedClusterName = _.get(possibleMatch, 'name', '')
        if (!_.includes(appClusters, matchedClusterName)) {
          appClusters.push(matchedClusterName)
        }
        //now move all target namespaces to this cluster name
        const targetNamespaces = _.get(node, 'specs.targetNamespaces', {})
        const targetNSForAppCls = targetNamespaces[appCls]
        const targetNSForMatchedName = targetNamespaces[matchedClusterName]
        targetNamespaces[matchedClusterName] = _.sortBy(_.union(targetNSForAppCls, targetNSForMatchedName))
      }
    } catch (err) {
      //ignore error
    }
  })
  _.set(node, 'specs.appClusters', _.sortBy(appClusters))
  return node
}

export const getValidHttpUrl = (value) => {
  let urlValue = true
  try {
    urlValue = new URL(value)
  } catch (err) {
    return null
  }
  return urlValue
}

//show warning when no deployed resources are not found by search on this cluster name
export const showMissingClusterDetails = (clusterName, node, details, t) => {
  const targetNS = _.get(node, 'clusters.specs.targetNamespaces', {
    unknown: [],
  })
  if (clusterName.length === 0) {
    // there are no deployed clusters for this app group
    const clsNames = Object.keys(targetNS)
    clsNames.forEach((clsName) => {
      details.push(
        {
          labelValue: t('Cluster name'),
          value: clsName,
        },
        {
          labelValue: '*',
          value: t('spec.deploy.not.deployed'),
          status: pendingStatus,
        }
      )
    })
  } else {
    details.push({
      labelValue: t('Cluster name'),
      value: clusterName,
    })
    const nsForCluster = targetNS[clusterName] || ['*']
    if (getValidHttpUrl(clusterName) !== null) {
      // if name with https://api. this server name could not be mapped to a cluster name
      // search clusters mapping fails when there are no deployed resources or clusters not found..
      nsForCluster.forEach((nsName) => {
        details.push({
          labelValue: nsName,
          value: _.startsWith(clusterName, 'https://api.') ? t('spec.deploy.not.deployed') : t('Not mapped'),
          status: pendingStatus,
        })
      })
    } else {
      const searchCluster = _.find(_.get(node, 'specs.searchClusters', []), (cls) => _.get(cls, 'name') === clusterName)
      const isOffline = searchCluster && _.get(searchCluster, 'ManagedClusterConditionAvailable', '') === 'False'
      nsForCluster.forEach((nsName) => {
        details.push({
          labelValue: nsName,
          value: isOffline ? t('Offline') : t('Not deployed'),
          status: isOffline ? warningStatus : pendingStatus,
        })
      })
    }
  }
  return details
}

// returns all namespaces this resource can deploy to
export const getTargetNsForNode = (node, resourcesForCluster, clusterName, defaultNS) => {
  // list of target namespaces per cluster
  const targetNamespaces = _.get(node, 'clusters.specs.targetNamespaces', {})
  const deployedResourcesNS = !isResourceNamespaceScoped(node)
    ? _.map(resourcesForCluster, 'name')
    : _.map(resourcesForCluster, 'namespace')
  //get cluster target namespaces
  return targetNamespaces[clusterName]
    ? _.union(targetNamespaces[clusterName], _.uniq(deployedResourcesNS))
    : resourcesForCluster.length > 0
    ? _.uniq(deployedResourcesNS)
    : [defaultNS]
}

//returns the list of clusters the app resources must deploy on
export const getResourcesClustersForApp = (searchClusters, nodes) => {
  let clustersList = searchClusters ? R.pathOr([], ['items'])(searchClusters) : []
  if (nodes && nodes.length > 0) {
    const placementNodes =
      _.filter(
        nodes,
        (node) => _.get(node, 'type', '') === 'placements' && _.get(node, 'id', '').indexOf('deployable') === -1
      ) || []
    if (placementNodes.length > 0) {
      const localClusterRuleFn = (decision) => _.get(decision, 'clusterName', '') === 'local-cluster'
      const localPlacement = _.find(
        placementNodes,
        (plc) => _.filter(_.get(plc, 'specs.raw.status.decisions', []), localClusterRuleFn).length > 0
      )
      if (!localPlacement) {
        // this placement doesn't include local host so don't include local cluster, used for showing not deployed status
        clustersList = _.filter(clustersList, (cls) => _.get(cls, 'name', '') !== 'local-cluster')
      }
    }
  }
  return clustersList
}

export const allClustersAreOnline = (clusterNames, onlineClusters) => {
  if (onlineClusters && clusterNames) {
    return _.intersection(onlineClusters, clusterNames).length === clusterNames.length
  }
  return false
}

// find a parent for pod using owner ID
export const findParentForOwnerID = (
  resourceMap,
  ownerUID,
  kind,
  relatedKind,
  nameWithoutChartRelease,
  addResourceToModel
) => {
  Object.keys(resourceMap).forEach((key) => {
    if (_.startsWith(key, 'replicationcontroller') || _.startsWith(key, 'replicaset')) {
      // get potential parents
      const resourceObj = resourceMap[key]
      const resourceModel = _.get(resourceObj, `specs.${resourceObj.type}Model`, {})

      // find the parent
      if (_.filter(_.flatten(Object.values(resourceModel)), (obj) => _.get(obj, '_uid', '') === ownerUID).length > 0) {
        addResourceToModel(resourceObj, kind, relatedKind, nameWithoutChartRelease)
      }
    }
  })
}

// check if the data has been refreshed, if not don't try to rebuild the map
export const mustRefreshTopologyMap = (topology, currentUpdate) => {
  if (currentUpdate && topology && _.get(topology, 'nodes', []).length > 0) {
    const firstNode = topology.nodes[0]
    if (_.get(firstNode, '_lastUpdated', '') === currentUpdate) {
      return false // nothing changed, don't refresh the model
    }
    //set current update
    _.set(firstNode, '_lastUpdated', currentUpdate)
  }
  return true
}

export const isResourceNamespaceScoped = (node) => {
  if (_.get(node, 'namespace')) {
    return true
  }

  const resources = _.get(node, 'specs.resources', [])
  if (resources.length > 0) {
    if (_.get(resources[0], 'namespace')) {
      return true
    }
  }

  return false
}
