/* Copyright Contributors to the Open Cluster Management project */

import R from 'ramda'
import _ from 'lodash'
import {
    getAge,
    addOCPRouteLocation,
    addDetails,
    createEditLink,
    addNodeServiceLocation,
    addPropertyToList,
    getNodePropery,
    pulseValueArr,
} from '../helpers/diagram-helpers'
import {
    isDeployableResource,
    nodeMustHavePods,
    getClusterName,
    getActiveFilterCodes,
    filterSubscriptionObject,
    fixMissingStateOptions,
    showMissingClusterDetails,
    getTargetNsForNode,
    nodesWithNoNS,
    allClustersAreOnline,
} from '../helpers/diagram-helpers-utils'
import { isSearchAvailable } from '../helpers/search-helper'
import { showAnsibleJobDetails, getPulseStatusForAnsibleNode } from '../helpers/ansible-task'

const specPulse = 'specs.pulse'
const specShapeType = 'specs.shapeType'
const showResourceYaml = 'show_resource_yaml'
export const checkmarkStatus = 'checkmark'
export const warningStatus = 'warning'
export const pendingStatus = 'pending'
export const failureStatus = 'failure'
export const checkmarkCode = 3
export const warningCode = 2
export const pendingCode = 1
export const failureCode = 0
//pod state contains any of these strings
const resErrorStates = ['err', 'off', 'invalid', 'kill', 'propagationfailed']
const resWarningStates = [pendingStatus, 'creating', 'terminating']
const apiVersionPath = 'specs.raw.apiVersion'

const metadataName = 'metadata.name'
const argoAppHealthyStatus = 'Healthy'
const argoAppDegradedStatus = 'Degraded'
const argoAppMissingStatus = 'Missing'
const argoAppProgressingStatus = 'Progressing'
const argoAppUnknownStatus = 'Unknown'
const argoAppSuspendedStatus = 'Suspended'

///////////////////////////////////////////////////////////////////////////////////////
/////////////////////////// COMPUTE EACH DIAGRAM NODE STATUS ////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

export const computeNodeStatus = (node, isSearchingStatusComplete, t) => {
    let pulse = 'green'
    let shapeType = node.type
    let apiVersion

    // still querying statuses
    if (!isSearchingStatusComplete) {
        _.set(node, specPulse, 'spinner')
        return 'spinner'
    }

    // pod status
    if (nodeMustHavePods(node)) {
        pulse = getPulseForNodeWithPodStatus(node, t)
        _.set(node, specPulse, pulse)
        _.set(node, specShapeType, shapeType)
        return pulse
    }

    const isDeployable = isDeployableResource(node)
    switch (node.type) {
        case 'application':
            apiVersion = _.get(node, apiVersionPath)
            if (apiVersion && apiVersion.indexOf('argoproj.io') > -1 && !isDeployable) {
                pulse = getPulseStatusForArgoApp(node)
            } else {
                if (isDeployable) {
                    pulse = getPulseStatusForGenericNode(node, t)
                } else if (!_.get(node, 'specs.channels')) {
                    pulse = 'red'
                }
            }
            break
        case 'applicationset':
            if (isDeployable) {
                pulse = getPulseStatusForGenericNode(node, t)
            } else {
                pulse = getPulseStatusForArgoApp(node, true)
            }
            break
        case 'placements':
            if (isDeployable) {
                pulse = getPulseStatusForGenericNode(node, t)
            } else if (!_.get(node, 'specs.raw.status.decisions')) {
                pulse = 'red'
            }
            break
        case 'placement':
            if (isDeployable) {
                pulse = getPulseStatusForGenericNode(node, t)
            } else if (_.get(node, 'specs.raw.status.numberOfSelectedClusters') === 0) {
                pulse = 'red'
            }
            break
        case 'subscription':
            if (isDeployable) {
                pulse = getPulseStatusForGenericNode(node, t)
            } else {
                pulse = getPulseStatusForSubscription(node)
                shapeType = getShapeTypeForSubscription(node)
            }
            break
        case 'cluster':
            pulse = getPulseStatusForCluster(node)
            break
        default:
            pulse = getPulseStatusForGenericNode(node, t)
    }

    _.set(node, specPulse, pulse)
    _.set(node, specShapeType, shapeType)
    return pulse
}

/////////////////////////////////////////////////////////////////
///////////////// SUBSCRIPTION //////////////////////////////////
/////////////////////////////////////////////////////////////////
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

// BLOCKED
export const getShapeTypeForSubscription = (node) => {
    const blocked = _.includes(_.get(node, 'specs.raw.status.message', ''), 'Blocked')
    if (blocked) {
        return 'subscriptionblocked'
    } else {
        return 'subscription'
    }
}

/////////////////////////////////////////////////////////////////
///////////////// ARGO APPLICATION //////////////////////////////
/////////////////////////////////////////////////////////////////

export const getPulseStatusForArgoApp = (node, isAppSet) => {
    const relatedApps = isAppSet ? _.get(node, 'specs.appSetApps', []) : []

    if (!isAppSet) {
        // add this node
        const appStatus = _.get(node, 'specs.raw.status.health.status', argoAppUnknownStatus)
        relatedApps.push({
            status: appStatus,
        })
    }

    let healthyCount = 0,
        missingUnknownProgressingSuspendedCount = 0,
        degradedCount = 0

    relatedApps.forEach((app) => {
        const relatedAppHealth = isAppSet
            ? _.get(app, 'status.health.status', argoAppUnknownStatus)
            : _.get(app, 'status', '')
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

/////////////////////////////////////////////////////////////////
///////////////// CLUSTER //////// //////////////////////////////
/////////////////////////////////////////////////////////////////

export const getPulseStatusForCluster = (node) => {
    /////////////////////////////////////////
    ///////// SEE IF CLUSTER IS OFFLINE
    ////////////////////////////////////////
    let clusters = _.get(node, 'specs.clusters')
    const appClusters = _.get(node, 'specs.appClusters', [])
    const clustersNames = _.get(node, 'specs.clustersNames')
    const targetNamespaces = _.get(node, 'specs.targetNamespaces', {})
    const appClustersList = appClusters.length > 0 ? appClusters : Object.keys(targetNamespaces)

    // if appClustersList is not empty then this is an Argo app
    if (appClustersList.length > 0) {
        appClustersList.forEach((appCls) => {
            if (_.findIndex(clusters, (obj) => _.get(obj, 'name') === appCls) === -1) {
                clusters.push({
                    name: appCls,
                    _clusterNamespace: appCls === 'local-cluster' ? appCls : '_',
                    status: appCls === 'local-cluster' ? 'ok' : '',
                })
            }
        })
    }

    let okCount = 0,
        pendingCount = 0,
        offlineCount = 0

    clusters.forEach((cluster) => {
        let clusterName = cluster.name || cluster.metadata.name
        if (clusterName === 'in-cluster') {
            clusterName = 'local-cluster'
        }
        if (!clustersNames || clustersNames.includes(clusterName)) {
            const status = cluster.status || calculateArgoClusterStatus(cluster) || ''
            if (status.toLowerCase() === 'ok' || _.get(cluster, 'ManagedClusterConditionAvailable', '') === 'True') {
                okCount++
            } else if (status === 'pendingimport') {
                pendingCount++
            } else if (status === 'offline') {
                offlineCount++
            }
        }
    })
    if (offlineCount > 0) {
        return 'red'
    }
    if (pendingCount === clusters.length) {
        return 'orange'
    }
    if (okCount < clusters.length) {
        return 'yellow'
    }
    return 'green'
}

// This calculation is not accurate as search is not returning all the needed
// data from the managedcluster resource YAML
export const calculateArgoClusterStatus = (clusterData) => {
    let status = ''
    const clusterAccepted = clusterData.HubAcceptedManagedCluster
    const clusterJoined = clusterData.ManagedClusterJoined
    const clusterAvailable = clusterData.ManagedClusterConditionAvailable

    if (clusterAccepted === false) {
        status = 'notaccepted'
    } else if (clusterJoined === false) {
        status = 'pendingimport'
    } else {
        status = clusterAvailable && clusterAvailable === 'True' ? 'ok' : 'offline'
    }

    return status
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

/////////////////////////////////////////////////////////////////
///////////////// POD ///////////////////////////////////////////
/////////////////////////////////////////////////////////////////

export const getPulseForNodeWithPodStatus = (node, t) => {
    const { resSuccessStates } = getStateNames(t)

    let pulse = 'green'
    const resourceMap = _.get(node, `specs.${node.type}Model`)
    let desired = 1
    if (resourceMap && Object.keys(resourceMap).length > 0) {
        desired = resourceMap[Object.keys(resourceMap)[0]][0].desired
            ? resourceMap[Object.keys(resourceMap)[0]][0].desired
            : 'NA'
    }

    const namespace = _.get(node, 'namespace', '')
    const clusterNames = R.split(',', getClusterName(node.id, node, true))
    const onlineClusters = getOnlineClusters(node)

    if (!resourceMap || onlineClusters.length === 0) {
        pulse = 'orange' //resource not available
        return pulse
    }

    //must have pods, set the pods status here
    const podStatusMap = {}
    const podList = _.get(node, 'specs.podModel', [])

    // list of target namespaces per cluster
    const targetNamespaces = _.get(node, 'clusters.specs.targetNamespaces', {})
    //go through all clusters to make sure all pods are counted, even if they are not deployed there
    let highestPulse = 3
    clusterNames.forEach((clusterName) => {
        clusterName = R.trim(clusterName)
        const resourcesForCluster = _.filter(
            _.flatten(Object.values(resourceMap)),
            (obj) => _.get(obj, 'cluster', '') === clusterName
        )
        const resourceItems = fixMissingStateOptions(resourcesForCluster || [])

        //get cluster target namespaces
        const targetNSList = targetNamespaces[clusterName]
            ? _.union(targetNamespaces[clusterName], _.uniq(_.map(resourceItems, 'namespace')))
            : resourceItems.length > 0
            ? _.uniq(_.map(resourceItems, 'namespace'))
            : [namespace]
        targetNSList.forEach((targetNS) => {
            const resourceItemsForNS = _.filter(resourceItems, (obj) => _.get(obj, 'namespace', '') === targetNS)
            if (resourceItemsForNS.length === 0) {
                //one namespace has no deployments
                pulse = 'yellow'
            }
            const podObjects = _.filter(
                _.flatten(Object.values(podList)),
                (obj) => _.get(obj, 'namespace', '') === targetNS && _.get(obj, 'cluster', '') === clusterName
            )
            resourceItemsForNS.forEach((resourceItem) => {
                //process item if there are no pods in the same ns - cluster as resource item
                const processItem = resourceItem && podObjects.length === 0
                if (resourceItem && resourceItem.kind === 'daemonset') {
                    desired = resourceItem.desired
                }

                let podsReady = 0
                let podsUnavailable = 0
                //find pods status and pulse from pods model, if available
                podObjects.forEach((podItem) => {
                    podsUnavailable = podsUnavailable + getPodState(podItem, clusterName, resErrorStates) //podsUnavailable + 1
                    podsReady = podsReady + getPodState(podItem, clusterName, resSuccessStates)
                })

                podStatusMap[`${clusterName}-${targetNS}-${node.type}-${resourceItem.name}`] = {
                    available: 0,
                    current: 0,
                    desired: desired,
                    ready: podsReady,
                    unavailable: podsUnavailable,
                }

                pulse = getPulseForData(podsReady, desired, podsUnavailable)
                if (processItem) {
                    //no pods linked to the resource, check if we have enough information on the actual resource
                    podStatusMap[`${clusterName}-${targetNS}-${node.type}-${resourceItem.name}`] = {
                        available: resourceItem.available || 0,
                        current: resourceItem.current || 0,
                        desired: resourceItem.desired || 0,
                        ready: resourceItem.ready || 0,
                    }

                    pulse = getPulseForData(
                        resourceItem.available ? resourceItem.available : 0,
                        resourceItem.desired,
                        0
                    )
                    resourceItem.resStatus = `${resourceItem.available || 0}/${resourceItem.desired}`
                }
                resourceItem.pulse = pulse
                const index = pulseValueArr.indexOf(pulse)
                if (index < highestPulse) {
                    highestPulse = index
                }
            })
            const index = pulseValueArr.indexOf(pulse)
            if (index < highestPulse) {
                highestPulse = index
            }
        })
        const index = pulseValueArr.indexOf(pulse)
        if (index < highestPulse) {
            highestPulse = index
        }
    })
    _.set(node, 'podStatusMap', podStatusMap)

    return pulseValueArr[highestPulse]
}

//count pod state
export const getPodState = (podItem, clusterName, types) => {
    const podStatus = R.toLower(R.pathOr('unknown', ['status'])(podItem))

    let result = 0
    if (!clusterName || R.equals(clusterName, R.pathOr('unknown', ['cluster'])(podItem))) {
        types.forEach((type) => {
            if (R.includes(type, podStatus)) {
                result = 1
            }
        })
    }
    return result
}

export const getPulseForData = (available, desired, podsUnavailable) => {
    if (podsUnavailable > 0) {
        return 'red'
    }

    if (available < desired) {
        return 'yellow'
    }

    if (desired <= 0) {
        return 'yellow'
    }

    if (!desired && available === 0) {
        return 'orange'
    }

    if (desired === 'NA' && available === 0) {
        return 'red'
    }

    return 'green'
}

/////////////////////////////////////////////////////////////////
///////////////// GENERIC ///////////////////////////////////////
/////////////////////////////////////////////////////////////////
const getPulseStatusForGenericNode = (node, t) => {
    const { deployedStr, resNotDeployedStates } = getStateNames(t)

    //ansible job status
    const nodeType = _.get(node, 'type', '')
    if (nodeType === 'ansiblejob' && _.get(node, 'specs.raw.hookType')) {
        // process here only ansible hooks
        return getPulseStatusForAnsibleNode(node)
    }
    let pulse = _.get(node, specPulse, 'green')

    if (pulse === 'red') {
        return pulse //no need to check anything else, return red
    }
    const namespace = _.get(node, 'namespace', '')
    const resourceMap = _.get(node, `specs.${node.type}Model`)
    const clusterNames = R.split(',', getClusterName(node.id, node, true))
    const onlineClusters = getOnlineClusters(node)
    if (!resourceMap || onlineClusters.length === 0) {
        pulse = 'orange' //resource not available
        if (nodeType === 'placement') {
            pulse = 'green'
        }
        return pulse
    }
    if (!allClustersAreOnline(clusterNames, onlineClusters)) {
        pulse = 'yellow'
        return pulse
    }
    //go through all clusters to make sure all pods are counted, even if they are not deployed there
    let highestPulse = 3
    clusterNames.forEach((clusterName) => {
        clusterName = R.trim(clusterName)
        //get target cluster namespaces
        const resourceNSString = _.includes(nodesWithNoNS, nodeType) ? 'name' : 'namespace'
        const resourcesForCluster = _.filter(
            _.flatten(Object.values(resourceMap)),
            (obj) => _.get(obj, 'cluster', '') === clusterName
        )

        const targetNSList = getTargetNsForNode(node, resourcesForCluster, clusterName, namespace)
        targetNSList.forEach((targetNS) => {
            const resObjects = _.filter(resourcesForCluster, (obj) => _.get(obj, resourceNSString, '') === targetNS)
            if (resObjects.length === 0) {
                pulse = 'yellow'
            } else {
                resObjects.forEach((resObject) => {
                    const resStatus = _.get(resObject, 'status', deployedStr).toLowerCase()
                    resObject.resStatus = resStatus
                    if (_.includes(resErrorStates, resStatus)) {
                        pulse = 'red'
                    }
                    if (_.includes(_.union(resWarningStates, resNotDeployedStates), resStatus)) {
                        // resource not created on this cluster for the required target namespace
                        pulse = 'yellow'
                    }
                    resObject.pulse = pulse
                    const index = pulseValueArr.indexOf(pulse)
                    if (index < highestPulse) {
                        highestPulse = index
                    }
                })
            }
            const index = pulseValueArr.indexOf(pulse)
            if (index < highestPulse) {
                highestPulse = index
            }
        })
        const index = pulseValueArr.indexOf(pulse)
        if (index < highestPulse) {
            highestPulse = index
        }
    })

    return pulseValueArr[highestPulse]
}

const getStateNames = (t) => {
    const notDeployedStr = t('Not Deployed')
    const notDeployedNSStr = t('Not Created')
    const deployedStr = t('Deployed')
    const deployedNSStr = t('Created')
    const resNotDeployedStates = [notDeployedStr.toLowerCase(), notDeployedNSStr.toLowerCase()]
    const resSuccessStates = ['run', 'bound', deployedStr.toLowerCase(), deployedNSStr.toLowerCase(), 'propagated']
    return { notDeployedStr, notDeployedNSStr, deployedStr, deployedNSStr, resNotDeployedStates, resSuccessStates }
}

///////////////////////////////////////////////////////////////////////////////////////
////////////////////////  SET STATUS IN DETAILS TAB ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
//////////////////// APPLICATION /////////////////////////
///////////////////////////////////////////////////////////
export const setApplicationDeployStatus = (node, details, t) => {
    if (node.type !== 'application' && node.type !== 'applicationset') {
        return details
    }

    const apiVersion = _.get(node, apiVersionPath)
    if (node.type === 'applicationset') {
        setAppSetDeployStatus(node, details, t)
    } else if (apiVersion && apiVersion.indexOf('argoproj.io') > -1) {
        setArgoApplicationDeployStatus(node, details, t)
    } else {
        addPropertyToList(
            details,
            getNodePropery(
                node,
                ['specs', 'raw', 'spec', 'selector'],
                t('Subscription Selector'),
                t('This application has no subscription match selector (spec.selector.matchExpressions)'),
                true
            )
        )

        details.push({
            type: 'spacer',
        })

        //show error if no channel, meaning there is no linked subscription
        if (!isDeployableResource(node) && !_.get(node, 'specs.channels')) {
            const appNS = _.get(node, 'namespace', 'NA')

            details.push({
                labelKey: t('Error'),
                value: t(
                    'This application has no matched subscription. Make sure the subscription match selector spec.selector.matchExpressions exists and matches a Subscription resource created in the {{0}} namespace.',
                    [appNS]
                ),
                status: failureStatus,
            })
            const subscrSearchLink = `/search?filters={"textsearch":"kind%3Asubscription%20namespace%3A${appNS}%20cluster%3A${'local-cluster'}"}`
            details.push({
                type: 'link',
                value: {
                    label: t('View all subscriptions in {{0}} namespace', [appNS]),
                    id: `${node.id}-subscrSearch`,
                    data: {
                        action: 'open_link',
                        targetLink: subscrSearchLink,
                    },
                },
            })
        }
    }

    return details
}

///////////////////////////////////////////////////////////
//////////////////// ARGO APPLICATION /////////////////////////
///////////////////////////////////////////////////////////

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

export const setAppSetDeployStatus = (node, details, t) => {
    const appSetApps = _.get(node, 'specs.appSetApps', [])
    if (appSetApps.length === 0) {
        details.push({
            labelKey: 'Error',
            value: t(
                'There are no Argo applications created. Check the following resources and make sure they are configured properly: applicationset placement, gitopscluster, gitopcluster placement, managedclusterset'
            ),
            status: failureStatus,
        })
        return
    }

    details.push({
        type: 'label',
        labelKey: t('Application deploy status'),
    })
    details.push({
        type: 'spacer',
    })
    // continue checking app status
    appSetApps.forEach((argoApp) => {
        const appHealth = _.get(argoApp, 'status.health.status', '')
        const appName = _.get(argoApp, metadataName)
        const appNamespace = _.get(argoApp, 'metadata.namespace')
        details.push({
            labelKey: appName,
            value: appHealth,
        })
        details.push({
            type: 'link',
            value: {
                label: t('Launch Argo editor'),
                id: `argoapp-${appName}`,
                data: {
                    action: 'open_argo_editor',
                    name: appName,
                    namespace: appNamespace,
                    cluster: 'local-cluster',
                },
            },
        })
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

///////////////////////////////////////////////////////////
//////////////////// SUBSCRIPTION /////////////////////////
///////////////////////////////////////////////////////////

export const setSubscriptionDeployStatus = (node, details, activeFilters, t) => {
    const { resourceStatuses = new Set() } = activeFilters
    const activeFilterCodes = getActiveFilterCodes(resourceStatuses)
    //check if this is a subscription created from the app deployable
    if (R.pathOr('', ['type'])(node) !== 'subscription' || isDeployableResource(node)) {
        return details //ignore subscriptions defined from deployables or any other types
    }
    const timeWindow = _.get(node, 'specs.raw.spec.timewindow.windowtype')
    const timezone = _.get(node, 'specs.raw.spec.timewindow.location', 'NA')
    const timeWindowDays = _.get(node, 'specs.raw.spec.timewindow.daysofweek')
    const timeWindowHours = _.get(node, 'specs.raw.spec.timewindow.hours', [])

    let windowStatusArray = []

    if (timeWindow) {
        windowStatusArray = _.split(_.get(node, 'specs.raw.status.message', ''), ',')

        details.push({
            type: 'label',
            labelKey: t('Time Window'),
        })
        details.push({
            labelKey: t('Time Window type'),
            value: timeWindow,
        })
        timeWindowDays &&
            details.push({
                labelKey: t('Time Window days'),
                value: R.toString(timeWindowDays),
            })

        if (timeWindowHours) {
            timeWindowHours.forEach((timeH) => {
                details.push({
                    labelKey: t('Time Window hours'),
                    value: `${_.get(timeH, 'start', 'NA')}-${_.get(timeH, 'end', 'NA')}`,
                })
            })
        }
        details.push({
            labelKey: t('Time zone'),
            value: timezone,
        })
    }

    const isLocalPlacementSubs = _.get(node, 'specs.raw.spec.placement.local')
    if (isLocalPlacementSubs) {
        details.push({
            type: 'spacer',
        })
        details.push({
            labelKey: t('Subscription deployed on local cluster'),
            value: 'true',
        })
    }

    details.push({
        type: 'spacer',
    })
    details.push({
        type: 'label',
        labelKey: t('Cluster deploy status'),
    })

    let localSubscriptionFailed = false
    let resourceMap = _.get(node, 'specs.subscriptionModel', {})
    const filteredResourceMap = filterSubscriptionObject(resourceMap, activeFilterCodes)

    if (resourceStatuses.size > 0) {
        resourceMap = filteredResourceMap
    }
    const onlineClusters = getOnlineClusters(node)
    Object.values(resourceMap).forEach((subscriptions) => {
        subscriptions.forEach((subscription) => {
            const subsCluster = _.get(subscription, 'cluster', '')
            if (!_.includes(onlineClusters, subsCluster)) {
                details.push({
                    labelValue: subsCluster,
                    value: t('Cluster is offline'),
                    status: warningStatus,
                })
            } else {
                const isLocalFailedSubscription =
                    subscription._hubClusterResource && R.includes('Fail', R.pathOr('Fail', ['status'])(subscription))
                if (isLocalFailedSubscription) {
                    localSubscriptionFailed = true
                }
                const isLinkedLocalPlacementSubs =
                    isLocalPlacementSubs ||
                    (_.get(subscription, 'localPlacement', '') === 'true' && subsCluster === 'local-cluster')
                if (isLinkedLocalPlacementSubs || !subscription._hubClusterResource || isLocalFailedSubscription) {
                    const subscriptionPulse = R.includes('Fail', R.pathOr('', ['status'])(subscription))
                        ? failureStatus
                        : R.pathOr(null, ['status'])(subscription) === null
                        ? warningStatus
                        : checkmarkStatus

                    //if subscription has not status show an error message
                    const emptyStatusErrorMsg = subscription._hubClusterResource
                        ? t(
                              'This subscription has no status. If the status does not change to {{0}} after waiting for initial creation, verify that the multicluster-operators-hub-subscription pod is running on hub',
                              ['Propagated']
                          )
                        : t(
                              'This subscription has no status. If the status does not change to {{0}} after waiting for initial creation, verify that the klusterlet-addon-appmgr pod is running on the remote cluster.',
                              ['Subscribed']
                          )

                    const subscriptionStatus = R.pathOr(emptyStatusErrorMsg, ['status'])(subscription)

                    details.push({
                        labelValue: subscription.cluster,
                        value: subscriptionStatus,
                        status: subscriptionPulse,
                    })
                    !isLocalPlacementSubs &&
                        isLinkedLocalPlacementSubs &&
                        details.push({
                            labelKey: t('Subscription deployed on local cluster'),
                            value: 'true',
                        })

                    setClusterWindowStatus(windowStatusArray, subscription, details, t)

                    // If any packages under subscription statuses has Failed phase, refer user to view resource yaml for more details
                    const statuses = _.get(node, 'specs.raw.status.statuses', {})
                    const clusterStatus = _.get(statuses, subscription.cluster, {})
                    const packageItems = _.get(clusterStatus, 'packages', {})
                    const { reason } = _.get(node, 'specs.raw.status', {})
                    const failedPackage = Object.values(packageItems).find(
                        (item) => _.get(item, 'phase', '') === 'Failed'
                    )
                    const failedSubscriptionStatus = _.get(subscription, 'status', '').includes('Failed')

                    if (failedSubscriptionStatus) {
                        details.push({
                            labelValue: t('Error'),
                            value:
                                reason ||
                                t(
                                    'Some resources failed to deploy. Use View resource YAML link below to view the details.'
                                ),
                            status: failureStatus,
                        })
                    }
                    if (failedPackage && !failedSubscriptionStatus) {
                        details.push({
                            labelValue: t('Warning'),
                            value: t(
                                'Some resources failed to deploy. Use View resource YAML link below to view the details.'
                            ),
                            status: warningStatus,
                        })
                    }
                }
            }

            details.push({
                type: 'spacer',
            })
        })
    })

    //show missing remote placement error only if local subscription is successful and is not local placement
    if (
        Object.keys(resourceMap).length === 0 &&
        !localSubscriptionFailed &&
        !isLocalPlacementSubs &&
        resourceStatuses.size === 0
    ) {
        //no remote subscriptions
        details.push({
            labelValue: t('Remote subscriptions'),
            value: t(
                'This subscription was not added to a managed cluster. If this status does not change after waiting for initial creation, ensure the Placement Rule resource is valid and exists in the {{0}} namespace and that the klusterlet-addon-appmgr pod runs on the managed clusters.',
                [node.namespace]
            ),
            status: failureStatus,
        })
        if (isSearchAvailable()) {
            const ruleSearchLink = `/search?filters={"textsearch":"kind%3Aplacementrule%20namespace%3A${
                node.namespace
            }%20cluster%3A${'local-cluster'}"}`
            details.push({
                type: 'link',
                value: {
                    label: t('View all placement rules in {{0}} namespace', [node.namespace]),
                    id: `${node.id}-subscrSearch`,
                    data: {
                        action: 'open_link',
                        targetLink: ruleSearchLink,
                    },
                },
            })
        }
    }

    details.push({
        type: 'spacer',
    })

    return details
}

///////////////////////////////////////////////////////////
//////////////////// RULE /////////////////////////
///////////////////////////////////////////////////////////

export const setPlacementRuleDeployStatus = (node, details, t) => {
    if (R.pathOr('', ['type'])(node) !== 'placements') {
        return details
    }

    const clusterStatus = _.get(node, 'specs.raw.status.decisions', [])
    if (clusterStatus.length === 0) {
        details.push({
            labelValue: t('Error'),
            value: t(
                'This Placement Rule does not match any remote clusters. Make sure the clusterSelector and clusterConditions properties, when used, are valid and match your clusters. If using the clusterReplicas property make sure is being set to a positive value.'
            ),
            status: failureStatus,
        })
    }

    return details
}

export const setPlacementDeployStatus = (node, details, t) => {
    if (node.type !== 'placement') {
        return
    }

    const placementStatus = _.get(node, 'specs.raw.status')
    if (placementStatus) {
        if (placementStatus.numberOfSelectedClusters === 0) {
            details.push({
                labelValue: t('Error'),
                value: t(
                    'This Placement does not match any remote clusters. Make sure the requiredClusterSelector property is valid and match your clusters.'
                ),
                status: failureStatus,
            })
        }
    }
}

///////////////////////////////////////////////////////////
//////////////////// CLUSTER /////////////////////////
///////////////////////////////////////////////////////////
export const setClusterStatus = (node, details, t) => {
    const { id } = node
    const specs = _.get(node, 'specs', {})
    const { cluster, targetNamespaces = {}, clusters = [], appClusters = [], clustersNames = [] } = specs

    const clusterArr = cluster ? [cluster] : clusters
    const appClustersList = appClusters.length > 0 ? appClusters : Object.keys(targetNamespaces)
    //add now all potential argo servers (appClusters array) not covered by the deployed resources clusters ( clusters array)
    appClustersList.forEach((appCls) => {
        if (_.findIndex(clusters, (obj) => _.get(obj, 'name') === appCls) === -1) {
            //target cluster not deployed on
            clusterArr.push({
                name: appCls,
                _clusterNamespace: appCls === 'local-cluster' ? appCls : '_',
                status: appCls === 'local-cluster' ? 'ok' : '',
            })
        }
    })

    //determine any zombie clusters found by search but not selected by placementrule
    const zombieClusters = []
    clustersNames.forEach((searchCls) => {
        if (
            !clusters.find((prCls) => {
                if (prCls.metadata) {
                    return prCls.metadata.name === searchCls
                }
                return prCls.name === searchCls
            })
        ) {
            zombieClusters.push(searchCls)
        }
    })

    details.push({
        type: 'label',
        labelValue: `${t('Clusters')} (${clusterArr.length})`,
    })

    details.push({
        type: 'clusterdetailcombobox',
        comboboxdata: {
            clusterList: clusterArr,
            clusterID: id,
        },
    })

    if (zombieClusters.length > 0) {
        details.push({
            type: 'spacer',
        })
        details.push({
            type: 'label',
            labelValue: `${t('Not selected by placement rule')} (${zombieClusters.length})`,
        })
        zombieClusters.forEach((cls) => {
            details.push({
                labelValue: t('Cluster name'),
                value: cls,
            })
        })
    }
    return details
}

const setClusterWindowStatus = (windowStatusArray, subscription, details, t) => {
    windowStatusArray.forEach((wstatus) => {
        if (_.startsWith(_.trimStart(wstatus), `${subscription.cluster}:`)) {
            details.push({
                labelKey: t('Current window status is'),
                value: _.split(wstatus, ':')[1],
            })
        }
    })
}

///////////////////////////////////////////////////////////
//////////////////// POD RESOURCES /////////////////////////
///////////////////////////////////////////////////////////

//show resource deployed status for resources producing pods
export const setPodDeployStatus = (node, updatedNode, details, activeFilters, t) => {
    const { notDeployedStr } = getStateNames(t)
    const { resourceStatuses = new Set() } = activeFilters
    const activeFilterCodes = getActiveFilterCodes(resourceStatuses)

    if (!nodeMustHavePods(node)) {
        return details //process only resources with pods
    }

    details.push({
        type: 'spacer',
    })
    details.push({
        type: 'label',
        labelKey: t('Cluster deploy status for pods'),
    })

    const podModel = _.get(node, 'specs.podModel', [])
    const podObjects = _.flatten(Object.values(podModel))
    const podStatusModel = _.get(updatedNode, 'podStatusMap', {})
    const podDataPerCluster = {} //pod details list for each cluster name
    // list of target namespaces per cluster
    const targetNamespaces = _.get(node, 'clusters.specs.targetNamespaces', {})
    const resourceName = _.get(node, 'name', '')
    const resourceNamespace = _.get(node, 'namespace', '')
    const resourceMap = _.get(node, `specs.${node.type}Model`, {})

    const clusterNames = R.split(',', getClusterName(node.id, node, true))
    const onlineClusters = getOnlineClusters(node)
    clusterNames.forEach((clusterName) => {
        clusterName = R.trim(clusterName)
        if (!_.includes(onlineClusters, clusterName)) {
            // offline cluster or argo destination server we could  not map to a cluster name, so skip
            return showMissingClusterDetails(clusterName, node, details, t)
        }
        details.push({
            labelValue: t('Cluster name'),
            value: clusterName,
        })
        const resourcesForCluster = _.filter(
            _.flatten(Object.values(resourceMap)),
            (obj) => _.get(obj, 'cluster', '') === clusterName
        )
        //get cluster target namespaces
        const targetNSList = targetNamespaces[clusterName]
            ? _.union(targetNamespaces[clusterName], _.uniq(_.map(resourcesForCluster, 'namespace')))
            : resourcesForCluster.length > 0
            ? _.uniq(_.map(resourcesForCluster, 'namespace'))
            : [resourceNamespace]
        targetNSList.forEach((targetNS) => {
            const res = podStatusModel[`${clusterName}-${targetNS}-${node.type}-${resourceName}`]
            let pulse = 'orange'
            if (res) {
                pulse = getPulseForData(res.ready, res.desired, res.unavailable)
            }
            const valueStr = res ? `${res.ready}/${res.desired}` : notDeployedStr

            let statusStr
            switch (pulse) {
                case 'red':
                    statusStr = failureStatus
                    break
                case 'yellow':
                    statusStr = warningStatus
                    break
                case 'orange':
                    statusStr = pendingStatus
                    break
                default:
                    statusStr = checkmarkStatus
                    break
            }

            let addItemToDetails = false
            if (resourceStatuses.size > 0) {
                const pendingOrWanrning = statusStr === pendingStatus || statusStr === warningStatus
                if (
                    (statusStr === checkmarkStatus && activeFilterCodes.has(checkmarkCode)) ||
                    (statusStr === warningStatus && activeFilterCodes.has(warningCode)) ||
                    (pendingOrWanrning && activeFilterCodes.has(pendingCode)) ||
                    (statusStr === failureStatus && activeFilterCodes.has(failureCode))
                ) {
                    addItemToDetails = true
                }
            } else {
                addItemToDetails = true
            }

            if (addItemToDetails) {
                details.push({
                    labelValue: targetNS,
                    value: valueStr,
                    status: statusStr,
                })
            }

            podDataPerCluster[clusterName] = []
        })
    })

    details.push({
        type: 'spacer',
    })

    podObjects.forEach((pod) => {
        const { status, restarts, hostIP, podIP, startedAt, cluster } = pod

        const podError = getPodState(pod, undefined, resErrorStates)
        const podWarning = getPodState(pod, undefined, resWarningStates)
        const clusterDetails = podDataPerCluster[cluster]
        if (clusterDetails) {
            const statusStr = podError ? failureStatus : podWarning ? warningStatus : checkmarkStatus

            let addPodDetails = false
            if (resourceStatuses.size > 0) {
                if (
                    (statusStr === failureStatus && activeFilterCodes.has(failureCode)) ||
                    (statusStr === warningStatus && activeFilterCodes.has(warningCode)) ||
                    (statusStr === checkmarkStatus && activeFilterCodes.has(checkmarkCode))
                ) {
                    addPodDetails = true
                }
            } else {
                addPodDetails = true
            }

            if (addPodDetails) {
                addDetails(clusterDetails, [
                    {
                        labelKey: t('Pod'),
                        value: pod.name,
                    },
                    {
                        labelKey: t('Namespace'),
                        value: pod.namespace,
                    },
                    {
                        labelKey: t('Status'),
                        value: status,
                        status: statusStr,
                    },
                ])
                clusterDetails.push({
                    type: 'link',
                    value: {
                        label: t('View Pod YAML and Logs'),
                        data: {
                            action: showResourceYaml,
                            cluster: pod.cluster,
                            editLink: createEditLink(pod),
                        },
                    },
                    indent: true,
                })
                addDetails(clusterDetails, [
                    {
                        labelKey: t('Restarts'),
                        value: `${restarts}`,
                    },
                    {
                        labelKey: t('Host and Pod IP'),
                        value: `${hostIP}, ${podIP}`,
                    },
                    {
                        labelKey: t('Created'),
                        value: getAge(startedAt),
                    },
                ])
                clusterDetails.push({
                    type: 'spacer',
                })
            }
        }
    })

    clusterNames.forEach((clusterName) => {
        clusterName = R.trim(clusterName)

        const clusterDetails = podDataPerCluster[clusterName]

        if (clusterDetails && clusterDetails.length > 0) {
            details.push({
                type: 'spacer',
            })

            details.push({
                type: 'label',
                labelValue: t('Pod details for {{0}}', [clusterName]),
            })

            clusterDetails.forEach((podDetail) => {
                details.push(podDetail)
            })
        }
    })

    return details
}

///////////////////////////////////////////////////////////
//////////////////// NON-POD RESOURCES /////////////////////////
///////////////////////////////////////////////////////////
//show resource deployed status on the remote clusters
//for resources not producing pods
export const setResourceDeployStatus = (node, details, activeFilters, t) => {
    const { notDeployedStr, notDeployedNSStr, deployedStr, deployedNSStr, resNotDeployedStates, resSuccessStates } =
        getStateNames(t)
    const isDeployable = isDeployableResource(node)
    const { resourceStatuses = new Set() } = activeFilters
    const activeFilterCodes = getActiveFilterCodes(resourceStatuses)
    if (
        nodeMustHavePods(node) ||
        node.type === 'package' ||
        (!isDeployable &&
            R.includes(node.type, [
                'application',
                'applicationset',
                'placements',
                'placement',
                'cluster',
                'subscription',
            ]))
    ) {
        //resource with pods info is processed separately
        //ignore packages or any resources from the above list not defined as a deployable
        return details
    }
    const nodeId = _.get(node, 'id', '')
    const nodeType = _.get(node, 'type', '')
    const name = _.get(node, 'name', '')
    const namespace = _.get(node, 'namespace', '')

    const isHookNode = _.get(node, 'specs.raw.hookType')
    const clusterNames = isHookNode ? ['local-cluster'] : R.split(',', getClusterName(nodeId, node, true))
    const resourceMap = _.get(node, `specs.${node.type}Model`, {})
    const onlineClusters = getOnlineClusters(node)

    if (nodeType === 'ansiblejob' && isHookNode) {
        // process here only ansible hooks
        showAnsibleJobDetails(node, details, t)

        if (!_.get(node, 'specs.raw.spec') || Object.keys(resourceMap).length === 0) {
            const res = {
                name: name,
                namespace: namespace,
                cluster: 'local-cluster',
                kind: 'ansiblejob',
                apigroup: 'tower.ansible.com',
                apiversion: 'v1alpha1',
            }
            details.push({
                type: 'spacer',
            })
            details.push({
                type: 'link',
                value: {
                    label: t('View resource YAML'),
                    data: {
                        action: showResourceYaml,
                        cluster: res.cluster,
                        editLink: createEditLink(res),
                    },
                },
                indent: true,
            })
            return details // no other status info so return here
        }
    } else {
        details.push({
            type: 'spacer',
        })
        details.push({
            type: 'label',
            labelKey: t('Cluster deploy status'),
        })
    }
    clusterNames.forEach((clusterName) => {
        details.push({
            type: 'spacer',
        })
        clusterName = R.trim(clusterName)
        if (!_.includes(onlineClusters, clusterName)) {
            // offline cluster or argo destination server we could  not map to a cluster name, so skip
            return showMissingClusterDetails(clusterName, node, details, t)
        }
        details.push({
            labelValue: t('Cluster name'),
            value: clusterName,
        })

        const resourcesForCluster = _.filter(
            _.flatten(Object.values(resourceMap)),
            (obj) => _.get(obj, 'cluster', '') === clusterName
        )
        const resourceNSString = _.includes(nodesWithNoNS, nodeType) ? 'name' : 'namespace'
        //get cluster target namespaces
        const targetNSList = getTargetNsForNode(node, resourcesForCluster, clusterName, '*')
        targetNSList.forEach((targetNS) => {
            let res = _.find(resourcesForCluster, (obj) => _.get(obj, resourceNSString, '') === targetNS)
            if (_.get(node, 'type', '') !== 'ansiblejob' || !isHookNode) {
                // process here only regular ansible tasks
                const deployedKey = res
                    ? node.type === 'namespace'
                        ? deployedNSStr
                        : _.get(res, 'status', deployedStr)
                    : node.type === 'namespace'
                    ? notDeployedNSStr
                    : notDeployedStr
                const deployedKeyLower = deployedKey.toLowerCase()
                const statusStr = _.includes(resSuccessStates, deployedKeyLower)
                    ? checkmarkStatus
                    : _.includes(resNotDeployedStates, deployedKeyLower)
                    ? pendingStatus
                    : _.includes(resErrorStates, deployedKeyLower)
                    ? failureStatus
                    : warningStatus

                let addItemToDetails = false
                if (resourceStatuses.size > 0) {
                    if (
                        (statusStr === checkmarkStatus && activeFilterCodes.has(checkmarkCode)) ||
                        (statusStr === pendingStatus &&
                            (activeFilterCodes.has(pendingCode) || activeFilterCodes.has(warningCode)))
                    ) {
                        addItemToDetails = true
                    }
                } else {
                    addItemToDetails = true
                }

                if (addItemToDetails) {
                    details.push({
                        labelValue: targetNS,
                        value: deployedKey,
                        status: statusStr,
                    })
                } else {
                    res = null
                }
            }

            if (res) {
                //for open shift routes show location info
                addOCPRouteLocation(node, clusterName, targetNS, details, t)

                //for service
                addNodeServiceLocation(node, clusterName, targetNS, details, t)

                // add apiversion if not exist
                if (!res.apiversion) {
                    _.assign(res, { apiversion: _.get(node, apiVersionPath) })
                }

                details.push({
                    type: 'link',
                    value: {
                        label: t('View resource YAML'),
                        data: {
                            action: showResourceYaml,
                            cluster: res.cluster,
                            editLink: createEditLink(res),
                        },
                    },
                    indent: true,
                })
            }
        })
    })

    details.push({
        type: 'spacer',
    })

    return details
}
