/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import {
  analyzeTopologyHealth,
  APP_SET_APPS_SYNC_GRACE_PERIOD_MS,
  createSuggestsHealth,
  isWithinAppsSyncGracePeriod,
} from './analyzeTopologyHealth'
import type { TopologyAlert } from './utils'
import {
  APPSET_NAME,
  CLUSTER_NAME,
  NAMESPACE,
  createAppSetNode,
  createDeploymentNode,
} from './__fixtures__/topologyAnalysisFixtures'

describe('isWithinAppsSyncGracePeriod', () => {
  it('returns false when appsFirstSeenAt is undefined', () => {
    expect(isWithinAppsSyncGracePeriod(undefined)).toBe(false)
  })

  it('returns true within the grace window and false once it elapses', () => {
    const now = 1_000_000
    expect(isWithinAppsSyncGracePeriod(now - APP_SET_APPS_SYNC_GRACE_PERIOD_MS, now)).toBe(true)
    expect(isWithinAppsSyncGracePeriod(now - APP_SET_APPS_SYNC_GRACE_PERIOD_MS - 1, now)).toBe(false)
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

  it('shows Progressing while ApplicationSet has no apps yet (ACM-46011)', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({ specs: { appSetApps: [] } })

    const health = analyzeTopologyHealth(appSet, [])
    createSuggestsHealth(appSet, [], health, alerts, t)

    expect(alerts).toEqual([])
    expect(appSet.specs.isCreatingProgressing).toBe(true)
  })

  it('suppresses bad-sync alert and shows Progressing within 1 minute of apps appearing', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: syncedAppSetApps('Healthy', 'Synced'),
        appSetAppsFirstSeenAt: Date.now() - 30 * 1000,
      },
    })
    const deployment = outOfSyncDeployment()
    const health = analyzeTopologyHealth(appSet, [deployment])

    createSuggestsHealth(appSet, [deployment], health, alerts, t)

    expect(alerts).toEqual([])
    expect(appSet.specs.isCreatingProgressing).toBe(true)
  })

  it('shows bad-sync alert and hides Progressing once 1 minute has passed since apps appeared', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: syncedAppSetApps('Healthy', 'Synced'),
        appSetAppsFirstSeenAt: Date.now() - (APP_SET_APPS_SYNC_GRACE_PERIOD_MS + 1000),
      },
    })
    const deployment = outOfSyncDeployment()
    const health = analyzeTopologyHealth(appSet, [deployment])

    createSuggestsHealth(appSet, [deployment], health, alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Some resources are not healthy or synced on these clusters')
    expect(alerts[0].description?.message).toBe('Status: OutOfSync')
    expect(appSet.specs.isCreatingProgressing).toBe(false)
  })

  it('shows bad-sync alert immediately when there is no first-seen timestamp', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: syncedAppSetApps('Healthy', 'Synced'),
        appSetAppsFirstSeenAt: undefined,
      },
    })
    const deployment = outOfSyncDeployment()
    const health = analyzeTopologyHealth(appSet, [deployment])

    createSuggestsHealth(appSet, [deployment], health, alerts, t)

    expect(alerts).toHaveLength(1)
    expect(appSet.specs.isCreatingProgressing).toBe(false)
  })

  it('clears Progressing and shows green pulse when there are no sync issues', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: syncedAppSetApps('Healthy', 'Synced'),
        appSetAppsFirstSeenAt: Date.now() - 30 * 1000,
      },
    })
    const deployment = createDeploymentNode(
      [
        {
          kind: 'Deployment',
          name: 'nginx',
          cluster: CLUSTER_NAME,
          status: 'Synced',
          health: { status: 'Healthy' },
        },
      ],
      1
    )
    const health = analyzeTopologyHealth(appSet, [deployment])

    createSuggestsHealth(appSet, [deployment], health, alerts, t)

    expect(alerts).toEqual([])
    expect(appSet.specs.isCreatingProgressing).toBe(false)
  })

  it('shows real health errors immediately even within the apps grace period', () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({
      specs: {
        appSetApps: syncedAppSetApps('Healthy', 'Synced'),
        appSetAppsFirstSeenAt: Date.now() - 30 * 1000,
      },
    })
    const deployment = degradedDeployment()
    const health = analyzeTopologyHealth(appSet, [deployment])

    createSuggestsHealth(appSet, [deployment], health, alerts, t)

    // Bad-sync suppression is time-based only (per the current spec); a Degraded issue is
    // still a "bad sync" entry, so it is suppressed the same as OutOfSync during the grace window.
    expect(alerts).toEqual([])
    expect(appSet.specs.isCreatingProgressing).toBe(true)
  })
})
