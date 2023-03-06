/* Copyright Contributors to the Open Cluster Management project */

import { get, set, uniqBy } from 'lodash'
import { fireManagedClusterView, getResource, listNamespacedResources } from '../../../../../resources'
import { searchClient } from '../../../../Home/Search/search-sdk/search-client'
import { SearchResultRelatedItemsDocument } from '../../../../Home/Search/search-sdk/search-sdk'
import { convertStringToQuery } from '../helpers/search-helper'
import { createReplicaChild } from './topologySubscription'
import { addClusters, getClusterName, processMultiples } from './utils'

export function getAppSetTopology(application) {
  const links = []
  const nodes = []
  const { name, namespace, appSetClusters, appSetApps } = application
  const clusterNames = appSetClusters.map((cluster) => {
    return cluster.name
  })

  const appId = `application--${name}`
  nodes.push({
    name,
    namespace,
    type: 'applicationset',
    id: appId,
    uid: appId,
    specs: {
      isDesign: true,
      raw: application.app,
      allClusters: {
        isLocal: clusterNames.includes('local-cluster'),
        remoteCount: clusterNames.includes('local-cluster') ? clusterNames.length - 1 : clusterNames.length,
      },
      clusterNames,
      appSetApps,
      appSetClusters,
    },
  })

  const appSetPlacementName = get(
    application.app,
    'spec.generators[0].clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]'
  )
  delete application.app.spec.apps

  // create placement node
  let isPlacementFound = false
  const placement = get(application, 'placement', '')
  const placementId = `member--placements--${namespace}--${name}`
  if (placement) {
    isPlacementFound = true
    const {
      metadata: { name, namespace },
    } = placement

    nodes.push({
      name,
      namespace,
      type: 'placement',
      id: placementId,
      uid: placementId,
      specs: {
        isDesign: true,
        raw: placement,
      },
    })
    links.push({
      from: { uid: appId },
      to: { uid: placementId },
      type: '',
      specs: { isDesign: true },
    })
  } else {
    if (!appSetPlacementName && appSetPlacementName !== '') {
      isPlacementFound = true
    }
  }

  set(nodes[0], 'isPlacementFound', isPlacementFound)

  const clusterParentId = placement ? placementId : appId
  const source =
    get(application, 'app.spec.template.spec.source.path', '') !== '{{path}}'
      ? get(application, 'app.spec.template.spec.source.path', '')
      : Object.values(get(application, 'app.spec.generators')[0])[0].directories[0].path

  const clusterId = addClusters(clusterParentId, null, source, clusterNames, appSetClusters, links, nodes)
  const resources = []

  if (appSetApps.length > 0) {
    appSetApps.forEach((app) => {
      const appResources = get(app, 'status.resources', [])
      let appClusterName = app.spec.destination.name
      if (!appClusterName) {
        const appCluster = application.appSetClusters.find((cls) => cls.url === app.spec.destination.server)
        appClusterName = appCluster ? appCluster.name : undefined
      }
      appResources.forEach((resource) => {
        resources.push({ ...resource, cluster: appClusterName })
      })
    })
  }

  processMultiples(resources).forEach((deployable) => {
    const {
      name: deployableName,
      namespace: deployableNamespace,
      kind,
      version,
      group,
      resourceCount,
      resources: deployableResources,
    } = deployable
    const type = kind.toLowerCase()

    const memberId = `member--member--deployable--member--clusters--${getClusterName(
      clusterId
    )}--${type}--${deployableNamespace}--${deployableName}`

    const raw = {
      metadata: {
        name: deployableName,
        namespace: deployableNamespace,
      },
      ...deployable,
    }

    let apiVersion = null
    if (version) {
      apiVersion = group ? `${group}/${version}` : version
    }
    if (apiVersion) {
      raw.apiVersion = apiVersion
    }

    const deployableObj = {
      name: deployableName,
      namespace: deployableNamespace,
      type,
      id: memberId,
      uid: memberId,
      specs: {
        isDesign: false,
        raw,
        clustersNames: clusterNames,
        parent: {
          clusterId,
        },
        resources: deployableResources,
        resourceCount: resourceCount || 0 + clusterNames.length,
      },
    }

    nodes.push(deployableObj)
    links.push({
      from: { uid: clusterId },
      to: { uid: memberId },
      type: '',
    })

    const template = { metadata: {} }
    // create replica subobject, if this object defines a replicas
    createReplicaChild(deployableObj, clusterNames, template, links, nodes)
  })

  return { nodes: uniqBy(nodes, 'uid'), links }
}

export const openArgoCDEditor = (cluster, namespace, name, toggleLoading, t) => {
  if (cluster === 'local-cluster') {
    toggleLoading()
    getArgoRoute(name, namespace, cluster)
    toggleLoading()
  } else {
    toggleLoading()
    getArgoRouteFromSearch(name, namespace, cluster, t)
    toggleLoading()
  }
}

const getArgoRoute = async (appName, appNamespace, cluster, managedclusterviewdata) => {
  let routes, argoRoute
  // this only works for OCP clusters, needs more work to support other vendors
  if (cluster === 'local-cluster') {
    try {
      routes = await listNamespacedResources({
        apiVersion: 'route.openshift.io/v1',
        kind: 'Route',
        metadata: { namespace: appNamespace },
      }).promise
    } catch (err) {
      console.error('Error listing resource:', err)
    }

    if (routes && routes.length > 0) {
      const routeObjs = routes.filter(
        (route) =>
          get(route, 'metadata.labels["app.kubernetes.io/part-of"]', '') === 'argocd' &&
          get(route, 'metadata.labels["app.kubernetes.io/name"]', '').endsWith('-server') &&
          !get(route, 'metadata.name', '').toLowerCase().includes('grafana') &&
          !get(route, 'metadata.name', '').toLowerCase().includes('prometheus')
      )
      argoRoute = routeObjs[0]
      if (routeObjs.length > 1) {
        const serverRoute = routeObjs.find((route) => get(route, 'metadata.name', '').toLowerCase().includes('server'))
        if (serverRoute) {
          argoRoute = serverRoute
        }
      }

      openArgoEditorWindow(argoRoute, appName)
    }
  } else {
    // get from remote cluster
    const { cluster, kind, apiVersion, name, namespace } = managedclusterviewdata
    fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
      .then((viewResponse) => {
        if (viewResponse.message) {
        } else {
          openArgoEditorWindow(viewResponse.result, appName)
        }
      })
      .catch((err) => {
        console.error('Error getting resource: ', err)
      })
  }
}

export const openRouteURL = (routeObject, toggleLoading) => {
  const name = get(routeObject, 'name', '')
  const namespace = get(routeObject, 'namespace', '')
  const cluster = get(routeObject, 'cluster', '')
  const kind = get(routeObject, 'kind', '')
  const apigroup = get(routeObject, 'apigroup', '')
  const apiversion = get(routeObject, 'apiversion', '')
  const apiVersion = `${apigroup}/${apiversion}`

  toggleLoading()
  if (cluster === 'local-cluster') {
    const route = getResource({ apiVersion, kind, metadata: { namespace, name } }).promise
    route
      .then((result) => {
        toggleLoading()
        openRouteURLWindow(result)
      })
      .catch((err) => {
        toggleLoading()
        console.error('Error getting resource: ', err)
      })
  } else {
    fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
      .then((viewResponse) => {
        toggleLoading()
        if (viewResponse.message) {
          // should handle error in the future
        } else {
          openRouteURLWindow(viewResponse.result)
        }
      })
      .catch((err) => {
        toggleLoading()
        console.error('Error getting resource: ', err)
      })
  }
}

const getArgoRouteFromSearch = async (appName, appNamespace, cluster, t) => {
  const query = convertStringToQuery(
    `kind:route namespace:${appNamespace} cluster:${cluster} label:app.kubernetes.io/part-of=argocd`
  )

  searchClient
    .query({
      query: SearchResultRelatedItemsDocument,
      variables: {
        input: [{ ...query }],
        limit: 1000,
      },
      fetchPolicy: 'network-only',
    })
    .then((result) => {
      if (result.errors) {
        console.log(`Error: ${result.errors[0].message}`)
        return
      } else {
        const searchResult = get(result, 'data.searchResult', [])
        if (searchResult.length > 0) {
          let route = null
          // filter out grafana and prometheus routes
          const routes = get(searchResult[0], 'items', []).filter(
            (routeObj) =>
              !get(routeObj, 'name', '').toLowerCase().includes('grafana') &&
              !get(routeObj, 'name', '').toLowerCase().includes('prometheus')
          )
          if (routes.length > 0) {
            // if still more than 1, choose one with “server” in the name if possible
            const serverRoute = routes.find((routeObj) => get(routeObj, 'name', '').toLowerCase().includes('server'))
            if (serverRoute) {
              route = serverRoute
            } else {
              route = routes[0]
            }
          }
          if (!route) {
            const errMsg = t('No Argo route found for namespace {0} on cluster {1}', [appNamespace, cluster])
            console.log(errMsg)
            return
          } else {
            getArgoRoute(appName, appNamespace, cluster, {
              cluster,
              name: route.name,
              namespace: route.namespace,
              kind: 'Route',
              apiVersion: 'route.openshift.io/v1',
            })
          }
        }
      }
    })
}

const openArgoEditorWindow = (route, appName) => {
  const hostName = get(route, 'spec.host', 'unknown')
  const transport = get(route, 'spec.tls') ? 'https' : 'http'
  const argoURL = `${transport}://${hostName}/applications`
  window.open(`${argoURL}/${appName}`, '_blank')
}

const openRouteURLWindow = (route) => {
  const hostName = get(route, 'spec.host', 'unknown')
  const transport = get(route, 'spec.tls') ? 'https' : 'http'
  const routeURL = `${transport}://${hostName}`
  window.open(`${routeURL}`, '_blank')
}
