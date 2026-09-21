/* Copyright Contributors to the Open Cluster Management project */

import type { TopologyNode } from '../types'

/** Toolbar action visibility aligned with DetailsView.renderToolbar */
export function getTopologyNodeActionVisibility(
  type: string | undefined,
  specs?: { useArgoApplicationIcon?: boolean }
): {
  showLogs: boolean
  showEditYaml: boolean
} {
  const nodeType = type ?? ''
  const showLogs = nodeType === 'pod'
  const showEditYaml =
    nodeType === 'application' ||
    specs?.useArgoApplicationIcon === true ||
    (nodeType !== 'cluster' &&
      nodeType !== 'git' &&
      nodeType !== 'chart' &&
      nodeType !== 'ocpapplication' &&
      nodeType !== 'fluxapplication')
  return { showLogs, showEditYaml }
}

export function showApplicationPickerOnAppSet(node: TopologyNode): boolean {
  if (node.type !== 'applicationset') {
    return false
  }
  if (node.specs?.showApplicationPicker === true) {
    return true
  }
  const apps = node.specs?.appSetApps
  return Array.isArray(apps) && apps.length > 1
}

export function getTopologyNodeDataFromElement(element: { getData: () => Record<string, unknown> }): TopologyNode {
  return element.getData() as TopologyNode
}
