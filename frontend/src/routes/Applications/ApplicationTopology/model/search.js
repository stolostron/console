/* Copyright Contributors to the Open Cluster Management project */

import _ from 'lodash'
import { nodeMustHavePods } from '../../../../components/Topology/utils/diagram-helpers-utils'
import { convertStringToQuery } from '../../../../components/Topology/utils/search-helper'

export const getApplicationQuery = (application, appData) => {
    const { name, namespace } = application
    if (appData.isArgoApp) {
        return getArgoApplicationQuery(name, namespace, appData)
    }
}

export const getRelatedQuery = (application, appData, topology, applicationRelated) => {
    const { name, namespace } = application
    if (appData.isArgoApp) {
        return getArgoRelatedQuery(name, namespace, appData, topology, applicationRelated)
    } else {
        return getSubscriptionRelatedQuery(name, namespace, appData)
    }
}

export const getAdditionalQuery = (appData, searchRelated) => {
    if (searchRelated) {
        if (appData.isArgoApp) {
            return getArgoAdditionalQuery(appData, searchRelated)
        }
    }
}

const getSubscriptionRelatedQuery = (name, namespace, appData) => {
    let query = getQueryStringForResource('Application', name, namespace)
    if (appData) {
        //query asking for a subset of related kinds and possibly for one subscription only
        if (appData.subscription) {
            //get related resources only for the selected subscription
            query = getQueryStringForResource('Subscription', appData.subscription, namespace)
            //ask only for these type of resources
            query.relatedKinds = appData.relatedKinds
        } else {
            //filter out any argo app with the same name and ns, we are looking here for acm apps
            query.filters.push({ property: 'apigroup', values: ['!argoproj.io'] })

            //get related resources for the application, but only this subset
            query.relatedKinds = appData.relatedKinds
        }
    }
    return query
}

const getArgoRelatedQuery = (name, namespace, appData, topology, applicationRelated) => {
    if (applicationRelated) {
        const { searchResult } = applicationRelated
        const allApps = _.get(searchResult[0], 'items', []).filter(
            (app) => app.applicationSet === appData.applicationSet
        )
        const targetNS = []
        const targetClusters = []
        const argoAppsLabelNames = []
        const targetNSForClusters = {} //keep track of what namespaces each cluster must deploy on
        allApps.forEach((argoApp) => {
            //get destination and clusters information
            argoAppsLabelNames.push(`app.kubernetes.io/instance=${argoApp.name}`)
            const argoNS = argoApp.destinationNamespace
            argoNS && targetNS.push(argoNS)
            const argoServerDest = findMatchingCluster(argoApp, _.get(appData, 'argoSecrets'))
            const argoServerNameDest = argoServerDest || argoApp.destinationName
            _.set(argoApp, 'destinationCluster', argoServerNameDest || argoApp.destinationServer)
            const targetClusterName = argoServerNameDest ? argoServerNameDest : argoServerDest ? argoServerDest : null
            if (targetClusterName) {
                targetClusters.push(targetClusterName)
                //add namespace to target list
                if (!targetNSForClusters[targetClusterName]) {
                    targetNSForClusters[targetClusterName] = []
                }
                if (argoNS && !_.includes(targetNSForClusters[targetClusterName], argoNS)) {
                    targetNSForClusters[targetClusterName].push(argoNS)
                }
            }
        })
        appData.targetNamespaces = _.uniq(targetNS)
        appData.clusterInfo = _.uniq(targetClusters)
        appData.argoAppsLabelNames = _.uniq(argoAppsLabelNames)
        //store all argo apps and destination clusters info on the first app
        const topoResources = topology.nodes
        const firstNode = topoResources[0]
        const topoClusterNode = _.find(topoResources, {
            id: 'member--clusters--',
        })
        _.set(firstNode, 'specs.relatedApps', allApps)
        //desired deployment state
        _.set(firstNode, 'specs.clusterNames', appData.clusterInfo)
        _.set(topoClusterNode, 'specs.appClusters', appData.clusterInfo)
        const initialClusterData = []
        //make sure clusters array always contain only objects
        appData.clusterInfo.forEach((cls) => {
            initialClusterData.push({
                name: cls,
            })
        })
        _.set(topoClusterNode, 'specs.clusters', initialClusterData)
        _.set(topoClusterNode, 'specs.targetNamespaces', targetNSForClusters)
    }

    let query = getQueryStringForResource('Application', name, namespace)
    if (appData && appData.targetNamespaces) {
        const argoKinds = appData.relatedKinds ? appData.relatedKinds.toString() : null
        //get all resources from the target namespace since they are not linked to the argo application
        query = getQueryStringForResource(argoKinds, null, appData.targetNamespaces.toString())
        query.filters.push({
            property: 'label',
            values: appData.argoAppsLabelNames,
        })
        //get the cluster for each target namespace and all pods related to this objects only
        //always ask for related pods, replicaset and replocationcontroller because they are tagged by the app instance
        // we'll get them if any are linked to the objects returned above
        query.relatedKinds.push('cluster', 'pod', 'replicaset', 'replicationcontroller')
    }
    return query
}

//try to find the name of the remote clusters using the server path
export const findMatchingCluster = (argoApp, argoMappingInfo) => {
    const serverApi = _.get(argoApp, 'destinationServer')
    if (
        (serverApi && serverApi === 'https://kubernetes.default.svc') ||
        _.get(argoApp, 'destinationName', '') === 'in-cluster'
    ) {
        return argoApp.cluster //target is the same as the argo app cluster
    }
    if (argoMappingInfo && serverApi) {
        // try to get server name from argo secret annotation
        try {
            const serverHostName = new URL(serverApi).hostname.substring(0, 63)
            const nameLabel = 'cluster-name='
            const serverLabel = `cluster-server=${serverHostName}`
            const mapServerInfo = _.find(_.map(argoMappingInfo, 'label', []), (obj) => obj.indexOf(serverLabel) !== -1)
            if (mapServerInfo) {
                // get the cluster name
                const labelsList = mapServerInfo.split(';')
                const clusterNameLabel = _.find(labelsList, (obj) => _.includes(obj, nameLabel))
                if (clusterNameLabel) {
                    return clusterNameLabel.split('=')[1]
                }
                return serverApi
            }
        } catch (err) {
            // do nothing
            return serverApi
        }
    }
    return serverApi
}

const getArgoApplicationQuery = (name, namespace, appData) => {
    //get all argo apps with the same source repo as this one
    const query = convertStringToQuery('kind:application apigroup:argoproj.io')
    if (appData.applicationSet) {
        // ApplicationSet name is only unique within cluster and namespace
        ;['applicationSet', 'cluster'].forEach((property) => {
            query.filters.push({ property, values: [appData[property]] })
        })
        query.filters.push({ property: 'namespace', values: [namespace] })
    } else {
        let targetRevisionFound = false
        const searchProperties = _.pick(appData.source, ['repoURL', 'path', 'chart', 'targetRevision'])
        for (const [property, value] of Object.entries(searchProperties)) {
            // add argo app source filters
            let propValue = value
            if (property === 'targetRevision') {
                targetRevisionFound = true
                if (propValue.length === 0) {
                    propValue = 'HEAD'
                }
            }

            query.filters.push({ property, values: [propValue] })
        }

        if (!targetRevisionFound) {
            query.filters.push({ property: 'targetRevision', values: ['HEAD'] })
        }
    }
    return query
}

const getArgoAdditionalQuery = (appData, { searchResult }) => {
    if (searchResult.length > 0 && searchResult[0].items) {
        // For the no applicationSet case, make sure we don't include apps with applicationSet
        const allApps = _.get(searchResult[0], 'items', []).filter(
            (app) => app.applicationSet === appData.applicationSet
        )
        // find argo server mapping
        const argoAppNS = _.uniqBy(_.map(allApps, 'namespace'))
        if (argoAppNS.length > 0) {
            const queryString = convertStringToQuery(
                `kind:secret namespace:${argoAppNS.join()} label:apps.open-cluster-management.io/acm-cluster='true'`
            )
            return queryString
        }
    }
}

const getQueryStringForResource = (resourcename, name, namespace) => {
    let resource = ''
    const nameForQuery = name ? `name:${name}` : ''
    const namespaceForQuery = namespace ? ` namespace:${namespace}` : ''
    if (resourcename) {
        switch (resourcename) {
            case 'Subscription':
                resource = 'kind:subscription '
                break
            case 'Application':
                resource = 'kind:application'
                break
            default:
                resource = `kind:${resourcename} `
        }
    }
    return convertStringToQuery(`${resource} ${nameForQuery} ${namespaceForQuery}`)
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
