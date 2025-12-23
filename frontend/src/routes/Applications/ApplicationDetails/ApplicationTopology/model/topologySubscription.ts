/* Copyright Contributors to the Open Cluster Management project */

import {
  addClusters,
  processMultiples,
  createReplicaChild,
  createControllerRevisionChild,
  createIngressRouteChild,
  createPodChild,
} from './topologyUtils'
import type {
  ManagedCluster,
  SubscriptionKind,
  SubscriptionReportResource,
  TopologyNode,
  TopologyLink,
  Topology,
  RuleDecisionMap,
  ServiceMap,
  ParentObject,
  SubscriptionApplicationModel,
  AnsibleJobModel,
} from '../types'
import { deepClone } from '../utils'
import { SubscriptionReport } from '../../../../../resources'

/**
 * Generates topology data for subscription-based applications
 *
 * This function creates a complete topology graph showing the relationships between
 * applications, subscriptions, placement rules, clusters, and deployed resources.
 *
 * @param application - The subscription application model containing subscriptions and metadata
 * @param managedClusters - Array of managed clusters available in the system
 * @param relatedResources - Map of related resources keyed by resource identifier
 * @param hubClusterName - Name of the hub cluster
 * @returns Topology object containing nodes and links for visualization
 */
export const getSubscriptionTopology = (
  application: SubscriptionApplicationModel,
  managedClusters: ManagedCluster[],
  relatedResources: Record<string, unknown>,
  hubClusterName: string
): Topology => {
  const links: TopologyLink[] = []
  const nodes: TopologyNode[] = []
  const { name, namespace } = application

  // Create the root application node
  const allAppClusters = application.allClusters ? application.allClusters : []
  const appId = `application--${name}`
  nodes.push({
    name: '',
    namespace,
    type: 'application',
    id: appId,
    uid: appId,
    specs: {
      isDesign: true,
      raw: application.app,
      activeChannel: application.activeChannel,
      allSubscriptions: application.allSubscriptions ? application.allSubscriptions : [],
      allChannels: application.allChannels ? application.allChannels : [],
      allClusters: {
        isLocal: allAppClusters.indexOf(hubClusterName) !== -1,
        remoteCount: allAppClusters.indexOf(hubClusterName) !== -1 ? allAppClusters.length - 1 : allAppClusters.length,
      },
      channels: application.channels,
    },
  })

  // Extract cluster names from managed clusters
  let managedClusterNames = managedClusters.map((cluster) => {
    return cluster?.name
  })

  // Process each subscription in the application
  let clusterId: string
  if (application.subscriptions) {
    application.subscriptions.forEach((subscription) => {
      // Build rule decision mapping for cluster placement
      const ruleDecisionMap: RuleDecisionMap = {}
      if (subscription.decisions) {
        subscription.decisions.forEach((rule) => {
          const ruleDecisions = rule?.status?.decisions as Array<{
            clusterName: string
            clusterNamespace: string
          }>
          if (ruleDecisions) {
            ruleDecisions.forEach(
              ({ clusterName, clusterNamespace }: { clusterName: string; clusterNamespace: string }) => {
                ruleDecisionMap[clusterName] = clusterNamespace
              }
            )
          }
        })
      }

      // Handle local cluster placement
      if (
        subscription?.spec?.placement?.local === true &&
        subscription.decisions &&
        !managedClusterNames.includes(hubClusterName)
      ) {
        const localCluster = {
          metadata: {
            name: hubClusterName,
            namespace: hubClusterName,
          },
        }
        managedClusterNames = [...managedClusterNames, localCluster.metadata.name]
        ruleDecisionMap[hubClusterName] = hubClusterName
      }
      const ruleClusterNames = Object.keys(ruleDecisionMap)

      // Extract source information from subscription annotations
      const ann = (subscription?.metadata?.annotations || {}) as Record<string, string>
      let source =
        ann['apps.open-cluster-management.io/git-path'] ||
        ann['apps.open-cluster-management.io/github-path'] ||
        ann['apps.open-cluster-management.io/bucket-path'] ||
        subscription?.spec?.packageOverrides?.[0]?.packageName ||
        ''
      source = source.split('/').pop() as string

      // Filter clusters based on placement decisions
      const filteredClusters = managedClusters.filter((cluster) => {
        return ruleClusterNames.includes(cluster?.name ?? '')
      })

      // Determine clusters where subscription was deployed
      let clustersNames: string[] = []
      if (ruleClusterNames && ruleClusterNames.length > 0) {
        clustersNames = ruleClusterNames
      } else {
        const reportResults = (subscription?.report?.results || []) as Array<{ source?: string }>
        clustersNames = reportResults
          .map((result) => (result && typeof result.source === 'string' ? result.source : undefined))
          .filter((name): name is string => !!name)
      }

      const isRulePlaced = ruleClusterNames.length > 0
      const subscriptionId = addSubscription(appId, clustersNames, subscription, source, isRulePlaced, links, nodes)

      // Add placement rules/decisions nodes
      if (subscription.decisions || subscription.placements) {
        addSubscriptionRules(subscriptionId, subscription, links, nodes)
      }

      // Add cluster nodes for subscription deployment
      clusterId = addClusters(subscriptionId, subscription, '', ruleClusterNames, filteredClusters, links, nodes)

      // Add pre-hook and post-hook nodes if they exist
      if (subscription.prehooks && subscription.prehooks.length > 0) {
        addSubscriptionHooks(subscriptionId, subscription, links, nodes, true)
      }
      if (subscription.posthooks && subscription.posthooks.length > 0) {
        addSubscriptionHooks(subscriptionId, subscription, links, nodes, false)
      }

      // Process subscription report to add deployed resource nodes
      if (subscription.report) {
        processReport(subscription.report, clustersNames, clusterId, links, nodes, relatedResources)
      }
    })
  }

  return {
    nodes: nodes.filter((node, index, self) => index === self.findIndex((n) => n.uid === node.uid)),
    links,
  }
}

/**
 * Adds a subscription node to the topology
 *
 * @param appId - Parent application ID
 * @param clustersNames - Array of cluster names where subscription is deployed
 * @param subscription - The subscription resource
 * @param source - Source path or package name for the subscription
 * @param isPlaced - Whether the subscription has placement rules
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @returns The subscription node ID
 */
const addSubscription = (
  appId: string,
  clustersNames: string[],
  subscription: SubscriptionKind,
  source: string,
  isPlaced: boolean,
  links: TopologyLink[],
  nodes: TopologyNode[]
): string => {
  const {
    metadata: { namespace, name },
  } = subscription
  const subscriptionId = `member--subscription--${namespace}--${name}`
  const rule = subscription?.rules?.[0]
  const isBlocked = subscription?.status?.message === 'Blocked'

  nodes.push({
    name,
    namespace,
    type: 'subscription',
    id: subscriptionId,
    uid: subscriptionId,
    specs: {
      title: source,
      isDesign: true,
      hasRules: !!rule,
      isPlaced,
      isBlocked,
      raw: subscription,
      clustersNames,
    },
    report: subscription.report,
  })

  // Link subscription to parent application
  links.push({
    from: { uid: appId },
    to: { uid: subscriptionId },
    type: '',
    specs: { isDesign: true },
  })
  return subscriptionId
}

/**
 * Adds placement rules or placement decisions nodes to the topology
 *
 * @param parentId - Parent subscription ID
 * @param subscription - The subscription containing placement information
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 */
const addSubscriptionRules = (
  parentId: string,
  subscription: SubscriptionKind,
  links: TopologyLink[],
  nodes: TopologyNode[]
): void => {
  let placement: unknown
  const placementType = subscription?.spec?.placement?.placementRef?.kind
  const isPlacement = placementType === 'Placement' ? true : false

  // Use decisions if available, otherwise fall back to placement rules
  const ruleDecisionArr =
    subscription.decisions && subscription.decisions.length > 0 ? subscription.decisions : subscription.placements || []

  ruleDecisionArr.forEach((rule, idx) => {
    const {
      metadata: { name, namespace },
    } = rule
    const ruleId = `member--rules--${namespace}--${name}--${idx}`
    const ownerReferences = rule?.metadata?.ownerReferences as Array<{ kind?: string; name?: string }> | undefined
    const decisionOwnerReference = ownerReferences?.[0]

    // Find associated placement if this is a placement decision
    if (decisionOwnerReference && subscription.placements) {
      placement = subscription.placements.find(
        (placement) =>
          placement.kind === decisionOwnerReference?.kind &&
          placement.metadata.name === decisionOwnerReference?.name &&
          placement.metadata.namespace === namespace
      )
    }

    nodes.push({
      name: name as string,
      namespace: namespace as string,
      type: 'placements',
      id: ruleId,
      uid: ruleId,
      specs: { isDesign: true, raw: rule },
      isPlacement,
      placement,
    })

    // Link placement rule to parent subscription
    links.push({
      from: { uid: parentId },
      to: { uid: ruleId },
      type: '',
      specs: { isDesign: true },
    })
  })
}

/**
 * Adds pre-hook or post-hook nodes to the topology
 *
 * @param parentId - Parent subscription ID
 * @param subscription - The subscription containing hook information
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @param isPreHook - Whether these are pre-hooks (true) or post-hooks (false)
 */
const addSubscriptionHooks = (
  parentId: string,
  subscription: SubscriptionKind,
  links: TopologyLink[],
  nodes: TopologyNode[],
  isPreHook: boolean
): void => {
  const hookList = isPreHook ? subscription.prehooks : subscription.posthooks
  if (!hookList) return

  hookList.forEach((hook: AnsibleJobModel) => {
    const {
      metadata: { name, namespace },
      kind,
    } = hook
    const type = kind.toLowerCase()
    const memberId = `member--deployed-resource--${parentId}--${namespace}--${name}--${type}`

    // Mark hook type for identification
    hook.hookType = isPreHook ? 'pre-hook' : 'post-hook'

    nodes.push({
      name: name as string,
      namespace: namespace as string,
      type,
      id: memberId,
      uid: memberId,
      specs: { isDesign: false, raw: hook },
    })

    // Link hooks with proper direction (pre-hooks point to subscription, post-hooks from subscription)
    links.push({
      from: { uid: isPreHook ? memberId : parentId },
      to: { uid: isPreHook ? parentId : memberId },
      type: '',
      specs: { isDesign: false },
    })
  })
}

/**
 * Processes subscription report to add deployed resource nodes
 *
 * This function handles the complex logic of creating topology nodes for all resources
 * deployed by a subscription, including proper parent-child relationships and service mappings.
 *
 * @param report - Subscription report containing deployed resources
 * @param clustersNames - Array of cluster names where resources are deployed
 * @param clusterId - Parent cluster node ID
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @param relatedResources - Map of related resources for template information
 */
const processReport = (
  report: SubscriptionReport,
  clustersNames: string[],
  clusterId: string,
  links: TopologyLink[],
  nodes: TopologyNode[],
  relatedResources: Record<string, any>
): void => {
  // Clone report to avoid mutations
  report = deepClone(report)
  const resources = report.resources || []
  const results = report.results || []

  // Attach template information from related resources
  if (relatedResources) {
    resources.forEach((resource) => {
      const { name, namespace } = resource
      resource.template = relatedResources[`${name}-${namespace}`] as Record<string, any>
    })
  }

  // Identify service owners (Route, Ingress, StatefulSet) for proper service linking
  const serviceOwners = resources.filter((obj) => {
    const kind = obj?.kind || ''
    return ['Route', 'Ingress', 'StatefulSet'].includes(kind)
  })

  // Process service owners first to build service mapping
  const serviceMap = processServiceOwner(clusterId, clustersNames, serviceOwners, links, nodes, relatedResources)

  // Process services and link them to their owners
  const services = resources.filter((obj) => {
    const kind = obj?.kind || ''
    return ['Service'].includes(kind)
  })
  processServices(clusterId, clustersNames, services, links, nodes, serviceMap)

  // Process all other resource types
  const others = resources.filter((obj) => {
    const kind = obj?.kind || ''
    return !['Route', 'Ingress', 'StatefulSet', 'Service'].includes(kind)
  })

  // Calculate number of clusters where resources were successfully deployed
  let numOfClustersDeployed = 0
  results.forEach((result) => {
    if (result.result === 'deployed') {
      numOfClustersDeployed++
    }
  })

  // Process remaining resources with multiplicity handling
  processMultiples(others as Record<string, unknown>[], numOfClustersDeployed).forEach(
    (resource: Record<string, unknown>) => {
      addSubscriptionDeployedResource(clusterId, clustersNames, resource as SubscriptionReportResource, links, nodes)
    }
  )
}

/**
 * Processes service owner resources (Route, Ingress, StatefulSet) and builds service mapping
 *
 * @param clusterId - Parent cluster node ID
 * @param clustersNames - Array of cluster names
 * @param serviceOwners - Array of service owner resources
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @param relatedResources - Map of related resources
 * @returns Service mapping for linking services to their owners
 */
const processServiceOwner = (
  clusterId: string,
  clustersNames: string[],
  serviceOwners: SubscriptionReportResource[],
  links: TopologyLink[],
  nodes: TopologyNode[],
  relatedResources: Record<string, unknown>
): ServiceMap => {
  const servicesMap: ServiceMap = {}

  serviceOwners.forEach((serviceOwner, inx) => {
    const node = addSubscriptionDeployedResource(clusterId, clustersNames, serviceOwner, links, nodes)

    if (relatedResources) {
      // Extract service information based on resource type
      let service: string | undefined
      let rules: unknown[]
      const { kind, template } = serviceOwner

      switch (kind) {
        case 'Route':
          service = (template as any)?.template?.spec?.to?.name
          if (service) {
            servicesMap[service] = node.id || ''
          }
          break
        case 'Ingress':
          rules = (template as any)?.template?.spec?.rules || []
          rules.forEach((rule) => {
            const rulePaths = (rule as any)?.http?.paths || []
            rulePaths.forEach((path: unknown) => {
              service = (path as any)?.backend?.serviceName
              if (service) {
                servicesMap[service] = node.id || ''
              }
            })
          })
          break
        case 'StatefulSet':
          service = (template as any)?.template?.spec?.serviceName
          if (service) {
            servicesMap[service] = node.id || ''
          }
          break
      }
    } else if (serviceOwners.length === 1) {
      // Fallback mapping when no related resources available
      servicesMap[`serviceOwner${inx}`] = node.id || ''
    }
  })

  return servicesMap
}

/**
 * Processes Service resources and links them to their owners
 *
 * @param clusterId - Parent cluster node ID
 * @param clustersNames - Array of cluster names
 * @param services - Array of Service resources
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @param servicesMap - Mapping of service names to owner node IDs
 */
const processServices = (
  clusterId: string,
  clustersNames: string[],
  services: SubscriptionReportResource[],
  links: TopologyLink[],
  nodes: TopologyNode[],
  servicesMap: ServiceMap
): void => {
  services.forEach((service, inx) => {
    const serviceName = service.name
    let parentId = servicesMap[serviceName]

    // Fallback parent selection
    if (!parentId) {
      parentId = servicesMap[`serviceOwner${inx}`]
    }
    if (!parentId) {
      parentId = clusterId
    }

    addSubscriptionDeployedResource(parentId, clustersNames, service, links, nodes)
  })
}

/**
 * Adds a deployed resource node to the topology with proper parent-child relationships
 *
 * This function creates nodes for resources deployed by subscriptions and handles
 * the creation of child nodes for replicas, controller revisions, ingress routes, and pods.
 *
 * @param parentId - Parent node ID
 * @param clustersNames - Array of cluster names where resource is deployed
 * @param resource - The resource to add
 * @param links - Array to add new links to
 * @param nodes - Array to add new nodes to
 * @returns The created node
 */
const addSubscriptionDeployedResource = (
  parentId: string,
  clustersNames: string[],
  resource: SubscriptionReportResource,
  links: TopologyLink[],
  nodes: TopologyNode[]
): TopologyNode => {
  // Find parent node information
  const parentNode = nodes.find((n) => n.id === parentId)
  const parentObject: ParentObject | undefined = parentNode
    ? {
        parentId,
        parentName: parentNode.name,
        parentType: parentNode.type,
        parentSpecs: parentNode.specs,
      }
    : undefined

  const { name, namespace, template, resources, resourceCount } = resource
  const kind = resource.kind.toLowerCase()
  const memberId = `member--deployed-resource--${parentId}--${namespace}--${name}--${kind}`

  const node: TopologyNode = {
    name: name,
    namespace: namespace,
    type: kind,
    id: memberId,
    uid: memberId,
    specs: {
      isDesign: false,
      parent: parentObject,
      clustersNames,
      template,
      resources,
      resourceCount: resourceCount ? resourceCount : clustersNames.length,
    },
  }

  nodes.push(node)

  // Link resource to its parent
  links.push({
    from: { uid: parentId },
    to: { uid: memberId },
    type: '',
  })

  // Create child nodes based on resource type
  createReplicaChild(node, clustersNames, template, undefined, links, nodes)
  createControllerRevisionChild(node, clustersNames, undefined, links, nodes)
  createIngressRouteChild(node, clustersNames, undefined, links, nodes)
  createPodChild(node, clustersNames, undefined, links, nodes)

  return node
}
