/* Copyright Contributors to the Open Cluster Management project */

import { get, startsWith, includes, concat, uniqBy, filter, remove, split, toLower, parseInt, indexOf } from 'lodash'

import {
    isPrePostHookDeployable,
    createReplicaChild,
    createGenericPackageObject,
    removeHelmReleaseName,
    addSubscriptionDeployable,
    addClusters,
} from '../utils'

const templateKind = 'spec.template.kind'
const localClusterName = 'local-cluster'
const metadataName = 'metadata.name'
const preHookType = 'pre-hook'

export const getSubscriptionTopology = (application, managedClusters, cluster) => {
    const links = []
    const nodes = []
    let name
    let namespace
    ;({ name, namespace } = application)

    // create application node
    const allAppClusters = application.allClusters ? application.allClusters : []
    const appId = `application--${name}`
    nodes.push({
        name,
        namespace,
        type: 'application',
        id: appId,
        uid: appId,
        specs: {
            isDesign: true,
            raw: application.app,
            activeChannel: application.activeChannel,
            allSubscriptions: application.allSubscriptions ? application.allSubscriptions : [],
            allChannels: application.allChannels ? application.allChannels : [],
            allClusters: {
                isLocal: allAppClusters.indexOf(localClusterName) !== -1,
                remoteCount:
                    allAppClusters.indexOf('local-cluster') !== -1 ? allAppClusters.length - 1 : allAppClusters.length,
            },
            channels: application.channels,
        },
    })

    // get clusters names
    let clusterNames = managedClusters.map((cluster) => {
        return cluster?.metadata?.name
    })
    // if application has subscriptions
    let memberId
    let parentId
    let clusterId
    if (application.subscriptions) {
        const createdClusterElements = new Set()
        application.subscriptions.forEach((subscription) => {
            const subscriptionChannel = get(subscription, 'spec.channel')
            const subscriptionName = get(subscription, metadataName, '')
            const topoAnnotation = get(subscription, 'metadata.annotations', {})['apps.open-cluster-management.io/topo']
            const isObjectApp = topoAnnotation ? startsWith(topoAnnotation, 'object//') : false
            // get cluster placement if any
            const ruleDecisionMap = {}
            if (subscription.rules) {
                subscription.rules.forEach((rule) => {
                    const ruleDecisions = get(rule, 'status.decisions')
                    if (ruleDecisions) {
                        ruleDecisions.forEach(({ clusterName, clusterNamespace }) => {
                            ruleDecisionMap[clusterName] = clusterNamespace
                        })
                    }
                })
            }
            if (
                get(subscription, 'spec.placement.local', '') === true &&
                subscription.rules &&
                includes(clusterNames, localClusterName) === false
            ) {
                const localCluster = {
                    metadata: {
                        name: localClusterName,
                        namespace: localClusterName,
                    },
                }
                clusterNames = concat(clusterNames, localCluster)
                ruleDecisionMap[localClusterName] = localClusterName
            }

            const ruleClusterNames = Object.keys(ruleDecisionMap)
            const isRulePlaced = ruleClusterNames.length > 0

            // get subscription statuses
            const subscriptionStatusMap = {}
            const subscribeDecisions = get(subscription, 'status.statuses')
            if (subscribeDecisions) {
                Object.entries(subscribeDecisions).forEach(([clusterName, value]) => {
                    subscriptionStatusMap[clusterName] = get(value, 'packages')
                })
            }

            // add subscription
            parentId = addSubscription(appId, subscription, isRulePlaced, links, nodes)

            // add rules if any
            let hasPlacementRules = false
            if (subscription.rules) {
                addSubscriptionRules(parentId, subscription, links, nodes)
                delete subscription.rules
                hasPlacementRules = true
            }

            // add cluster(s)
            // if no cluster found by the placement, use a default empty cluster name so that the deployables are parsed and shown
            let clusterShapes = [['']]
            if (ruleClusterNames.length > 1) {
                clusterShapes = [ruleClusterNames]
            } else if (ruleClusterNames.length === 1) {
                clusterShapes = ruleClusterNames.map((cn) => [cn])
            }

            clusterShapes.forEach((names) => {
                // add cluster element
                clusterId = addClusters(
                    parentId,
                    createdClusterElements,
                    subscription,
                    names,
                    clusterNames,
                    links,
                    nodes
                )

                if (subscription.deployables && !isObjectApp) {
                    // add deployables if any

                    processDeployables(
                        subscription.deployables,
                        clusterId,
                        links,
                        nodes,
                        subscriptionStatusMap,
                        names,
                        namespace,
                        subscription
                    )
                }

                if (topoAnnotation) {
                    addSubscriptionCharts(
                        clusterId,
                        subscriptionStatusMap,
                        nodes,
                        links,
                        names,
                        namespace,
                        subscriptionChannel,
                        subscriptionName,
                        topoAnnotation,
                        subscription
                    )
                }
            })

            // no deployables was placed on a cluster but there were subscription decisions
            if (!subscription.deployables && !hasPlacementRules && subscribeDecisions) {
                addSubscriptionCharts(
                    parentId,
                    subscriptionStatusMap,
                    nodes,
                    links,
                    null,
                    namespace,
                    subscriptionChannel,
                    subscriptionName,
                    topoAnnotation,
                    subscription
                )
            }
            delete subscription.deployables
        })

        // if application has deployables
        // (unsubscribed--possibly a template)
    } else if (application.deployables) {
        application.deployables.forEach((deployable) => {
            ;({ name, namespace } = get(deployable, 'metadata'))
            memberId = `member--deployable--${name}`
            nodes.push({
                name,
                namespace,
                type: 'deployable',
                id: memberId,
                uid: memberId,
                specs: { isDesign: true, raw: deployable },
            })
            links.push({
                from: { uid: parentId },
                to: { uid: memberId },
                type: '',
                specs: { isDesign: true },
            })
        })
    }

    return { nodes: uniqBy(nodes, 'uid'), links }
}

const addSubscription = (appId, subscription, isPlaced, links, nodes) => {
    const {
        metadata: { namespace, name },
    } = subscription
    const subscriptionId = `member--subscription--${namespace}--${name}`
    const rule = get(subscription, 'rules[0]')
    nodes.push({
        name,
        namespace,
        type: 'subscription',
        id: subscriptionId,
        uid: subscriptionId,
        specs: {
            isDesign: true,
            hasRules: !!rule,
            isPlaced,
            raw: subscription,
        },
    })

    links.push({
        from: { uid: appId },
        to: { uid: subscriptionId },
        type: '',
        specs: { isDesign: true },
    })
    return subscriptionId
}

const addSubscriptionRules = (parentId, subscription, links, nodes) => {
    subscription.rules.forEach((rule, idx) => {
        const {
            metadata: { name, namespace },
        } = rule
        const ruleId = `member--rules--${namespace}--${name}--${idx}`
        nodes.push({
            name,
            namespace,
            type: 'placements',
            id: ruleId,
            uid: ruleId,
            specs: { isDesign: true, raw: rule },
        })
        links.push({
            from: { uid: parentId },
            to: { uid: ruleId },
            type: '',
            specs: { isDesign: true },
        })
    })
}

// Route, Ingress, StatefulSet
const processServiceOwner = (
    clusterId,
    routes,
    links,
    nodes,
    subscriptionStatusMap,
    names,
    namespace,
    subscription
) => {
    const servicesMap = {}
    routes.forEach((deployable) => {
        const topoObject = addSubscriptionDeployable(
            clusterId,
            deployable,
            links,
            nodes,
            subscriptionStatusMap,
            names,
            namespace,
            subscription
        )

        // get service info and map it to the object id
        const kind = get(deployable, templateKind, '')

        if (kind === 'Route') {
            const service = get(deployable, 'spec.template.spec.to.name')
            if (service) {
                servicesMap[service] = topoObject.id
            }
        } else if (kind === 'Ingress') {
            // ingress
            const rules = get(deployable, 'spec.template.spec.rules', [])

            rules.forEach((rule) => {
                const rulePaths = get(rule, 'http.paths', [])
                rulePaths.forEach((path) => {
                    const service = get(path, 'backend.serviceName')
                    if (service) {
                        servicesMap[service] = topoObject.id
                    }
                })
            })
        } else if (kind === 'StatefulSet') {
            const service = get(deployable, 'spec.template.spec.serviceName')
            if (service) {
                servicesMap[service] = topoObject.id
            }
        }
    })
    // return a map of services that must be linked to these router
    return servicesMap
}

const processServices = (
    clusterId,
    services,
    links,
    nodes,
    subscriptionStatusMap,
    names,
    namespace,
    servicesMap,
    subscription
) => {
    services.forEach((deployable) => {
        const serviceName = get(deployable, 'spec.template.metadata.name', '')
        let parentId = servicesMap[serviceName]
        if (!parentId) {
            parentId = clusterId
        }

        addSubscriptionDeployable(
            parentId,
            deployable,
            links,
            nodes,
            subscriptionStatusMap,
            names,
            namespace,
            subscription
        )
    })
}

const processDeployables = (
    deployables,
    clusterId,
    links,
    nodes,
    subscriptionStatusMap,
    names,
    namespace,
    subscription
) => {
    const routes = filter(deployables, (obj) => {
        const kind = get(obj, templateKind, '')
        return includes(['Route', 'Ingress', 'StatefulSet'], kind)
    })

    // process route and ingress first
    const serviceMap = processServiceOwner(
        clusterId,
        routes,
        links,
        nodes,
        subscriptionStatusMap,
        names,
        namespace,
        subscription
    )

    const services = filter(deployables, (obj) => {
        const kind = get(obj, templateKind, '')
        return includes(['Service'], kind)
    })

    // then service
    processServices(
        clusterId,
        services,
        links,
        nodes,
        subscriptionStatusMap,
        names,
        namespace,
        serviceMap,
        subscription
    )

    // then the rest
    const other = remove(deployables, (obj) => {
        const kind = get(obj, templateKind, '')
        return !includes(['Route', 'Ingress', 'Service', 'StatefulSet', 'HelmRelease'], kind)
    })

    other.forEach((deployable) => {
        addSubscriptionDeployable(
            clusterId,
            deployable,
            links,
            nodes,
            subscriptionStatusMap,
            names,
            namespace,
            subscription
        )
    })
}

const getSubscriptionPackageInfo = (topoAnnotation, subscriptionName, appNamespace, channelInfo, subscription) => {
    const deployablesList = []

    const deployables = split(topoAnnotation, ',')
    const packageName = get(get(subscription, 'spec.packageOverrides', [{}])[0], 'packageName')
    const aliasName = get(get(subscription, 'spec.packageOverrides', [{}])[0], 'packageAlias')

    deployables.forEach((deployableInfo) => {
        const deployableData = split(deployableInfo, '/')

        if (deployableData.length === 6) {
            let dName = deployableData[4]

            let namespace = deployableData[3].length === 0 ? appNamespace : deployableData[3]
            let deployableName = deployableData[4]
            const deployableTypeLower = toLower(deployableData[2])

            const isHook = isPrePostHookDeployable(subscription, dName, namespace)
            // process only helm charts, object storage resources and hooks
            if (deployableData[0] === 'helmchart' || deployableData[0] === 'object' || isHook) {
                if (!isHook) {
                    dName =
                        deployableData[0] === 'object'
                            ? deployableData[4]
                            : removeHelmReleaseName(deployableData[4], deployableData[1], packageName, aliasName)
                    namespace = deployableData[3].length === 0 ? appNamespace : deployableData[3]
                    deployableName = `${subscriptionName}-${dName}-${dName}-${deployableTypeLower}`
                }
                const version = 'apps.open-cluster-management.io/v1'
                const hasReplica = deployableData[5] !== '0'
                const deployable = {
                    apiVersion: version,
                    kind: 'Deployable',
                    metadata: {
                        namespace,
                        name: deployableName,
                        selfLink: `/apis/${version}/namespaces/${deployableData[3]}/deployables/${dName}-${deployableTypeLower}`,
                    },
                    spec: {
                        template: {
                            apiVersion: 'apps/v1',
                            kind: deployableData[2],
                            metadata: {
                                namespace,
                                name: dName,
                            },
                            spec: {},
                        },
                    },
                }

                if (hasReplica) {
                    deployable.spec.template.spec.replicas = parseInt(deployableData[5])
                }

                if (deployableTypeLower === 'helmrelease') {
                    deployable.spec.template.spec.channel = channelInfo
                }
                deployablesList.push(deployable)
            }
        }
    })
    return deployablesList
}

const createDeployableObject = (subscription, name, namespace, type, specData, parentId, nodes, links, linkName) => {
    let linkType = isPrePostHookDeployable(subscription, name, namespace)
    if (linkType === null) {
        linkType = linkName
    }
    const objId = `member--deployable--${parentId}--${type.toLowerCase()}--${name}`
    const newObject = {
        id: objId,
        uid: objId,
        name,
        namespace,
        type: type.toLowerCase(),
        specs: {
            isDesign: false,
            raw: {
                kind: type,
                metadata: {
                    name,
                    namespace,
                },
                spec: specData,
            },
        },
    }
    nodes.push(newObject)
    if (linkType === preHookType) {
        links.push({
            from: { uid: objId },
            to: { uid: parentId },
            type: linkType,
        })
    } else {
        links.push({
            from: { uid: parentId },
            to: { uid: objId },
            type: linkType,
        })
    }
    return newObject
}

const addSubscriptionCharts = (
    parentId,
    subscriptionStatusMap,
    nodes,
    links,
    names,
    appNamespace,
    channelInfo,
    subscriptionName,
    topoAnnotation,
    subscription
) => {
    if (topoAnnotation) {
        const deployablesFromTopo = getSubscriptionPackageInfo(
            topoAnnotation,
            subscriptionName,
            appNamespace,
            channelInfo,
            subscription
        )
        processDeployables(
            deployablesFromTopo,
            parentId,
            links,
            nodes,
            subscriptionStatusMap,
            names,
            appNamespace,
            subscription
        )
        return nodes
    }

    let channelName = null
    if (channelInfo) {
        const splitIndex = indexOf(channelInfo, '/')
        if (splitIndex !== -1) {
            channelName = channelInfo.substring(splitIndex + 1)
        }
    }
    const packagedObjects = {}

    if (!channelName) {
        createGenericPackageObject(parentId, appNamespace, nodes, links, subscriptionName)
        return nodes // could not find the subscription channel name, abort
    }

    let foundDeployables = false
    Object.values(subscriptionStatusMap).forEach((packageItem) => {
        if (packageItem) {
            Object.keys(packageItem).forEach((packageItemKey) => {
                if (packageItemKey.startsWith(channelName)) {
                    const objectInfo = packageItemKey.substring(channelName.length + 1)
                    let objectType
                    let objectName
                    // now find the type-name
                    const splitIndex = indexOf(objectInfo, '-')
                    if (splitIndex !== -1) {
                        objectName = objectInfo.substring(splitIndex + 1)
                        objectType = objectInfo.substring(0, splitIndex)
                        const keyStr = `${objectName}-${objectType}`
                        if (!packagedObjects[keyStr]) {
                            const resStatus = get(packageItem[packageItemKey], 'resourceStatus')
                            const chartObject = createDeployableObject(
                                subscription,
                                objectName,
                                appNamespace,
                                objectType,
                                resStatus,
                                parentId,
                                nodes,
                                links,
                                ''
                            )
                            // create subobject replica subobject, if this object defines a replicas
                            createReplicaChild(chartObject, chartObject.specs.raw, links, nodes)

                            packagedObjects[keyStr] = chartObject
                            foundDeployables = true
                        }
                    }
                }
            })
        }
    })
    if (!foundDeployables) {
        createGenericPackageObject(parentId, appNamespace, nodes, links, subscriptionName)
    }
    return nodes
}
