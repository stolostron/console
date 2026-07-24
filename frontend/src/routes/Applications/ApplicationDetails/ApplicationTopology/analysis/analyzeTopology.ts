/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import type { Placement } from '~/resources'
import type { TopologyNode } from '../types'
import { analyzeTopologyAppSet } from './analyzeTopologyAppSet'
import type { TopologyAlert } from './utils'

export type {
  IBulletDescription,
  IConditionWithErrors,
  IConditionError,
  IFilteredConditionError,
  IResourcesWithStatus,
  TopologyAlert,
  TopologyAlertAction,
  TopologyAlertDescription,
} from './utils'

export {
  createTopologyErrorAlert,
  createTopologyAlert,
  extractConditionsErrors,
  TopologyAlertActionType,
} from './utils'

/**
 * Analyzes topology nodes and produces alerts for placement, cluster, and deployment issues.
 */
export const analyzeTopology = async (
  nodes: TopologyNode[],
  t: TFunction,
  placements: Placement[] = [],
  hubClusterName = ''
): Promise<TopologyAlert[]> => {
  const alerts: TopologyAlert[] = []

  const appSet = nodes.find((node) => node.type === 'applicationset')

  if (appSet) {
    await analyzeTopologyAppSet(appSet, nodes, alerts, t, placements, hubClusterName)
  }

  return alerts
}
