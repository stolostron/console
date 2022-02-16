/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
/* eslint no-param-reassign: "error" */
import _ from 'lodash'
import { nodeMustHavePods } from '../helpers/diagram-helpers-utils'

const localClusterName = 'local-cluster'
const metadataName = 'metadata.name'

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

const getLocalClusterElement = (createdClusterElements) => {
    let localClusterElement
    createdClusterElements.forEach((element) => {
        if (element.indexOf(localClusterName) > -1) {
            localClusterElement = element
        }
    })

    return localClusterElement
}

export const createChildNode = (parentObject, type, links, nodes) => {
    const parentType = _.get(parentObject, 'type', '')
    const { name, namespace } = parentObject
    const parentId = parentObject.id
    const memberId = `member--member--deployable--member--clusters--${getClusterName(parentId)}--${type}--${name}`
    const node = {
        name,
        namespace,
        type,
        id: memberId,
        uid: memberId,
        specs: {
            parent: {
                parentId,
                parentName: name,
                parentType,
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
export const addClusters = (
    parentId,
    createdClusterElements,
    subscription,
    clusterNames,
    managedClusterNames,
    links,
    nodes
) => {
    // create element if not already created
    const sortedClusterNames = _.sortBy(clusterNames)
    // do not use cluster names for the id or name if this is an argo app, we only know about one app here
    const cns = subscription ? sortedClusterNames.join(',') : ''
    let clusterId = `member--clusters--${cns}`
    const localClusterElement =
        clusterNames.length === 1 && clusterNames[0] === localClusterName
            ? getLocalClusterElement(createdClusterElements)
            : undefined
    if (!createdClusterElements.has(clusterId) && !localClusterElement) {
        const filteredClusters = managedClusterNames.filter((cluster) => {
            const cname = _.get(cluster, metadataName)
            return cname && clusterNames.includes(cname)
        })
        nodes.push({
            name: cns,
            namespace: '',
            type: 'cluster',
            id: clusterId,
            uid: clusterId,
            specs: {
                cluster: subscription && filteredClusters.length === 1 ? filteredClusters[0] : undefined,
                clusters: filteredClusters,
                sortedClusterNames,
            },
        })
        createdClusterElements.add(clusterId)
    }
    if (localClusterElement) {
        clusterId = localClusterElement
    }
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
    const appNode = nodes.find((r) => r.type === 'application')
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
    nodes.forEach((node) => {
        const nodeType = _.get(node, 'type', '')
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
