import { addDiagramDetails, computeNodeStatus } from '../../../../components/Topology/utils/diagram-helpers'
import {
    getClusterName,
    nodeMustHavePods,
    isDeployableResource,
} from '../../../../components/Topology/utils/diagram-helpers-utils'
import _ from 'lodash'
import R from 'ramda'
import { getArgoTopology } from './argo/topology'
import { addArgoDiagramDetails } from './argo/details'
import { getSubscriptionTopology } from './subscription/topology'

export const getTopology = (application, managedClusters) => {
    let topology
    if (application.isArgoApp) {
        topology = getArgoTopology(application, managedClusters)
    } else {
        topology = getSubscriptionTopology(application, managedClusters)
    }
    return topology
}

export const getDiagramElements = (appData, topology, searchRelated, applicationRelated, additionalRelated) => {
    // topology from api will have raw k8 objects, pods status
    const { links, nodes } = getTopologyElements(topology)
    // create yaml and what row links to what node
    let row = 0
    const yamls = []
    const clustersList = []
    let activeChannelInfo
    let channelsList = []
    const originalMap = {}
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

        processNodeData(node, allResourcesMap, isClusterGrouped, hasHelmReleases, topology)
    })

    if (searchRelated) {
        if (appData.isArgoApp && additionalRelated) {
            const secretItems = _.get(additionalRelated, 'searchResult', [{ items: [] }])[0]
            _.set(appData, 'argoSecrets', _.get(secretItems, 'items', []))
        }
        addDiagramDetails(searchRelated, allResourcesMap, isClusterGrouped, hasHelmReleases, topology)
        nodes.forEach((node) => {
            computeNodeStatus(node)
            //_.set(node, 'specs.rnd', Math.random())
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

    if (!isDeployableResource(node) && R.contains(type, ['cluster', 'application', 'placements'])) {
        return //ignore these types
    }

    const channel = _.get(node, 'specs.raw.spec.channel', '')
    const keyName = !isDeployableResource(node) && channel.length > 0 ? `${channel}-${name}` : name

    let podsKeyForThisNode = null
    const clusterName = getClusterName(node.id, node)
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
        topoResourceMap[`${type}-${keyName}-${clusterName}`] = node
        //podsKeyForThisNode must use the resource type and name since we can have
        //resources deploying pods and having the same name, in the same deployment
        //(for example deploymant and deploymentconfig with same name)
        podsKeyForThisNode = `pod-${type}-${keyName}-${clusterName}`

        if (clusterName.indexOf(', ') > -1) {
            isClusterGrouped.value = true
        }
    }
    //keep clusters info to create route host and to match nodes to grouped clusters
    node['clusters'] = R.find(R.propEq('id', `member--clusters--${clusterName}`))(topology.nodes)

    if (nodeMustHavePods(node)) {
        //keep a map with the nodes names that could have pods
        //since we don't have a link between pods and parent, we rely on pod name vs resource name to find pod's parents
        //if resources have the same name, try to solve conflicts by setting this map name for resources that could have pods
        //assuming we don't have resources with same name and producing pods, this workaorund will function
        //for the future need to set a relation between pods and parents
        topoResourceMap[podsKeyForThisNode] = node
    }
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
