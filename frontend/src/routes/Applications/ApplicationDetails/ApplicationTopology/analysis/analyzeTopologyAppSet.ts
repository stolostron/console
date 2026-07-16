/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import type { TopologyNode } from '../types'
import { analyzeTopologyApplications } from './analyzeTopologyApplications'
import { analyzeTopologyClusters } from './analyzeTopologyClusters'
import type { IFilteredConditionError, IResourcesWithStatus, TopologyAlert } from './analyzeTopology'
import { createSuggestsAppset } from './createSuggestsAppset'
import { createSuggestsPlacement } from './createSuggestsPlacement'
import { extractConditionsErrors, setNodePulseForTypes } from './utils'

/**
 * Analyzes ApplicationSet topology nodes for placement and application errors.
 */
export const analyzeTopologyAppSet = async (
  appSet: TopologyNode,
  nodes: TopologyNode[],
  alerts: TopologyAlert[],
  t: TFunction
): Promise<void> => {
  let placementErrors: IFilteredConditionError[] = []
  let appsetErrors: IFilteredConditionError[] = []
  let appSetAppsErrors: IFilteredConditionError[] = []

  /////////////////////////////////////////////
  // Analyzing Placement Policy
  /////////////////////////////////////////////
  const placement = nodes.find((node) => node.type === 'placement')

  if (placement) {
    placementErrors = extractConditionsErrors([placement.placement as IResourcesWithStatus], t)
  }

  if (placementErrors.length > 0) {
    placementErrors.forEach((placementError) => {
      createSuggestsPlacement(placement!, placementError, alerts, t)
    })

    if (placement) {
      placement.specs.pulse = 'red'
    }
    setNodePulseForTypes(nodes, ['placementDecision', 'applicationset', 'cluster', 'git', 'chart'], 'none')
  }

  /////////////////////////////////////////////
  // Analyzing Application Set Applications
  /////////////////////////////////////////////
  if (placementErrors.length === 0) {
    appSetAppsErrors = await analyzeTopologyApplications(appSet, nodes, alerts, t)
  }

  /////////////////////////////////////////////
  // Analyzing Application Set
  /////////////////////////////////////////////
  if (placementErrors.length === 0 && appSetAppsErrors.length === 0) {
    appsetErrors = extractConditionsErrors([appSet.specs.raw as IResourcesWithStatus], t)

    if (appsetErrors.length > 0) {
      appsetErrors.forEach((appsetError) => {
        createSuggestsAppset(appSet, appsetError, alerts, t)
      })

      appSet.specs.pulse = 'red'
    }
  }

  await analyzeTopologyClusters(appSet, nodes, alerts, t)
}
