/* Copyright Contributors to the Open Cluster Management project */

import { get } from 'lodash'
import { getSubscriptionApplication } from './subscription/application'

export const getApplication = (location, selectedChannel, recoilStates, cluster, apiversion) => {
    const [, , , name, namespace] = location

    let app
    let model
    let placement
    let placementName

    // get application
    const { applications, applicationSets, argoApplications } = recoilStates
    app = applications.find((app) => {
        return app?.metadata?.name === name && app?.metadata?.namespace === namespace
    })

    // get argo app set
    if (!app) {
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
    if (!app) {
        app = argoApplications.find((app) => {
            return app?.metadata?.name === name && app?.metadata?.namespace === namespace
        })
        if (app) {
            const appsetName = get(app, 'metadata.ownerReferences[0].name', '')
            if (appsetName) {
                const set = applicationSets.find((app) => {
                    return app?.metadata?.name === appsetName && app?.metadata?.namespace === namespace
                })
                placementName = get(
                    set,
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
    }

    // collect app resources
    if (app) {
        model = {
            name,
            namespace,
            app,
            metadata: app.metadata,
            placement,
            isArgoApp: get(app, 'apiVersion', '').indexOf('argoproj.io') > -1,
        }

        // a short sweet ride for argo
        if (model.isArgoApp) {
            return model
        }

        return getSubscriptionApplication(model, app, selectedChannel, recoilStates, cluster, apiversion)
    }
    return model
}
