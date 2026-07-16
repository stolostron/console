/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { analyzeTopologyAppSet } from './analyzeTopologyAppSet'
import type { TopologyAlert } from './utils'
import {
  createAppSetNode,
  createCondition,
  createPlacementNode,
} from './__fixtures__/topologyAnalysisFixtures'

jest.mock('../../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(() => Promise.resolve({ errorMessage: 'not available' })),
}))

describe('analyzeTopologyAppSet', () => {
  it('handles placement errors first and suppresses later application analysis', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: [
          {
            metadata: { name: 'test-appset-local-cluster', namespace: 'openshift-gitops' },
            kind: 'Application',
            status: {
              health: { status: 'Degraded' },
              sync: { status: 'OutOfSync' },
            },
          },
        ],
      },
    })
    const placement = createPlacementNode('No ManagedCluster matches any of the cluster predicate')
    const cluster = {
      name: 'local-cluster',
      namespace: 'openshift-gitops',
      type: 'cluster',
      specs: {},
    }

    await analyzeTopologyAppSet(appSet, [appSet, placement, cluster], alerts, t)

    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts.some((alert) => alert.description?.bullets?.[0].title === 'Current predicates')).toBe(true)
    expect(placement.specs.pulse).toBe('red')
    expect(cluster.specs.pulse).toBe('none')
    expect(appSet.specs.pulse).toBe('none')
    expect(alerts.some((alert) => alert.title === 'Some resources are not healthy or synced on these clusters')).toBe(
      false
    )
  })

  it('analyzes appset conditions when placement and apps are healthy', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'ApplicationSet',
          metadata: { name: 'test-appset', namespace: 'openshift-gitops' },
          spec: {
            generators: [],
            template: { spec: { destination: { namespace: 'default' } } },
          },
          status: {
            conditions: [
              createCondition({
                type: 'ErrorOccurred',
                reason: 'ApplicationGenerationFromParamsError',
                message: 'no clusterDecisionResources found',
                status: 'True',
              }),
            ],
          },
        },
      },
    })
    const placement = createPlacementNode()

    await analyzeTopologyAppSet(appSet, [appSet, placement], alerts, t)

    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].description?.bullets?.[0].title).toContain(
      'Make sure the placement referenced in the ApplicationSet generator exists'
    )
    expect(appSet.specs.pulse).toBe('red')
  })
})
