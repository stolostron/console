/* Copyright Contributors to the Open Cluster Management project */
import _ from 'lodash'
import {
  warningStatus,
  pendingStatus,
  checkmarkCode,
  warningCode,
  pendingCode,
  failureCode,
  metadataName,
} from '../model/computeStatuses'
import type { DetailsList, NodeLike, ResourceItem, ResourceMap, AddResourceToModelFn, Translator } from '../model/types'

/**
 * Check if the node represents a resource created via a Deployable.
 * Used to differentiate between app, subscription, and rules deployed via an app Deployable.
 */
export const isDeployableResource = (node: NodeLike): boolean => {
  const id = _.get(node, 'id', '')
  return typeof id === 'string' && id.indexOf('--member--deployable--') !== -1
}

/**
 * Determine if a node is expected to deploy pods.
 */
export const nodeMustHavePods = (node: NodeLike): boolean => {
  if (!node || !_.get(node, 'type') || _.includes(['application', 'placements', 'subscription'], _.get(node, 'type'))) {
    return false
  }

  if (
    _.includes(
      [
        'pod',
        //'replicaset',
        'daemonset',
        'statefulset',
        //'replicationcontroller',
        //'deployment',
        //'deploymentconfig',
        'controllerrevision',
      ],
      _.get(node, 'type', '')
    )
  ) {
    if (
      _.get(node, 'type') === 'controllerrevision' &&
      _.get(node, 'specs.parent') &&
      _.get(node, 'specs.parent.parentType') === 'virtualmachine'
    ) {
      // exception for controllerrevision created by VMs
      return false
    }
    return true
  }
  const hasContainers =
    (_.get(node, ['specs', 'raw', 'spec', 'template', 'spec', 'containers'], []) as unknown[]).length > 0
  const hasReplicas = _.get(node, ['specs', 'raw', 'spec', 'replicas'])
  const hasDesired = _.get(node, ['specs', 'raw', 'spec', 'desired'])
  if ((hasContainers || hasDesired) && !hasReplicas) {
    return true
  }

  if (hasReplicas) {
    return true
  }

  return false
}

/**
 * Resolve cluster name(s) for a node.
 * - If findAll=true, returns combined cluster names from specs and app clusters
 * - Falls back to parsing from nodeId, or the hub cluster for certain nodes
 */
export const getClusterName = (
  nodeId: string | undefined,
  node: NodeLike | undefined,
  findAll: boolean | undefined,
  hubClusterName: string
): string => {
  if (node) {
    if (findAll) {
      // Fix: _.union expects arrays, but _.get may return unknown, so ensure arrays
      const clustersNames = Array.isArray(_.get(node, 'specs.clustersNames')) ? _.get(node, 'specs.clustersNames') : []
      const appClusters = Array.isArray(_.get(node, 'clusters.specs.appClusters'))
        ? _.get(node, 'clusters.specs.appClusters')
        : []
      // Ensure both arrays for _.union, and type safety
      return _.union(
        Array.isArray(clustersNames) ? clustersNames : [],
        Array.isArray(appClusters) ? appClusters : []
      ).join(',')
    }

    const clusterNames = _.get(node, 'specs.clustersNames', [])
    if (Array.isArray(clusterNames) && clusterNames.length > 0) {
      return clusterNames.join(',')
    }
  }

  if (nodeId === undefined) {
    return ''
  }
  const clusterIndex = nodeId.indexOf('--clusters--')
  if (clusterIndex !== -1) {
    const startPos = nodeId.indexOf('--clusters--') + 12
    const endPos = nodeId.indexOf('--', startPos)
    return nodeId.slice(startPos, endPos > 0 ? endPos : nodeId.length)
  }
  // node must be deployed locally on hub, such as ansible jobs
  return hubClusterName
}

/**
 * If this is a Route generated from an Ingress resource, remove the generated hash postfix.
 */
export const getRouteNameWithoutIngressHash = (
  relatedKind: Record<string, unknown>,
  relateKindName: string
): string => {
  let name = relateKindName
  const isRouteGeneratedByIngress =
    String(_.get(relatedKind, 'kind', '')).toLowerCase() === 'route' &&
    !String(_.get(relatedKind, '_hostingDeployable', '')).endsWith(name)
  if (isRouteGeneratedByIngress) {
    const names = String(_.get(relatedKind, '_hostingDeployable', '')).split('Ingress-')
    if (names.length === 2) {
      name = names[1]
    }
  }

  return name
}

/**
 * Map UI resource status strings to filter codes currently applied in the panel.
 */
export const getActiveFilterCodes = (resourceStatuses: Set<string> | string[]): Set<number> => {
  const activeFilterCodes = new Set<number>()
  resourceStatuses.forEach((rStatus) => {
    if (rStatus === 'green') {
      activeFilterCodes.add(checkmarkCode)
    } else if (rStatus === 'yellow') {
      activeFilterCodes.add(warningCode)
    } else if (rStatus === 'orange') {
      activeFilterCodes.add(pendingCode)
    } else if (rStatus === 'red') {
      activeFilterCodes.add(failureCode)
    }
  })

  return activeFilterCodes
}

/**
 * Filter a subscription resource map by the active filter codes.
 */
export const filterSubscriptionObject = (
  resourceMap: Record<string, Array<{ status?: string }>>,
  activeFilterCodes: Set<number>
): Record<string, { status?: string }> => {
  const filteredObject: Record<string, { status?: string }> = {}
  Object.entries(resourceMap).forEach(([key, values]) => {
    values.forEach((value) => {
      if (value.status === 'Subscribed' && activeFilterCodes.has(checkmarkCode)) {
        filteredObject[key] = value
      }
      if (value.status === 'Propagated' && activeFilterCodes.has(warningCode)) {
        filteredObject[key] = value
      }
      if (value.status === 'Fail' && activeFilterCodes.has(failureCode)) {
        filteredObject[key] = value
      }
    })
  })
  return filteredObject
}

/**
 * Extract the base cluster host from a console URL, e.g. console-openshift-console.apps.example.com -> apps.example.com
 */
export const getClusterHost = (consoleURL?: string | null): string => {
  if (!consoleURL) {
    return ''
  }
  const consoleURLInstance = new URL(consoleURL)
  const ocpIdx = consoleURL ? consoleURLInstance.host.indexOf('.') : -1
  if (ocpIdx < 0) {
    return ''
  }
  return consoleURLInstance.host.substr(ocpIdx + 1)
}

/**
 * For items with pods lacking ready/available state, default those to current state (search gap workaround).
 */
export const fixMissingStateOptions = (
  items: Array<{ available?: unknown; ready?: unknown; current?: unknown }>
): Array<{ available?: unknown; ready?: unknown; current?: unknown }> => {
  items.forEach((item) => {
    if (_.get(item, 'available') === undefined) {
      ;(item as any).available = (item as any).current
    }
    if (_.get(item, 'ready') === undefined) {
      ;(item as any).ready = (item as any).current
    }
  })
  return items
}

/**
 * Try to match a resource namespace with the server target namespace (Argo use case).
 * Updates the relatedKind.cluster when a match is found.
 */
export const namespaceMatchTargetServer = (
  relatedKind: Record<string, any>,
  resourceMapForObject: Record<string, any>
): boolean => {
  const namespace = _.get(relatedKind, 'namespace', '')
  const findTargetClustersByNS = _.filter(
    _.get(resourceMapForObject, 'clusters.specs.clusters', []),
    (filtertype) => _.get(filtertype, 'destination.namespace', '') === namespace
  )
  if (findTargetClustersByNS.length > 0) {
    ;(relatedKind as any).cluster = _.get(findTargetClustersByNS[0], metadataName, '')
  }
  return findTargetClustersByNS.length > 0
}

/**
 * Try to match app destination clusters with hub clusters using search data and normalize.
 */
export const updateAppClustersMatchingSearch = (
  node: NodeLike,
  searchClusters: Array<Record<string, any>>
): NodeLike => {
  if (_.get(node, 'type') !== 'cluster') {
    _.set(node, 'specs.clusters', searchClusters)
    return node
  }
  const appClustersRaw = _.get(node, 'specs.appClusters', [])
  const appClusters: string[] = Array.isArray(appClustersRaw)
    ? appClustersRaw.filter((c): c is string => typeof c === 'string')
    : []
  const appClustersUsingURL: string[] = appClusters.filter((cls) => getValidHttpUrl(cls) !== null)

  appClustersUsingURL.forEach((appCls) => {
    try {
      let possibleMatch: Record<string, any> | undefined
      const clsUrl = new URL(appCls)
      const isOCPUrl = _.startsWith(clsUrl.hostname, 'api')
      const clusterIdx = appCls.indexOf(':cluster/')
      if (clusterIdx !== -1) {
        const kubeClusterName = appCls.substring(clusterIdx + 9)
        possibleMatch = _.find(searchClusters, (cls) => {
          const clsName = _.get(cls, 'name', '_') as string
          return _.includes([clsName, `${clsName}-cluster`], kubeClusterName)
        }) as any
      } else {
        if (isOCPUrl) {
          possibleMatch = _.find(searchClusters, (cls) =>
            _.endsWith(String(_.get(cls, 'consoleURL', '_')), clsUrl.hostname.substring(3))
          ) as any
        }
      }
      if (possibleMatch || !isOCPUrl) {
        _.pull(appClusters, appCls)
      }
      if (possibleMatch) {
        const matchedClusterName = _.get(possibleMatch, 'name', '') as string
        if (!_.includes(appClusters, matchedClusterName)) {
          appClusters.push(matchedClusterName)
        }
        const targetNamespaces = _.get(node, 'specs.targetNamespaces', {}) as Record<string, string[]>
        const targetNSForAppCls = targetNamespaces[appCls]
        const targetNSForMatchedName = targetNamespaces[matchedClusterName]
        targetNamespaces[matchedClusterName] = _.sortBy(_.union(targetNSForAppCls, targetNSForMatchedName))
      }
    } catch {
      // ignore error
    }
  })
  _.set(node, 'specs.appClusters', _.sortBy(appClusters))
  return node
}

/**
 * Validate a string is an http(s) URL. Returns the URL object or null if invalid.
 */
export const getValidHttpUrl = (value: string): URL | null => {
  let urlValue: URL
  try {
    urlValue = new URL(value)
  } catch {
    return null
  }
  return urlValue
}

/**
 * Show warning rows when no deployed resources are found by search for a given cluster name.
 */
export const showMissingClusterDetails = (
  clusterName: string,
  node: NodeLike,
  details: DetailsList,
  t: Translator
): DetailsList => {
  const targetNS = _.get(node, 'clusters.specs.targetNamespaces', {
    unknown: [],
  }) as Record<string, string[]>
  if (clusterName.length === 0) {
    const clsNames = Object.keys(targetNS)
    clsNames.forEach((clsName) => {
      details.push(
        {
          labelValue: t('Cluster name'),
          value: clsName,
        },
        {
          labelValue: '*',
          value: t('spec.deploy.not.deployed'),
          status: pendingStatus,
        }
      )
    })
  } else {
    details.push({
      labelValue: t('Cluster name'),
      value: clusterName,
    })
    const nsForCluster = targetNS[clusterName] || ['*']
    if (getValidHttpUrl(clusterName) !== null) {
      nsForCluster.forEach((nsName) => {
        details.push({
          labelValue: nsName,
          value: _.startsWith(clusterName, 'https://api.') ? t('spec.deploy.not.deployed') : t('Not mapped'),
          status: pendingStatus,
        })
      })
    } else {
      const searchClusters = _.get(node, 'specs.searchClusters', []) as Array<Record<string, any>>
      const searchCluster = _.find(searchClusters, (cls: Record<string, any>) => _.get(cls, 'name') === clusterName)
      const isOffline = searchCluster && _.get(searchCluster, 'ManagedClusterConditionAvailable', '') === 'False'
      nsForCluster.forEach((nsName) => {
        details.push({
          labelValue: nsName,
          value: isOffline ? t('Offline') : t('Not deployed'),
          status: isOffline ? warningStatus : pendingStatus,
        })
      })
    }
  }
  return details
}

/**
 * Return all namespaces this resource can deploy to for the given cluster.
 */
export const getTargetNsForNode = (
  node: NodeLike,
  resourcesForCluster: ResourceItem[],
  clusterName: string,
  defaultNS: string
): string[] => {
  const targetNamespaces = _.get(node, 'clusters.specs.targetNamespaces', {}) as Record<string, string[]>
  const deployedResourcesNS = !isResourceNamespaceScoped(node)
    ? _.map(resourcesForCluster, 'name')
    : _.map(resourcesForCluster, 'namespace')
  return targetNamespaces[clusterName]
    ? (_.union(targetNamespaces[clusterName], _.uniq(deployedResourcesNS)) as string[])
    : resourcesForCluster.length > 0
      ? (_.uniq(deployedResourcesNS) as string[])
      : [defaultNS]
}

/**
 * Return the list of cluster objects where app resources must deploy.
 */
export const getResourcesClustersForApp = (
  searchClusters: { items?: Array<Record<string, any>> } | undefined,
  nodes: NodeLike[] | undefined,
  hubClusterName: string
): Array<Record<string, any>> => {
  let clustersList = searchClusters ? _.get(searchClusters, 'items', []) : []
  if (nodes && nodes.length > 0) {
    const placementNodes =
      _.filter(
        nodes,
        (node: unknown) =>
          _.get(node, 'type', '') === 'placements' && String(_.get(node, 'id', '')).indexOf('deployable') === -1
      ) || []
    if (placementNodes.length > 0) {
      const localClusterRuleFn = (decision: any) => _.get(decision, 'clusterName', '') === hubClusterName
      const localPlacement = _.find(
        placementNodes,
        (plc: Record<string, unknown>) =>
          _.filter(_.get(plc, 'specs.raw.status.decisions', []) as object[], localClusterRuleFn).length > 0
      )
      if (!localPlacement) {
        clustersList = _.filter(
          clustersList,
          (cls: Record<string, unknown>) => _.get(cls, 'name', '') !== hubClusterName
        )
      }
    }
  }
  return clustersList as Array<Record<string, any>>
}

/**
 * Return true if all clusters in clusterNames are included in onlineClusters.
 */
export const allClustersAreOnline = (clusterNames?: string[], onlineClusters?: string[]): boolean => {
  if (onlineClusters && clusterNames) {
    return _.intersection(onlineClusters, clusterNames).length === clusterNames.length
  }
  return false
}

/**
 * Find and attach a parent to a resource based on owner UID.
 */
export const findParentForOwnerID = (
  resourceMap: ResourceMap,
  ownerUID: string,
  kind: string,
  relatedKind: string,
  nameWithoutChartRelease: string,
  addResourceToModel: AddResourceToModelFn
): void => {
  Object.keys(resourceMap).forEach((key) => {
    if (_.startsWith(key, 'replicationcontroller') || _.startsWith(key, 'replicaset')) {
      const resourceObj: any = (resourceMap as any)[key]
      const resourceModel = _.get(resourceObj, `specs.${resourceObj.type}Model`, {}) as Record<string, any[]>

      if (_.filter(_.flatten(Object.values(resourceModel)), (obj) => _.get(obj, '_uid', '') === ownerUID).length > 0) {
        addResourceToModel(resourceObj, kind, relatedKind, nameWithoutChartRelease)
      }
    }
  })
}

/**
 * Check if topology map needs to be recalculated depending on the last update marker.
 */
export const mustRefreshTopologyMap = (topology: NodeLike | undefined, currentUpdate: string | undefined): boolean => {
  if (
    currentUpdate &&
    topology &&
    typeof topology === 'object' &&
    Array.isArray((topology as any)?.nodes) &&
    (topology as any).nodes.length > 0
  ) {
    const firstNode = (topology as any).nodes[0]
    if (firstNode && typeof firstNode === 'object' && _.get(firstNode, '_lastUpdated', '') === currentUpdate) {
      return false
    }
    _.set(firstNode, '_lastUpdated', currentUpdate)
  }
  return true
}

/**
 * Return true if resource is namespace-scoped.
 */
export const isResourceNamespaceScoped = (node: NodeLike): boolean => {
  if (_.get(node, 'namespace')) {
    return true
  }

  const resources = _.get(node, 'specs.resources', []) as Array<Record<string, any>>
  if (resources.length > 0) {
    if (_.get(resources[0], 'namespace')) {
      return true
    }
  }

  return false
}

/**
 * Remove '-volume...' postfix from a resource name.
 */
export const getNameWithoutVolumePostfix = (name: string): string => {
  return name.substring(0, name.lastIndexOf('-volume'))
}

/**
 * Remove VM type hash postfix from a resource name using instancetype label.
 */
export const getNameWithoutVMTypeHash = (resource: { name: string; label?: string }): string => {
  const nameNoHash = resource.name
  let vmType: string | undefined
  const labelsList = resource.label ? (resource.label.split(';') as string[]) : []

  for (let i = 0; i < labelsList.length; i++) {
    const values = labelsList[i].split('=') as string[]
    if (values.length === 2) {
      const labelKey = values[0].trim()
      if (labelKey === 'instancetype.kubevirt.io/object-name') {
        vmType = values[1].trim()
        return nameNoHash.substring(0, nameNoHash.indexOf(`-${vmType}`))
      }
    }
  }

  return nameNoHash
}

/**
 * Get VM name from pod labels or fall back to resource name when label is absent.
 */
export const getVMNameWithoutPodHash = (resource: { name: string; label?: string }): string => {
  const nameNoHash = resource.name
  const labelsList = resource.label ? (resource.label.split(';') as string[]) : []

  for (let i = 0; i < labelsList.length; i++) {
    const values = labelsList[i].split('=') as string[]
    if (values.length === 2) {
      const labelKey = values[0].trim()
      if (labelKey === 'vm.kubevirt.io/name') {
        return values[1].trim()
      }
    }
  }

  return nameNoHash
}
