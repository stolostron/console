/* Copyright Contributors to the Open Cluster Management project */
import { getClusterName, isDeployableResource } from '../helpers/diagram-helpers-utils'
import { addDiagramDetails } from './computeRelated'
import { computeNodeStatus } from './computeStatuses'
import _ from 'lodash'
import R from 'ramda'
import { getArgoTopology } from './topologyArgo'
import { getSubscriptionTopology } from './topologySubscription'
import { getAppSetTopology } from './topologyAppSet'
import { getOCPFluxAppTopology } from './topologyOCPFluxApp'

export const getTopology = async (application, managedClusters, localHubName, relatedResources, argoData) => {
  let topology
  if (application) {
    if (application.isArgoApp) {
      topology = getArgoTopology(application, argoData, managedClusters, localHubName)
    } else if (application.isAppSet) {
      topology = getAppSetTopology(application, localHubName)
    } else if (application.isOCPApp || application.isFluxApp) {
      topology = await getOCPFluxAppTopology(application, localHubName)
    } else {
      topology = getSubscriptionTopology(application, managedClusters, relatedResources, localHubName)
    }
  }

  if (topology) {
    _.set(topology, 'hubClusterName', localHubName)
  }
  return topology
}

export const getDiagramElements = (appData, topology, resourceStatuses, canUpdateStatuses, t) => {
  // topology from api will have raw k8 objects, pods status
  const { links, nodes } = getTopologyElements(topology)
  // create yaml and what row links to what node
  let activeChannelInfo
  let channelsList = []
  const allResourcesMap = {}
  const isClusterGrouped = {
    value: false,
  }
  const hasHelmReleases = {
    value: false,
  }
  nodes.forEach((node) => {
    const { id, type } = node

    if (evaluateSingleAnd(type === 'application', id.startsWith('application'))) {
      channelsList = _.get(node, 'specs.channels', [])
      // set default active channel
      const channelListNoAllChannels = channelsList.filter((chn) => chn !== '__ALL__/__ALL__//__ALL__/__ALL__')
      const defaultActiveChannel = channelListNoAllChannels.length > 0 ? channelListNoAllChannels[0] : null
      activeChannelInfo = _.get(node, 'specs.activeChannel')
      if (!activeChannelInfo) {
        activeChannelInfo = defaultActiveChannel
        _.set(node, 'specs.activeChannel', defaultActiveChannel)
      }
      //active channel not found in the list of channel, remove it
      if (evaluateSingleAnd(activeChannelInfo, channelsList.indexOf(activeChannelInfo) === -1)) {
        _.set(node, 'specs.activeChannel', defaultActiveChannel)
        activeChannelInfo = defaultActiveChannel
      }
    }

    // create a resource map of [type-name-cluster] =  node
    // will stuff statuses into each one
    processNodeData(node, allResourcesMap, isClusterGrouped, hasHelmReleases, topology)
  })

  if (resourceStatuses) {
    // set the queried resource statuses into the node map
    addDiagramDetails(resourceStatuses, allResourcesMap, isClusterGrouped, hasHelmReleases, topology)

    // determine the status icon to put on each shape
    nodes.forEach((node) => {
      computeNodeStatus(node, canUpdateStatuses, t, topology.hubClusterName)
    })
  }

  return {
    activeChannel: activeChannelInfo,
    channels: channelsList,
    links: links,
    nodes: nodes,
  }
}

//link the search objects to this node;
export const processNodeData = (node, topoResourceMap, isClusterGrouped, hasHelmReleases, topology) => {
  const { name, type } = node
  const isDesign = _.get(node, 'specs.isDesign', false)
  if (!isDeployableResource(node) && R.includes(type, ['cluster', 'application', 'placements']) && isDesign) {
    return //ignore these types
  }

  const channel = _.get(node, 'specs.raw.spec.channel', '')
  const keyName = !isDeployableResource(node) && channel.length > 0 ? `${channel}-${name}` : name

  const clusterName = getClusterName(node.id, node, undefined, topology.hubClusterName)
  if (type === 'subscription') {
    //don't use cluster name when grouping subscriptions
    topoResourceMap[name] = node
    const topoAnnotation =
      _.get(node, 'specs.raw.metadata.annotations') !== undefined
        ? _.get(node, 'specs.raw.metadata.annotations')['apps.open-cluster-management.io/topo']
        : undefined
    if (topoAnnotation !== undefined && topoAnnotation.indexOf('helmchart/') > -1) {
      hasHelmReleases.value = true
    }
  } else {
    // if this node represents multiple resources, create an entry for each resource in the map
    const resources = _.get(node, 'specs.resources')
    if (resources) {
      topoResourceMap[`${type}-${clusterName}`] = node
    } else {
      topoResourceMap[`${type}-${keyName}-${clusterName}`] = node
    }

    if (clusterName.indexOf(', ') > -1) {
      isClusterGrouped.value = true
    }
  }
  //keep clusters info to create route host and to match nodes to grouped clusters
  node['clusters'] = R.find(R.propEq('id', `member--clusters--${clusterName}`))(topology.nodes)
}

export const evaluateSingleAnd = (operand1, operand2) => {
  return operand1 && operand2
}

export const getTopologyElements = (resourceItem) => {
  const { nodes = [], links = [] } = resourceItem

  // We need to change "to/from" to "source/target" to satisfy D3's API.
  let modifiedLinks = links.map((l) => ({
    source: l.from.uid,
    target: l.to.uid,
    label: l.type,
    type: l.type,
    uid: l.from.uid + l.to.uid,
  }))

  // filter out links to self, then add as a new svg circular arrow on node
  const nodeMap = _.keyBy(nodes, 'uid')
  modifiedLinks = modifiedLinks.filter((l) => {
    if (l.source !== l.target) {
      return true
    } else {
      nodeMap[l.source].selfLink = l
      return false
    }
  })

  return {
    links: modifiedLinks,
    nodes: nodes,
  }
}
