/** *****************************************************************************
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2018, 2019. All Rights Reserved.
 *
 * US Government Users Restricted Rights - Use, duplication or disclosure
 * restricted by GSA ADP Schedule Contract with IBM Corp.
 *******************************************************************************/
// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
'use strict'
import jsYaml from 'js-yaml'
import { getStoredObject, saveStoredObject } from '../../../../lib/client/resource-helper'
import { setupResourceModel, computeNodeStatus } from '../utils/diagram-helpers'
import { getClusterName, nodeMustHavePods, isDeployableResource } from '../utils/diagram-helpers-utils'
import { getTopologyElements } from './hcm-topology'
import { REQUEST_STATUS } from '../../../actions'
import _ from 'lodash'
import R from 'ramda'

// remove the system stuff
const system = ['creationTimestamp', 'selfLink', 'status', 'uid', 'annotations', 'livenessProbe', 'resourceVersion']
const removeMeta = (obj) => {
    for (const key in obj) {
        if (system.indexOf(key) !== -1) {
            delete obj[key]
        } else if (typeof obj[key] === 'object') {
            removeMeta(obj[key])
        }
    }
}
const sortKeys = (a, b) => {
    if (a === 'name' && b !== 'name') {
        return -1
    } else if (a !== 'name' && b === 'name') {
        return 1
    } else if (a === 'namespace' && b !== 'namespace') {
        return -1
    } else if (a !== 'namespace' && b === 'namespace') {
        return 1
    }
    return a.localeCompare(b)
}

export const getActiveChannel = (localStoreKey) => {
    const storedActiveChannel = getStoredObject(localStoreKey)
    if (storedActiveChannel) {
        return storedActiveChannel.activeChannelInfo
    }

    return undefined
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

export const getDiagramElements = (topology, localStoreKey, iname, inamespace, applicationDetails) => {
    const { status, loaded, reloading, willLoadDetails, detailsReloading } = topology
    const topologyReloading = reloading
    const topologyLoadError = status === REQUEST_STATUS.ERROR
    const appLoaded = applicationDetails && applicationDetails.status === 'DONE'
    const specsActiveChannel = 'specs.activeChannel'
    if (evaluateSingleAnd(loaded, !topologyLoadError)) {
        // topology from api will have raw k8 objects, pods status
        const { topo_links, topo_nodes } = getTopologyElements(topology)
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
        topo_nodes.forEach((node) => {
            const { id, type } = node

            if (evaluateSingleAnd(type === 'application', id.startsWith('application'))) {
                channelsList = _.get(node, 'specs.channels', [])
                // set default active channel
                const channelListNoAllChannels = channelsList.filter(
                    (chn) => chn !== '__ALL__/__ALL__//__ALL__/__ALL__'
                )
                const defaultActiveChannel = channelListNoAllChannels.length > 0 ? channelListNoAllChannels[0] : null
                activeChannelInfo = _.get(node, specsActiveChannel)
                if (!activeChannelInfo) {
                    activeChannelInfo = defaultActiveChannel
                    _.set(node, specsActiveChannel, defaultActiveChannel)
                }
                //active channel not found in the list of channel, remove it
                if (evaluateSingleAnd(activeChannelInfo, channelsList.indexOf(activeChannelInfo) === -1)) {
                    _.set(node, specsActiveChannel, defaultActiveChannel)
                    activeChannelInfo = defaultActiveChannel
                }
            }

            processNodeData(node, allResourcesMap, isClusterGrouped, hasHelmReleases, topology)

            const raw = _.get(node, 'specs.raw')
            if (raw) {
                node.specs.row = row
                originalMap[raw.kind] = raw
                const dumpRaw = _.cloneDeep(raw)
                removeMeta(dumpRaw)
                const yamlData = jsYaml.safeDump(dumpRaw, { sortKeys })
                yamls.push(yamlData)
                row += yamlData.split('\n').length
            }
        })
        const yamlStr = yamls.join('---\n')

        // save results
        saveStoredObject(localStoreKey, {
            activeChannelInfo,
            channelsList,
        })
        saveStoredObject(`${localStoreKey}-${activeChannelInfo}`, {
            clusters: clustersList,
            links: topo_links,
            nodes: topo_nodes,
            yaml: yamlStr,
        })

        if (appLoaded) {
            // details are requested separately for faster load
            // if loaded, we add those details now
            addDiagramDetails(
                topology,
                allResourcesMap,
                activeChannelInfo,
                localStoreKey,
                isClusterGrouped,
                hasHelmReleases,
                applicationDetails
            )

            topo_nodes.forEach((node) => {
                computeNodeStatus(node)
            })
        }
        return {
            clusters: clustersList,
            activeChannel: activeChannelInfo,
            channels: channelsList,
            links: topo_links,
            nodes: topo_nodes,
            pods: topology.pods,
            yaml: yamlStr,
            originalMap,
            topologyLoaded: true,
            storedVersion: false,
            topologyLoadError,
            topologyReloading,
            willLoadDetails,
            detailsLoaded: appLoaded,
            detailsReloading,
        }
    }

    // if not loaded yet, see if there's a stored version
    // with the same diagram filters
    let channelsList2 = []
    let activeChannelInfo2
    const storedActiveChannel = getStoredObject(localStoreKey)
    if (storedActiveChannel) {
        activeChannelInfo2 = storedActiveChannel.activeChannelInfo
        channelsList2 = storedActiveChannel.channelsList || []
    }

    activeChannelInfo2 = _.get(topology, 'fetchFilters.application.channel', activeChannelInfo2)
    if (evaluateSingleAnd(activeChannelInfo2, loaded)) {
        //skip this if topology is not loaded ( disable refresh for example)
        const storedElements = getStoredObject(`${localStoreKey}-${activeChannelInfo2}`)
        if (storedElements) {
            return {
                clusters: storedElements.clusters,
                activeChannel: activeChannelInfo2,
                channels: channelsList2,
                links: storedElements.links,
                nodes: storedElements.nodes,
                yaml: storedElements.yaml,
                topologyLoaded: true,
                storedVersion: true,
                topologyLoadError,
                topologyReloading,
            }
        }
    }
    // if no topology yet, create diagram with search item
    const nodes2 = []
    // create application node
    const appId = `application--${iname}`
    nodes2.push({
        id: appId,
        name: iname,
        namespace: inamespace,
        type: 'application',
        uid: appId,
        specs: { isDesign: true },
    })

    return {
        clusters: [],
        channels: [],
        activeChannel: undefined,
        links: [],
        nodes: nodes2,
        yaml: '',
        topologyLoaded: false,
        topologyLoadError,
        topologyReloading,
    }
}

export const addDiagramDetails = (
    topology,
    allResourcesMap,
    activeChannel,
    localStoreKey,
    isClusterGrouped,
    hasHelmReleases,
    applicationDetails
) => {
    const { detailsReloading } = topology
    const lastUpdated = applicationDetails ? _.get(applicationDetails, 'responseTime', null) : null
    // get extra details from topology or from localstore
    let related = []
    if (applicationDetails) {
        if (!R.isEmpty(R.pathOr([], ['items'])(applicationDetails))) {
            //get the app related objects
            related = R.pathOr([], ['related'])(applicationDetails.items[0])
        }
        // save in local store
        saveStoredObject(`${localStoreKey}-${activeChannel}-details`, {
            related,
        })
    } else if (!detailsReloading) {
        // if not loaded yet, see if there's a stored version
        // with the same diagram filters
        related = getStoredObject(`${localStoreKey}-${activeChannel}-details`)
    }
    //link search objects with topology deployable objects displayed in the tree
    setupResourceModel(related, allResourcesMap, isClusterGrouped, hasHelmReleases, topology, lastUpdated)
}
