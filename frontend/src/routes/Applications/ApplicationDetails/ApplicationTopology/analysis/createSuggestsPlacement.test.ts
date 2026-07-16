/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import {
  createSuggestsPlacement,
  getPlacementMatchLabelHighlightPath,
  missingPlacementAlert,
} from './createSuggestsPlacement'
import { TopologyAlertActionType, type TopologyAlert } from './utils'
import { createAppSetNode, createFilteredError } from './__fixtures__/topologyAnalysisFixtures'

describe('createSuggestsPlacement', () => {
  it('adds predicate suggestions for unmatched cluster predicates', () => {
    const alerts: TopologyAlert[] = []
    const node = createAppSetNode()
    node.type = 'placement'
    node.placement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test-placement', namespace: 'openshift-gitops' },
      spec: {
        predicates: [{ requiredClusterSelector: { labelSelector: { matchLabels: { env: 'prod' } } } }],
      },
    }

    createSuggestsPlacement(
      node,
      createFilteredError('No ManagedCluster matches any of the cluster predicate'),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.bullets?.[0].title).toBe('Current predicates')
    expect(alerts[0].actions?.map((action) => action.type)).toEqual([
      TopologyAlertActionType.editAppSet,
      TopologyAlertActionType.editYaml,
    ])
    expect(alerts[0].actions?.[1].highlightEditorPath).toBe('Placement.spec.predicates')
  })

  it('adds clusterset suggestions for unbound ManagedClusterSets', () => {
    const alerts: TopologyAlert[] = []
    const node = createAppSetNode()
    node.type = 'placement'
    node.placement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test-placement', namespace: 'openshift-gitops' },
      spec: { clusterSets: ['default'] },
    }

    createSuggestsPlacement(
      node,
      createFilteredError('None of ManagedClusterSets [] is bound to placement namespace'),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.bullets?.map((bullet) => bullet.title)).toEqual([
      'If specify a clusterSet, make sure it is bound to the gitops operator placement namespace',
      'If you want to deploy to all clusters, remove the clusterSets',
      'Current clustersets',
    ])
    expect(alerts[0].actions?.[1].highlightEditorPath).toBe('Placement.spec.clusterSets')
  })

  it('falls back to current specification for unknown messages', () => {
    const alerts: TopologyAlert[] = []
    const node = createAppSetNode()
    node.type = 'placement'
    node.placement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test-placement', namespace: 'openshift-gitops' },
      spec: { clusterSets: ['default'] },
    }

    createSuggestsPlacement(node, createFilteredError('some unknown placement failure'), alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.bullets?.[0].title).toBe('Current specification')
    expect(alerts[0].actions?.[1].label).toBe('Edit placement')
  })
})

describe('missingPlacementAlert', () => {
  it('creates a Placement Missing alert with yaml content and edit actions', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode()

    missingPlacementAlert(appSet, 'missing-placement', 'local-cluster', 'generators.0', alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Placement Missing')
    expect(alerts[0].description?.message).toBe("Cannot find 'missing-placement' on local-cluster")
    expect(alerts[0].description?.bullets?.[0].title).toBe('Specified placement does not exist')
    expect(alerts[0].description?.bullets?.[0].content?.join('\n')).toContain(
      'cluster.open-cluster-management.io/placement: missing-placement'
    )
    expect(alerts[0].actions?.map((action) => action.label)).toEqual(['Edit application', 'Edit YAML'])
    expect(alerts[0].actions?.[1].highlightEditorPath).toBe(getPlacementMatchLabelHighlightPath('generators.0'))
    expect(appSet.specs.pulse).toBe('red')
  })

  it('does not duplicate the same missing placement alert', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode()

    missingPlacementAlert(appSet, 'missing-placement', 'local-cluster', 'generators.0', alerts, t)
    missingPlacementAlert(appSet, 'missing-placement', 'local-cluster', 'generators.0', alerts, t)

    expect(alerts).toHaveLength(1)
  })

  it('uses the generator path in the highlight path', () => {
    expect(getPlacementMatchLabelHighlightPath('generators.2')).toBe(
      'ApplicationSet.spec.generators.2.clusterDecisionResource.labelSelector.matchLabels.cluster.open-cluster-management.io/placement'
    )
    expect(getPlacementMatchLabelHighlightPath('generators.0.matrix.generators.1')).toBe(
      'ApplicationSet.spec.generators.0.matrix.generators.1.clusterDecisionResource.labelSelector.matchLabels.cluster.open-cluster-management.io/placement'
    )
  })
})
