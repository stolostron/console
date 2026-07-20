/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import jsYaml from 'js-yaml'
import stringSimilarity from 'string-similarity'
import type { Placement } from '~/resources'
import type { TopologyNode } from '../types'
import type { IFilteredConditionError, TopologyAlert } from './analyzeTopology'
import { createTopologyAlert, createTopologyErrorAlert, TopologyAlertActionType } from './utils'

const BAD_PREDICATE_MESSAGE = 'No ManagedCluster matches any of the cluster predicate'
const UNBOUND_CLUSTER_SETS_MESSAGE = 'None of ManagedClusterSets [] is bound to placement namespace'
const SIMILARITY_THRESHOLD = 0.7

export const PLACEMENT_MATCH_LABEL = 'cluster.open-cluster-management.io/placement'

/** @param generatorPath Path from spec to the generator entry, e.g. `generators.0` or `generators.0.matrix.generators.0` */
export const getPlacementMatchLabelHighlightPath = (generatorPath: string): string =>
  `ApplicationSet.spec.${generatorPath}.clusterDecisionResource.labelSelector.matchLabels.cluster.open-cluster-management.io/placement`

/**
 * Creates an alert when an ApplicationSet references a placement that does not exist.
 */
export const missingPlacementAlert = (
  appSet: TopologyNode,
  placementName: string,
  clusterName: string,
  generatorPath: string,
  alerts: TopologyAlert[],
  t: TFunction
): void => {
  const currentYaml = jsYaml
    .dump(
      {
        [PLACEMENT_MATCH_LABEL]: placementName,
      },
      { indent: 2 }
    )
    .split('\n')

  const alert = createTopologyAlert(
    t('Placement Missing'),
    'red',
    {
      message: t("Cannot find '{{placement}}' on {{clusterName}}", {
        placement: placementName,
        clusterName,
      }),
      bullets: [
        {
          title: t('Specified placement does not exist'),
          content: currentYaml,
        },
      ],
    },
    [
      {
        label: t('Edit application'),
        type: TopologyAlertActionType.editAppSet,
        node: appSet,
      },
      {
        label: t('Edit YAML'),
        type: TopologyAlertActionType.editYaml,
        node: appSet,
        highlightEditorPath: getPlacementMatchLabelHighlightPath(generatorPath),
      },
    ]
  )

  if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
    alerts.push(alert)
  }

  appSet.specs.pulse = 'red'
}

export const createSuggestsPlacement = (
  node: TopologyNode,
  filteredError: IFilteredConditionError,
  alerts: TopologyAlert[],
  t: TFunction
): void => {
  const placement = node.placement as Placement

  filteredError.errors.forEach((error) => {
    const message = error.firstError.message
    const singleError = { ...filteredError, errors: [error] }

    switch (true) {
      case stringSimilarity.compareTwoStrings(message, BAD_PREDICATE_MESSAGE) > SIMILARITY_THRESHOLD: {
        const currentYaml = jsYaml.dump(placement.spec.predicates ?? {}, { indent: 2 }).split('\n')
        const suggestions = [{ title: t('Current predicates'), content: currentYaml }]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
              highlightEditorPath: 'Placement.spec.predicates',
            },
          ],
          alerts,
          singleError,
          t
        )
        break
      }
      case stringSimilarity.compareTwoStrings(message, UNBOUND_CLUSTER_SETS_MESSAGE) > SIMILARITY_THRESHOLD: {
        const currentYaml = jsYaml.dump(placement.spec.clusterSets ?? {}, { indent: 2 }).split('\n')
        const suggestions = [
          {
            title: t('If specify a clusterSet, make sure it is bound to the gitops operator placement namespace'),
          },
          { title: t('If you want to deploy to all clusters, remove the clusterSets') },
          { title: t('Current clustersets'), content: currentYaml },
        ]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
              highlightEditorPath: 'Placement.spec.clusterSets',
            },
          ],
          alerts,
          singleError,
          t
        )
        break
      }
      default: {
        const currentYaml = jsYaml.dump(placement.spec.clusterSets ?? {}, { indent: 2 }).split('\n')
        const suggestions = [{ title: t('Current specification'), content: currentYaml }]
        createTopologyErrorAlert(
          suggestions,
          [
            {
              label: t('Edit application'),
              type: TopologyAlertActionType.editAppSet,
              node,
            },
            {
              label: t('Edit YAML'),
              type: TopologyAlertActionType.editYaml,
              node,
            },
          ],
          alerts,
          singleError,
          t
        )
      }
    }
  })
}
