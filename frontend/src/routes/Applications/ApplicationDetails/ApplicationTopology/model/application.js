/* Copyright Contributors to the Open Cluster Management project */

import { get } from 'lodash'
import { getSubscriptionApplication } from './applicationSubscription'

export const getApplication = async (namespace, name, selectedChannel, recoilStates, cluster, apiversion) => {
    let app
    let model
    let placement
    let placementName

    // get application
    const apiVersion = apiversion || 'application.app.k8s.io' // defaults to ACM app
    const isAppSet = apiVersion === 'applicationset.argoproj.io'
    const { applications, applicationSets, argoApplications } = recoilStates

    if (apiVersion === 'application.app.k8s.io') {
        app = applications.find((app) => {
            return app?.metadata?.name === name && app?.metadata?.namespace === namespace
        })
    }

    // get argo app set
    if (!app && isAppSet) {
        app = applicationSets.find((app) => {
            return app?.metadata?.name === name && app?.metadata?.namespace === namespace
        })
        if (app) {
            placementName = get(
                app,
                'spec.generators[0].clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]',
                ''
            )
            placement = recoilStates.placements.find((placement) => {
                return (
                    get(placement, 'metadata.namespace') === namespace &&
                    get(placement, 'metadata.name') === placementName
                )
            })
        }
    }

    // get argo embedded app set
    if (!app && apiVersion === 'application.argoproj.io') {
        app = argoApplications.find((app) => {
            return app?.metadata?.name === name && app?.metadata?.namespace === namespace
        })
    }

    // collect app resources
    if (app) {
        model = {
            name,
            namespace,
            app,
            metadata: app.metadata,
            placement,
            isArgoApp: get(app, 'apiVersion', '').indexOf('argoproj.io') > -1 && !isAppSet,
            isAppSet: isAppSet,
        }

        // a short sweet ride for argo
        if (model.isArgoApp) {
            return model
        }

        if (isAppSet) {
            return getAppSetApplication(model, app, recoilStates)
        }

        return await getSubscriptionApplication(model, app, selectedChannel, recoilStates, cluster, apiversion)
    }
    return model
}

export const getAppSetApplication = (model, app, recoilStates) => {
    const { argoApplications, managedClusters } = recoilStates
    const appSetApps = []
    const appSetClusters = []

    argoApplications.forEach((argoApp) => {
        const argoAppOwnerRef = get(argoApp, 'metadata.ownerReferences')
        if (argoAppOwnerRef) {
            if (argoAppOwnerRef[0].kind === 'ApplicationSet' && argoAppOwnerRef[0].name === model.name) {
                appSetApps.push(argoApp)
                let serverName = get(argoApp, 'spec.destination.name')
                let serverURL = get(argoApp, 'spec.destination.server')
                let cluster
                if (serverName) {
                    if (serverName === 'in-cluster') {
                        serverName = 'local-cluster'
                    }
                    // find cluster by name
                    cluster = findCluster(managedClusters, serverName, false)
                }

                if (serverURL) {
                    // find cluster by URL
                    cluster = findCluster(managedClusters, serverURL, true)
                }

                // we only want certain data from the YAML
                // is it possible no cluster is found?
                if (cluster) {
                    const managedClusterClientConfigs = cluster.spec.managedClusterClientConfigs
                    const url = managedClusterClientConfigs[0].url
                    let clusterAccepted
                    let clusterJoined
                    let clusterAvailable
                    let status
                    const clusterConditions = cluster.status.conditions
                    // parse conditions
                    if (clusterConditions) {
                        clusterConditions.forEach((condition) => {
                            if (condition.type === 'HubAcceptedManagedCluster' && condition.status === 'True') {
                                clusterAccepted = true
                            }
                            if (condition.type === 'ManagedClusterJoined' && condition.status === 'True') {
                                clusterJoined = true
                            }
                            if (condition.type === 'ManagedClusterConditionAvailable' && condition.status === 'True') {
                                clusterAvailable = true
                            }

                            if (!clusterAccepted) {
                                status = 'notaccepted'
                            } else if (!clusterJoined) {
                                status = 'pendingimport'
                            } else {
                                status = clusterAvailable ? 'ok' : 'offline'
                            }
                        })
                    }
                    appSetClusters.push({
                        name: cluster.metadata.name,
                        namespace: cluster.metadata.namespace,
                        url,
                        status,
                        created: cluster.metadata.creationTimestamp,
                    })
                }
            }
        }
    })

    model.appSetApps = appSetApps
    model.appSetClusters = appSetClusters

    return model
}

export const findCluster = (managedClusters, searchValue, findByURL) => {
    for (let i = 0; i < managedClusters.length; i++) {
        if (!findByURL) {
            if (managedClusters[i].metadata.name === searchValue) {
                return managedClusters[i]
            }
        } else {
            const managedClusterClientConfig = managedClusters[i].spec.managedClusterClientConfigs
            const url = managedClusterClientConfig[0].url
            if (url === searchValue) {
                return managedClusters[i]
            }
        }
    }

    return undefined
}
