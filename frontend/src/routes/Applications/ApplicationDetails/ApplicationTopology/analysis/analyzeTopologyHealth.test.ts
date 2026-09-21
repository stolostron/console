/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { analyzeTopologyHealth, createSuggestsHealth, isGracePeriodSuppressibleIssue } from './analyzeTopologyHealth'
import type { TopologyAlert } from './utils'
import {
  APPSET_NAME,
  CLUSTER_NAME,
  NAMESPACE,
  createAppSetNode,
  createDeploymentNode,
} from './__fixtures__/topologyAnalysisFixtures'

describe('isGracePeriodSuppressibleIssue', () => {
  it('returns true for OutOfSync and Progressing keys', () => {
    expect(isGracePeriodSuppressibleIssue('OutOfSync')).toBe(true)
    expect(isGracePeriodSuppressibleIssue('Progressing')).toBe(true)
    expect(isGracePeriodSuppressibleIssue('OutOfSync/Progressing')).toBe(true)
  })

  it('returns false for non-sync health errors and empty keys', () => {
    expect(isGracePeriodSuppressibleIssue('')).toBe(false)
    expect(isGracePeriodSuppressibleIssue('Degraded')).toBe(false)
    expect(isGracePeriodSuppressibleIssue('OutOfSync/Degraded')).toBe(false)
    expect(isGracePeriodSuppressibleIssue('Missing')).toBe(false)
    expect(isGracePeriodSuppressibleIssue('Unknown')).toBe(false)
  })
})

describe('createSuggestsHealth', () => {
  const outOfSyncDeployment = () =>
    createDeploymentNode(
      [
        {
          kind: 'Deployment',
          name: 'nginx',
          cluster: CLUSTER_NAME,
          status: 'OutOfSync',
          health: { status: 'Healthy' },
        },
      ],
      1
    )

  const degradedDeployment = () =>
    createDeploymentNode(
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

  const syncedAppSetApps = (health: string, sync: string) => [
    {
      metadata: { name: `${APPSET_NAME}-${CLUSTER_NAME}`, namespace: NAMESPACE },
      kind: 'Application',
      status: {
        health: { status: health },
        sync: { status: sync },
      },
    },
  ]

  it('shows Progressing instead of unsynced warning while ApplicationSet is creating (ACM-46011)', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        isCreating: true,
        appSetApps: syncedAppSetApps('Healthy', 'Synced'),
      },
    })
    const deployment = outOfSyncDeployment()
    const health = analyzeTopologyHealth(appSet, [deployment])

    createSuggestsHealth(appSet, [deployment], health, alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Progressing...')
    expect(alerts[0].status).toBe('orange')
    expect(alerts[0].description).toBeUndefined()
  })

  it('still shows unsynced warning after creation grace period ends', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        isCreating: false,
        appSetApps: syncedAppSetApps('Healthy', 'Synced'),
      },
    })
    const deployment = outOfSyncDeployment()
    const health = analyzeTopologyHealth(appSet, [deployment])

    createSuggestsHealth(appSet, [deployment], health, alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Some resources are not healthy or synced on these clusters')
    expect(alerts[0].description?.message).toBe('Status: OutOfSync')
  })

  it('shows real health errors even while ApplicationSet is creating', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        isCreating: true,
        appSetApps: syncedAppSetApps('Healthy', 'Synced'),
      },
    })
    const deployment = degradedDeployment()
    const health = analyzeTopologyHealth(appSet, [deployment])

    createSuggestsHealth(appSet, [deployment], health, alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Some resources are not healthy or synced on these clusters')
    expect(alerts[0].description?.message).toBe('Status: OutOfSync/Degraded')
    expect(alerts[0].status).toBe('red')
  })
})
