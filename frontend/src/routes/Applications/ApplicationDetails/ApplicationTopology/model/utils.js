/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
/* eslint no-param-reassign: "error" */
import _ from 'lodash'
import { nodeMustHavePods } from '../helpers/diagram-helpers-utils'

const localClusterName = 'local-cluster'

export const getClusterName = (nodeId) => {
  if (nodeId === undefined) {
    return ''
  }
  const clusterIndex = nodeId.indexOf('--clusters--')
  if (clusterIndex !== -1) {
    const startPos = nodeId.indexOf('--clusters--') + 12
    const endPos = nodeId.indexOf('--', startPos)
    return nodeId.slice(startPos, endPos > 0 ? endPos : nodeId.length)
  }
  return localClusterName
}

export const createChildNode = (parentObject, clustersNames, type, links, nodes, replicaCount = 1) => {
  const parentType = _.get(parentObject, 'type', '')
  const { name, namespace, id, specs = {} } = parentObject
  const parentId = id
  const memberId = `${parentId}--${type}--${name}`
  let resources
  if (specs.resources) {
    resources = specs.resources.map((res) => {
      return { ...res, kind: type }
    })
  }
  const resourceCount = specs.resourceCount === 0 ? replicaCount : specs.resourceCount * replicaCount
  const node = {
    name,
    namespace,
    type,
    id: memberId,
    uid: memberId,
    specs: {
      isDesign: false,
      resourceCount,
      resources,
      clustersNames,
      replicaCount,
      parent: {
        parentId,
        parentName: name,
        parentType,
        resources: specs.resources,
        parentSpecs: _.get(specs, 'parent.parentSpecs'),
      },
    },
  }
  nodes.push(node)
  links.push({
    from: { uid: parentId },
    to: { uid: memberId },
    type: '',
  })
  return node
}

// add cluster node to RHCAM application
export const addClusters = (parentId, subscription, source, clusterNames, managedClusters, links, nodes, topology) => {
  // create element if not already created
  const sortedClusterNames = _.sortBy(clusterNames)
  let clusterId = 'member--clusters'
  // do not use this for the id for argo app, we only know about one app here
  if (subscription) {
    const cns = sortedClusterNames.join('--')
    const sub = _.get(subscription, 'metadata.name')
    clusterId = `member--clusters--${cns}--${sub}`
  } else {
    clusterId = 'member--clusters--'
  }
  const topoClusterNode = topology
    ? _.find(topology.nodes, {
        id: 'member--clusters',
      })
    : undefined
  //    const filteredClusters = managedClusterNames.filter((cluster) => {
  //        const cname = _.get(cluster, metadataName)
  //        return cname && clusterNames.includes(cname)
  //    })
  nodes.push({
    name: clusterNames.length === 1 ? clusterNames[0] : '',
    namespace: '',
    type: 'cluster',
    id: clusterId,
    uid: clusterId,
    specs: {
      title: source,
      subscription,
      resourceCount: clusterNames.length,
      //            cluster: subscription && filteredClusters.length === 1 ? filteredClusters[0] : undefined,
      //            clusters: filteredClusters,
      clustersNames: clusterNames,
      clusters: _.cloneDeep(managedClusters),
      sortedClusterNames,
      appClusters: topoClusterNode ? topoClusterNode.specs.appClusters : undefined,
      targetNamespaces: topoClusterNode ? topoClusterNode.specs.targetNamespaces : undefined,
    },
  })
  links.push({
    from: { uid: parentId },
    to: { uid: clusterId },
    type: '',
    specs: { isDesign: true },
  })
  return clusterId
}

export const getApplicationData = (nodes) => {
  let subscriptionName = ''
  let nbOfSubscriptions = 0
  let resourceMustHavePods = false
  const nodeTypes = []
  const result = {}
  let isArgoApp = false
  const appNode = nodes?.find((r) => r.type === 'application')
  if (appNode) {
    isArgoApp = _.get(appNode, ['specs', 'raw', 'apiVersion'], '').indexOf('argo') !== -1
    result.isArgoApp = isArgoApp
    //get argo app destination namespaces 'show_search':
    if (isArgoApp) {
      const applicationSetRef = _.get(appNode, ['specs', 'raw', 'metadata', 'ownerReferences'], []).find(
        (owner) => owner.apiVersion.startsWith('argoproj.io/') && owner.kind === 'ApplicationSet'
      )
      if (applicationSetRef) {
        result.applicationSet = applicationSetRef.name
      }
      let cluster = 'local-cluster'
      const clusterNames = _.get(appNode, ['specs', 'cluster-names'], [])
      if (clusterNames.length > 0) {
        cluster = clusterNames[0]
      }
      result.cluster = cluster
      result.source = _.get(appNode, ['specs', 'raw', 'spec', 'source'], {})
    }
  }
  nodes?.forEach((node) => {
    const type = _.get(node, 'type', '')
    const nodeType = type === 'project' ? 'namespace' : type
    if (!(isArgoApp && _.includes(['application', 'cluster'], nodeType))) {
      nodeTypes.push(nodeType) //ask for this related object type
    }
    if (nodeMustHavePods(node)) {
      //request pods when asking for related resources, this resource can have pods
      resourceMustHavePods = true
    }
    if (nodeType === 'subscription') {
      subscriptionName = _.get(node, 'name', '')
      nbOfSubscriptions = nbOfSubscriptions + 1
    }
  })

  if (resourceMustHavePods) {
    nodeTypes.push('pod')
  }

  //if only one subscription, ask for resources only related to that subscription
  result.subscription = nbOfSubscriptions === 1 ? subscriptionName : null
  //ask only for these type of resources since only those are displayed
  result.relatedKinds = _.uniq(nodeTypes)

  return result
}

export const getAppSetArgoCluster = (search, clusters) => {
  return clusters.find((cluster) => cluster.name === search || cluster.url === search)
}

export const processMultiples = (resources, numOfDeployedClusters = 0) => {
  // Need to multiply the number of success clusters
  const rCount = numOfDeployedClusters > 0 ? resources.length * numOfDeployedClusters : resources.length
  if (rCount > 5) {
    const groupByKind = _.groupBy(resources, 'kind')
    return Object.entries(groupByKind).map(([kind, _resources]) => {
      if (_resources.length === 1) {
        return _resources[0]
      } else {
        return {
          kind,
          name: '',
          namespace: '',
          resources: _resources,
          resourceCount: numOfDeployedClusters > 0 ? _resources.length * numOfDeployedClusters : _resources.length,
        }
      }
    })
  }
  return resources
}
