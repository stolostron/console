/* Copyright Contributors to the Open Cluster Management project */

import { get, set } from 'lodash'
import { getSubscriptionApplication } from './applicationSubscription'
import { fireManagedClusterView } from '../../../../../resources'

export const getApplication = async (namespace, name, selectedChannel, recoilStates, cluster, apiversion, clusters) => {
  let app
  let model
  let placement
  let placementName
  let relatedPlacement

  // get application
  const apiVersion = apiversion || 'application.app.k8s.io' // defaults to ACM app
  const isAppSet = apiVersion === 'applicationset.argoproj.io'
  const isOCPApp = apiVersion === 'ocp'
  const isFluxApp = apiVersion === 'flux'
  const { applications, applicationSets, argoApplications } = recoilStates
  let isAppSetPullModel = false

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
      placement = recoilStates.placementDecisions.find((placementDecision) => {
        const labels = get(placementDecision, 'metadata.labels', {})
        return labels['cluster.open-cluster-management.io/placement'] === placementName
      })

      const decisionOwnerReference = get(placement, 'metadata.ownerReferences')[0]

      relatedPlacement = recoilStates.placements.find(
        (resource) =>
          resource.kind === decisionOwnerReference.kind &&
          resource.metadata.name === decisionOwnerReference.name &&
          resource.metadata.namespace === namespace
      )

      if (get(app, 'spec.template.metadata.annotations["apps.open-cluster-management.io/ocm-managed-cluster"]')) {
        isAppSetPullModel = true
      }
    }
  }

  // get argo
  if (!app && apiVersion === 'application.argoproj.io') {
    if (cluster) {
      // get argo app definition from managed cluster
      app = await getRemoteArgoApp(cluster, 'application', 'argoproj.io/v1alpha1', name, namespace)
      set(app, 'status.cluster', cluster)
    } else {
      app = argoApplications.find((app) => {
        return app?.metadata?.name === name && app?.metadata?.namespace === namespace
      })
    }
  }

  // generate ocp app boiler plate
  if (!app && isOCPApp) {
    const clusterInfo = findCluster(clusters, cluster, false)
    app = {
      apiVersion: 'ocp',
      kind: 'OCPApplication',
      metadata: {
        name,
        namespace,
      },
      cluster: clusterInfo,
    }
  }

  // generate ocp app boiler plate
  if (!app && isFluxApp) {
    const clusterInfo = findCluster(clusters, cluster, false)
    app = {
      apiVersion: 'flux',
      kind: 'FluxApplication',
      metadata: {
        name,
        namespace,
      },
      cluster: clusterInfo,
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
      isArgoApp: get(app, 'apiVersion', '').indexOf('argoproj.io') > -1 && !isAppSet,
      isAppSet: isAppSet,
      isOCPApp,
      isFluxApp,
      isAppSetPullModel,
      relatedPlacement,
    }

    // a short sweet ride for argo
    if (model.isArgoApp || model.isOCPApp || model.isFluxApp) {
      return model
    }

    if (isAppSet) {
      if (isAppSetPullModel) {
        return getAppSetApplicationPullModel(model, app, recoilStates, clusters)
      }
      return getAppSetApplication(model, app, recoilStates, clusters)
    }

    return await getSubscriptionApplication(model, app, selectedChannel, recoilStates, cluster, apiversion)
  }
  return model
}

export const getAppSetApplication = (model, app, recoilStates, clusters) => {
  const { argoApplications } = recoilStates
  const appSetApps = []
  const appSetClusters = []
  const appSetNS = get(app, 'metadata.namespace')

  argoApplications.forEach((argoApp) => {
    const argoAppOwnerRef = get(argoApp, 'metadata.ownerReferences')
    const argoAppNS = get(argoApp, 'metadata.namespace')
    if (argoAppOwnerRef) {
      if (
        argoAppOwnerRef[0].kind === 'ApplicationSet' &&
        argoAppOwnerRef[0].name === model.name &&
        argoAppNS === appSetNS
      ) {
        appSetApps.push(argoApp)
        let serverName = get(argoApp, 'spec.destination.name')
        let serverURL = get(argoApp, 'spec.destination.server')
        let cluster
        if (serverName) {
          if (serverName === 'in-cluster') {
            serverName = 'local-cluster'
          }
          // find cluster by name
          cluster = findCluster(clusters, serverName, false)
        }

        if (serverURL) {
          // find cluster by URL
          cluster = findCluster(clusters, serverURL, true)
        }

        // we only want certain data from the YAML
        // is it possible no cluster is found?
        if (cluster) {
          const url = cluster.kubeApiServer
          let status
          if (cluster.status === 'ready') {
            status = 'ok'
          } else if (cluster.status === 'unknown') {
            status = 'offline'
          } else {
            status = cluster.status
          }
          appSetClusters.push({
            name: cluster.name,
            namespace: cluster.namespace,
            url,
            status,
            created: cluster.creationTimestamp,
          })
        }
      }
    }
  })

  model.appSetApps = appSetApps
  model.appSetClusters = appSetClusters

  return model
}

export const getAppSetApplicationPullModel = (model, app, recoilStates, clusters) => {
  const { multiclusterApplicationSetReports } = recoilStates
  const multiclusterApplicationSetReport = multiclusterApplicationSetReports.find(
    (report) => report.metadata.name === app.metadata.name && report.metadata.namespace === app.metadata.namespace
  )
  const argoApps = get(multiclusterApplicationSetReport, 'statuses.clusterConditions', [])
  const resources = get(multiclusterApplicationSetReport, 'statuses.resources', [])
  const appSetApps = []
  const appSetClusters = []

  argoApps.forEach((argoApp) => {
    const appStr = get(argoApp, 'app')
    const appData = appStr ? appStr.split('/') : []
    const conditions = get(argoApp, 'conditions', [])
    appSetApps.push({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: {
        name: appData[1],
        namespace: appData[0],
      },
      spec: {
        destination: {
          name: argoApp.cluster,
        },
      },
      status: {
        health: {
          status: argoApp.healthStatus,
        },
        conditions,
        sync: {
          status: argoApp.syncStatus,
        },
        resources,
      },
    })

    const cluster = findCluster(clusters, argoApp.cluster, false)
    if (cluster) {
      const url = cluster.kubeApiServer
      let status
      if (cluster.status === 'ready') {
        status = 'ok'
      } else if (cluster.status === 'unknown') {
        status = 'offline'
      } else {
        status = cluster.status
      }
      appSetClusters.push({
        name: cluster.name,
        namespace: cluster.namespace,
        url,
        status,
        created: cluster.creationTimestamp,
      })
    }
  })

  model.appSetApps = appSetApps
  model.appSetClusters = appSetClusters

  return model
}

export const findCluster = (managedClusters, searchValue, findByURL) => {
  for (let i = 0; i < managedClusters.length; i++) {
    if (!findByURL) {
      if (managedClusters[i].name === searchValue) {
        return managedClusters[i]
      }
    } else {
      const url = managedClusters[i].kubeApiServer
      if (url === searchValue) {
        return managedClusters[i]
      }
    }
  }

  return undefined
}

const getRemoteArgoApp = async (cluster, kind, apiVersion, name, namespace) => {
  let response

  try {
    response = await fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
  } catch (err) {
    console.error('Error getting remote Argo app', err)
  }

  if (response) {
    return response.result
  }
}
