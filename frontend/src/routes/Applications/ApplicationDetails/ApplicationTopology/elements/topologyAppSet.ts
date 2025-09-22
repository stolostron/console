/* Copyright Contributors to the Open Cluster Management project */

// Lodash imports removed - using native TypeScript equivalents
import { getResource, listNamespacedResources } from '../../../../../resources/utils'
import { fireManagedClusterView } from '../../../../../resources'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { convertStringToQuery } from './helpers/search-helper'
import {
  createReplicaChild,
  createControllerRevisionChild,
  createDataVolumeChild,
  createVirtualMachineInstance,
} from './topologySubscription'
import { addClusters, getClusterName, processMultiples } from './topologyUtils'
import {
  ApplicationModel,
  AppSetCluster,
  TopologyNode,
  TopologyLink,
  AppSetTopologyResult,
  RouteObject,
  ManagedClusterViewData,
  ProcessedDeployableResource,
  TranslationFunction,
  SearchQuery,
} from '../types'

/**
 * Generates topology data for ApplicationSet applications
 * Creates nodes and links representing the application structure including:
 * - ApplicationSet node
 * - Placement node (if applicable)
 * - Cluster nodes
 * - Deployed resource nodes
 *
 * @param application - The ApplicationSet application model
 * @param hubClusterName - Name of the hub cluster
 * @returns Topology structure with nodes and links
 */
export function getAppSetTopology(application: ApplicationModel, hubClusterName: string): AppSetTopologyResult {
  const links: TopologyLink[] = []
  const nodes: TopologyNode[] = []
  const { name, namespace, appSetClusters, appSetApps, relatedPlacement } = application

  // Extract cluster names from the ApplicationSet clusters
  const clusterNames =
    appSetClusters?.map((cluster: AppSetCluster) => {
      return cluster.name
    }) || []

  // Create the main ApplicationSet node
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
        isLocal: clusterNames.includes(hubClusterName),
        remoteCount: clusterNames.includes(hubClusterName) ? clusterNames.length - 1 : clusterNames.length,
      },
      clusterNames,
      appSetApps,
      appSetClusters,
    },
  })

  // Extract placement name from ApplicationSet generators configuration
  const appSetPlacementName = (application.app as any)?.spec?.generators?.[0]?.clusterDecisionResource?.labelSelector
    ?.matchLabels?.['cluster.open-cluster-management.io/placement']

  // Clean up the application spec by removing apps array
  if (application.app && typeof application.app === 'object' && 'spec' in application.app) {
    const spec = application.app.spec as any
    if (spec && typeof spec === 'object' && 'apps' in spec) {
      delete spec.apps
    }
  }

  // Create placement node if placement exists
  let isPlacementFound = false
  let isArgoCDPullModelTargetLocalCluster = false
  const placement = application.placement ?? ''
  const placementId = `member--placements--${namespace}--${name}`

  if (placement) {
    isPlacementFound = true
    const placementName = (placement as any)?.metadata?.name || ''
    const placementNamespace = (placement as any)?.metadata?.namespace || ''
    const clusterDecisions = (placement as any)?.status?.decisions ?? []

    // Check if this is an ArgoCD pull model targeting the local cluster
    if (
      Array.isArray(clusterDecisions) &&
      clusterDecisions.find((cluster: any) => cluster.clusterName === hubClusterName) &&
      application.isAppSetPullModel
    ) {
      isArgoCDPullModelTargetLocalCluster = true
    }

    // Add placement node to topology
    nodes.push({
      name: placementName,
      namespace: placementNamespace,
      type: 'placement',
      id: placementId,
      uid: placementId,
      specs: {
        isDesign: true,
        raw: placement,
      },
      placement: relatedPlacement,
    })

    // Link ApplicationSet to Placement
    links.push({
      from: { uid: appId },
      to: { uid: placementId },
      type: '',
      specs: { isDesign: true },
    })
  } else {
    // Handle case where placement name exists but placement object doesn't
    if (!appSetPlacementName && appSetPlacementName !== '') {
      isPlacementFound = true
    }
  }

  // Set placement-related flags on the ApplicationSet node
  ;(nodes[0] as any).isPlacementFound = isPlacementFound
  ;(nodes[0] as any).isArgoCDPullModelTargetLocalCluster = isArgoCDPullModelTargetLocalCluster

  // Determine the parent node for clusters (placement if exists, otherwise ApplicationSet)
  const clusterParentId = placement ? placementId : appId

  // Extract source path from ApplicationSet template or generators
  const templateSourcePath = (application.app as any)?.spec?.template?.spec?.source?.path ?? ''
  const source =
    templateSourcePath !== '{{path}}'
      ? templateSourcePath
      : (Object.values((application.app as any)?.spec?.generators?.[0] ?? {})[0] as any)?.directories?.[0]?.path ?? ''

  // Add cluster nodes to topology
  const clusterId = addClusters(
    clusterParentId,
    undefined,
    source,
    clusterNames,
    (appSetClusters || []) as any,
    links,
    nodes
  )
  const resources: any[] = []

  // Collect resources from all ApplicationSet applications
  if (appSetApps && appSetApps.length > 0) {
    appSetApps.forEach((app: any) => {
      const appResources = app.status?.resources ?? []
      let appClusterName = app.spec?.destination?.name

      // If cluster name not found, try to find it by server URL
      if (!appClusterName) {
        const appCluster = application.appSetClusters?.find(
          (cls: AppSetCluster) => cls.url === app.spec?.destination?.server
        )
        appClusterName = appCluster ? appCluster.name : undefined
      }

      // Add cluster information to each resource
      appResources.forEach((resource: any) => {
        resources.push({ ...resource, cluster: appClusterName })
      })
    })
  }

  // Process and create nodes for deployed resources
  processMultiples(resources).forEach((deployable: Record<string, unknown>) => {
    const typedDeployable = deployable as unknown as ProcessedDeployableResource
    const {
      name: deployableName,
      namespace: deployableNamespace,
      kind,
      version,
      group,
      resourceCount,
      resources: deployableResources,
    } = typedDeployable
    const type = kind.toLowerCase()

    // Generate unique member ID for the deployable resource
    const memberId = `member--member--deployable--member--clusters--${getClusterName(
      clusterId,
      hubClusterName
    )}--${type}--${deployableNamespace}--${deployableName}`

    // Create raw resource object with metadata
    const raw: any = {
      metadata: {
        name: deployableName,
        namespace: deployableNamespace,
      },
      ...typedDeployable,
    }

    // Construct API version from group and version
    let apiVersion: string | null = null
    if (version) {
      apiVersion = group ? `${group}/${version}` : version
    }
    if (apiVersion) {
      raw.apiVersion = apiVersion
    }

    // Create deployable resource node
    const deployableObj: TopologyNode = {
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
        resourceCount: (resourceCount || 0) + clusterNames.length,
      },
    }

    // Add deployable node and link to cluster
    nodes.push(deployableObj)
    links.push({
      from: { uid: clusterId },
      to: { uid: memberId },
      type: '',
    })

    // Create child nodes for specific resource types
    const template = { metadata: {} }

    // Create replica child nodes (for Deployments, ReplicaSets, etc.)
    createReplicaChild(deployableObj, clusterNames, template, links, nodes)

    // Create controller revision child nodes (for DaemonSets, StatefulSets)
    createControllerRevisionChild(deployableObj, clusterNames, links, nodes)

    // Create data volume child nodes (for KubeVirt)
    createDataVolumeChild(deployableObj, clusterNames, links, nodes)

    // Create virtual machine instance child nodes (for KubeVirt)
    createVirtualMachineInstance(deployableObj, clusterNames, links, nodes)
  })

  // Return unique nodes and all links
  const uniqueNodes = nodes.filter((node, index, self) => index === self.findIndex((n) => n.uid === node.uid))
  return { nodes: uniqueNodes, links }
}

/**
 * Opens the Argo CD editor for a specific application
 * Handles both local hub cluster and remote managed cluster scenarios
 *
 * @param cluster - Target cluster name
 * @param namespace - Application namespace
 * @param name - Application name
 * @param toggleLoading - Function to toggle loading state
 * @param t - Translation function
 * @param hubClusterName - Hub cluster name
 */
export const openArgoCDEditor = (
  cluster: string,
  namespace: string,
  name: string,
  toggleLoading: () => void,
  t: TranslationFunction,
  hubClusterName: string
): void => {
  if (cluster === hubClusterName) {
    // Handle local hub cluster
    toggleLoading()
    getArgoRoute(name, namespace, cluster, undefined, hubClusterName)
    toggleLoading()
  } else {
    // Handle remote managed cluster
    toggleLoading()
    getArgoRouteFromSearch(name, namespace, cluster, t, hubClusterName)
    toggleLoading()
  }
}

/**
 * Retrieves Argo CD route information and opens the editor
 * Supports both direct API calls for hub cluster and ManagedClusterView for remote clusters
 *
 * @param appName - Application name
 * @param appNamespace - Application namespace
 * @param cluster - Target cluster name
 * @param managedclusterviewdata - Optional ManagedClusterView data for remote clusters
 * @param hubClusterName - Hub cluster name
 */
const getArgoRoute = async (
  appName: string,
  appNamespace: string,
  cluster: string,
  managedclusterviewdata: ManagedClusterViewData | undefined,
  hubClusterName: string
): Promise<void> => {
  let routes: any[]
  let argoRoute: RouteObject | undefined

  // Handle hub cluster - direct API call
  if (cluster === hubClusterName) {
    try {
      routes = await listNamespacedResources({
        apiVersion: 'route.openshift.io/v1',
        kind: 'Route',
        metadata: { namespace: appNamespace },
      }).promise
    } catch (err) {
      console.error('Error listing resource:', err)
      return
    }

    if (routes && routes.length > 0) {
      // Filter routes to find Argo CD server routes
      const routeObjs = routes.filter(
        (route: any) =>
          (route.metadata?.labels?.['app.kubernetes.io/part-of'] ?? '') === 'argocd' &&
          (route.metadata?.labels?.['app.kubernetes.io/name'] ?? '').endsWith('-server') &&
          !(route.metadata?.name ?? '').toLowerCase().includes('grafana') &&
          !(route.metadata?.name ?? '').toLowerCase().includes('prometheus')
      )

      argoRoute = routeObjs[0]

      // Prefer routes with 'server' in the name if multiple routes exist
      if (routeObjs.length > 1) {
        const serverRoute = routeObjs.find((route: any) =>
          (route.metadata?.name ?? '').toLowerCase().includes('server')
        )
        if (serverRoute) {
          argoRoute = serverRoute
        }
      }

      if (argoRoute) {
        openArgoEditorWindow(argoRoute, appName)
      }
    }
  } else {
    // Handle remote cluster using ManagedClusterView
    if (!managedclusterviewdata) return

    const { cluster: clusterName, kind, apiVersion, name, namespace } = managedclusterviewdata
    fireManagedClusterView(clusterName, kind, apiVersion, name, namespace)
      .then((viewResponse: any) => {
        if (viewResponse.message) {
          // Handle error case - could add error handling here
        } else {
          openArgoEditorWindow(viewResponse.result, appName)
        }
      })
      .catch((err: any) => {
        console.error('Error getting resource: ', err)
      })
  }
}

/**
 * Opens a route URL in a new browser window
 * Handles both hub cluster direct access and remote cluster ManagedClusterView access
 *
 * @param routeObject - Route object containing metadata and cluster information
 * @param toggleLoading - Function to toggle loading state
 * @param hubClusterName - Hub cluster name
 */
export const openRouteURL = (
  routeObject: {
    name?: string
    namespace?: string
    cluster?: string
    kind?: string
    apigroup?: string
    apiversion?: string
  },
  toggleLoading: () => void,
  hubClusterName: string
): void => {
  const name = routeObject.name ?? ''
  const namespace = routeObject.namespace ?? ''
  const cluster = routeObject.cluster ?? ''
  const kind = routeObject.kind ?? ''
  const apigroup = routeObject.apigroup ?? ''
  const apiversion = routeObject.apiversion ?? ''
  const apiVersion = `${apigroup}/${apiversion}`

  toggleLoading()

  if (cluster === hubClusterName) {
    // Handle hub cluster - direct API access
    const route = getResource({ apiVersion, kind, metadata: { namespace, name } }).promise
    route
      .then((result: RouteObject) => {
        toggleLoading()
        openRouteURLWindow(result)
      })
      .catch((err: any) => {
        toggleLoading()
        console.error('Error getting resource: ', err)
      })
  } else {
    // Handle remote cluster using ManagedClusterView
    fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
      .then((viewResponse: any) => {
        toggleLoading()
        if (viewResponse.message) {
          // Handle error case - could add error handling here
        } else {
          openRouteURLWindow(viewResponse.result)
        }
      })
      .catch((err: any) => {
        toggleLoading()
        console.error('Error getting resource: ', err)
      })
  }
}

/**
 * Searches for Argo CD routes using the search API
 * Used when accessing Argo CD on remote managed clusters
 *
 * @param appName - Application name
 * @param appNamespace - Application namespace
 * @param cluster - Target cluster name
 * @param t - Translation function
 * @param hubClusterName - Hub cluster name
 */
const getArgoRouteFromSearch = async (
  appName: string,
  appNamespace: string,
  cluster: string,
  t: TranslationFunction,
  hubClusterName: string
): Promise<void> => {
  // Build search query for Argo CD routes
  const query: SearchQuery = convertStringToQuery(
    `kind:route namespace:${appNamespace} cluster:${cluster} label:app.kubernetes.io/part-of=argocd`
  )

  try {
    const result = await searchClient.query({
      query: SearchResultItemsAndRelatedItemsDocument,
      variables: {
        input: [{ ...query }],
        limit: 1000,
      },
      fetchPolicy: 'network-only',
    })

    if (result.errors) {
      console.log(`Error: ${result.errors[0].message}`)
      return
    }

    const searchResult = result.data?.searchResult ?? []
    if (searchResult.length > 0) {
      let route: any = null

      // Filter out Grafana and Prometheus routes
      const routes = (searchResult[0]?.items ?? []).filter(
        (routeObj: any) =>
          !(routeObj.name ?? '').toLowerCase().includes('grafana') &&
          !(routeObj.name ?? '').toLowerCase().includes('prometheus')
      )

      if (routes.length > 0) {
        // Prefer routes with 'server' in the name
        const serverRoute = routes.find((routeObj: any) => (routeObj.name ?? '').toLowerCase().includes('server'))
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
      }

      // Use the found route to get the actual route resource
      await getArgoRoute(
        appName,
        appNamespace,
        cluster,
        {
          cluster,
          name: route.name,
          namespace: route.namespace,
          kind: 'Route',
          apiVersion: 'route.openshift.io/v1',
        },
        hubClusterName
      )
    }
  } catch (error) {
    console.error('Error searching for Argo route:', error)
  }
}

/**
 * Opens the Argo CD editor in a new browser window
 * Constructs the URL from the route specification
 *
 * @param route - Route object containing host and TLS information
 * @param appName - Application name to navigate to
 */
const openArgoEditorWindow = (route: RouteObject, appName: string): void => {
  const hostName = route.spec?.host ?? 'unknown'
  const transport = route.spec?.tls ? 'https' : 'http'
  const argoURL = `${transport}://${hostName}/applications`
  window.open(`${argoURL}/${appName}`, '_blank')
}

/**
 * Opens a route URL in a new browser window
 * Constructs the URL from the route specification
 *
 * @param route - Route object containing host and TLS information
 */
const openRouteURLWindow = (route: RouteObject): void => {
  const hostName = route.spec?.host ?? 'unknown'
  const transport = route.spec?.tls ? 'https' : 'http'
  const routeURL = `${transport}://${hostName}`
  window.open(`${routeURL}`, '_blank')
}
