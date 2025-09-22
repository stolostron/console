/* Copyright Contributors to the Open Cluster Management project */

// Lodash replaced with native TypeScript implementations

// Utility function to safely get nested properties (replaces lodash get)
function safeGet<T = any>(obj: any, path: string | string[], defaultValue?: T): T {
  if (!obj || typeof obj !== 'object') return defaultValue as T

  const keys = Array.isArray(path) ? path : path.split('.')
  let result = obj

  for (const key of keys) {
    if (result == null || typeof result !== 'object') {
      return defaultValue as T
    }
    result = result[key]
  }

  return result === undefined ? (defaultValue as T) : result
}

// Utility function to safely set nested properties (replaces lodash set)
function safeSet(obj: any, path: string | string[], value: any): void {
  if (!obj || typeof obj !== 'object') return

  const keys = Array.isArray(path) ? path : path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

// Deep clone utility (replaces lodash cloneDeep)
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}
import { getPulseStatusForAnsibleNode, showAnsibleJobDetails } from '../elements/helpers/ansible-task'
import {
  addDetails,
  addNodeServiceLocation,
  addOCPRouteLocation,
  addPropertyToList,
  createEditLink,
  getNodePropery,
  pulseValueArr,
} from '../elements/helpers/diagram-helpers'
import {
  filterSubscriptionObject,
  getActiveFilterCodes,
  getClusterName,
  getTargetNsForNode,
  isDeployableResource,
  isResourceNamespaceScoped,
  nodeMustHavePods,
  showMissingClusterDetails,
} from '../elements/helpers/diagram-helpers-utils'
import { isSearchAvailable } from '../elements/helpers/search-helper'
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
  ArgoApplication,
  ActiveFilters,
  StateNames,
  DetailItem,
  WindowStatusArray,
  TranslationFunction,
  ApplicationModel,
  ExtendedTopology,
  GetResourceStatussResult,
  ResourceStatusResult,
} from '../types'
import { getArgoResourceStatuses } from './resourceStatusesArgo'
import { getAppSetResourceStatuses } from './resourceStatusesAppSet'
import { getSubscriptionResourceStatuses } from './resourceStatusesSubscription'

// Constants for node specification paths
const specPulse = 'specs.pulse'
const specShapeType = 'specs.shapeType'
const specIsDesign = 'specs.isDesign'
const specIsBlocked = 'specs.isBlocked'
const showResourceYaml = 'show_resource_yaml'

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
const resErrorStates = [
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
const apiVersionPath = 'specs.raw.apiVersion'
export const metadataName = 'metadata.name'

// Argo application health status constants
const argoAppHealthyStatus: ArgoHealthStatus = 'Healthy'
const argoAppDegradedStatus: ArgoHealthStatus = 'Degraded'
const argoAppMissingStatus: ArgoHealthStatus = 'Missing'
const argoAppProgressingStatus: ArgoHealthStatus = 'Progressing'
const argoAppUnknownStatus: ArgoHealthStatus = 'Unknown'
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
  t: TranslationFunction,
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
    const failedPackage = Object.values(packageItems).find((item: any) => safeGet(item, 'phase', '') === 'Failed')
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
      status: { health: { status: appStatus } },
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
export const getPulseStatusForCluster = (node: TopologyNodeWithStatus, hubClusterName: string): PulseColor => {
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

  if (clusterAccepted === false) {
    status = 'notaccepted'
  } else if (clusterJoined === false) {
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
          (safeGet(matchingCluster, 'ManagedClusterConditionAvailable', '') || '') === 'True')
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
  t: TranslationFunction,
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
 * Gets localized state names for resource deployment status.
 *
 * @param t - Translation function
 * @returns Object containing localized state names and arrays
 */
const getStateNames = (t: TranslationFunction): StateNames => {
  const notDeployedStr = t('Not Deployed')
  const notDeployedNSStr = t('Not Created')
  const deployedStr = t('Deployed')
  const deployedNSStr = t('Created')
  const resNotDeployedStates = [notDeployedStr.toLowerCase(), notDeployedNSStr.toLowerCase()]
  const resSuccessStates = [
    'run',
    'bound',
    deployedStr.toLowerCase(),
    deployedNSStr.toLowerCase(),
    'propagated',
    'healthy',
    'active',
    'available',
    'running',
  ]
  return { notDeployedStr, notDeployedNSStr, deployedStr, deployedNSStr, resNotDeployedStates, resSuccessStates }
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

///////////////////////////////////////////////////////////////////////////////////////
////////////////////////  SET STATUS IN DETAILS TAB ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
//////////////////// APPLICATION /////////////////////////
///////////////////////////////////////////////////////////

/**
 * Sets deployment status details for application nodes in the details panel.
 * Handles both regular applications and Argo CD applications.
 *
 * @param node - The application node
 * @param details - Array to add detail items to
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */
export const setApplicationDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TranslationFunction,
  hubClusterName: string
): DetailItem[] => {
  const isDesign = safeGet<boolean>(node, specIsDesign, false)
  if ((node.type !== 'application' || !isDesign) && (node.type !== 'applicationset' || !isDesign)) {
    return details
  }

  const apiVersion = safeGet<string>(node, apiVersionPath, '')
  if (node.type === 'applicationset') {
    setAppSetDeployStatus(node, details, t, hubClusterName)
  } else if (apiVersion && apiVersion.indexOf('argoproj.io') > -1) {
    setArgoApplicationDeployStatus(node, details, t)
  } else {
    // Regular ACM application - check for subscription selector
    addPropertyToList(
      details,
      getNodePropery(
        node,
        ['specs', 'raw', 'spec', 'selector'],
        t('Subscription Selector'),
        t('This application has no subscription match selector (spec.selector.matchExpressions)'),
        ''
      )
    )

    details.push({
      type: 'spacer',
    })

    // Show error if no channel (no linked subscription)
    if (!isDeployableResource(node) && !safeGet<any>(node, 'specs.channels')) {
      const appNS = safeGet<string>(node, 'namespace', 'NA')

      details.push({
        labelValue: t('Error'),
        value: t(
          'This application has no matched subscription. Make sure the subscription match selector spec.selector.matchExpressions exists and matches a Subscription resource created in the {{0}} namespace.',
          [appNS]
        ),
        status: failureStatus,
      })

      const subscrSearchLink = `/multicloud/search?filters={"textsearch":"kind%3Asubscription%20namespace%3A${appNS}%20cluster%3A${hubClusterName}"}`
      details.push({
        type: 'link',
        value: {
          label: t('View all subscriptions in {{0}} namespace', [appNS]),
          id: `${node.id}-subscrSearch`,
          data: {
            action: 'open_link',
            targetLink: subscrSearchLink,
          },
        },
      })
    }
  }

  return details
}

///////////////////////////////////////////////////////////
//////////////////// ARGO APPLICATION /////////////////////////
///////////////////////////////////////////////////////////

/**
 * Sets deployment status details for Argo CD applications.
 *
 * @param node - The Argo application node
 * @param details - Array to add detail items to
 * @param t - Translation function
 */
export const setArgoApplicationDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TranslationFunction
): void => {
  const relatedArgoApps = safeGet<ArgoApplication[]>(node, 'specs.relatedApps', [])
  if (relatedArgoApps.length === 0) {
    return // Search is not available
  }

  // Show error if app is not healthy
  const appHealth = safeGet(node, 'specs.raw.status.health.status')
  const appStatusConditions = safeGet(node, 'specs.raw.status.conditions')

  if ((appHealth === 'Unknown' || appHealth === 'Degraded' || appHealth === 'Missing') && appStatusConditions) {
    details.push({
      labelValue: t('Health status'),
      value: t(
        'The health status for application {{0}} is {{1}}. Use the Launch Argo editor action below to view the application details.',
        [safeGet(node, 'name', ''), appHealth]
      ),
      status: failureStatus,
    })
  }

  // Related Argo apps section
  details.push({
    type: 'label',
    labelValue: t('Related applications ({{0}})', [relatedArgoApps.length]),
  })

  details.push({
    type: 'spacer',
  })

  // Sort and display related Argo apps
  const sortedRelatedArgoApps = relatedArgoApps.sort((a, b) =>
    (safeGet(a, 'name', '') as string).toLowerCase().localeCompare((safeGet(b, 'name', '') as string).toLowerCase())
  )
  details.push({
    type: 'relatedargoappdetails',
    relatedargoappsdata: {
      argoAppList: sortedRelatedArgoApps,
    },
  })
}

/**
 * Sets deployment status details for ApplicationSet nodes.
 *
 * @param node - The ApplicationSet node
 * @param details - Array to add detail items to
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 */
export const setAppSetDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TranslationFunction,
  hubClusterName: string
): void => {
  const isPlacementFound = safeGet(node, 'isPlacementFound')
  if (!isPlacementFound) {
    details.push({
      labelValue: t('Error'),
      value: t(
        'The placement referenced in the ApplicationSet is not found. Make sure the placement is configured properly.'
      ),
      status: failureStatus,
    })
    return
  }

  const appSetApps = safeGet(node, 'specs.appSetApps', []) as ArgoApplication[]
  const isArgoCDPullModelTargetLocalCluster = safeGet(node, 'isArgoCDPullModelTargetLocalCluster')

  if (appSetApps.length === 0) {
    if (isArgoCDPullModelTargetLocalCluster) {
      details.push({
        labelValue: t('Error'),
        value: t(
          'The ArgoCD pull model does not support the hub cluster as a destination cluster. Filter out the hub cluster from the placement resource.'
        ),
        status: failureStatus,
      })
      return
    }

    details.push({
      labelValue: t('Error'),
      value: t(
        'There are no Argo applications created. Check the following resources and make sure they are configured properly: applicationset placement, gitopscluster, gitopscluster placement, managedclusterset. Also make sure the ApplicationSet feature is enabled if GitOps is deployed to a namespace other than openshift-gitops.'
      ),
      status: failureStatus,
    })
    return
  } else {
    if (isArgoCDPullModelTargetLocalCluster) {
      details.push({
        labelValue: t('Warning'),
        value: t(
          'The ArgoCD pull model does not support the hub cluster as a destination cluster. Filter out the hub cluster from the placement resource.'
        ),
        status: warningStatus,
      })
      details.push({
        type: 'spacer',
      })
    }
  }

  details.push({
    type: 'label',
    labelValue: t('Application deploy status'),
  })
  details.push({
    type: 'spacer',
  })

  // Display status for each ApplicationSet app
  appSetApps.forEach((argoApp: ArgoApplication) => {
    const appHealth = safeGet(argoApp, 'status.health.status', '') as ArgoHealthStatus
    const appSync = safeGet(argoApp, 'status.sync.status', '')
    const appName = safeGet(argoApp, metadataName, '') as string
    const appNamespace = safeGet(argoApp, 'metadata.namespace')
    const appStatusConditions = safeGet(argoApp, 'status.conditions', []) as Array<{ type: string; message: string }>

    details.push({
      labelValue: appName,
      value: appHealth,
    })
    details.push({
      labelValue: t('Sync status'),
      value: appSync,
    })

    appStatusConditions.forEach((condition: any) => {
      details.push({
        labelValue: condition.type,
        value: condition.message,
        status: failureStatus,
      })
    })

    details.push({
      type: 'link',
      value: {
        label: t('Launch Argo editor'),
        id: `argoapp-${appName}`,
        data: {
          action: 'open_argo_editor',
          name: appName,
          namespace: appNamespace,
          cluster: hubClusterName,
        },
      },
    })
    details.push({
      type: 'spacer',
    })
  })
}

/**
 * Gets the appropriate status type for an Argo application health status.
 *
 * @param healthStatus - The Argo health status
 * @returns The corresponding status type
 */
export const getStatusForArgoApp = (healthStatus: ArgoHealthStatus): StatusType => {
  if (healthStatus === argoAppHealthyStatus) {
    return checkmarkStatus
  }
  if (healthStatus === argoAppProgressingStatus) {
    return pendingStatus
  }
  if (healthStatus === argoAppUnknownStatus) {
    return failureStatus
  }
  return warningStatus
}

/**
 * Translates Argo health status to numeric code for priority ordering.
 *
 * @param healthStatus - The Argo health status
 * @returns Numeric status code (lower = higher severity)
 */
export const translateArgoHealthStatus = (healthStatus: ArgoHealthStatus): StatusCode => {
  if (healthStatus === argoAppHealthyStatus) {
    return 3
  }
  if (healthStatus === argoAppMissingStatus || healthStatus === argoAppUnknownStatus) {
    return 1
  }
  if (healthStatus === argoAppDegradedStatus) {
    return 0
  }
  return 2
}

///////////////////////////////////////////////////////////
//////////////////// SUBSCRIPTION /////////////////////////
///////////////////////////////////////////////////////////

/**
 * Sets deployment status details for subscription nodes, including cluster
 * deployment status and time window information.
 *
 * @param node - The subscription node
 * @param details - Array to add detail items to
 * @param activeFilters - Active status filters
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */
export const setSubscriptionDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  activeFilters: ActiveFilters,
  t: TranslationFunction,
  hubClusterName: string
): DetailItem[] => {
  const { resourceStatuses = new Set() } = activeFilters
  const activeFilterCodes = getActiveFilterCodes(resourceStatuses)
  const isDesign = safeGet<boolean>(node, specIsDesign, false)

  // Only process design-time subscriptions (not deployable ones)
  if (safeGet<string>(node, 'type', '') !== 'subscription' || isDeployableResource(node) || !isDesign) {
    return details
  }

  // Time window configuration
  const timeWindow = safeGet(node, 'specs.raw.spec.timewindow.windowtype')
  const timezone = safeGet(node, 'specs.raw.spec.timewindow.location', 'NA')
  const timeWindowDays = safeGet(node, 'specs.raw.spec.timewindow.daysofweek')
  const timeWindowHours = safeGet(node, 'specs.raw.spec.timewindow.hours', []) as any[]
  const isCurrentlyBlocked = safeGet(node, 'specs.isBlocked')

  let windowStatusArray: WindowStatusArray = []

  if (timeWindow) {
    windowStatusArray = (safeGet(node, 'specs.raw.status.message', '') as string).split(',')

    details.push({
      type: 'label',
      labelValue: t('Time Window'),
    })
    details.push({
      labelValue: t('Time Window type'),
      value: timeWindow,
    })

    if (timeWindowDays) {
      details.push({
        labelValue: t('Time Window days'),
        value: String(timeWindowDays),
      })
    }

    if (timeWindowHours) {
      timeWindowHours.forEach((timeH: any) => {
        details.push({
          labelValue: t('Time Window hours'),
          value: `${safeGet(timeH, 'start', 'NA')}-${safeGet(timeH, 'end', 'NA')}`,
        })
      })
    }

    details.push({
      labelValue: t('Time zone'),
      value: timezone,
    })

    details.push({
      labelValue: t('Currently blocked'),
      value: isCurrentlyBlocked ? t('Yes') : t('No'),
    })
  }

  // Local placement information
  const isLocalPlacementSubs = safeGet<boolean>(node, 'specs.raw.spec.placement.local')
  if (isLocalPlacementSubs) {
    details.push({
      type: 'spacer',
    })
    details.push({
      labelValue: t('Subscription deployed on local cluster'),
      value: 'true',
    })
  }

  details.push({
    type: 'spacer',
  })
  details.push({
    type: 'label',
    labelValue: t('Cluster deploy status'),
  })

  let localSubscriptionFailed = false
  let resourceMap = safeGet(node, 'specs.subscriptionModel', {})
  const filteredResourceMap = filterSubscriptionObject(resourceMap, activeFilterCodes)

  if (resourceStatuses.size > 0) {
    resourceMap = filteredResourceMap
  }

  const subscriptionReportResults = safeGet(node, 'report.results', [])
  const onlineClusters = getOnlineClusters(node, hubClusterName)

  // Process each subscription across clusters
  Object.values(resourceMap).forEach((subscriptions: any) => {
    subscriptions.forEach((subscription: SubscriptionItem) => {
      const subsCluster = safeGet<string>(subscription, 'cluster', '')

      if (!onlineClusters.includes(subsCluster)) {
        // Cluster is offline
        details.push({
          labelValue: subsCluster,
          value: t('Cluster is offline'),
          status: warningStatus,
        })
      } else {
        const isLocalFailedSubscription =
          subscription._hubClusterResource && safeGet<string>(subscription, 'status', 'Fail').includes('Fail')
        if (isLocalFailedSubscription) {
          localSubscriptionFailed = true
        }

        const isLinkedLocalPlacementSubs =
          isLocalPlacementSubs ||
          (safeGet<string>(subscription, 'localPlacement', '') === 'true' && subsCluster === hubClusterName)

        if (isLinkedLocalPlacementSubs || !subscription._hubClusterResource || isLocalFailedSubscription) {
          const subscriptionPulse = (safeGet<string>(subscription, 'status', '') || '').includes('Fail')
            ? failureStatus
            : safeGet<string | null>(subscription, 'status', null) === null
              ? warningStatus
              : checkmarkStatus

          // Error message for subscriptions without status
          const emptyStatusErrorMsg = subscription._hubClusterResource
            ? t(
                'This subscription has no status. If the status does not change to {{0}} after waiting for initial creation, verify that the multicluster-operators-hub-subscription pod is running on hub',
                ['Propagated']
              )
            : t(
                'This subscription has no status. If the status does not change to {{0}} after waiting for initial creation, verify that the application-manager pod is running on the remote cluster.',
                ['Subscribed']
              )

          const subscriptionStatus = safeGet<string>(subscription, 'status', emptyStatusErrorMsg)

          details.push({
            labelValue: subscription.cluster,
            value: subscriptionStatus,
            status: subscriptionPulse,
          })

          if (!isLocalPlacementSubs && isLinkedLocalPlacementSubs) {
            details.push({
              labelValue: t('Subscription deployed on local cluster'),
              value: 'true',
            })
          }

          setClusterWindowStatus(windowStatusArray, subscription, details, t)

          // Check for failed packages in subscription status
          const statuses = safeGet(node, 'specs.raw.status.statuses', {})
          const clusterStatus = safeGet(statuses, subscription.cluster, {}) as Record<string, unknown>
          const packageItems = safeGet(clusterStatus, 'packages', {}) as Record<string, unknown>
          const { reason } = safeGet(node, 'specs.raw.status', {}) as Record<string, unknown>
          const failedPackage = Object.values(packageItems).find((item: any) => safeGet(item, 'phase', '') === 'Failed')
          const failedSubscriptionStatus = (safeGet<string>(subscription, 'status', '') || '').includes('Failed')

          if (failedSubscriptionStatus) {
            details.push({
              labelValue: t('Error'),
              value: reason || t('Some resources failed to deploy. Use View resource YAML link to view the details.'),
              status: failureStatus,
            })
          }

          if (failedPackage && !failedSubscriptionStatus) {
            details.push({
              labelValue: t('Warning'),
              value: t('Some resources failed to deploy. Use View resource YAML link to view the details.'),
              status: warningStatus,
            })
          }

          // Check subscription report results
          const clusterResult = subscriptionReportResults.find((res: any) => res.source === subsCluster)
          if (clusterResult && clusterResult.result === 'failed') {
            details.push({
              labelValue: t('Error'),
              value: t('Some resources failed to deploy. Use View status YAML link to view the details.'),
              status: failureStatus,
            })

            const subscriptionStatusLink = createEditLink(
              node,
              hubClusterName,
              'SubscriptionStatus',
              subsCluster,
              'apps.open-cluster-management.io/v1alpha1'
            )
            details.push({
              type: 'link',
              value: {
                label: t('View status YAML'),
                data: {
                  action: 'show_resource_yaml',
                  cluster: subsCluster,
                  editLink: subscriptionStatusLink,
                },
              },
            })
          }
        }
      }

      details.push({
        type: 'spacer',
      })
    })
  })

  // Show missing remote placement error if applicable
  if (
    Object.keys(resourceMap).length === 0 &&
    !localSubscriptionFailed &&
    !isLocalPlacementSubs &&
    resourceStatuses.size === 0
  ) {
    details.push({
      labelValue: t('Remote subscriptions'),
      value: t(
        'This subscription was not added to a managed cluster. If this status does not change after waiting for initial creation, ensure the Placement Rule resource is valid and exists in the {{0}} namespace and that the application-manager pod runs on the managed clusters.',
        [node.namespace]
      ),
      status: failureStatus,
    })

    if (isSearchAvailable()) {
      const ruleSearchLink = `/multicloud/search?filters={"textsearch":"kind%3Aplacementrule%20namespace%3A${node.namespace}%20cluster%3A${hubClusterName}"}`
      details.push({
        type: 'link',
        value: {
          label: t('View all placement rules in {{0}} namespace', [node.namespace]),
          id: `${node.id}-subscrSearch`,
          data: {
            action: 'open_link',
            targetLink: ruleSearchLink,
          },
        },
      })
    }
  }

  details.push({
    type: 'spacer',
  })

  return details
}

///////////////////////////////////////////////////////////
//////////////////// RULE /////////////////////////
///////////////////////////////////////////////////////////

/**
 * Sets deployment status details for placement rule nodes.
 *
 * @param node - The placement rule node
 * @param details - Array to add detail items to
 * @param t - Translation function
 * @returns Updated details array
 */
export const setPlacementRuleDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TranslationFunction
): DetailItem[] => {
  if (safeGet(node, 'type', '') !== 'placements' || node.isPlacement) {
    return details
  }

  const clusterStatus = safeGet(node, 'specs.raw.status.decisions', []) as unknown[]
  if (clusterStatus.length === 0) {
    details.push({
      labelValue: t('Error'),
      value: t(
        'This Placement Rule does not match any remote clusters. Make sure the clusterSelector and clusterConditions properties, when used, are valid and match your clusters. If using the clusterReplicas property make sure is being set to a positive value.'
      ),
      status: failureStatus,
    })
  }

  return details
}

/**
 * Sets deployment status details for placement nodes.
 *
 * @param node - The placement node
 * @param details - Array to add detail items to
 * @param t - Translation function
 */
export const setPlacementDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TranslationFunction
): void => {
  if (node.type !== 'placements' || !node.isPlacement) {
    return
  }

  const placementStatus = safeGet(node, 'specs.raw.status') as { numberOfSelectedClusters?: number } | undefined
  if (placementStatus) {
    if (placementStatus.numberOfSelectedClusters === 0) {
      details.push({
        labelValue: t('Error'),
        value: t(
          'This Placement does not match any remote clusters. Make sure the requiredClusterSelector property is valid and match your clusters.'
        ),
        status: failureStatus,
      })
    }
  } else {
    details.push({
      labelValue: t('Error'),
      value: t(
        'This Placement does not have any status. Make sure the ManagedClusterSetBinding is created for the target namespace.'
      ),
      status: failureStatus,
    })
  }
}

///////////////////////////////////////////////////////////
//////////////////// CLUSTER /////////////////////////
///////////////////////////////////////////////////////////

/**
 * Sets cluster status details showing all clusters associated with a node
 * and any clusters not selected by placement rules.
 *
 * @param node - The cluster node
 * @param details - Array to add detail items to
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */
export const setClusterStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TranslationFunction,
  hubClusterName: string
): DetailItem[] => {
  const { id } = node
  const specs = safeGet(node, 'specs', {})
  const {
    cluster,
    targetNamespaces = {},
    clusters = [],
    appClusters = [],
    clustersNames = [],
  } = specs as {
    cluster?: ClusterInfo
    targetNamespaces?: Record<string, unknown>
    clusters?: ClusterInfo[]
    appClusters?: string[]
    clustersNames?: string[]
  }

  const clusterArr = cluster ? [cluster] : clusters
  const appClustersList = appClusters.length > 0 ? appClusters : Object.keys(targetNamespaces)

  // Add Argo app clusters not covered by deployed resource clusters
  appClustersList.forEach((appCls: string) => {
    if (clusters.findIndex((obj: any) => safeGet(obj, 'name') === appCls) === -1) {
      clusterArr.push({
        name: appCls,
        _clusterNamespace: appCls === hubClusterName ? appCls : '_',
        status: appCls === hubClusterName ? 'ok' : '',
      })
    }
  })

  // Find zombie clusters (found by search but not selected by placement rule)
  const zombieClusters: string[] = []
  clustersNames.forEach((searchCls: string) => {
    if (
      !clusters.find((prCls: any) => {
        if (prCls.metadata) {
          return prCls.metadata.name === searchCls
        }
        return prCls.name === searchCls
      })
    ) {
      zombieClusters.push(searchCls)
    }
  })

  details.push({
    type: 'label',
    labelValue: `${t('Clusters')} (${clusterArr.length})`,
  })

  details.push({
    type: 'clusterdetailcombobox',
    comboboxdata: {
      clusterList: clusterArr,
      clusterID: id,
    },
  })

  // Show clusters not selected by placement rule
  if (zombieClusters.length > 0) {
    details.push({
      type: 'spacer',
    })
    details.push({
      type: 'label',
      labelValue: `${t('Not selected by placement rule')} (${zombieClusters.length})`,
    })
    zombieClusters.forEach((cls) => {
      details.push({
        labelValue: t('Cluster name'),
        value: cls,
      })
    })
  }

  return details
}

/**
 * Sets cluster window status information for subscription time windows.
 *
 * @param windowStatusArray - Array of window status strings
 * @param subscription - The subscription item
 * @param details - Array to add detail items to
 * @param t - Translation function
 */
const setClusterWindowStatus = (
  windowStatusArray: WindowStatusArray,
  subscription: SubscriptionItem,
  details: DetailItem[],
  t: TranslationFunction
): void => {
  windowStatusArray.forEach((wstatus: string) => {
    if (wstatus.trimStart().startsWith(`${subscription.cluster}:`)) {
      details.push({
        labelValue: t('Current window status is'),
        value: wstatus.split(':')[1],
      })
    }
  })
}

///////////////////////////////////////////////////////////
//////////////////// POD RESOURCES /////////////////////////
///////////////////////////////////////////////////////////

/**
 * Shows resource deployment status for resources that produce pods,
 * including detailed pod information per cluster.
 *
 * @param node - The node with pod resources
 * @param details - Array to add detail items to
 * @param activeFilters - Active status filters
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */
export const setPodDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  activeFilters: ActiveFilters,
  t: TranslationFunction,
  hubClusterName: string
): DetailItem[] => {
  const { notDeployedStr } = getStateNames(t)
  const { resourceStatuses = new Set() } = activeFilters
  const activeFilterCodes = getActiveFilterCodes(resourceStatuses)

  if (!nodeMustHavePods(node)) {
    return details // Process only resources with pods
  }

  const podModel = safeGet(node, 'specs.podModel', [])
  const podObjects = Object.values(podModel).flat() as PodInfo[]
  const podDataPerCluster: Record<string, DetailItem[]> = {} // Pod details list for each cluster

  const clusterNames = getClusterName(node.id, node, true, hubClusterName).split(',')
  clusterNames.forEach((clusterName) => {
    podDataPerCluster[clusterName] = []
  })

  let addedDetails = false

  // Process each pod
  podObjects.forEach((pod: PodInfo) => {
    const { status, restarts, hostIP, podIP, startedAt, cluster } = pod
    const podError = [
      'Error',
      'Failed',
      'Terminating',
      'ImagePullBackOff',
      'CrashLoopBackOff',
      'RunContainerError',
    ].includes(status || '')
    const podWarning = ['Pending', 'Creating', 'Terminating'].includes(status || '')
    const clusterDetails = podDataPerCluster[cluster || '']

    if (clusterDetails) {
      addedDetails = true
      const statusStr: StatusType = podError ? failureStatus : podWarning ? warningStatus : checkmarkStatus

      let addPodDetails = false
      if (resourceStatuses.size > 0) {
        if (
          (statusStr === failureStatus && activeFilterCodes.has(failureCode)) ||
          (statusStr === warningStatus && activeFilterCodes.has(warningCode)) ||
          (statusStr === checkmarkStatus && activeFilterCodes.has(checkmarkCode))
        ) {
          addPodDetails = true
        }
      } else {
        addPodDetails = true
      }

      if (addPodDetails) {
        addDetails(clusterDetails, [
          {
            labelValue: t('Pod'),
            value: pod.name,
          },
          {
            labelValue: t('Namespace'),
            value: pod.namespace,
          },
          {
            labelValue: t('Status'),
            value: status,
            status: statusStr,
          },
        ])

        clusterDetails.push({
          type: 'link',
          value: {
            label: t('View Pod YAML and Logs'),
            data: {
              action: showResourceYaml,
              cluster: pod.cluster,
              editLink: createEditLink(pod, hubClusterName),
            },
          },
          indent: true,
        })

        addDetails(clusterDetails, [
          {
            labelValue: t('Restarts'),
            value: `${restarts}`,
          },
          {
            labelValue: t('Host and Pod IP'),
            value: `${hostIP}, ${podIP}`,
          },
          {
            labelValue: t('Created'),
            value: startedAt || 'N/A',
          },
        ])

        clusterDetails.push({
          type: 'spacer',
        })
      }
    }
  })

  // Show "not deployed" message if no pod details were added
  if (!addedDetails && node.type !== 'pod') {
    details.push({
      type: 'spacer',
    })
    details.push({
      type: 'label',
      labelValue: t('Cluster deploy status for pods'),
    })
    clusterNames.forEach((clusterName) => {
      details.push({ labelValue: 'Cluster name', value: clusterName })
      details.push({ labelValue: 'default', status: 'pending', value: notDeployedStr })
      details.push({
        type: 'spacer',
      })
    })
  }

  // Add pod details for each cluster
  clusterNames.forEach((clusterName) => {
    clusterName = clusterName.trim()
    const clusterDetails = podDataPerCluster[clusterName]

    if (clusterDetails && clusterDetails.length > 0) {
      details.push({
        type: 'spacer',
      })

      details.push({
        type: 'label',
        labelValue: t('Pod details for {{0}}', [clusterName]),
      })

      clusterDetails.forEach((podDetail) => {
        details.push(podDetail)
      })
    }
  })

  return details
}

///////////////////////////////////////////////////////////
//////////////////// NON-POD RESOURCES /////////////////////////
///////////////////////////////////////////////////////////

/**
 * Shows resource deployment status on remote clusters for resources
 * that don't produce pods (e.g., ConfigMaps, Secrets, Services).
 *
 * @param node - The resource node
 * @param details - Array to add detail items to
 * @param activeFilters - Active status filters
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */
export const setResourceDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  activeFilters: ActiveFilters,
  t: TranslationFunction,
  hubClusterName: string
): DetailItem[] => {
  const { notDeployedStr, notDeployedNSStr, deployedStr, deployedNSStr, resNotDeployedStates, resSuccessStates } =
    getStateNames(t)
  const isDeployable = isDeployableResource(node)
  const isDesign = safeGet(node, specIsDesign, false)
  const { resourceStatuses = new Set() } = activeFilters
  const activeFilterCodes = getActiveFilterCodes(resourceStatuses)

  // Skip resources with pods or certain design-time resources
  if (
    nodeMustHavePods(node) ||
    node.type === 'package' ||
    (!isDeployable &&
      [
        'application',
        'applicationset',
        'placements',
        'placement',
        'cluster',
        'subscription',
        'ocpapplication',
        'fluxapplication',
      ].includes(node.type) &&
      isDesign)
  ) {
    return details
  }

  const nodeId = safeGet(node, 'id', '')
  const nodeType = safeGet(node, 'type', '')
  const name = safeGet(node, 'name', '')
  const namespace = safeGet(node, 'namespace', '')
  const cluster = safeGet(node, 'cluster', '')

  const isHookNode = safeGet(node, 'specs.raw.hookType')
  const clusterNames = isHookNode
    ? [hubClusterName]
    : cluster
      ? [cluster]
      : getClusterName(nodeId, node, true, hubClusterName).split(',')
  const resourceMap = safeGet(node, `specs.${node.type}Model`, {})
  const onlineClusters = getOnlineClusters(node, hubClusterName)

  // Handle Ansible job hooks specially
  if (nodeType === 'ansiblejob' && isHookNode) {
    showAnsibleJobDetails(node, details, t)

    if (!safeGet(node, 'specs.raw.spec') || Object.keys(resourceMap).length === 0) {
      const res = {
        name: name,
        namespace: namespace,
        cluster: hubClusterName,
        kind: 'ansiblejob',
        apigroup: 'tower.ansible.com',
        apiversion: 'v1alpha1',
      }
      details.push({
        type: 'spacer',
      })
      details.push({
        type: 'link',
        value: {
          label: t('View resource YAML'),
          data: {
            action: showResourceYaml,
            cluster: res.cluster,
            editLink: createEditLink(res, hubClusterName),
          },
        },
        indent: true,
      })
      return details // No other status info available
    }
  } else {
    details.push({
      type: 'spacer',
    })
    details.push({
      type: 'label',
      labelValue: t('Cluster deploy status'),
    })
  }

  // Process each cluster
  clusterNames.forEach((clusterName) => {
    details.push({
      type: 'spacer',
    })
    clusterName = clusterName.trim()

    if (!onlineClusters.includes(clusterName)) {
      // Offline cluster or unmappable Argo destination server
      return showMissingClusterDetails(clusterName, node, details, t)
    }

    details.push({
      labelValue: t('Cluster name'),
      value: clusterName,
    })

    const resourcesForCluster = Object.values(resourceMap)
      .flat()
      .filter((obj: any) => safeGet(obj, 'cluster', '') === clusterName)
    const resourceNSString = !safeGet(node, 'namespace') ? 'name' : 'namespace'

    // Get cluster target namespaces
    const targetNSList = getTargetNsForNode(node, resourcesForCluster, clusterName, '*')

    targetNSList.forEach((targetNS) => {
      let res = resourcesForCluster.find((obj: any) => safeGet(obj, resourceNSString, '') === targetNS)

      if (safeGet(node, 'type', '') !== 'ansiblejob' || !isHookNode) {
        // Process regular resources (not ansible hooks)
        const deployedKey = res
          ? node.type === 'namespace'
            ? deployedNSStr
            : safeGet(res, 'status', deployedStr)
          : node.type === 'namespace'
            ? notDeployedNSStr
            : notDeployedStr
        const deployedKeyLower = deployedKey.toLowerCase()
        const statusStr: StatusType = resSuccessStates.includes(deployedKeyLower)
          ? checkmarkStatus
          : resNotDeployedStates.includes(deployedKeyLower)
            ? pendingStatus
            : resErrorStates.includes(deployedKeyLower)
              ? failureStatus
              : warningStatus

        let addItemToDetails = false
        if (resourceStatuses.size > 0) {
          if (
            (statusStr === checkmarkStatus && activeFilterCodes.has(checkmarkCode)) ||
            (statusStr === pendingStatus && (activeFilterCodes.has(pendingCode) || activeFilterCodes.has(warningCode)))
          ) {
            addItemToDetails = true
          }
        } else {
          addItemToDetails = true
        }

        if (addItemToDetails) {
          details.push({
            labelValue: targetNS,
            value: `${deployedKey}${res && res.desired !== undefined ? '  ' + res.resStatus : ''}`,
            status: statusStr,
          })
        } else {
          res = null
        }
      }

      if (res) {
        // Add OpenShift route location info
        addOCPRouteLocation(node, clusterName, targetNS, details, t)

        // Add service location info
        addNodeServiceLocation(node, clusterName, targetNS, details, t)

        // Add apiversion if not present
        if (!res.apiversion) {
          Object.assign(res, { apiversion: safeGet(node, apiVersionPath) })
        }

        details.push({
          type: 'link',
          value: {
            label: t('View resource YAML'),
            data: {
              action: showResourceYaml,
              cluster: res.cluster,
              editLink: createEditLink(res, hubClusterName),
            },
          },
          indent: true,
        })
      }
    })
  })

  details.push({
    type: 'spacer',
  })

  return details
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
  appData: Record<string, unknown>,
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
    results = await getAppSetResourceStatuses(application, appDataWithStatuses)
  } else if (application.isOCPApp || application.isFluxApp) {
    // Handle OpenShift and Flux applications - reuse existing search data from topology
    results = {
      // Reuse the search data we fetched before to avoid redundant API calls
      resourceStatuses: topology.rawSearchData,
      relatedResources: {},
    }
  } else {
    // Handle subscription-based applications (ACM/MCE subscription model)
    results = await getSubscriptionResourceStatuses(application, appDataWithStatuses)
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
