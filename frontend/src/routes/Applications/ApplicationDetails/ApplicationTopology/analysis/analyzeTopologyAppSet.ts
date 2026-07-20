/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import type { ApplicationSet, AppSetGenerator, Placement } from '~/resources'
import type { TopologyNode } from '../types'
import { analyzeTopologyApplications } from './analyzeTopologyApplications'
import { analyzeTopologyClusters } from './analyzeTopologyClusters'
import type { IFilteredConditionError, IResourcesWithStatus, TopologyAlert } from './analyzeTopology'
import { createSuggestsAppset } from './createSuggestsAppset'
import { createSuggestsPlacement, missingPlacementAlert, PLACEMENT_MATCH_LABEL } from './createSuggestsPlacement'
import { createTopologyAlert, extractConditionsErrors, setNodePulseForTypes, TopologyAlertActionType } from './utils'

const collectReferencedPlacements = (
  generators: AppSetGenerator[] | undefined
): { placementName: string; generatorPath: string }[] => {
  const referenced: { placementName: string; generatorPath: string }[] = []
  const seen = new Set<string>()

  const collectFrom = (items: AppSetGenerator[] | undefined, pathPrefix: string): void => {
    items?.forEach((item, index) => {
      const generatorPath = `${pathPrefix}.${index}`
      const placementName = item.clusterDecisionResource?.labelSelector?.matchLabels?.[PLACEMENT_MATCH_LABEL]
      if (placementName && !seen.has(placementName)) {
        seen.add(placementName)
        referenced.push({ placementName, generatorPath })
      }
      collectFrom(item.matrix?.generators, `${generatorPath}.matrix.generators`)
      collectFrom(item.merge?.generators, `${generatorPath}.merge.generators`)
    })
  }

  collectFrom(generators, 'generators')
  return referenced
}

/**
 * Analyzes ApplicationSet topology nodes for placement and application errors.
 */
export const analyzeTopologyAppSet = async (
  appSet: TopologyNode,
  nodes: TopologyNode[],
  alerts: TopologyAlert[],
  t: TFunction,
  placements: Placement[] = [],
  hubClusterName = ''
): Promise<void> => {
  let placementErrors: IFilteredConditionError[] = []
  let appsetErrors: IFilteredConditionError[] = []
  let appSetAppsErrors: IFilteredConditionError[] = []
  let hasMissingPlacement = false

  /////////////////////////////////////////////
  // Analyzing Placement Policy
  /////////////////////////////////////////////
  const placement = nodes.find((node) => node.type === 'placement')

  if (placement) {
    placementErrors = extractConditionsErrors([placement.placement as IResourcesWithStatus], t)
  } else {
    const referencedPlacements = collectReferencedPlacements(
      (appSet.specs.raw as ApplicationSet | undefined)?.spec?.generators
    )
    const clusterName = hubClusterName || 'local-cluster'

    referencedPlacements.forEach(({ placementName, generatorPath }) => {
      const placementExists = placements.some(
        (candidate) =>
          candidate.metadata?.name === placementName &&
          (!appSet.namespace || candidate.metadata?.namespace === appSet.namespace)
      )
      if (!placementExists) {
        missingPlacementAlert(appSet, placementName, clusterName, generatorPath, alerts, t)
        hasMissingPlacement = true
      }
    })
  }

  const hasPlacementIssues = placementErrors.length > 0 || hasMissingPlacement

  if (placementErrors.length > 0) {
    placementErrors.forEach((placementError) => {
      createSuggestsPlacement(placement!, placementError, alerts, t)
    })

    if (placement) {
      placement.specs.pulse = 'red'
    }
    setNodePulseForTypes(nodes, ['placementDecision', 'applicationset', 'cluster', 'git', 'chart'], 'none')
  } else if (hasMissingPlacement) {
    setNodePulseForTypes(nodes, ['placementDecision', 'cluster', 'git', 'chart'], 'none')
  }

  /////////////////////////////////////////////
  // Analyzing Application Set Applications
  /////////////////////////////////////////////
  if (!hasPlacementIssues) {
    appSetAppsErrors = await analyzeTopologyApplications(appSet, nodes, alerts, t)
  }

  /////////////////////////////////////////////
  // Analyzing Application Set
  /////////////////////////////////////////////
  if (!hasPlacementIssues && appSetAppsErrors.length === 0) {
    appsetErrors = extractConditionsErrors([appSet.specs.raw as IResourcesWithStatus], t)

    if (appsetErrors.length > 0) {
      appsetErrors.forEach((appsetError) => {
        createSuggestsAppset(appSet, appsetError, alerts, t)
      })

      appSet.specs.pulse = 'red'
    }
  }

  if (appSet.isArgoCDPullModelTargetLocalCluster) {
    const actionNode = placement ?? appSet
    const alert = createTopologyAlert(
      t('Warning'),
      'yellow',
      {
        message: t(
          'The ArgoCD pull model does not support the hub cluster as a destination cluster. Filter out the hub cluster from the placement resource.'
        ),
        bullets: [
          {
            title: t('Add predicate to exclude the local-cluster'),
          },
        ],
      },
      [
        {
          label: t('Edit application'),
          type: TopologyAlertActionType.editAppSet,
          node: actionNode,
        },
        {
          label: t('Edit YAML'),
          type: TopologyAlertActionType.editYaml,
          node: actionNode,
          highlightEditorPath: 'Placement.spec.predicates',
        },
      ]
    )
    if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
      alerts.push(alert)
    }
  }

  await analyzeTopologyClusters(appSet, nodes, alerts, t)
}
