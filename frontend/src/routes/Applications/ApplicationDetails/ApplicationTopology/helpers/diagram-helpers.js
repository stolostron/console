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
import moment from 'moment'
import {
    isDeployableResource,
    nodeMustHavePods,
    getClusterName,
    getRouteNameWithoutIngressHash,
    getActiveFilterCodes,
    filterSubscriptionObject,
    getOnlineClusters,
    getPulseStatusForSubscription,
    getExistingResourceMapKey,
    syncControllerRevisionPodStatusMap,
    fixMissingStateOptions,
    namespaceMatchTargetServer,
    setArgoApplicationDeployStatus,
    getPulseStatusForArgoApp,
    updateAppClustersMatchingSearch,
    showMissingClusterDetails,
    getTargetNsForNode,
    nodesWithNoNS,
    getResourcesClustersForApp,
    allClustersAreOnline,
    findParentForOwnerID,
    setAppSetDeployStatus,
} from './diagram-helpers-utils'
import { getEditLink } from './resource-helper'
import { isSearchAvailable } from './search-helper'
import { getURLSearchData } from './diagram-helpers-argo'

const specPulse = 'specs.pulse'
const specShapeType = 'specs.shapeType'
const showResourceYaml = 'show_resource_yaml'
const checkmarkStatus = 'checkmark'
const warningStatus = 'warning'
const pendingStatus = 'pending'
const failureStatus = 'failure'
const checkmarkCode = 3
const warningCode = 2
const pendingCode = 1
const failureCode = 0
//pod state contains any of these strings
const resErrorStates = ['err', 'off', 'invalid', 'kill', 'propagationfailed']
const resWarningStates = [pendingStatus, 'creating', 'terminating']
const apiVersionPath = 'specs.raw.apiVersion'

import { showAnsibleJobDetails, getPulseStatusForAnsibleNode } from './ansible-task'
import { t } from 'i18next'

/*
 * UI helpers to help with data transformations
 * */
export const getAge = (value) => {
    if (value) {
        if (value.includes('T')) {
            return moment(value, 'YYYY-MM-DDTHH:mm:ssZ').fromNow()
        } else {
            return moment(value, 'YYYY-MM-DD HH:mm:ss').fromNow()
        }
    }
    return '-'
}

export const addDetails = (details, dets) => {
    dets.forEach(({ labelKey, labelValue, value, indent, status }) => {
        if (value !== undefined) {
            details.push({
                type: 'label',
                labelKey,
                labelValue,
                value,
                indent,
                status: status,
            })
        }
    })
}

export const getNodePropery = (node, propPath, key, defaultValue, status) => {
    const dataObj = R.pathOr(undefined, propPath)(node)

    let data = dataObj
    if (data) {
        data = R.replace(/:/g, '=', R.toString(data))
        data = R.replace(/{/g, '', data)
        data = R.replace(/}/g, '', data)
        data = R.replace(/"/g, '', data)
        data = R.replace(/ /g, '', data)
        data = R.replace(/\/\//g, ',', data)
    } else {
        if (defaultValue) {
            data = defaultValue
        }
    }

    if (data !== undefined) {
        // must show 0 values as well
        return {
            labelKey: key,
            value: data,
            status: status && !dataObj, //show as error message if data not defined and marked for error
        }
    }

    return undefined
}

export const addPropertyToList = (list, data) => {
    if (list && data) {
        list.push(data)
    }

    return list
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

export const getPulseStatusForCluster = (node) => {
    const clusters = _.get(node, 'specs.clusters')
    const appClusters = _.get(node, 'specs.appClusters', [])
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
        const status = cluster.status || calculateArgoClusterStatus(cluster) || ''
        if (status.toLowerCase() === 'ok' || _.get(cluster, 'ManagedClusterConditionAvailable', '') === 'True') {
            okCount++
        } else if (status === 'pendingimport') {
            pendingCount++
        } else if (status === 'offline') {
            offlineCount++
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

const getPulseStatusForGenericNode = (node, t) => {
    const { notDeployedStr, deployedStr, resNotDeployedStates } = getStateNames(t)

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
            const resObject = _.find(resourcesForCluster, (obj) => _.get(obj, resourceNSString, '') === targetNS)
            const resStatus = !resObject
                ? notDeployedStr.toLowerCase()
                : _.get(resObject, 'status', deployedStr).toLowerCase()
            if (_.includes(resErrorStates, resStatus)) {
                pulse = 'red'
                return pulse // error on a resource
            }
            if (_.includes(_.union(resWarningStates, resNotDeployedStates), resStatus)) {
                // resource not created on this cluster for the required target namespace
                pulse = 'yellow'
            }
        })
    })

    return pulse
}

//count pod state
export const getPodState = (podItem, clusterName, types) => {
    const podStatus = R.toLower(R.pathOr('unknown', ['status'])(podItem))

    let result = 0
    if (!clusterName || R.equals(clusterName, R.pathOr('unkown', ['cluster'])(podItem))) {
        types.forEach((type) => {
            if (R.includes(type, podStatus)) {
                result = 1
            }
        })
    }
    return result
}

export const getPulseForData = (previousPulse, available, desired, podsUnavailable) => {
    if (previousPulse === 'red') {
        return 'red' //don't overwrite a red state
    }

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

export const getPulseForNodeWithPodStatus = (node, t) => {
    const { resSuccessStates } = getStateNames(t)

    let pulse = 'green'
    const pulseArr = []
    const pulseValueArr = ['red', 'orange', 'yellow', 'green']
    const resourceMap = _.get(node, `specs.${node.type}Model`)
    let desired = 1
    if (resourceMap && Object.keys(resourceMap).length > 0) {
        desired = resourceMap[Object.keys(resourceMap)[0]][0].desired
            ? resourceMap[Object.keys(resourceMap)[0]][0].desired
            : 'NA'
    }

    const resourceName = _.get(node, 'name', '')
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
    clusterNames.forEach((clusterName) => {
        clusterName = R.trim(clusterName)
        const resourceItems = fixMissingStateOptions(resourceMap[`${resourceName}-${clusterName}`] || [])

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
                pulseArr.push(2)
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

                podStatusMap[`${clusterName}-${targetNS}`] = {
                    available: 0,
                    current: 0,
                    desired: desired,
                    ready: podsReady,
                    unavailable: podsUnavailable,
                }

                pulse = getPulseForData(pulse, podsReady, desired, podsUnavailable)
                if (processItem) {
                    //no pods linked to the resource, check if we have enough information on the actual resource
                    podStatusMap[`${clusterName}-${targetNS}`] = {
                        available: resourceItem.available || 0,
                        current: resourceItem.current || 0,
                        desired: resourceItem.desired || 0,
                        ready: resourceItem.ready || 0,
                    }

                    pulse = getPulseForData(
                        pulse,
                        resourceItem.available ? resourceItem.available : 0,
                        resourceItem.desired,
                        0
                    )
                }
                // assign a number to each pulse with lowest number being most critical
                if (pulse === 'green') {
                    pulseArr.push(3)
                } else if (pulse === 'yellow') {
                    pulseArr.push(2)
                } else if (pulse === 'orange') {
                    pulseArr.push(1)
                } else if (pulse === 'red') {
                    pulseArr.push(0)
                }
            })
        })
    })

    // set node icon to the most critical status
    const minPulse = Math.min.apply(null, pulseArr)
    pulse = pulseValueArr[minPulse] || pulseValueArr[2] //show orange is no pods
    _.set(node, 'podStatusMap', podStatusMap)

    if (!allClustersAreOnline(clusterNames, onlineClusters)) {
        pulse = 'yellow'
    }

    return pulse
}

export const computeNodeStatus = (node, isSearchingStatusComplete, t) => {
    let pulse = 'green'
    let shapeType = node.type
    let apiVersion

    if (!isSearchingStatusComplete) {
        _.set(node, specPulse, 'spinner')
        return 'spinner'
    }

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

export const getShapeTypeForSubscription = (node) => {
    const blocked = _.includes(_.get(node, 'specs.raw.status.message', ''), 'Blocked')
    if (blocked) {
        return 'subscriptionblocked'
    } else {
        return 'subscription'
    }
}

export const createEditLink = (node) => {
    const kind = _.get(node, 'specs.raw.kind') || _.get(node, 'kind')
    const apigroup = _.get(node, 'apigroup')
    const apiversion = _.get(node, 'apiversion')
    let cluster = _.get(node, 'cluster')
    if (!cluster) {
        cluster = getURLSearchData().cluster
    }
    let apiVersion = _.get(node, apiVersionPath)
    if (!apiVersion) {
        apiVersion = apigroup && apiversion ? apigroup + '/' + apiversion : apiversion
    }

    return getEditLink({
        name: _.get(node, 'name'),
        namespace: _.get(node, 'namespace'),
        kind: kind ? kind.toLowerCase() : undefined,
        apiVersion,
        cluster: cluster ? cluster : undefined,
    })
}

export const createDeployableYamlLink = (node, details, t) => {
    //returns yaml for the deployable
    if (
        details &&
        node &&
        R.includes(_.get(node, 'type', ''), ['application', 'placements', 'subscription']) &&
        node.specs.isDesign // only for top-level resources
    ) {
        const editLink = createEditLink(node)
        editLink &&
            isSearchAvailable() &&
            details.push({
                type: 'link',
                value: {
                    label: t('View resource YAML'),
                    data: {
                        action: showResourceYaml,
                        cluster: 'local-cluster',
                        editLink: editLink,
                    },
                },
            })
    }

    return details
}

export const inflateKubeValue = (value) => {
    if (value) {
        const match = value.match(/\D/g)
        if (match) {
            // if value has suffix
            const unit = match.join('')
            const val = value.match(/\d+/g).map(Number)[0]
            const BINARY_PREFIXES = ['Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei']
            const SI_PREFIXES = ['m', 'k', 'M', 'G', 'T', 'P', 'E']
            const num =
                unit && unit.length === 2
                    ? factorize(BINARY_PREFIXES, unit, 'binary')
                    : factorize(SI_PREFIXES, unit, 'si')
            return val * num
        }
        return parseFloat(value)
    }
    return ''
}

function factorize(prefixes, unit, type) {
    let factorizeNb = 1
    for (let index = 0; index < prefixes.length; index++) {
        if (unit === prefixes[index]) {
            const base = type === 'binary' ? 1024 : 1000
            const unitM = unit === 'm' ? -1 : index
            const exponent = type === 'binary' ? index + 1 : unitM
            factorizeNb = Math.pow(base, exponent)
        }
    }
    return factorizeNb
}

export const getPercentage = (value, total) => {
    return Math.floor((100 * (total - value)) / total) || 0
}

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

export const createResourceSearchLink = (node, t) => {
    let result = {
        type: 'link',
        value: null,
    }

    const nodeType = _.get(node, 'type', '')
    //returns search link for resource
    if (nodeType === 'cluster') {
        if (isSearchAvailable()) {
            let clusterNames = _.get(node, 'specs.clustersNames') || []
            if (clusterNames.length === 0) {
                clusterNames = _.get(node, 'specs.appClusters') || []
            }
            if (clusterNames.length === 0) {
                const nodeClusters = _.get(node, 'specs.clusters')
                nodeClusters.forEach((cls) => {
                    clusterNames.push(cls.name)
                })
            }
            const clusterNameStr = clusterNames ? clusterNames.join() : undefined
            result = {
                type: 'link',
                value: {
                    label: t('Launch resource in Search'),
                    id: node.id,
                    data: {
                        action: 'show_search',
                        name: (node.name && R.replace(/ /g, '')(node.name)) || clusterNameStr || 'undefined', // take out spaces
                        kind: 'cluster',
                    },
                    indent: true,
                },
            }
        }
    } else if (node && R.pathOr('', ['specs', 'pulse'])(node) !== 'orange') {
        const kindModel = _.get(node, `specs.${nodeType}Model`, {})
        let computedNameList = []
        let computedNSList = []
        _.flatten(Object.values(kindModel)).forEach((item) => {
            computedNameList = R.union(computedNameList, [item.name])
            computedNSList = R.union(computedNSList, [item.namespace])
        })
        let computedName = ''
        computedNameList.forEach((item) => {
            computedName = computedName.length === 0 ? item : `${computedName},${item}`
        })
        let computedNS = ''
        computedNSList.forEach((item) => {
            computedNS = computedNS.length === 0 ? item : `${computedNS},${item}`
        })

        //get the list of all names from the related list; for helm charts, they are different than the deployable name
        //pulse orange means not deployed on any cluster so don't show link to search page
        if (isSearchAvailable()) {
            result = {
                type: 'link',
                value: {
                    label: t('Launch resource in Search'),
                    id: node.id,
                    data: {
                        action: 'show_search',
                        name: computedName && computedName.length > 0 ? computedName : node.name,
                        namespace:
                            computedNS && computedNS.length > 0
                                ? computedNS
                                : R.pathOr('', ['specs', 'raw', 'metadata', 'namespace'])(node),
                        kind: nodeType === 'placements' ? 'placementrule' : _.get(node, 'type', ''),
                    },
                    indent: true,
                },
            }
        }
    }
    return result
}

export const createResourceURL = (node, t, isLogURL = false) => {
    const cluster = _.get(node, 'cluster', '')
    const type = _.get(node, 'type', '')
    const apiVersion = _.get(node, 'specs.raw.apiVersion', '')
    const namespace = _.get(node, 'namespace', '')
    const name = _.get(node, 'name', '')

    if (!isLogURL) {
        return (
            '/multicloud/home/search/resources?' +
            encodeURIComponent(
                `cluster=${cluster}&kind=${type}&apiversion=${apiVersion}&namespace=${namespace}&name=${name}`
            )
        )
    }
    return (
        '/multicloud/home/search/resources/logs?' +
        encodeURIComponent(
            `cluster=${cluster}&kind=${type}&apiversion=${apiVersion}&namespace=${namespace}&name=${name}`
        )
    )
}

export const removeReleaseGeneratedSuffix = (name) => {
    return name.replace(/-[0-9a-zA-Z]{4,5}$/, '')
}

//for charts remove release name
export const getNameWithoutChartRelease = (relatedKind, name, hasHelmReleases) => {
    const kind = _.get(relatedKind, 'kind', '')
    if (kind === 'subscription' || !hasHelmReleases.value) {
        return name //ignore subscription objects or objects where the name is not created from the _hostingDeployable
    }

    //for resources deployed from charts, remove release name
    //note that the name parameter is the _hostingDeployable
    //and is in this format ch-git-helm/git-helm-chart1-1.1.1
    const savedName = name
    const labelAttr = _.get(relatedKind, 'label', '')
    const labels = _.split(labelAttr, ';')
    const labelMap = {}
    let foundReleaseLabel = false
    labels.forEach((label) => {
        const splitLabelContent = _.split(label, '=')

        if (splitLabelContent.length === 2) {
            const splitLabelTrimmed = _.trim(splitLabelContent[0])
            labelMap[splitLabelTrimmed] = splitLabelContent[1]
            if (splitLabelTrimmed === 'release') {
                //get label for release name
                foundReleaseLabel = true
                const releaseName = _.trim(splitLabelContent[1])
                if (name === releaseName) {
                    return name //name identical with release name, no extra processing needed, exit
                }
                name = _.replace(name, `${releaseName}-`, '')
                name = _.replace(name, releaseName, '')

                if (name.length === 0) {
                    // release name is used as name, need to strip generated suffix
                    name = removeReleaseGeneratedSuffix(savedName)
                }
            }
        }
    })

    if (!foundReleaseLabel && kind === 'helmrelease') {
        //try to guess the release name from the name, which is the _hostingDeployable
        //and is in this format ch-git-helm/git-helm-chart1-1.1.1 - we want chart1-1.1.1
        const resourceName = _.get(relatedKind, 'name', '')
        let resourceNameNoHash = resourceName.replace(/-[0-9a-fA-F]{8,10}-[0-9a-zA-Z]{4,5}$/, '')
        if (resourceName === resourceNameNoHash) {
            const idx = resourceNameNoHash.lastIndexOf('-')
            if (idx !== -1) {
                resourceNameNoHash = resourceNameNoHash.substr(0, idx)
            }
        }

        const values = _.split(name, '-')
        if (values.length > 2) {
            //take the last value which is the version
            name = `${resourceNameNoHash}-${values[values.length - 1]}`
        }
    }

    if (!foundReleaseLabel && kind !== 'helmrelease' && labelMap['app.kubernetes.io/instance']) {
        //if name = alias-resourceName, remove alias- from name
        name =
            name.indexOf(`${labelMap['app.kubernetes.io/instance']}-`) === 0
                ? name.substring(labelMap['app.kubernetes.io/instance'].length + 1)
                : name
    }

    return name
}

export const computeResourceName = (relatedKind, deployableName, name, isClusterGrouped) => {
    if (relatedKind.kind === 'pod' && !_.get(relatedKind, '_hostingDeployable') && !deployableName) {
        //if pod has hosting deployable it is owned by a pod object; don't remove suffix
        const pname = name
        // get pod name w/o uid suffix
        name = pname.replace(/-[0-9a-fA-F]{8,10}-[0-9a-zA-Z]{4,5}$/, '')
        if (name === pname) {
            const idx = name.lastIndexOf('-')
            if (idx !== -1) {
                name = name.substr(0, idx)
            }
        }
    }

    if (relatedKind.kind !== 'subscription') {
        //expect for subscriptions, use cluster name to group resources
        name = isClusterGrouped.value
            ? `${relatedKind.kind}-${name}`
            : `${relatedKind.kind}-${name}-${relatedKind.cluster}`
    }

    return name
}

//look for pod template hash and remove it from the name if there
export const getNameWithoutPodHash = (relatedKind) => {
    let nameNoHash = relatedKind.name
    let podHash = null
    let deployableName = null

    if (_.get(relatedKind, 'kind', '') === 'helmrelease') {
        //for helm releases use hosting deployable to match parent
        nameNoHash = _.get(relatedKind, '_hostingDeployable', nameNoHash)
    }

    const labelsList = relatedKind.label ? R.split(';')(relatedKind.label) : []
    labelsList.forEach((resLabel) => {
        const values = R.split('=')(resLabel)
        if (values.length === 2) {
            const labelKey = values[0].trim()
            if (
                labelKey === 'pod-template-hash' ||
                labelKey === 'controller-revision-hash' ||
                labelKey === 'controller.kubernetes.io/hash'
            ) {
                podHash = values[1].trim()
                if (podHash.indexOf('-') > -1) {
                    // for hashes that include prefix, always take last section
                    const hashValues = R.split('-')(podHash)
                    podHash = hashValues[hashValues.length - 1]
                }
                nameNoHash = R.replace(`-${podHash}`, '')(nameNoHash)
            }
            if (labelKey === 'openshift.io/deployment-config.name' || R.includes('deploymentconfig')(resLabel)) {
                //look for deployment config info in the label; the name of the resource could be different than the one defined by the deployable
                //openshift.io/deployment-config.name
                deployableName = values[1].trim()
                nameNoHash = deployableName
            }
        }
    })
    //return podHash as well, it will be used to map pods with parent resource
    return { nameNoHash, deployableName, podHash }
}

//add deployed object to the matching resource in the map
const addResourceToModel = (resourceMapObject, kind, relatedKind, nameWithoutChartRelease) => {
    const kindModel = _.get(resourceMapObject, `specs.${kind}Model`, {})
    const kindList = kindModel[`${nameWithoutChartRelease}-${relatedKind.cluster}`] || []
    kindList.push(relatedKind)
    kindModel[`${nameWithoutChartRelease}-${relatedKind.cluster}`] = kindList
    _.set(resourceMapObject, `specs.${kind}Model`, kindModel)
}

// reduce complexity for code smell
export const checkNotOrObjects = (obj1, obj2) => {
    return !obj1 || !obj2
}

// reduce complexity for code smell
export const checkAndObjects = (obj1, obj2) => {
    return obj1 && obj2
}

//creates a map with all related kinds for this app, not only pod types
export const addDiagramDetails = (resourceStatuses, resourceMap, isClusterGrouped, hasHelmReleases, topology) => {
    if (checkNotOrObjects(resourceStatuses, resourceMap)) {
        return resourceMap
    }
    const { related } = mapSingleApplication(_.cloneDeep(resourceStatuses.data.searchResult[0]))
    // store cluster objects and cluster names as returned by search; these are clusters related to the app
    const clustersObjects = getResourcesClustersForApp(
        R.find(R.propEq('kind', 'cluster'))(related) || {},
        topology.nodes
    )
    const clusterNamesList = R.sortBy(R.identity)(R.pluck('name')(clustersObjects))
    if (topology.nodes) {
        const appNode =
            _.find(
                topology.nodes,
                (node) => _.get(node, 'id', '').startsWith('application--') && _.get(node, 'type', '') === 'application'
            ) || {}
        const hasMultipleSubs = _.get(appNode, 'specs.allSubscriptions', []).length > 1

        topology.nodes.forEach((node) => {
            const nodeId = _.get(node, 'id', '')
            if (nodeId.startsWith('member--clusters--')) {
                // only do this for Argo clusters
                //cluster node, set search found clusters objects here
                updateAppClustersMatchingSearch(node, clustersObjects)
            }
            const nodeClusters = nodeId.startsWith('member--subscription')
                ? clusterNamesList
                : getClusterName(nodeId).split(',')
            _.set(
                node,
                'specs.clustersNames',
                hasMultipleSubs
                    ? nodeClusters
                    : nodeId.includes('clusters----') || nodeId === 'member--clusters--'
                    ? clusterNamesList
                    : _.sortBy(_.uniq(_.union(nodeClusters, clusterNamesList)))
            )
            _.set(
                node,
                'specs.searchClusters',
                hasMultipleSubs && !nodeId.startsWith('application--')
                    ? _.filter(clustersObjects, (cls) => _.includes(nodeClusters, _.get(cls, 'name', '')))
                    : clustersObjects // get all search clusters when one cluster node or this is the main app node
            )
        })
        // set clusters status on the app node
        // we have all clusters information here
        const appNodeSearchClusters = _.get(appNode, 'specs.searchClusters', [])
        // search returns clusters information, use it here
        const isLocal = _.find(appNodeSearchClusters, (cls) => _.get(cls, 'name', '') === 'local-cluster')
            ? true
            : false
        _.set(appNode, 'specs.allClusters', {
            isLocal,
            remoteCount: isLocal ? appNodeSearchClusters.length - 1 : appNodeSearchClusters.length,
        })
    }
    const podIndex = _.findIndex(related, ['kind', 'pod'])
    //move pods last in the related to be processed after all resources producing pods have been processed
    //we want to add the pods to the map by using the pod hash
    let orderedList =
        podIndex === -1
            ? related
            : _.concat(_.slice(related, 0, podIndex), _.slice(related, podIndex + 1), related[podIndex])
    orderedList = _.pullAllBy(orderedList, [{ kind: 'deployable' }, { kind: 'cluster' }], 'kind')
    orderedList.forEach((kindArray) => {
        const relatedKindList = R.pathOr([], ['items'])(kindArray)
        relatedKindList.forEach((relatedKind) => {
            const { kind, cluster } = relatedKind

            //look for pod template hash and remove it from the name if there
            const { nameNoHash, deployableName, podHash } = getNameWithoutPodHash(relatedKind)

            //for routes generated by Ingress, remove route name hash
            const nameNoHashIngressPod = getRouteNameWithoutIngressHash(relatedKind, nameNoHash)

            const nameWithoutChartRelease = getNameWithoutChartRelease(
                relatedKind,
                nameNoHashIngressPod,
                hasHelmReleases
            )

            let name = computeResourceName(relatedKind, deployableName, nameWithoutChartRelease, isClusterGrouped)

            if (
                kind === 'subscription' &&
                cluster === 'local-cluster' &&
                _.get(relatedKind, 'localPlacement', '') === 'true' &&
                _.endsWith(name, '-local')
            ) {
                //match local hub subscription after removing -local suffix
                name = _.trimEnd(name, '-local')
            }

            const existingResourceMapKey = getExistingResourceMapKey(resourceMap, name, relatedKind)
            if (checkAndObjects(podHash, existingResourceMapKey)) {
                //update resource map key with podHash if the resource has a pod hash ( deployment, replicaset, deploymentconig, etc )
                //this is going to be used to link pods with this parent resource
                resourceMap[`pod-${podHash}-${cluster}`] = resourceMap[existingResourceMapKey]
            } else if (checkAndObjects(deployableName, existingResourceMapKey)) {
                resourceMap[`pod-deploymentconfig-${deployableName}`] = resourceMap[existingResourceMapKey]
            }

            let ownerUID
            let resourceMapForObject =
                resourceMap[name] || (existingResourceMapKey && resourceMap[existingResourceMapKey])
            if (!resourceMapForObject && kind === 'pod') {
                if (podHash) {
                    //just found a pod object, try to map it to the parent resource using the podHash
                    resourceMapForObject = resourceMap[`pod-${podHash}-${cluster}`]
                } else if (deployableName) {
                    resourceMapForObject = resourceMap[`pod-deploymentconfig-${deployableName}`]
                } else {
                    ownerUID = relatedKind._ownerUID
                }
            }

            if (ownerUID) {
                findParentForOwnerID(
                    resourceMap,
                    ownerUID,
                    kind,
                    relatedKind,
                    nameWithoutChartRelease,
                    addResourceToModel
                )
            } else if (resourceMapForObject) {
                addResourceToModel(resourceMapForObject, kind, relatedKind, nameWithoutChartRelease)
            } else {
                //get resource by looking at the cluster grouping
                Object.keys(resourceMap).forEach((key) => {
                    resourceMapForObject = resourceMap[key]
                    if (
                        _.startsWith(key, name) &&
                        (_.includes(
                            _.get(
                                resourceMapForObject,
                                'clusters.specs.clustersNames',
                                ['local-cluster'] // if no cluster found for this resource, this could be a local deployment
                            ),
                            _.get(relatedKind, 'cluster')
                        ) ||
                            namespaceMatchTargetServer(relatedKind, resourceMapForObject))
                    ) {
                        addResourceToModel(resourceMapForObject, kind, relatedKind, nameWithoutChartRelease)
                    }
                })
            }
        })
    })

    // need to preprocess and sync up podStatusMap for controllerrevision to parent
    syncControllerRevisionPodStatusMap(resourceMap)
    return resourceMap
}

export const mapSingleApplication = (application) => {
    const items = (application ? _.get(application, 'items', []) : []) || []

    const result =
        items.length > 0
            ? items[0]
            : {
                  name: '',
                  namespace: '',
                  dashboard: '',
                  selfLink: '',
                  _uid: '',
                  created: '',
                  apigroup: '',
                  cluster: '',
                  kind: '',
                  label: '',
                  _hubClusterResource: '',
                  _rbac: '',
                  related: [],
              }

    result.related = application ? application.related || [] : []

    items.forEach((item) => {
        //if this is an argo app, the related kinds query should be built from the items section
        //for argo we ask for namespace:targetNamespace label:appLabel kind:<comma separated string of resource kind>
        //this code moves all these items under the related section
        const kind = _.get(item, 'kind')
        const cluster = _.get(item, 'cluster')

        if (kind === 'application') {
            //this is a legit app object , just leave it
            return
        }

        if (kind === 'subscription' && cluster !== 'local-cluster') {
            // this is a legit subscription object that needs no alternation
            return
        }

        //find under the related array an object matching this kind
        const queryKind = _.filter(result.related, (filtertype) => _.get(filtertype, 'kind', '') === kind)
        //if that kind section was found add this object to it, otherwise create a new kind object for it
        const kindSection = queryKind && queryKind.length > 0 ? queryKind : { kind, items: [item] }
        if (!queryKind || queryKind.length === 0) {
            //link this kind section directly to the results array
            result.related.push(kindSection)
        } else {
            kindSection[0].items.push(item)
        }
    })
    return result
}

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
                addOCPRouteLocation(node, clusterName, targetNS, details)

                //for service
                addNodeServiceLocation(node, clusterName, targetNS, details)

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
        const resourcesForCluster = resourceMap[`${resourceName}-${clusterName}`] || []
        //get cluster target namespaces
        const targetNSList = targetNamespaces[clusterName]
            ? _.union(targetNamespaces[clusterName], _.uniq(_.map(resourcesForCluster, 'namespace')))
            : resourcesForCluster.length > 0
            ? _.uniq(_.map(resourcesForCluster, 'namespace'))
            : [resourceNamespace]
        targetNSList.forEach((targetNS) => {
            const res = podStatusModel[`${clusterName}-${targetNS}`]
            let pulse = 'orange'
            if (res) {
                pulse = getPulseForData('', res.ready, res.desired, res.unavailable)
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

const setClusterWindowStatus = (windowStatusArray, subscription, details) => {
    windowStatusArray.forEach((wstatus) => {
        if (_.startsWith(_.trimStart(wstatus), `${subscription.cluster}:`)) {
            details.push({
                labelKey: t('Current window status is'),
                value: _.split(wstatus, ':')[1],
            })
        }
    })
}

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

                    setClusterWindowStatus(windowStatusArray, subscription, details)

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

export const addNodeOCPRouteLocationForCluster = (node, typeObject, details) => {
    const rules = R.pathOr([], ['specs', 'raw', 'spec', 'rules'])(node)
    if (rules.length > 1) {
        //we don't know how to process more then one hosts if the Ingress generates more than one route
        return details
    }

    const clustersList = _.get(node, 'specs.searchClusters', [])
    let hostName = R.pathOr(undefined, ['specs', 'raw', 'spec', 'host'])(node)
    if (typeObject && _.get(node, 'name', '') !== _.get(typeObject, 'name', '')) {
        //if route name on remote cluster doesn't match the main route name ( generated from Ingress ), show the name here
        //this is to cover the scenario when the Ingress object defines multiple routes,
        //so it generates multiple Route objects on the same cluster
        addPropertyToList(details, getNodePropery(typeObject, ['name'], 'spec.route.cluster.name'))
    }

    if (!hostName && rules.length === 1) {
        //check rules path, for route generated by Ingress
        hostName = _.get(rules[0], 'host')
    }

    if (clustersList.length === 0 && !hostName) {
        // this is a local app deploy, check hostname in ingress
        const ingress = R.pathOr([], ['specs', 'raw', 'spec', 'ingress'])(node)
        if (ingress.length > 0) {
            hostName = ingress[0].host
        }
    }

    if (hostName && typeObject) {
        return details // this info is in the main Location status since we have a spec host
    }

    let hostLink = 'NA'
    const linkId = typeObject ? _.get(typeObject, 'id', '0') : _.get(node, 'uid', '0')

    if (!typeObject) {
        //this is called from the main details
        if (!hostName) {
            return details //return since there is no global host
        }

        details.push({
            type: 'spacer',
        })

        details.push({
            type: 'label',
            labelKey: t('Location'),
        })
    }

    if (!hostName && typeObject) {
        details.push({
            type: 'link',
            value: {
                labelKey: t('Launch Route URL'),
                id: `${_.get(typeObject, '_uid', '0')}`,
                data: {
                    action: 'open_route_url',
                    routeObject: typeObject,
                },
            },
            indent: true,
        })
        return details
    }
    const transport = R.pathOr(undefined, ['specs', 'raw', 'spec', 'tls'])(node) ? 'https' : 'http'
    hostLink = `${transport}://${hostName}/`

    //argo app doesn't have spec info
    details.push({
        type: 'link',
        value: {
            label: hostLink,
            id: `${linkId}-location`,
            data: {
                action: 'open_link',
                targetLink: hostLink,
            },
        },
        indent: true,
    })

    !typeObject &&
        details.push({
            type: 'spacer',
        })

    return details
}

//route
export const addOCPRouteLocation = (node, clusterName, targetNS, details) => {
    if (R.pathOr('', ['specs', 'raw', 'kind'])(node) === 'Route') {
        return addNodeInfoPerCluster(node, clusterName, targetNS, details, addNodeOCPRouteLocationForCluster)
    }

    return details //process only routes
}

//ingress
export const addIngressNodeInfo = (node, details) => {
    if (R.pathOr('', ['specs', 'raw', 'kind'])(node) === 'Ingress') {
        details.push({
            type: 'label',
            labelKey: t('Location'),
        })

        //ingress - single service
        addPropertyToList(
            details,
            getNodePropery(node, ['specs', 'raw', 'spec', 'backend', 'serviceName'], 'raw.spec.ingress.service')
        )
        addPropertyToList(
            details,
            getNodePropery(node, ['specs', 'raw', 'spec', 'backend', 'servicePort'], 'raw.spec.ingress.service.port')
        )

        const rules = R.pathOr([], ['specs', 'raw', 'spec', 'rules'])(node)
        rules.forEach((ruleInfo) => {
            const hostName = R.pathOr('NA', ['host'])(ruleInfo)
            details.push({
                labelKey: t('Host'),
                value: hostName,
            })
            const paths = R.pathOr([], ['http', 'paths'])(ruleInfo)
            paths.forEach((pathInfo) => {
                details.push({
                    labelKey: t('Service Name'),
                    value: R.pathOr('NA', ['backend', 'serviceName'])(pathInfo),
                })
                details.push({
                    labelKey: t('Service Port'),
                    value: R.pathOr('NA', ['backend', 'servicePort'])(pathInfo),
                })
            })
            details.push({
                type: 'spacer',
            })
        })
    }

    return details //process only routes
}

//for service
export const addNodeServiceLocation = (node, clusterName, targetNS, details) => {
    if (R.pathOr('', ['specs', 'raw', 'kind'])(node) === 'Service') {
        return addNodeInfoPerCluster(node, clusterName, targetNS, details, addNodeServiceLocationForCluster) //process only services
    }
    return details
}

//generic function to write location info
export const addNodeInfoPerCluster = (node, clusterName, targetNS, details, getDetailsFunction) => {
    const resourceName = _.get(node, 'namespace', '')
    const resourceMap = _.get(node, `specs.${node.type}Model`, {})

    const locationDetails = []
    const resourcesForCluster = resourceMap[`${resourceName}-${clusterName}`] || []
    const typeObject = _.find(resourcesForCluster, (obj) => _.get(obj, 'namespace', '') === targetNS)
    if (typeObject) {
        getDetailsFunction(node, typeObject, locationDetails)
    }

    locationDetails.forEach((locationDetail) => {
        details.push(locationDetail)
    })

    return details
}

export const addNodeServiceLocationForCluster = (node, typeObject, details) => {
    if (node && typeObject && typeObject.clusterIP && typeObject.port) {
        let port = R.split(':', typeObject.port)[0] // take care of 80:etc format
        port = R.split('/', port)[0] //now remove any 80/TCP

        const location = `${typeObject.clusterIP}:${port}`
        details.push({
            labelKey: t('Location'),
            value: location,
        })
    }

    return details
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const processResourceActionLink = (resource, toggleLoading, handleErrorMsg) => {
    let targetLink = ''
    const linkPath = R.pathOr('', ['action'])(resource)
    const { name, namespace, editLink, kind } = resource //cluster, , routeObject
    const nsData = namespace ? ` namespace:${namespace}` : ''
    switch (linkPath) {
        case showResourceYaml:
            targetLink = editLink
            break
        case 'show_search':
            targetLink = `/search?filters={"textsearch":"kind:${kind}${nsData} name:${name}"}`
            break
        case 'open_argo_editor': {
            //czcz openArgoCDEditor(cluster, namespace, name, toggleLoading, handleErrorMsg) // the editor opens here
            break
        }
        case 'open_route_url': {
            // czcz openRouteURL(routeObject, toggleLoading, handleErrorMsg) // the route url opens here
            break
        }
        default:
            targetLink = R.pathOr('', ['targetLink'])(resource)
    }
    if (targetLink !== '') {
        window.open(targetLink, '_blank')
    }
    return targetLink
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
