/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import { analyzeTopologyApplications } from './analyzeTopologyApplications'
import { analyzeTopologyHealth, createSuggestsHealth } from './analyzeTopologyHealth'
import type { TopologyAlert } from './utils'
import {
  APPSET_NAME,
  CLUSTER_NAME,
  NAMESPACE,
  createAppSetNode,
  createDeploymentNode,
} from './__fixtures__/topologyAnalysisFixtures'

jest.mock('../../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(),
}))

const mockFleetResourceRequest = fleetResourceRequest as jest.MockedFunction<typeof fleetResourceRequest>

const analyzeApplicationsWithHealth = async (
  appSet: ReturnType<typeof createAppSetNode>,
  deploymentNodes: ReturnType<typeof createDeploymentNode>[],
  alerts: TopologyAlert[]
) => {
  const health = analyzeTopologyHealth(appSet, deploymentNodes)
  const errors = await analyzeTopologyApplications(appSet, deploymentNodes, alerts, t, health)
  if (errors.length === 0) {
    createSuggestsHealth(appSet, deploymentNodes, health, alerts, t)
  }
  return errors
}

describe('analyzeTopologyApplications', () => {
  beforeEach(() => {
    mockFleetResourceRequest.mockReset()
  })

  it('returns no errors and no alerts when apps and deployments are healthy', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode()
    const deployment = createDeploymentNode([
      {
        kind: 'Deployment',
        name: 'nginx',
        cluster: CLUSTER_NAME,
        status: 'Synced',
        health: { status: 'Healthy' },
      },
    ])

    const errors = await analyzeApplicationsWithHealth(appSet, [deployment], alerts)

    expect(errors).toEqual([])
    expect(alerts).toEqual([])
  })

  it('creates a consolidated sync alert for unhealthy deployment resources', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: [
          {
            metadata: { name: `${APPSET_NAME}-${CLUSTER_NAME}`, namespace: NAMESPACE },
            kind: 'Application',
            status: {
              health: { status: 'Healthy' },
              sync: { status: 'Synced' },
              resources: [
                {
                  kind: 'Deployment',
                  name: 'nginx',
                  cluster: CLUSTER_NAME,
                  status: 'OutOfSync',
                  health: { status: 'Degraded' },
                },
              ],
            },
          },
        ],
      },
    })
    const deployment = createDeploymentNode(
      [
        {
          kind: 'Deployment',
          name: 'nginx',
          cluster: CLUSTER_NAME,
          status: 'OutOfSync',
          health: { status: 'Degraded' },
        },
      ],
      1
    )

    const errors = await analyzeApplicationsWithHealth(appSet, [deployment], alerts)

    expect(errors).toEqual([])
    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Some resources are not healthy or synced on these clusters')
    expect(alerts[0].description?.message).toBe('Status: OutOfSync/Degraded')
    expect(alerts[0].status).toBe('red')
  })

  it('skips resources marked for pruning from sync alerts', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: [
          {
            metadata: { name: `${APPSET_NAME}-${CLUSTER_NAME}`, namespace: NAMESPACE },
            kind: 'Application',
            status: {
              health: { status: 'Healthy' },
              sync: { status: 'Synced' },
              resources: [
                {
                  kind: 'Deployment',
                  name: 'nginx',
                  cluster: CLUSTER_NAME,
                  status: 'OutOfSync',
                  health: { status: 'Degraded' },
                  requiresPruning: true,
                },
              ],
            },
          },
        ],
      },
    })
    const deployment = createDeploymentNode(
      [
        {
          kind: 'Deployment',
          name: 'nginx',
          cluster: CLUSTER_NAME,
          status: 'OutOfSync',
          health: { status: 'Degraded' },
          requiresPruning: true,
        },
      ],
      1
    )

    await analyzeApplicationsWithHealth(appSet, [deployment], alerts)

    expect(alerts).toEqual([])
  })

  it('creates an Application Missing alert when pull-model fetch fails', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'not found' } as never)

    const appSet = createAppSetNode({
      specs: {
        isAppSetPullModel: true,
        appSetApps: [
          {
            metadata: { name: `${APPSET_NAME}-${CLUSTER_NAME}`, namespace: NAMESPACE },
            kind: 'Application',
            status: {
              health: { status: 'Degraded' },
              sync: { status: 'OutOfSync' },
              conditions: [
                {
                  type: 'ComparisonError',
                  reason: 'ComparisonError',
                  message:
                    'Failed to load target state: failed to generate manifest for source: app path does not exist',
                  status: 'True',
                },
              ],
            },
          },
        ],
      },
    })

    await analyzeApplicationsWithHealth(appSet, [], alerts)

    expect(mockFleetResourceRequest).toHaveBeenCalledWith('GET', CLUSTER_NAME, {
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      name: `${APPSET_NAME}-${CLUSTER_NAME}`,
      namespace: NAMESPACE,
    })
    expect(alerts.some((alert) => alert.title === 'Application Missing')).toBe(true)
    expect(appSet.specs.pulse).toBe('red')
  })

  it('limits pull-model application fetches to three clusters', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'not found' } as never)

    const clusters = ['cluster-a', 'cluster-b', 'cluster-c', 'cluster-d']
    const appSet = createAppSetNode({
      specs: {
        isAppSetPullModel: true,
        appSetClusters: clusters.map((name) => ({ name })),
        appSetApps: clusters.map((clusterName) => ({
          metadata: { name: `${APPSET_NAME}-${clusterName}`, namespace: NAMESPACE },
          kind: 'Application',
          status: {
            health: { status: 'Degraded' },
            sync: { status: 'OutOfSync' },
          },
        })),
      },
    })

    await analyzeApplicationsWithHealth(appSet, [], alerts)

    expect(mockFleetResourceRequest).toHaveBeenCalledTimes(3)
  })

  it('creates application condition alerts and skips consolidated sync alert', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: [
          {
            metadata: { name: `${APPSET_NAME}-${CLUSTER_NAME}`, namespace: NAMESPACE },
            kind: 'Application',
            status: {
              health: { status: 'Degraded' },
              sync: { status: 'OutOfSync' },
              conditions: [
                {
                  type: 'ComparisonError',
                  reason: 'ComparisonError',
                  message:
                    'Failed to load target state: failed to generate manifest for source: app path does not exist',
                  status: 'True',
                },
              ],
              resources: [
                {
                  kind: 'Deployment',
                  name: 'nginx',
                  cluster: CLUSTER_NAME,
                  status: 'OutOfSync',
                  health: { status: 'Degraded' },
                },
              ],
            },
          },
        ],
      },
    })
    const deployment = createDeploymentNode([
      {
        kind: 'Deployment',
        name: 'nginx',
        cluster: CLUSTER_NAME,
        status: 'OutOfSync',
        health: { status: 'Degraded' },
      },
    ])

    const errors = await analyzeApplicationsWithHealth(appSet, [deployment], alerts)

    expect(errors.length).toBeGreaterThan(0)
    expect(alerts.some((alert) => alert.title.includes('Application'))).toBe(true)
    expect(alerts.some((alert) => alert.title === 'Some resources are not healthy or synced on these clusters')).toBe(
      false
    )
    expect(appSet.specs.pulse).toBe('red')
  })
})
