/* Copyright Contributors to the Open Cluster Management project */

import {
  addResourceToModel,
  checkNotOrObjects,
  getNameWithoutPodHash,
  getNameWithoutChartRelease,
  computeResourceName,
} from './helpers/diagram-helpers'
import {
  getClusterName,
  getRouteNameWithoutIngressHash,
  updateAppClustersMatchingSearch,
  getResourcesClustersForApp,
  getNameWithoutVolumePostfix,
  getNameWithoutVMTypeHash,
  getVMNameWithoutPodHash,
} from './helpers/diagram-helpers-utils'
import type {
  ResourceStatuses,
  ResourceMapObject,
  Topology,
  HelmReleaseDetector,
  SearchResultItem,
  RelatedKindGroup,
  RelatedResourceItem,
  NameProcessingResult,
  AppClusterSummary,
  ClusterInfo,
} from '../types'

///////////////////////////////////////////////////////////////////////////
////////////////////// CREATE MAP OF RELATED TYPES ///////////////////////
///////////////////////////////////////////////////////////////////////////

/**
 * Main function to add diagram details by processing resource statuses and updating the resource map.
 * This function creates a comprehensive map of all related resource kinds for the application,
 * not limited to just pod types.
 *
 * @param resourceStatuses - Search results containing application and related resources
 * @param resourceMap - Map of topology resources to be updated with search results
 * @param isClusterGrouped - Whether resources should be grouped by cluster
 * @param hasHelmReleases - Detector for Helm release presence
 * @param topology - Complete topology structure with nodes and links
 * @returns Updated resource map with search result data integrated
 */
export const addDiagramDetails = (
  resourceStatuses: ResourceStatuses,
  resourceMap: Record<string, ResourceMapObject>,
  isClusterGrouped: boolean,
  hasHelmReleases: HelmReleaseDetector,
  topology: Topology
): Record<string, ResourceMapObject> => {
  // Early return if required objects are missing or invalid
  if (checkNotOrObjects(resourceStatuses, resourceMap)) {
    return resourceMap
  }

  let related: RelatedKindGroup[] = []

  // Process multiple search results or single result
  if (resourceStatuses.data.searchResult.length > 1) {
    // Handle multiple search results by aggregating all related resources
    const searchResultArr: RelatedKindGroup[] = []

    resourceStatuses.data.searchResult.forEach((result: SearchResultItem) => {
      const mappedResult = mapSingleApplication(structuredClone(result), topology.hubClusterName || '')
      searchResultArr.push(...(mappedResult.related || []))
    })
    // Remove duplicates using Set
    related = Array.from(new Set(searchResultArr))
  } else {
    // Handle single search result
    related =
      mapSingleApplication(structuredClone(resourceStatuses.data.searchResult[0]), topology.hubClusterName || '')
        .related || []
  }

  // Store cluster objects and cluster names as returned by search
  // These represent clusters related to the application
  const eqIgnoreCase = (a: string) => (b: string) => String(a).toLowerCase() === String(b).toLowerCase()

  // Find cluster-related resources and extract cluster information
  const clustersObjects = getResourcesClustersForApp(
    related.find((item) => eqIgnoreCase('cluster')(item.kind || '')) || {},
    topology.nodes,
    topology.hubClusterName || ''
  ) as ClusterInfo[]

  const clusterNamesList: string[] = clustersObjects.map((cluster) => cluster.name).sort()

  // Update topology nodes with cluster information
  if (topology.nodes) {
    // Find the main application node
    const appNode =
      topology.nodes.find(
        (node) => (node.id || '').startsWith('application--') && (node.type || '') === 'application'
      ) || {}

    // Check if application has multiple subscriptions
    const hasMultipleSubs: boolean = ((appNode as any).specs?.allSubscriptions || []).length > 1

    // Process each topology node to update cluster information
    topology.nodes.forEach((node) => {
      if (node.type === 'cluster') {
        // Update cluster nodes with search-found cluster objects (for Argo clusters)
        updateAppClustersMatchingSearch(node, clustersObjects)
      }

      // Determine cluster names for the node based on its type
      const nodeClusters: string[] =
        node.type === 'subscription' ? clusterNamesList : (((node as any).specs?.clustersNames || []) as string[])

      // Set search clusters on the node
      if (!(node as any).specs) (node as any).specs = {}
      ;(node as any).specs.searchClusters =
        hasMultipleSubs && node.type !== 'application'
          ? clustersObjects.filter((cls) => nodeClusters.includes(cls.name || ''))
          : clustersObjects // Get all search clusters when single cluster node or main app node
    })

    // Set cluster status on the application node
    // We have all cluster information available at this point
    const appNodeSearchClusters: ClusterInfo[] = (appNode as any).specs?.searchClusters || []

    // Determine if the application is deployed locally (on hub cluster)
    const isLocal: boolean = appNodeSearchClusters.find((cls) => (cls.name || '') === topology.hubClusterName)
      ? true
      : false

    // Set cluster summary information on the application node
    const clusterSummary: AppClusterSummary = {
      isLocal,
      remoteCount: isLocal ? appNodeSearchClusters.length - 1 : appNodeSearchClusters.length,
    }
    if (!(appNode as any).specs) (appNode as any).specs = {}
    ;(appNode as any).specs.allClusters = clusterSummary
  }

  // Find pod resources in the related kinds array
  let podIndex = related.findIndex((item) => item.kind === 'pod')
  // Also check uppercase due to search API inconsistency
  if (podIndex === -1) {
    podIndex = related.findIndex((item) => item.kind === 'Pod')
  }

  // Reorder the related kinds list to process pods last
  // This ensures pods are added to the map after all resources that produce pods have been processed
  // We want to add pods using their pod hash for proper grouping
  let orderedList: RelatedKindGroup[] =
    podIndex === -1 ? related : [...related.slice(0, podIndex), ...related.slice(podIndex + 1), related[podIndex]]

  // Remove deployable and cluster kinds as they are handled separately
  orderedList = orderedList.filter((item) => !['deployable', 'cluster', 'Deployable', 'Cluster'].includes(item.kind))

  // Process each kind group and its resources
  orderedList.forEach((kindArray: RelatedKindGroup) => {
    const relatedKindList: RelatedResourceItem[] = kindArray.items || []

    for (let i = 0; i < relatedKindList.length; i++) {
      const { kind, cluster } = relatedKindList[i]

      // Skip old replica sets that are scaled down to 0
      if (kind.toLowerCase() === 'replicaset' && relatedKindList[i].desired === '0') {
        continue
      }

      // Process resource name by removing pod template hash if present
      // eslint-disable-next-line prefer-const
      let { nameNoHash, deployableName }: NameProcessingResult = getNameWithoutPodHash(relatedKindList[i])

      // Handle virtual machine resources with special naming conventions
      if (isVirtualMachineResource(relatedKindList[i].label)) {
        switch (kind) {
          case 'PersistentVolumeClaim':
          case 'DataVolume':
            // Remove volume postfix from VM storage resources
            nameNoHash = getNameWithoutVolumePostfix(nameNoHash)
            break
          case 'ControllerRevision':
            // Remove VM type hash from controller revisions
            nameNoHash = getNameWithoutVMTypeHash(relatedKindList[i])
            break
          case 'Pod':
            // Remove VM-specific pod hash
            nameNoHash = getVMNameWithoutPodHash(relatedKindList[i])
        }
      }

      // For routes generated by Ingress, remove the route name hash
      const nameNoHashIngressPod: string = getRouteNameWithoutIngressHash(relatedKindList[i], nameNoHash)

      // Remove Helm chart release information if Helm releases are detected
      const nameWithoutChartRelease: string = getNameWithoutChartRelease(
        relatedKindList[i],
        nameNoHashIngressPod,
        hasHelmReleases
      )

      // Compute the final resource name for mapping
      let resourceName: string = computeResourceName(relatedKindList[i], deployableName, nameWithoutChartRelease, {
        value: isClusterGrouped,
      })

      // Handle special case for local hub subscriptions
      if (
        kind.toLowerCase() === 'subscription' &&
        cluster === topology.hubClusterName &&
        (relatedKindList[i].localPlacement || '') === 'true' &&
        resourceName.endsWith('-local')
      ) {
        // Match local hub subscription after removing -local suffix
        resourceName = resourceName.replace(/-local$/, '')
      }

      // Find the corresponding resource in the resource map
      const resourceMapForObject = Object.values(resourceMap).find(({ name, namespace, type, specs = {} }) => {
        const replacedType = type === 'project' ? 'namespace' : type

        if (specs.resources) {
          // Handle resources with sub-resources
          if (
            replacedType === relatedKindList[i].kind.toLowerCase() &&
            (specs.clustersNames || []).includes(relatedKindList[i].cluster)
          ) {
            return (
              (specs.resources || []).findIndex((spec) => {
                return spec.name === nameNoHash && spec.namespace === relatedKindList[i].namespace
              }) !== -1
            )
          } else {
            return false
          }
        } else {
          // Handle direct resource matching
          return (
            (kind.toLowerCase() === 'subscription' ? name === resourceName : name === nameNoHash) &&
            namespace === relatedKindList[i].namespace &&
            replacedType === relatedKindList[i].kind.toLowerCase() &&
            ((specs.clustersNames || []).includes(relatedKindList[i].cluster) ||
              (specs.searchClusters || []).find((cls) => cls.name === relatedKindList[i].cluster) ||
              relatedKindList[i].cluster === topology.hubClusterName) // Fallback to searchClusters if SubscriptionReport is not created
          )
        }
      })

      // Add the resource to the model if a matching resource map object is found
      if (resourceMapForObject) {
        addResourceToModel(resourceMapForObject, kind, relatedKindList[i], nameWithoutChartRelease)
      }
    }
  })

  // Post-processing: synchronize pod status maps and replica counts
  syncControllerRevisionPodStatusMap(resourceMap, topology.hubClusterName || '')
  syncReplicaSetCountToPodNode(resourceMap)

  return resourceMap
}

/**
 * Maps a single application search result by organizing items under the related section.
 * This is particularly important for Argo applications where the related kinds query
 * is built from the items section.
 *
 * @param application - Single search result item to be mapped
 * @param hubClusterName - Name of the hub cluster for filtering
 * @returns Mapped application with organized related resources
 */
export const mapSingleApplication = (application: SearchResultItem, hubClusterName: string): SearchResultItem => {
  const items = (application ? application.items || [] : []) || []

  // Initialize result with default structure or clone from first item
  const result: SearchResultItem =
    items.length > 0
      ? structuredClone(items[0])
      : {
          name: '',
          namespace: '',
          dashboard: '',
          selfLink: '',
          _uid: '',
          created: '',
          apigroup: '',
          cluster: '',
          kind: '',
          label: '',
          _hubClusterResource: '',
          _rbac: '',
          related: [],
        }

  // Set related resources from application or initialize empty array
  result.related = application ? application.related || [] : []

  // Process each item and organize under related section
  items.forEach((item) => {
    // For Argo apps, the related kinds query is built from the items section
    // Query format: namespace:targetNamespace label:appLabel kind:<comma separated resource kinds>
    // This code moves all these items under the related section
    const kind = item.kind || ''
    const cluster = item.cluster || ''
    const label = (item.label || '') as string

    // Preserve legitimate app objects for Argo app of apps pattern
    if (kind === 'application' && label.indexOf('app.kubernetes.io/instance=') === -1) {
      // This is a legitimate app object, leave it as is
      return
    }

    // Preserve legitimate subscription objects on non-hub clusters
    if (kind === 'subscription' && cluster !== hubClusterName) {
      // This is a legitimate subscription object that needs no alteration
      return
    }

    // Find existing kind section in the related array or create new one
    const queryKind = (result.related || []).filter((filtertype) => (filtertype.kind || '') === kind)

    // Add item to existing kind section or create new kind section
    const kindSection = queryKind && queryKind.length > 0 ? queryKind : { kind, items: [item] }

    if (!queryKind || queryKind.length === 0) {
      // Link new kind section directly to the results array
      result.related?.push(kindSection as RelatedKindGroup)
    } else {
      // Add item to existing kind section
      if (Array.isArray(kindSection)) {
        kindSection[0]?.items?.push(item as RelatedResourceItem)
      }
    }
  })

  return result
}

/**
 * Synchronizes pod status map for ControllerRevision resources.
 * ControllerRevision resources don't contain desired pod count information,
 * so we need to get it from their parent resources (DaemonSet or StatefulSet).
 *
 * @param resourceMap - Map of topology resources to update
 * @param hubClusterName - Name of the hub cluster
 */
export const syncControllerRevisionPodStatusMap = (
  resourceMap: Record<string, ResourceMapObject>,
  hubClusterName: string
): void => {
  Object.keys(resourceMap).forEach((resourceName) => {
    if (resourceName.startsWith('controllerrevision-')) {
      const controllerRevision = resourceMap[resourceName]

      // Extract parent resource information
      const parentName = controllerRevision.specs?.parent?.parentName || ''
      const parentType = controllerRevision.specs?.parent?.parentType || ''
      const parentId = (controllerRevision.specs?.parent?.parentId || '') as string

      // Determine cluster name for parent resource lookup
      const clusterName = getClusterName(parentId, undefined, undefined, hubClusterName)?.toString() || hubClusterName

      // Find parent resource in the resource map
      const parentResource =
        resourceMap[`${parentType}-${parentName}-${clusterName}`] || resourceMap[`${parentType}-${parentName}-`]

      if (parentResource) {
        // Copy parent model to controller revision
        const parentModel = {
          ...(((parentResource as any).specs?.[`${parentResource.type}Model`] || {}) as Record<string, unknown>),
        }

        if (parentModel) {
          // Preserve the controller revision's name while using parent's model structure
          const currentModel = (controllerRevision as any).specs?.controllerrevisionModel
          if (currentModel) {
            const parentModelKey = Object.keys(parentModel)[0]
            const currentModelKey = Object.keys(currentModel)[0]
            if (parentModelKey && currentModelKey) {
              ;(parentModel as any)[parentModelKey][0].name = (currentModel as any)[currentModelKey][0].name
            }
          }
          if (!(controllerRevision as any).specs) (controllerRevision as any).specs = {}
          ;(controllerRevision as any).specs.controllerrevisionModel = parentModel
        }
      }
    }
  })
}

/**
 * Synchronizes replica set count information to pod nodes.
 * This ensures pod nodes have accurate replica count information
 * from their parent ReplicaSet resources.
 *
 * @param resourceMap - Map of topology resources to update
 */
export const syncReplicaSetCountToPodNode = (resourceMap: Record<string, ResourceMapObject>): void => {
  Object.keys(resourceMap).forEach((resourceName) => {
    if (resourceName.startsWith('pod-')) {
      const pod = resourceMap[resourceName]

      // Extract parent resource information
      const parentName = (pod as any).specs?.parent?.parentName || ''
      const parentType = (pod as any).specs?.parent?.parentType || ''
      const clusterName = (pod as any).specs?.clustersNames || ''

      // Find parent resource (typically a ReplicaSet)
      const parentResource =
        resourceMap[`${parentType}-${parentName}-${clusterName}`] || resourceMap[`${parentType}-${parentName}-`]

      if (parentResource) {
        // Extract replica set model information
        const parentModel = (parentResource as any).specs?.[`${parentResource.type}Model`] || {}

        if (parentModel && Object.keys(parentModel).length > 0) {
          const replicaSetValueArr = Object.values(parentModel)[0] as any[]

          if (replicaSetValueArr.length > 0) {
            const replicaSet = replicaSetValueArr[0]
            const desiredCount = replicaSet.desired || 1

            // Set replica count and total resource count on the pod
            if (!(pod as any).specs) (pod as any).specs = {}
            ;(pod as any).specs.replicaCount = desiredCount
            ;(pod as any).specs.resourceCount =
              desiredCount * (((pod as any).specs.clustersNames || []) as string[]).length
          }
        }
      }
    }
  })
}

/**
 * Determines if a resource is part of a Virtual Machine by examining its labels.
 * Virtual Machine resources are identified by specific KubeVirt label keys.
 *
 * @param labels - Semicolon-separated string of labels in key=value format
 * @returns True if the resource is part of a Virtual Machine, false otherwise
 */
export const isVirtualMachineResource = (labels?: string): boolean => {
  if (!labels || labels === '') {
    // Cannot determine without labels
    return false
  }

  const labelsList = labels ? labels.split(';') : []

  // Check each label for KubeVirt-specific keys
  for (let i = 0; i < labelsList.length; i++) {
    const values = labelsList[i].split('=')
    if (values.length === 2) {
      const labelKey = values[0].trim()
      // Look for KubeVirt-specific label keys
      if (labelKey.indexOf('instancetype.kubevirt.io') > -1 || labelKey.indexOf('kubevirt.io') > -1) {
        return true
      }
    }
  }

  return false
}
