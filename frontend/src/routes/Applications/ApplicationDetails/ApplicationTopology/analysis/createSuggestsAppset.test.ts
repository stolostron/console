/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { createSuggestsAppset } from './createSuggestsAppset'
import { TopologyAlertActionType, type TopologyAlert } from './utils'
import { createAppSetNode, createFilteredError } from './__fixtures__/topologyAnalysisFixtures'

describe('createSuggestsAppset', () => {
  it('suggests generator fixes for missing clusterDecisionResources', () => {
    const alerts: TopologyAlert[] = []
    const node = createAppSetNode()

    createSuggestsAppset(
      node,
      createFilteredError('no clusterDecisionResources found', {
        kind: 'ApplicationSet',
        reason: 'ApplicationGenerationFromParamsError',
      }),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.bullets?.[0].title).toContain(
      'Make sure the placement referenced in the ApplicationSet generator exists'
    )
    expect(alerts[0].description?.bullets?.[1].title).toBe('Current generators')
    expect(alerts[0].actions?.map((action) => action.type)).toEqual([
      TopologyAlertActionType.editAppSet,
      TopologyAlertActionType.editYaml,
    ])
    expect(alerts[0].actions?.[1].highlightEditorPath).toBe('ApplicationSet.spec.generators')
  })

  it('falls back to destination suggestions for unknown errors', () => {
    const alerts: TopologyAlert[] = []
    const node = createAppSetNode()

    createSuggestsAppset(
      node,
      createFilteredError('unexpected appset failure', {
        kind: 'ApplicationSet',
        reason: 'OtherError',
      }),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.bullets?.[0].title).toBe('Current destinations')
    expect(alerts[0].actions?.[1].highlightEditorPath).toBe('ApplicationSet.spec.template.spec.destination')
  })
})
