/* Copyright Contributors to the Open Cluster Management project */

import { getFilteredNode } from './diagram-helpers'
import type {
  AppSetApplication,
  DetailsTableNodeSpecs,
  DetailsTableNodeSpecsStatusMap,
  DetailsTableResourceItem,
  PodInfo,
  PulseColor,
  ResourceMap,
  TopologyNode,
} from '../types'

export type ResourceNavigatorItem = {
  id: string
  name: string
  namespace?: string
  cluster: string
  resourceType?: string
  pulse?: PulseColor
  isApplication?: boolean
  /** Filtered topology node for edit/logs when not an application */
  filteredNode?: TopologyNode
  /** Argo application resource for application edit */
  application?: AppSetApplication
}

export type ResourceNavigatorGroup = {
  groupId: string
  groupTitle: string
  items: ResourceNavigatorItem[]
}

export function pulseToDrawerIcon(pulse: PulseColor | undefined): string {
  switch (pulse) {
    case 'green':
      return 'success'
    case 'red':
      return 'failure'
    case 'yellow':
      return 'warning'
    case 'blocked':
      return 'blocked'
    case undefined:
    case 'orange':
    default:
      return 'pending'
  }
}

function buildResourceItemsFromNode(node: TopologyNode): DetailsTableResourceItem[] {
  const { name, namespace, type, specs = {} } = node
  const { resources = [{ name, namespace }], clustersNames = [] } = specs as DetailsTableNodeSpecs

  let replicaCount = (specs as DetailsTableNodeSpecs).replicaCount ?? 1
  replicaCount = Number.isNaN(Number(replicaCount)) ? 1 : Number(replicaCount)

  const statusMap = ((specs as DetailsTableNodeSpecs)[`${node.type}Model`] || {}) as DetailsTableNodeSpecsStatusMap

  const available: DetailsTableResourceItem[] = []
  resources.forEach((resource) => {
    clustersNames.forEach((cluster) => {
      const displayResource = resource.cluster ? resource.cluster === cluster : true
      if (!displayResource) {
        return
      }
      Array.from(new Array(replicaCount)).forEach((_, i) => {
        const modelKey = resource.namespace
          ? `${resource.name}-${cluster}-${resource.namespace}`
          : `${resource.name}-${cluster}`
        const status = statusMap[modelKey as keyof typeof statusMap]
        available.push({
          pulse: status && status.length > i ? status[i].pulse || 'green' : 'orange',
          name: status && status.length > i ? status[i].name : resource.name,
          namespace: status && status.length > i ? status[i].namespace : resource.namespace,
          cluster,
          type,
        })
      })
    })
  })

  return available
}

/** Error first, waiting (orange / unknown) last within a type group */
export function navigatorPulseSortIndex(pulse?: PulseColor): number {
  switch (pulse) {
    case 'red':
      return 0
    case 'yellow':
      return 1
    case 'green':
      return 2
    case 'blocked':
      return 3
    case 'orange':
      return 4
    default:
      return 5
  }
}

export function sortNavigatorItems(items: ResourceNavigatorItem[]): ResourceNavigatorItem[] {
  return [...items].sort((a, b) => {
    const typeCmp = (a.resourceType ?? '').localeCompare(b.resourceType ?? '')
    if (typeCmp !== 0) {
      return typeCmp
    }
    const pulseCmp = navigatorPulseSortIndex(a.pulse) - navigatorPulseSortIndex(b.pulse)
    if (pulseCmp !== 0) {
      return pulseCmp
    }
    return a.name.localeCompare(b.name)
  })
}

function groupItemsByCluster(items: ResourceNavigatorItem[]): ResourceNavigatorGroup[] {
  const byCluster = new Map<string, ResourceNavigatorItem[]>()
  items.forEach((item) => {
    const list = byCluster.get(item.cluster) ?? []
    list.push(item)
    byCluster.set(item.cluster, list)
  })
  return [...byCluster.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([cluster, groupItems]) => ({
      groupId: cluster,
      groupTitle: cluster,
      items: sortNavigatorItems(groupItems),
    }))
}

function displayNameForResource(item: ResourceNavigatorItem, sameNameCount: number): string {
  if (item.isApplication) {
    return item.name
  }
  if (sameNameCount > 1 && item.namespace) {
    return `${item.name} (${item.namespace})`
  }
  return item.name
}

function countSameNameInCluster(items: ResourceNavigatorItem[], name: string, cluster: string): number {
  return items.filter((i) => i.name === name && i.cluster === cluster && !i.isApplication).length
}

export function buildNavigatorGroups(
  node: TopologyNode,
  mode: 'logs' | 'edit' | 'application'
): ResourceNavigatorGroup[] {
  if (mode === 'application' && node.type === 'applicationset') {
    const apps = (node.specs?.appSetApps ?? []) as AppSetApplication[]
    const items: ResourceNavigatorItem[] = apps.map((app: AppSetApplication) => {
      const appName = app.metadata?.name ?? ''
      const appNamespace = app.metadata?.namespace ?? node.namespace ?? ''
      return {
        id: `app-${appNamespace}-${appName}`,
        name: appName,
        namespace: appNamespace,
        cluster: (node.cluster as string | undefined) ?? '',
        isApplication: true,
        application: app,
        resourceType: 'application',
        pulse: 'green',
      }
    })
    return [
      {
        groupId: node.name,
        groupTitle: node.name,
        items: sortNavigatorItems(items),
      },
    ]
  }

  const resourceRows = buildResourceItemsFromNode(node)
  const flatItems: ResourceNavigatorItem[] = resourceRows.map((row) => ({
    id: `${row.cluster}-${row.namespace ?? ''}-${row.name}`,
    name: row.name,
    namespace: row.namespace,
    cluster: row.cluster,
    resourceType: row.type,
    pulse: row.pulse as PulseColor,
    filteredNode: undefined,
  }))

  flatItems.forEach((item) => {
    item.filteredNode = getFilteredNode(node, {
      name: item.name,
      namespace: item.namespace ?? '',
      cluster: item.cluster,
    })
    const sameNameCount = countSameNameInCluster(flatItems, item.name, item.cluster)
    item.name = displayNameForResource(item, sameNameCount)
  })

  return groupItemsByCluster(flatItems)
}

export function flattenNavigatorGroups(groups: ResourceNavigatorGroup[]): ResourceNavigatorItem[] {
  return groups.flatMap((g) => g.items)
}

export function findInitialNavigatorSelection(items: ResourceNavigatorItem[]): ResourceNavigatorItem | undefined {
  if (items.length === 0) {
    return undefined
  }
  const red = items.find((item) => item.pulse === 'red')
  return red ?? items[0]
}

export function filterNavigatorGroups(groups: ResourceNavigatorGroup[], searchValue: string): ResourceNavigatorGroup[] {
  if (!searchValue.trim()) {
    return groups
  }
  // Every token must appear in the group title or the item name (substring, case-insensitive).
  const tokens = searchValue.trim().toLowerCase().split(/\s+/).filter(Boolean)

  return groups
    .map((group) => {
      const groupTitle = group.groupTitle.toLowerCase()
      const items = group.items.filter((item) => {
        const itemName = item.name.toLowerCase()
        return tokens.every((token) => groupTitle.includes(token) || itemName.includes(token))
      })
      return { ...group, items }
    })
    .filter((group) => group.items.length > 0)
}

export function getAllPodsFromNode(node: TopologyNode): PodInfo[] {
  const podModel = node?.specs?.podModel as ResourceMap | undefined
  if (!podModel) {
    return []
  }
  return Object.values(podModel).flat()
}

export function buildPodNavigatorGroups(node: TopologyNode): ResourceNavigatorGroup[] {
  const pods = getAllPodsFromNode(node)
  const items: ResourceNavigatorItem[] = pods.map((pod) => {
    const podName = pod.name ?? ''
    const filtered = getFilteredNode(node, {
      name: podName,
      namespace: pod.namespace ?? '',
      cluster: pod.cluster ?? '',
    })
    // Ensure logs viewer sees only this pod (getFilteredNode keeps full podModel for non-exact matches)
    filtered.specs = {
      ...filtered.specs,
      podModel: {
        [podName]: [pod],
      },
    }
    return {
      id: `${pod.cluster}-${pod.namespace}-${podName}`,
      name: podName,
      namespace: pod.namespace,
      cluster: pod.cluster ?? '',
      resourceType: 'pod',
      pulse: 'green',
      filteredNode: filtered,
    }
  })
  return groupItemsByCluster(items)
}

export function navigatorItemCount(node: TopologyNode, mode: 'logs' | 'edit' | 'application'): number {
  if (mode === 'logs') {
    return flattenNavigatorGroups(buildPodNavigatorGroups(node)).length
  }
  return flattenNavigatorGroups(buildNavigatorGroups(node, mode)).length
}

export function topologyNodeToApplicationEditNode(appSetNode: TopologyNode, app: AppSetApplication): TopologyNode {
  const appName = app.metadata?.name ?? ''
  const appNamespace = app.metadata?.namespace ?? appSetNode.namespace ?? ''
  return {
    ...appSetNode,
    name: appName,
    namespace: appNamespace,
    type: 'application',
    id: `${appSetNode.id}-app-${appName}`,
    uid: `${appSetNode.uid}-app-${appName}`,
    specs: {
      ...appSetNode.specs,
      isDesign: false,
      raw: app,
      applicationName: appName,
      resourceCount: 0,
    },
  }
}
