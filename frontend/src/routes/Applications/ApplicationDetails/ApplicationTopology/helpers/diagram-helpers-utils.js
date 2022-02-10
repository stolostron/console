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

const checkmarkCode = 3
const warningCode = 2
const pendingCode = 1
const failureCode = 0
const checkmarkStatus = 'checkmark'
const warningStatus = 'warning'
const pendingStatus = 'pending'
const failureStatus = 'failure'
const pulseValueArr = ['red', 'orange', 'yellow', 'green']
const metadataName = 'metadata.name'
const argoAppHealthyStatus = 'Healthy'
const argoAppDegradedStatus = 'Degraded'
const argoAppMissingStatus = 'Missing'
const argoAppProgressingStatus = 'Progressing'
const argoAppSuspendedStatus = 'Suspended'
const argoAppUnknownStatus = 'Unknown'
export const nodesWithNoNS = ['namespace', 'clusterrole', 'clusterrolebinding']

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
            'replicaset',
            'daemonset',
            'statefulset',
            'replicationcontroller',
            'deployment',
            'deploymentconfig',
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
            return _.union(_.get(node, 'specs.clustersNames', []), _.get(node, 'clusters.specs.appClusters', [])).join(
                ','
            )
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
        relatedKind.kind === 'route' && !_.get(relatedKind, '_hostingDeployable', '').endsWith(name)
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

export const getOnlineClusters = (node) => {
    const clusterNames = R.split(',', getClusterName(_.get(node, 'id', ''), node))
    const prClusters = _.get(node, 'clusters.specs.clusters', [])
    const searchClusters = _.get(node, 'specs.searchClusters', [])
    const clusterObjs = prClusters.length > searchClusters.length ? prClusters : searchClusters
    const onlineClusters = []
    clusterNames.forEach((clsName) => {
        const cluster = clsName.trim()
        if (cluster === 'local-cluster') {
            onlineClusters.push(cluster)
        } else {
            const matchingCluster = _.find(
                clusterObjs,
                (cls) => _.get(cls, 'name', '') === cluster || _.get(cls, metadataName, '') === cluster
            )
            if (
                matchingCluster &&
                (_.includes(['ok', 'pendingimport', 'OK'], _.get(matchingCluster, 'status', '')) ||
                    _.get(matchingCluster, 'ManagedClusterConditionAvailable', '') === 'True')
            ) {
                onlineClusters.push(cluster)
            }
        }
    })
    //always add local cluster
    return _.uniqBy(_.union(onlineClusters, ['local-cluster']))
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

export const getPulseStatusForSubscription = (node) => {
    let pulse = 'green'

    const resourceMap = _.get(node, `specs.${node.type}Model`)
    if (!resourceMap) {
        pulse = 'orange' //resource not available
        return pulse
    }
    let isPlaced = false
    const onlineClusters = getOnlineClusters(node)
    _.flatten(Object.values(resourceMap)).forEach((subscriptionItem) => {
        const clsName = _.get(subscriptionItem, 'cluster', '')
        if (subscriptionItem.status) {
            if (R.includes('Failed', subscriptionItem.status)) {
                pulse = 'red'
            }
            if (subscriptionItem.status === 'Subscribed') {
                isPlaced = true // at least one cluster placed
            }
            if (
                (!_.includes(onlineClusters, clsName) ||
                    (subscriptionItem.status !== 'Subscribed' && subscriptionItem.status !== 'Propagated')) &&
                pulse !== 'red'
            ) {
                pulse = 'yellow' // anything but failed or subscribed
            }
        }
    })
    if (pulse === 'green' && !isPlaced) {
        pulse = 'yellow' // set to yellow if not placed
    }

    const statuses = _.get(node, 'specs.raw.status.statuses', {})
    Object.values(statuses).forEach((cluster) => {
        const packageItems = _.get(cluster, 'packages', {})
        const failedPackage = Object.values(packageItems).find((item) => _.get(item, 'phase', '') === 'Failed')
        if (failedPackage && pulse === 'green') {
            pulse = 'yellow'
        }
    })

    return pulse
}

export const getExistingResourceMapKey = (resourceMap, name, relatedKind) => {
    // bofore loop, find all items with the same type as relatedKind
    const isSameType = (item) => item.indexOf(`${relatedKind.kind}-`) === 0
    const keys = R.filter(isSameType, Object.keys(resourceMap))
    const relatedKindCls = _.get(relatedKind, 'cluster', '')
    let i
    for (i = 0; i < keys.length; i++) {
        const keyObject = resourceMap[keys[i]]
        const keyObjType = _.get(keyObject, 'type', '')
        const keyObjName = _.get(keyObject, 'name', '')
        if (
            (keys[i].indexOf(name) > -1 && keys[i].indexOf(relatedKindCls) > -1) || //node id doesn't contain cluster name, match cluster using the object type
            (_.includes(_.get(keyObject, 'specs.clustersNames', []), relatedKindCls) &&
                name === `${keyObjType}-${keyObjName}-${relatedKindCls}`)
        ) {
            return keys[i]
        }
    }

    return null
}

// The controllerrevision resource doesn't contain any desired pod count so
// we need to get it from the parent; either a daemonset or statefulset
export const syncControllerRevisionPodStatusMap = (resourceMap) => {
    Object.keys(resourceMap).forEach((resourceName) => {
        if (resourceName.startsWith('controllerrevision-')) {
            const controllerRevision = resourceMap[resourceName]
            const parentName = _.get(controllerRevision, 'specs.parent.parentName', '')
            const parentType = _.get(controllerRevision, 'specs.parent.parentType', '')
            const parentId = _.get(controllerRevision, 'specs.parent.parentId', '')
            const clusterName = getClusterName(parentId).toString()
            const parentResource =
                resourceMap[`${parentType}-${parentName}-${clusterName}`] || resourceMap[`${parentType}-${parentName}-`]
            if (parentResource) {
                const parentModel = {
                    ..._.get(parentResource, `specs.${parentResource.type}Model`, ''),
                }
                if (parentModel) {
                    _.set(controllerRevision, 'specs.controllerrevisionModel', parentModel)
                }
            }
        }
    })
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

export const setArgoApplicationDeployStatus = (node, details, t) => {
    const relatedArgoApps = _.get(node, 'specs.relatedApps', [])
    if (relatedArgoApps.length === 0) {
        return // search is not available
    }

    // show error if app is not healthy
    const appHealth = _.get(node, 'specs.raw.status.health.status')
    const appStatusConditions = _.get(node, 'specs.raw.status.conditions')

    if ((appHealth === 'Unknown' || appHealth === 'Degraded' || appHealth === 'Missing') && appStatusConditions) {
        details.push({
            labelKey: 'Health status',
            value: t(
                'The health status for application {{0}} is {{1}}. Use the Launch Argo editor action below to view the application details.',
                [_.get(node, 'name', ''), appHealth]
            ),
            status: failureStatus,
        })
    }

    // related Argo apps
    details.push({
        type: 'label',
        labelValue: t('Related applications ({{0}})', [relatedArgoApps.length]),
    })

    details.push({
        type: 'spacer',
    })
    // related Argo apps search and pagination
    const sortByNameCaseInsensitive = R.sortBy(R.compose(R.toLower, R.prop('name')))
    const sortedRelatedArgoApps = sortByNameCaseInsensitive(relatedArgoApps)
    details.push({
        type: 'relatedargoappdetails',
        relatedargoappsdata: {
            argoAppList: sortedRelatedArgoApps,
        },
    })
}

export const getStatusForArgoApp = (healthStatus) => {
    if (healthStatus === argoAppHealthyStatus) {
        return checkmarkStatus
    }
    if (healthStatus === argoAppProgressingStatus) {
        return pendingStatus
    }
    if (healthStatus === argoAppUnknownStatus) {
        return failureStatus
    }
    return warningStatus
}

export const translateArgoHealthStatus = (healthStatus) => {
    if (healthStatus === argoAppHealthyStatus) {
        return 3
    }
    if (healthStatus === argoAppMissingStatus || healthStatus === argoAppUnknownStatus) {
        return 1
    }
    if (healthStatus === argoAppDegradedStatus) {
        return 0
    }
    return 2
}

export const getPulseStatusForArgoApp = (node) => {
    const relatedApps = _.get(node, 'specs.relatedApps', [])
    let healthyCount = 0,
        missingUnknownProgressingSuspendedCount = 0,
        degradedCount = 0

    relatedApps.forEach((app) => {
        const relatedAppHealth = _.get(app, 'status', '')
        if (relatedAppHealth === argoAppHealthyStatus) {
            healthyCount++
        } else if (
            relatedAppHealth === argoAppMissingStatus ||
            relatedAppHealth === argoAppUnknownStatus ||
            relatedAppHealth === argoAppProgressingStatus ||
            relatedAppHealth === argoAppSuspendedStatus
        ) {
            missingUnknownProgressingSuspendedCount++
        } else if (relatedAppHealth === argoAppDegradedStatus) {
            degradedCount++
        }
    })

    if (degradedCount === relatedApps.length) {
        return pulseValueArr[failureCode]
    }
    if (missingUnknownProgressingSuspendedCount === relatedApps.length) {
        return pulseValueArr[pendingCode]
    }
    if (healthyCount === 0 && missingUnknownProgressingSuspendedCount === 0 && degradedCount === 0) {
        return pulseValueArr[pendingCode]
    }
    if (healthyCount < relatedApps.length) {
        return pulseValueArr[warningCode]
    }

    return pulseValueArr[checkmarkCode]
}

// try to match app destination clusters with hub clusters using search data
export const updateAppClustersMatchingSearch = (node, searchClusters) => {
    const nodeId = _.get(node, 'id', '')
    if (nodeId !== 'member--clusters--') {
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
    _.set(node, 'specs.clusters', searchClusters)
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
            const searchCluster = _.find(
                _.get(node, 'specs.searchClusters', []),
                (cls) => _.get(cls, 'name') === clusterName
            )
            const isOffline = searchCluster && _.get(searchCluster, '_clusterNamespace', '').length > 1
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
    const nodeType = _.get(node, 'type', '')
    const deployedResourcesNS = _.includes(nodesWithNoNS, nodeType)
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
            if (
                _.filter(_.flatten(Object.values(resourceModel)), (obj) => _.get(obj, '_uid', '') === ownerUID).length >
                0
            ) {
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
