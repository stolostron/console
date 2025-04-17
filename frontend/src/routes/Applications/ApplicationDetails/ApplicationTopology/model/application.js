/* Copyright Contributors to the Open Cluster Management project */

import { get, set } from 'lodash'
import { getSubscriptionApplication } from './applicationSubscription'
import {
  fireManagedClusterView,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  ApplicationSetApiVersion,
  ApplicationSetKind,
} from '../../../../../resources'
import { getResource } from '../../../../../resources/utils'
import { fetchAggregate, SupportedAggregate } from '../../../../../lib/useAggregates'

export const getApplication = async (
  namespace,
  name,
  backendUrl,
  selectedChannel,
  recoilStates,
  cluster,
  apiversion,
  clusters
) => {
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
  const { applications } = recoilStates
  let isAppSetPullModel = false

  if (apiVersion === 'application.app.k8s.io') {
    app = applications.find((app) => {
      return app?.metadata?.name === name && app?.metadata?.namespace === namespace
    })
  }

  // get argo app set
  if (!app && isAppSet) {
    // appset is not part of recoil
    app = await getResource({
      apiVersion: ApplicationSetApiVersion,
      kind: ApplicationSetKind,
      metadata: {
        name,
        namespace,
      },
    }).promise
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

      const decisionOwnerReference = get(placement, 'metadata.ownerReferences', undefined)

      if (decisionOwnerReference) {
        relatedPlacement = recoilStates.placements.find(
          (resource) =>
            resource.kind === decisionOwnerReference[0].kind &&
            resource.metadata.name === decisionOwnerReference[0].name &&
            resource.metadata.namespace === namespace
        )
      }

      if (get(app, 'spec.template.metadata.annotations["apps.open-cluster-management.io/ocm-managed-cluster"]')) {
        isAppSetPullModel = true
      }
    }
  }

  // get argo
  if (!app && apiVersion === 'application.argoproj.io') {
    if (cluster) {
      // get argo app definition from managed cluster
      app = await getRemoteArgoApp(cluster, 'application', ArgoApplicationApiVersion, name, namespace)
      set(app, 'status.cluster', cluster)
    } else {
      // argo app is not part of recoil
      app = await getResource({
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: {
          name,
          namespace,
        },
      }).promise
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
    const uidata = await fetchAggregate(SupportedAggregate.uidata, backendUrl, app)
    model.clusterList = uidata?.clusterList

    // a short sweet ride for argo
    if (model.isArgoApp || model.isOCPApp || model.isFluxApp) {
      return model
    }

    if (isAppSet) {
      if (isAppSetPullModel) {
        return getAppSetApplicationPullModel(model, app, recoilStates, clusters)
      }
      // because these values require all argo apps to calculate
      // we get the data from the backend
      model.appSetApps = uidata.appSetApps
      model.appSetClusters = uidata.clusterList.reduce((list, clusterName) => {
        const _cluster = clusters.find((c) => c.name === clusterName)
        if (_cluster) {
          list.push({
            name: _cluster.name,
            namespace: _cluster.namespace,
            url: _cluster.kubeApiServer,
            status: _cluster.status,
            creationTimestamp: _cluster.creationTimestamp,
          })
        }
        return list
      }, [])
      return model
    }

    return await getSubscriptionApplication(model, app, selectedChannel, recoilStates, cluster, apiversion)
  }
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
      apiVersion: ArgoApplicationApiVersion,
      kind: ArgoApplicationKind,
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
