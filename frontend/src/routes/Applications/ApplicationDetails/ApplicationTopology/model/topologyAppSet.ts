/* Copyright Contributors to the Open Cluster Management project */

// Lodash imports removed - using native TypeScript equivalents
import { TFunction } from 'react-i18next'
import { getResource, listNamespacedResources } from '../../../../../resources/utils'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchRelatedResult, SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import { convertStringToQuery } from '../helpers/search-helper'
import { ToolbarControl } from '../topology/components/TopologyToolbar'
import {
  ApplicationModel,
  AppSetCluster,
  ExtendedTopology,
  ManagedClusterViewData,
  ProcessedDeployableResource,
  ResourceItem,
  RouteObject,
  SearchQuery,
  TopologyLink,
  TopologyNode,
} from '../types'
import {
  addClusters,
  addTopologyNode,
  createControllerRevisionChild,
  createDataVolumeChild,
  createReplicaChild,
  createVirtualMachineInstance,
  getClusterName,
  getResourceTypes,
  processMultiples,
} from './topologyUtils'

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
export async function getAppSetTopology(
  toolbarControl: ToolbarControl,
  application: ApplicationModel,
  hubClusterName: string
): Promise<ExtendedTopology> {
  const links: TopologyLink[] = []
  const nodes: TopologyNode[] = []
  const {
    name,
    namespace,
    appSetClusters = [],
    appSetApps = [],
    appStatusByNameMap = {},
    relatedPlacement,
  } = application
  const allClusterNames = appSetClusters.map((cluster: AppSetCluster) => cluster.name)
  toolbarControl.setAllClusters?.(allClusterNames)
  const { activeTypes, activeClusters, activeApplications } = toolbarControl
  const clusterNames = activeClusters && activeClusters.length > 0 ? activeClusters : allClusterNames

  /////////////////////////////////////////////
  ////  APPLICATION SET NODE /////////////////
  /////////////////////////////////////////////
  const appId = `application--${name}`
  const appSetNode: TopologyNode = {
    name,
    namespace,
    type: 'applicationset',
    id: appId,
    uid: appId,
    specs: {
      isDesign: true,
      raw: application.app,
      allClusters: {
        isLocal: allClusterNames.includes(hubClusterName),
        remoteCount: allClusterNames.includes(hubClusterName) ? allClusterNames.length - 1 : allClusterNames.length,
      },
      clusterNames: allClusterNames,
      appSetApps,
      appSetClusters,
      appStatusByNameMap,
    },
  }
  nodes.push(appSetNode)

  /////////////////////////////////////////////
  ////  PLACEMENT NODE /////////////////
  /////////////////////////////////////////////

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

  /////////////////////////////////////////////
  ////  CLUSTER NODE /////////////////
  /////////////////////////////////////////////

  const clusterId = addClusters(
    clusterParentId,
    undefined,
    source,
    activeClusters ?? allClusterNames,
    (appSetClusters || []) as any,
    links,
    nodes
  )

  ////////////////////////////////////////////////////////////////
  ////  USE SEARCH TO GET APPLICATION SET RESOURCES /////////////////
  ////////////////////////////////////////////////////////////////
  const { applicationResourceMap, applicationNames } = await getAppSetResources(
    name,
    namespace,
    appSetApps,
    allClusterNames
  )

  if (Object.keys(applicationResourceMap).length === 0 && applicationNames.length === 0) {
    // fallback to single application mode
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

    processResources(resources, clusterId, clusterNames, hubClusterName, activeTypes ?? [], links, nodes)
  }

  ////  SET TOOLBAR FILTERS ///////////////////
  toolbarControl.setAllApplications(applicationNames.length > 0 ? applicationNames : [name])
  const allApplicationTypes = new Set<string>()

  /////////////////////////////////////////////
  ////  APPLICATION RESOURCE NODES /////////////////
  /////////////////////////////////////////////
  let parentNodeId = clusterId
  Object.entries(applicationResourceMap).forEach(([appNameClusterKey, resources]) => {
    const [appName, clusterName] = appNameClusterKey.split('--')
    // if there are multiple applications and moe then one application is selected,
    // we need to insert an application node above the resources
    const isApplicationFiltered =
      applicationNames.length > 0 && activeApplications && !activeApplications.includes(appName)
    if (applicationNames.length > 0 && !isApplicationFiltered) {
      // Has application name - create application node
      parentNodeId = `member--application--${clusterName}--${appName}`
      const healthStatus = appStatusByNameMap[`${name}-${appName}`]?.health.status || 'Healthy'
      const appNode: TopologyNode = {
        name: appName,
        namespace,
        type: 'application',
        id: parentNodeId,
        uid: parentNodeId,
        specs: {
          isDesign: false,
          clustersNames: clusterNames,
          raw: {
            apiVersion: 'argoproj.io/v1alpha1',
            kind: 'Application',
            status: {
              health: {
                status: healthStatus,
              },
            },
          },
          parent: {
            clusterId,
          },
        },
        detailsNode: appSetNode,
      }
      nodes.push(appNode)
      links.push({
        from: { uid: clusterId },
        to: { uid: parentNodeId },
        type: '',
      })
    }
    if (!isApplicationFiltered) {
      // Collect resource types
      const types = getResourceTypes(resources as Record<string, unknown>[])
      types.forEach((type) => allApplicationTypes.add(type))

      // Process and create resource nodes under the cluster or application node
      processResources(resources, parentNodeId, clusterNames, hubClusterName, activeTypes ?? [], links, nodes)
    }
  })

  // Set all resource types in toolbar
  toolbarControl.setAllTypes?.([...allApplicationTypes])
  // Return complete topology with unique nodes and all links
  return {
    nodes: nodes.filter((node, index, array) => array.findIndex((n) => n.uid === node.uid) === index), // Remove duplicate nodes based on unique ID
    links,
  }
}

async function getAppSetResources(name: string, namespace: string, appSetApps: any[], allClusterNames: string[]) {
  // first get all applications that belong to this appset
  if (appSetApps.length === 0) {
    return {
      applicationResourceMap: {},
      applicationNames: [],
    }
  }
  const query: SearchQuery = convertStringToQuery(
    `name:${appSetApps?.map((application: ResourceItem) => application.metadata?.name).join(',')} namespace:${namespace} cluster:${allClusterNames.join(',')} apigroup:argoproj.io`
  )
  const appsetSearchResult = await searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [{ ...query }],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })

  const applications = appsetSearchResult.data?.searchResult?.[0]?.items
  // // Filter out excluded kinds from related results
  const excludedKinds = new Set([
    'application',
    'applicationset',
    'cluster',
    'subscription',
    'namespace',
    'pod',
    'replicaset',
  ])
  const relatedResults = appsetSearchResult.data?.searchResult?.[0]?.related?.filter(
    (relatedResult: SearchRelatedResult | null) => relatedResult && !excludedKinds.has(relatedResult.kind.toLowerCase())
  )

  // Sort cluster names by length (longest first) to match longer names before shorter ones
  const sortedAllClusterNames = [...allClusterNames].sort((a, b) => b.length - a.length)

  const applicationNameSet = new Set<string>()
  const applicationResourceMap: Record<string, ResourceItem[]> = {}

  applications?.forEach((application: ResourceItem) => {
    const compositeName = application.name as string
    const applicationUid = application._uid as string

    // Find related resources for this application on this cluster
    const resourceList =
      relatedResults?.flatMap(
        (relatedResult: SearchRelatedResult | null) =>
          relatedResult?.items?.filter((item: ResourceItem) => item._relatedUids?.includes(applicationUid)) ?? []
      ) ?? []

    // Remove appset name prefix to get namePart
    const namePart = compositeName.startsWith(name) ? compositeName.substring(name.length + 1) : compositeName

    // Find matching cluster name in namePart bounded by '-' (sorted longest first for correct matching)
    const clusterName = sortedAllClusterNames.find(
      (cluster: string) => namePart === cluster || namePart.includes(`-${cluster}`) || namePart.includes(`${cluster}-`)
    )

    // Extract application name by stripping cluster name from namePart
    const appName = clusterName ? namePart.replace(clusterName, '').replaceAll(/(?:^-)|(?:-$)/g, '') : namePart

    if (appName) {
      applicationNameSet.add(appName)
      applicationResourceMap[`${appName}--${clusterName ?? ''}`] = resourceList
    } else {
      applicationResourceMap[`${name}--${clusterName ?? ''}`] = resourceList
    }
  })

  return {
    applicationResourceMap,
    applicationNames: [...applicationNameSet] as string[],
  }
}

/**
 * Processes resources and creates topology nodes for deployable resources
 * Creates nodes for each resource including child nodes for replicas, controller revisions, etc.
 *
 * @param resources - Array of resources to process
 * @param parentId - ID of the parent node to link resources to
 * @param parentClusterNames - Array of cluster names where resources are deployed
 * @param hubClusterName - Name of the hub cluster
 * @param activeTypes - Active resource types from toolbar filter
 * @param links - Array to add topology links to
 * @param nodes - Array to add topology nodes to
 */
function processResources(
  resources: ResourceItem[],
  parentId: string,
  parentClusterNames: string[],
  hubClusterName: string,
  activeTypes: string[],
  links: TopologyLink[],
  nodes: TopologyNode[]
): void {
  // clone resources for each cluster
  const allResources: ResourceItem[] = []
  parentClusterNames.forEach((clusterName: string) => {
    resources.forEach((resource: any) => {
      allResources.push({ ...resource, cluster: clusterName })
    })
  })

  // create nodes for each resource
  processMultiples(allResources).forEach((deployable: Record<string, unknown>) => {
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
      parentId,
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
    let deployableObj: TopologyNode = {
      name: deployableName,
      namespace: deployableNamespace,
      type,
      id: memberId,
      uid: memberId,
      specs: {
        isDesign: false,
        raw,
        clustersNames: parentClusterNames,
        parent: {
          clusterId: parentId,
        },
        resources: deployableResources,
        resourceCount: resourceCount || parentClusterNames.length,
      },
    }

    // Add deployable node and link to parent
    deployableObj = addTopologyNode(parentId, deployableObj, activeTypes, links, nodes)

    // Create replica child nodes (for Deployments, ReplicaSets, etc.)
    const template = { metadata: {} }
    createReplicaChild(deployableObj, parentClusterNames || [], template, activeTypes, links, nodes)

    // Create controller revision child nodes (for DaemonSets, StatefulSets)
    createControllerRevisionChild(deployableObj, parentClusterNames || [], activeTypes, links, nodes)

    // Create data volume child nodes (for KubeVirt)
    createDataVolumeChild(deployableObj, parentClusterNames || [], activeTypes, links, nodes)

    // Create virtual machine instance child nodes (for KubeVirt)
    createVirtualMachineInstance(deployableObj, parentClusterNames || [], activeTypes, links, nodes)
  })
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
  t: TFunction,
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
    fleetResourceRequest('GET', clusterName, {
      apiVersion,
      kind,
      name,
      namespace,
    })
      .then((res: any) => {
        if ('errorMessage' in res) {
          // Handle error case - could add error handling here
        } else {
          openArgoEditorWindow(res, appName)
        }
      })
      .catch((err) => {
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
    fleetResourceRequest('GET', cluster, {
      apiVersion,
      kind,
      name,
      namespace,
    })
      .then((res: any) => {
        if ('errorMessage' in res) {
          // Handle error case - could add error handling here
        } else {
          openRouteURLWindow(res)
        }
      })
      .catch((err) => {
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
  t: TFunction,
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
