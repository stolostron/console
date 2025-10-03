/* Copyright Contributors to the Open Cluster Management project */
import { getPulseStatusForAnsibleNode } from '../helpers/ansible-task'
import { pulseValueArr } from '../helpers/diagram-helpers'
import {
  getClusterName,
  getTargetNsForNode,
  isDeployableResource,
  isResourceNamespaceScoped,
} from '../helpers/diagram-helpers-utils'
import type {
  TopologyNodeWithStatus,
  PulseColor,
  StatusType,
  StatusCode,
  ArgoHealthStatus,
  ClusterInfo,
  ClusterStatus,
  ResourceItemWithStatus,
  SubscriptionItem,
  PodInfo,
  ApplicationModel,
  ExtendedTopology,
  GetResourceStatussResult,
  ResourceStatusResult,
  ApplicationData,
  AppSetApplicationModel,
  SubscriptionApplicationData,
} from '../types'
import {
  ArgoApplication,
  ArgoApplicationKind,
  ArgoApplicationApiVersion,
} from '../../../../../resources/argo-application'
import { getArgoResourceStatuses } from './resourceStatusesArgo'
import { getAppSetResourceStatuses } from './resourceStatusesAppSet'
import { getSubscriptionResourceStatuses } from './resourceStatusesSubscription'
import { deepClone, safeGet, safeSet } from '../utils'
import { TFunction } from 'react-i18next'
import { getStateNames } from './NodeDetailsProviderStatuses'

// Constants for node specification paths
const specPulse = 'specs.pulse'
const specShapeType = 'specs.shapeType'
export const specIsDesign = 'specs.isDesign'
const specIsBlocked = 'specs.isBlocked'
export const showResourceYaml = 'show_resource_yaml'

// Status constants for UI display
export const checkmarkStatus: StatusType = 'checkmark'
export const warningStatus: StatusType = 'warning'
export const pendingStatus: StatusType = 'pending'
export const failureStatus: StatusType = 'failure'

// Status codes for priority ordering (lower number = higher severity)
export const checkmarkCode: StatusCode = 3
export const warningCode: StatusCode = 2
export const pendingCode: StatusCode = 1
export const failureCode: StatusCode = 0

// Resource state arrays for status classification
const resGreenStates = ['running', 'bound'] as const
export const resErrorStates = [
  'err',
  'off',
  'invalid',
  'kill',
  'propagationfailed',
  'imagepullbackoff',
  'crashloopbackoff',
  'lost',
] as const
const resWarningStates = [pendingStatus, 'creating', 'terminating'] as const

// API and metadata path constants
export const apiVersionPath = 'specs.raw.apiVersion'
export const metadataName = 'metadata.name'

// Argo application health status constants
export const argoAppHealthyStatus: ArgoHealthStatus = 'Healthy'
const argoAppDegradedStatus: ArgoHealthStatus = 'Degraded'
const argoAppMissingStatus: ArgoHealthStatus = 'Missing'
export const argoAppProgressingStatus: ArgoHealthStatus = 'Progressing'
export const argoAppUnknownStatus: ArgoHealthStatus = 'Unknown'
const argoAppSuspendedStatus: ArgoHealthStatus = 'Suspended'

// Pulse color constants
const redPulse: PulseColor = 'red'
const greenPulse: PulseColor = 'green'
const yellowPulse: PulseColor = 'yellow'
const orangePulse: PulseColor = 'orange'
const blockedPulse: PulseColor = 'blocked'

///////////////////////////////////////////////////////////////////////////////////////
/////////////////////////// COMPUTE EACH DIAGRAM NODE STATUS ////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

/**
 * Computes the status pulse for a topology node based on its type and current state.
 * This is the main entry point for determining node status visualization.
 *
 * @param node - The topology node to compute status for
 * @param isSearchingStatusComplete - Whether the search for status information is complete
 * @param t - Translation function for internationalization
 * @param hubClusterName - Name of the hub cluster
 * @returns The pulse color representing the node's status
 */
export const computeNodeStatus = (
  node: TopologyNodeWithStatus,
  isSearchingStatusComplete: boolean,
  t: TFunction,
  hubClusterName: string
): PulseColor => {
  let pulse: PulseColor = greenPulse
  let shapeType = node.type
  let apiVersion: string | undefined

  // Show spinner while still querying statuses
  if (!isSearchingStatusComplete) {
    safeSet(node, specPulse, 'spinner')
    return 'spinner'
  }

  const isDeployable = isDeployableResource(node)
  const isDesign = safeGet(node, specIsDesign, false)
  const isBlocked = safeGet(node, specIsBlocked, false)

  // Compute status based on node type
  switch (node.type) {
    case 'fluxapplication':
    case 'ocpapplication':
      // OCP and Flux apps are always green (no additional status computation needed)
      break

    case 'application':
      apiVersion = safeGet<string>(node, apiVersionPath, '')
      if (apiVersion && apiVersion.indexOf('argoproj.io') > -1 && !isDeployable) {
        // This is an Argo CD application
        pulse = getPulseStatusForArgoApp(node)
      } else {
        if (isDeployable || !isDesign) {
          // Deployable resource or not a design-time node
          pulse = getPulseStatusForGenericNode(node, t, hubClusterName)
        } else if (!safeGet<any>(node, 'specs.channels')) {
          // Design-time application without channels (no linked subscription)
          pulse = redPulse
        }
      }
      break

    case 'applicationset':
      if (isDeployable || !isDesign) {
        pulse = getPulseStatusForGenericNode(node, t, hubClusterName)
      } else {
        // Design-time ApplicationSet - check Argo app status
        pulse = getPulseStatusForArgoApp(node, true)
      }
      break

    case 'placements':
      if (isDeployable) {
        pulse = getPulseStatusForGenericNode(node, t, hubClusterName)
      } else if (!safeGet<any>(node, 'specs.raw.status.decisions')) {
        // PlacementRule without decisions
        pulse = redPulse
      }
      break

    case 'placement':
      if (isDeployable) {
        pulse = getPulseStatusForGenericNode(node, t, hubClusterName)
      } else if (safeGet<number>(node, 'specs.raw.status.numberOfSelectedClusters') === 0) {
        // Placement with no selected clusters
        pulse = redPulse
      }
      break

    case 'subscription':
      if (isBlocked) {
        // Subscription is blocked by time window
        pulse = blockedPulse
      } else if (isDeployable || !isDesign) {
        pulse = getPulseStatusForGenericNode(node, t, hubClusterName)
      } else {
        // Design-time subscription - check subscription-specific status
        pulse = getPulseStatusForSubscription(node, hubClusterName)
        shapeType = getShapeTypeForSubscription(node)
      }
      break

    case 'cluster':
      pulse = getPulseStatusForCluster(node, hubClusterName)
      break

    default:
      // Generic node status computation
      pulse = getPulseStatusForGenericNode(node, t, hubClusterName)
  }

  // Set computed values on the node
  safeSet(node, specPulse, pulse)
  safeSet(node, specShapeType, shapeType)
  return pulse
}

/////////////////////////////////////////////////////////////////
///////////////// SUBSCRIPTION //////////////////////////////////
/////////////////////////////////////////////////////////////////

/**
 * Computes the pulse status for a subscription node based on its deployment state
 * across clusters and any reported errors.
 *
 * @param node - The subscription node to evaluate
 * @param hubClusterName - Name of the hub cluster
 * @returns The pulse color representing subscription status
 */
export const getPulseStatusForSubscription = (node: TopologyNodeWithStatus, hubClusterName: string): PulseColor => {
  let pulse: PulseColor = greenPulse

  const resourceMap = safeGet<any>(node, `specs.${node.type}Model`)
  if (!resourceMap) {
    // Resource not available from search
    pulse = orangePulse
    return pulse
  }

  let isPlaced = false
  const onlineClusters = getOnlineClusters(node, hubClusterName)

  // Check subscription status across all clusters
  ;(Object.values(resourceMap) as SubscriptionItem[][]).flat().forEach((subscriptionItem: SubscriptionItem) => {
    const clsName = safeGet<string>(subscriptionItem, 'cluster', '')
    if (subscriptionItem.status) {
      if ((subscriptionItem.status || '').includes('Failed')) {
        pulse = redPulse
      }
      if (subscriptionItem.status === 'Subscribed' || subscriptionItem.status === 'Propagated') {
        isPlaced = true // At least one cluster has successful placement
      }
      if (
        (!onlineClusters.includes(clsName) ||
          (subscriptionItem.status !== 'Subscribed' && subscriptionItem.status !== 'Propagated')) &&
        pulse !== redPulse
      ) {
        pulse = yellowPulse // Cluster offline or subscription not successful
      }
    }
  })

  // If no placement found, set to yellow
  if (pulse === greenPulse && !isPlaced) {
    pulse = yellowPulse
  }

  // Check subscription report results for failures
  const subscriptionReportResults = safeGet(node, 'report.results', []) as Array<{ result?: string; source?: string }>
  subscriptionReportResults.forEach((clusterResult) => {
    if (clusterResult.result === 'failed') {
      pulse = redPulse
    }
  })

  // Check package statuses for failures
  const statuses = safeGet(node, 'specs.raw.status.statuses', {}) as Record<string, any>
  Object.values(statuses).forEach((cluster) => {
    const packageItems = safeGet(cluster, 'packages', {})
    const failedPackage = Object.values(packageItems).find(
      (item: any) => safeGet<string>(item, 'phase', '') === 'Failed'
    )
    if (failedPackage && pulse === greenPulse) {
      pulse = yellowPulse
    }
  })

  return pulse
}

/**
 * Determines the shape type for a subscription node based on whether it's blocked.
 *
 * @param node - The subscription node to evaluate
 * @returns The shape type string for rendering
 */
export const getShapeTypeForSubscription = (node: TopologyNodeWithStatus): string => {
  const blocked = safeGet<string>(node, 'specs.raw.status.message', '').includes('Blocked')
  if (blocked) {
    return 'subscriptionblocked'
  } else {
    return 'subscription'
  }
}

/////////////////////////////////////////////////////////////////
///////////////// ARGO APPLICATION //////////////////////////////
/////////////////////////////////////////////////////////////////

/**
 * Computes the pulse status for Argo CD applications or ApplicationSets
 * based on the health status of related applications.
 *
 * @param node - The Argo application or ApplicationSet node
 * @param isAppSet - Whether this is an ApplicationSet (vs single Application)
 * @returns The pulse color representing the Argo app status
 */
export const getPulseStatusForArgoApp = (node: TopologyNodeWithStatus, isAppSet?: boolean): PulseColor => {
  const relatedApps: ArgoApplication[] = isAppSet ? safeGet<ArgoApplication[]>(node, 'specs.appSetApps', []) : []
  const isArgoCDPullModelTargetLocalCluster = safeGet(node, 'isArgoCDPullModelTargetLocalCluster')

  if (!isAppSet) {
    // For single applications, add this node's status to the evaluation
    const appStatus = safeGet<ArgoHealthStatus>(node, 'specs.raw.status.health.status', argoAppUnknownStatus)
    relatedApps.push({
      apiVersion: ArgoApplicationApiVersion,
      kind: ArgoApplicationKind,
      metadata: {
        name: node.name,
        namespace: node.namespace,
      },
      spec: {
        destination: {
          name: node.cluster,
          namespace: node.namespace,
        },
        project: '',
        syncPolicy: undefined,
      },
      status: appStatus,
    })
  }

  let healthyCount = 0
  let missingUnknownProgressingSuspendedCount = 0
  let degradedCount = 0
  let appWithConditions = 0

  // Count apps with conditions (pull model targeting local cluster)
  if (relatedApps.length > 0 && isArgoCDPullModelTargetLocalCluster) {
    appWithConditions++
  }

  // Categorize applications by health status
  relatedApps.forEach((app) => {
    const relatedAppHealth = isAppSet
      ? safeGet(app, 'status.health.status', argoAppUnknownStatus)
      : (safeGet(app, 'status', '') as ArgoHealthStatus)
    const relatedAppConditions = isAppSet ? safeGet(app, 'status.conditions', []) : []

    if (relatedAppHealth === argoAppHealthyStatus) {
      healthyCount++
    } else if (
      relatedAppHealth === argoAppMissingStatus ||
      relatedAppHealth === argoAppUnknownStatus ||
      relatedAppHealth === argoAppProgressingStatus ||
      relatedAppHealth === argoAppSuspendedStatus
    ) {
      missingUnknownProgressingSuspendedCount++
    } else if (relatedAppHealth === argoAppDegradedStatus) {
      degradedCount++
    }

    if (Array.isArray(relatedAppConditions) && relatedAppConditions.length > 0) {
      appWithConditions++
    }
  })

  // Determine pulse based on application health distribution
  if (appWithConditions > 0) {
    return pulseValueArr[warningCode] as PulseColor
  }
  if (degradedCount === relatedApps.length) {
    return pulseValueArr[failureCode] as PulseColor
  }
  if (missingUnknownProgressingSuspendedCount === relatedApps.length) {
    return pulseValueArr[pendingCode] as PulseColor
  }
  if (healthyCount === 0 && missingUnknownProgressingSuspendedCount === 0 && degradedCount === 0) {
    return pulseValueArr[pendingCode] as PulseColor
  }
  if (healthyCount < relatedApps.length) {
    return pulseValueArr[warningCode] as PulseColor
  }

  return pulseValueArr[checkmarkCode] as PulseColor
}

/////////////////////////////////////////////////////////////////
///////////////// CLUSTER //////// //////////////////////////////
/////////////////////////////////////////////////////////////////

/**
 * Computes the pulse status for a cluster node based on the online/offline
 * status of all clusters associated with the node.
 *
 * @param node - The cluster node to evaluate
 * @param hubClusterName - Name of the hub cluster
 * @returns The pulse color representing cluster status
 */
export const getPulseStatusForCluster = (node: TopologyNodeWithStatus, hubClusterName?: string): PulseColor => {
  // Gather cluster information from various sources
  const clusters: ClusterInfo[] = safeGet<ClusterInfo[]>(node, 'specs.clusters', [])
  const appClusters = safeGet<string[]>(node, 'specs.appClusters', [])
  const clustersNames = safeGet<string[]>(node, 'specs.clustersNames')
  const targetNamespaces = safeGet<Record<string, unknown>>(node, 'specs.targetNamespaces', {})
  const appClustersList = appClusters.length > 0 ? appClusters : Object.keys(targetNamespaces)

  // Add Argo app clusters that aren't already in the clusters list
  if (appClustersList.length > 0) {
    appClustersList.forEach((appCls: string) => {
      if (clusters.findIndex((obj) => safeGet(obj, 'name') === appCls) === -1) {
        clusters.push({
          name: appCls,
          _clusterNamespace: appCls === hubClusterName ? appCls : '_',
          status: (appCls === hubClusterName ? 'ok' : '') as ClusterStatus,
        })
      }
    })
  }

  let okCount = 0
  let pendingCount = 0
  let offlineCount = 0

  // Evaluate status of each cluster
  clusters.forEach((cluster) => {
    let clusterName = cluster.name || cluster.metadata?.name
    if (clusterName === 'in-cluster') {
      clusterName = hubClusterName
    }
    if (
      !clustersNames ||
      (Array.isArray(clustersNames) && clusterName !== undefined && clustersNames.includes(clusterName))
    ) {
      const status = (cluster.status || calculateArgoClusterStatus(cluster) || '').toLowerCase()
      if (
        status === 'ok' ||
        status === 'ready' ||
        safeGet<string>(cluster, 'ManagedClusterConditionAvailable', '') === 'True'
      ) {
        okCount++
      } else if (status === 'pendingimport') {
        pendingCount++
      } else if (status === 'offline' || status === 'unknown') {
        offlineCount++
      }
    }
  })

  // Determine overall cluster status
  if (offlineCount > 0 || (pendingCount === clusters.length && pendingCount === 0)) {
    return redPulse
  }
  if (pendingCount === clusters.length) {
    return orangePulse
  }
  if (okCount < clusters.length) {
    return yellowPulse
  }
  return greenPulse
}

/**
 * Calculates the status of an Argo cluster based on its managed cluster conditions.
 * Note: This calculation may not be fully accurate as search doesn't return all
 * needed data from the managedcluster resource YAML.
 *
 * @param clusterData - The cluster data to evaluate
 * @returns The calculated cluster status
 */
export const calculateArgoClusterStatus = (clusterData: ClusterInfo): string => {
  let status = ''
  const clusterAccepted = clusterData.HubAcceptedManagedCluster
  const clusterJoined = clusterData.ManagedClusterJoined
  const clusterAvailable = clusterData.ManagedClusterConditionAvailable

  if (clusterAccepted !== 'True') {
    status = 'notaccepted'
  } else if (clusterJoined !== 'True') {
    status = 'pendingimport'
  } else {
    status = clusterAvailable && clusterAvailable === 'True' ? 'ok' : 'offline'
  }

  return status
}

/**
 * Gets the list of online clusters for a given node by checking cluster status
 * across placement rules and search results.
 *
 * @param node - The node to get online clusters for
 * @param hubClusterName - Name of the hub cluster
 * @returns Array of online cluster names
 */
export const getOnlineClusters = (node: TopologyNodeWithStatus, hubClusterName: string): string[] => {
  const clusterNames = safeGet(node, 'specs.clustersNames', []) as string[]
  const prClusters = safeGet(node, 'clusters.specs.clusters', []) as ClusterInfo[]
  const searchClusters = safeGet(node, 'specs.searchClusters', []) as ClusterInfo[]
  const clusterObjs = prClusters.length > searchClusters.length ? prClusters : searchClusters
  const onlineClusters: string[] = []

  clusterNames.forEach((clsName) => {
    const cluster = clsName.trim()
    if (cluster === hubClusterName) {
      onlineClusters.push(cluster)
    } else {
      const matchingCluster = clusterObjs.find(
        (cls) => safeGet(cls, 'name', '') === cluster || safeGet(cls, metadataName, '') === cluster
      )
      if (
        matchingCluster &&
        (['ok', 'pendingimport', 'OK'].includes(safeGet(matchingCluster, 'status', '') || '') ||
          (safeGet<string>(matchingCluster, 'ManagedClusterConditionAvailable', '') || '') === 'True')
      ) {
        onlineClusters.push(cluster)
      }
    }
  })

  // Always include the hub cluster as online
  return [...new Set([...onlineClusters, hubClusterName])]
}

/////////////////////////////////////////////////////////////////
///////////////// GENERIC ///////////////////////////////////////
/////////////////////////////////////////////////////////////////

/**
 * Computes the pulse status for generic nodes by checking resource deployment
 * status across clusters and evaluating resource health.
 *
 * @param node - The node to evaluate
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns The pulse color representing node status
 */
const getPulseStatusForGenericNode = (
  node: TopologyNodeWithStatus,
  t: TFunction,
  hubClusterName: string
): PulseColor => {
  const { deployedStr, resNotDeployedStates } = getStateNames(t)

  // Handle Ansible job status specially
  const nodeType = safeGet<string>(node, 'type', '')
  if (nodeType === 'ansiblejob' && safeGet<any>(node, 'specs.raw.hookType')) {
    // Process only ansible hooks
    return getPulseStatusForAnsibleNode(node)
  }

  let pulse: PulseColor = greenPulse
  const namespace = safeGet<string>(node, 'namespace', '')
  const resourceMap = safeGet<any>(node, `specs.${node.type}Model`)
  const resourceCount = safeGet<number>(node, 'specs.resourceCount')
  const clusterNames = getClusterName(node.id, node, true, hubClusterName).split(',')
  const onlineClusters = getOnlineClusters(node, hubClusterName)

  // If no resourceMap from search query or no online clusters, show unknown status
  if (!resourceMap || onlineClusters.length === 0) {
    pulse = orangePulse
    if (nodeType === 'placement') {
      pulse = greenPulse // Placements are OK without resources
    }
    return pulse
  }

  // Check if resource count matches expected (except for pods which are handled specially)
  if (resourceCount && resourceCount !== Object.keys(resourceMap).length && nodeType !== 'pod') {
    return yellowPulse
  }

  // Evaluate resources across all clusters
  let highestPulse = 3 // Start with best possible status
  let pendingPulseCount = 0

  clusterNames.forEach((clusterName) => {
    clusterName = clusterName.trim()

    // Get target cluster namespaces
    const resourceNSString = !isResourceNamespaceScoped(node) ? 'name' : 'namespace'
    const resourcesForCluster = (Object.values(resourceMap) as ResourceItemWithStatus[][])
      .flat()
      .filter((obj: any) => safeGet<string>(obj, 'cluster', '') === clusterName)
    const targetNSList = getTargetNsForNode(node, resourcesForCluster, clusterName, namespace)

    targetNSList.forEach((targetNS) => {
      const resourceItems = resourcesForCluster.filter(
        (obj: any) => safeGet<string>(obj, resourceNSString, '') === targetNS
      )

      if (resourceItems.length === 0) {
        pendingPulseCount++
        // Resource not found in this cluster/namespace
      } else {
        resourceItems.forEach((resourceItem: ResourceItemWithStatus) => {
          // Check if resource has desired vs available counts
          if (resourceItem.desired !== undefined) {
            pulse = getPulseForData(resourceItem.available || resourceItem.current || 0, resourceItem.desired, 0)
            resourceItem.resStatus = `${resourceItem.available || resourceItem.current || 0}/${resourceItem.desired}`
          } else {
            // Check resource status string
            const resStatus = safeGet<string>(resourceItem, 'status', deployedStr).toLowerCase()
            resourceItem.resStatus = resStatus

            if (resGreenStates.includes(resStatus as any)) {
              pulse = greenPulse
            }
            if (resErrorStates.includes(resStatus as any)) {
              pulse = redPulse
            }
            if ([...resWarningStates, ...resNotDeployedStates].includes(resStatus as any)) {
              pulse = yellowPulse
            }
          }

          resourceItem.pulse = pulse
          const index = pulseValueArr.indexOf(pulse)
          if (index >= 0 && index < highestPulse) {
            highestPulse = index
          }
        })
      }

      const index = pulseValueArr.indexOf(pulse)
      if (index !== -1 && index < highestPulse) {
        highestPulse = index
      }
    })

    const index = pulseValueArr.indexOf(pulse)
    if (index !== -1 && index < highestPulse) {
      highestPulse = index
    }
  })

  // If some clusters are pending but not all, set to yellow
  if (pendingPulseCount > 0 && pendingPulseCount < clusterNames.length) {
    const index = pulseValueArr.indexOf(yellowPulse)
    if (index !== -1 && index < highestPulse) {
      highestPulse = index
    }
  }

  return pulseValueArr[highestPulse] as PulseColor
}

/**
 * Counts pods in a specific state for a given cluster.
 *
 * @param podItem - The pod item to evaluate
 * @param clusterName - Name of the cluster to filter by
 * @param types - Array of status types to match against
 * @returns 1 if pod matches criteria, 0 otherwise
 */
export const getPodState = (podItem: PodInfo, clusterName: string, types: string[]): number => {
  const podStatus = safeGet<string>(podItem, 'status', 'unknown').toLowerCase()

  let result = 0
  if (!clusterName || clusterName === safeGet<string>(podItem, 'cluster', 'unknown')) {
    types.forEach((type) => {
      if (podStatus.includes(type)) {
        result = 1
      }
    })
  }
  return result
}

/**
 * Determines pulse color based on available vs desired resource counts.
 *
 * @param available - Number of available resources
 * @param desired - Number of desired resources
 * @param podsUnavailable - Number of unavailable pods
 * @returns The appropriate pulse color
 */
export const getPulseForData = (available: number, desired: number, podsUnavailable: number): PulseColor => {
  if (available === desired) {
    return greenPulse
  }

  if (podsUnavailable > 0 || available === 0) {
    return redPulse
  }

  if (available < desired) {
    return yellowPulse
  }

  if (desired <= 0) {
    return yellowPulse
  }

  if (!desired && available === 0) {
    return orangePulse
  }

  return greenPulse
}

/**
 * Retrieves resource statuses for different types of applications based on their configuration.
 * This function acts as a dispatcher that routes to the appropriate resource status retrieval
 * function based on the application type (Argo, ApplicationSet, OCP, Flux, or Subscription).
 *
 * @param application - The application model containing metadata and type information
 * @param appData - Application data object that will be augmented with status information
 * @param topology - Topology data structure containing nodes and links (optional for some app types)
 * @returns Promise resolving to an object containing resource statuses, related resources, and updated app data
 */
export async function getResourceStatuses(
  application: ApplicationModel,
  appData: ApplicationData,
  topology: ExtendedTopology
): Promise<GetResourceStatussResult> {
  // Create a deep copy of appData to avoid mutating the original object
  const appDataWithStatuses = deepClone(appData)

  let results: ResourceStatusResult

  // Route to the appropriate resource status function based on application type
  if (application.isArgoApp) {
    // Handle Argo CD applications - requires topology data for resource discovery
    results = await getArgoResourceStatuses(application, appDataWithStatuses, topology)
  } else if (application.isAppSet) {
    // Handle ApplicationSet resources - uses pull model for multi-cluster deployments
    results = await getAppSetResourceStatuses(application as unknown as AppSetApplicationModel, appDataWithStatuses)
  } else if (application.isOCPApp || application.isFluxApp) {
    // Handle OpenShift and Flux applications - reuse existing search data from topology
    results = {
      // Reuse the search data we fetched before to avoid redundant API calls
      resourceStatuses: topology.rawSearchData,
      relatedResources: {},
    }
  } else {
    // Handle subscription-based applications (ACM/MCE subscription model)
    results = await getSubscriptionResourceStatuses(application, appDataWithStatuses as SubscriptionApplicationData)
  }

  // Extract results and ensure relatedResources is always defined
  const { resourceStatuses, relatedResources = {} } = results

  // Return deep-cloned resource statuses to prevent external mutations,
  // along with related resources and the augmented app data
  return {
    resourceStatuses: deepClone(resourceStatuses),
    relatedResources,
    appDataWithStatuses,
  }
}
