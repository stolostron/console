/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import type { Placement } from '~/resources'
import { analyzeTopologyAppSet } from './analyzeTopologyAppSet'
import type { TopologyAlert } from './utils'
import {
  APPSET_NAME,
  NAMESPACE,
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

  it('creates a missing placement alert when no placement node and referenced placement is absent', async () => {
    const alerts: TopologyAlert[] = []
    const placementName = `${APPSET_NAME}-placement`
    const appSet = createAppSetNode({
      specs: {
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'ApplicationSet',
          metadata: { name: APPSET_NAME, namespace: NAMESPACE },
          spec: {
            generators: [
              {
                clusterDecisionResource: {
                  configMapRef: 'acm-placement',
                  labelSelector: {
                    matchLabels: {
                      'cluster.open-cluster-management.io/placement': placementName,
                    },
                  },
                },
              },
            ],
            template: { spec: { destination: { namespace: 'default' } } },
          },
          status: { conditions: [] },
        },
      },
    })

    await analyzeTopologyAppSet(appSet, [appSet], alerts, t, [], 'local-cluster')

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Placement Missing')
    expect(alerts[0].description?.message).toBe(`Cannot find '${placementName}' on local-cluster`)
    expect(appSet.specs.pulse).toBe('red')
  })

  it('creates a missing placement alert for matrix nested clusterDecisionResource', async () => {
    const alerts: TopologyAlert[] = []
    const placementName = 'appset-perf-40009-placement'
    const appSet = createAppSetNode({
      specs: {
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'ApplicationSet',
          metadata: { name: APPSET_NAME, namespace: NAMESPACE },
          spec: {
            generators: [
              {
                matrix: {
                  generators: [
                    {
                      clusterDecisionResource: {
                        configMapRef: 'acm-placement',
                        labelSelector: {
                          matchLabels: {
                            'cluster.open-cluster-management.io/placement': placementName,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            ],
            template: { spec: { destination: { namespace: 'default' } } },
          },
          status: { conditions: [] },
        },
      },
    })

    await analyzeTopologyAppSet(appSet, [appSet], alerts, t, [], 'local-cluster')

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Placement Missing')
    expect(alerts[0].actions?.[1].highlightEditorPath).toBe(
      'ApplicationSet.spec.generators.0.matrix.generators.0.clusterDecisionResource.labelSelector.matchLabels.cluster.open-cluster-management.io/placement'
    )
  })

  it('does not create a missing placement alert when the referenced placement exists', async () => {
    const alerts: TopologyAlert[] = []
    const placementName = `${APPSET_NAME}-placement`
    const appSet = createAppSetNode({
      specs: {
        raw: {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'ApplicationSet',
          metadata: { name: APPSET_NAME, namespace: NAMESPACE },
          spec: {
            generators: [
              {
                clusterDecisionResource: {
                  labelSelector: {
                    matchLabels: {
                      'cluster.open-cluster-management.io/placement': placementName,
                    },
                  },
                },
              },
            ],
            template: { spec: { destination: { namespace: 'default' } } },
          },
          status: { conditions: [] },
        },
      },
    })
    const placements: Placement[] = [
      {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'Placement',
        metadata: { name: placementName, namespace: NAMESPACE },
        spec: {},
      },
    ]

    await analyzeTopologyAppSet(appSet, [appSet], alerts, t, placements, 'local-cluster')

    expect(alerts.some((alert) => alert.title === 'Placement Missing')).toBe(false)
  })
})
