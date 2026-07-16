/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { createSuggestsApplication } from './createSuggestsApplication'
import { TopologyAlertActionType, type TopologyAlert } from './utils'
import { createAppSetNode, createFilteredError } from './__fixtures__/topologyAnalysisFixtures'

describe('createSuggestsApplication', () => {
  it('suggests repository path checks when app path does not exist', () => {
    const alerts: TopologyAlert[] = []
    createSuggestsApplication(
      createAppSetNode(),
      createFilteredError(
        'Failed to load target state: failed to generate manifest for source: app path does not exist',
        { kind: 'Application' }
      ),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.bullets?.map((bullet) => bullet.title)).toEqual([
      'Check that the repository path exists for each source',
      'Current sources',
    ])
  })

  it('rewrites namespace-not-found sync failures with concise messaging', () => {
    const alerts: TopologyAlert[] = []
    createSuggestsApplication(
      createAppSetNode(),
      createFilteredError(
        'Failed last sync attempt to [abc]: one or more synchronization tasks completed unsuccessfully, reason: namespaces "demo" not found (retried 5 times).',
        { kind: 'Application' }
      ),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.message).toBe('Sync failed: namespace demo not found')
    expect(alerts[0].actions?.map((action) => action.type)).toContain(TopologyAlertActionType.launchArgo)
  })

  it('rewrites objects-failed-to-apply namespace-not-found sync failures', () => {
    const alerts: TopologyAlert[] = []
    createSuggestsApplication(
      createAppSetNode(),
      createFilteredError(
        'Failed last sync attempt to [5e2f094b7e4e80195e91c8118813352dd4efd327]: one or more objects failed to apply, reason: namespaces "ansible" not found (retried 5 times).',
        { kind: 'Application' }
      ),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.message).toBe('Sync failed: namespace ansible not found')
    expect(alerts[0].actions?.map((action) => action.type)).toContain(TopologyAlertActionType.launchArgo)
  })

  it('creates forbidden sync alerts without actions', () => {
    const alerts: TopologyAlert[] = []
    createSuggestsApplication(
      createAppSetNode(),
      createFilteredError(
        'Failed last sync attempt to [abc]: one or more objects failed to apply, reason: secrets is forbidden: User "system:serviceaccount:openshift-gitops:argocd" cannot create resource "secrets" in API group "" in the namespace "demo" (retried 5 times).',
        { kind: 'Application' }
      ),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.message).toBe(
      'Sync failed: insufficient permissions to create resources in demo'
    )
    expect(alerts[0].actions).toEqual([])
  })

  it('rewrites manifest generation RPC unavailable errors', () => {
    const alerts: TopologyAlert[] = []
    createSuggestsApplication(
      createAppSetNode(),
      createFilteredError(
        'Failed to load target state: failed to generate manifest for source 1 of 1: rpc error: code = Unavailable desc = connection error: desc = "transport: Error while dialing: dial tcp 10.0.0.1:8080: connect: connection refused"',
        { kind: 'Application' }
      ),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].description?.message).toBe(
      'Failed to generate manifests: GitOps manifest service unavailable'
    )
  })

  it('adds sync and argo actions for generic failed sync messages', () => {
    const alerts: TopologyAlert[] = []
    createSuggestsApplication(
      createAppSetNode(),
      createFilteredError(
        'Failed last sync attempt to [abc]: one or more synchronization tasks completed unsuccessfully,  (retried 5 times).',
        { kind: 'Application' }
      ),
      alerts,
      t
    )

    expect(alerts).toHaveLength(1)
    expect(alerts[0].actions?.map((action) => action.type)).toEqual([
      TopologyAlertActionType.editAppSet,
      TopologyAlertActionType.editYaml,
      TopologyAlertActionType.syncResources,
      TopologyAlertActionType.launchArgo,
    ])
  })

  it('adds show logs action for unknown pod errors', () => {
    const alerts: TopologyAlert[] = []
    const node = createAppSetNode({ type: 'pod' })
    createSuggestsApplication(node, createFilteredError('unexpected failure', { kind: 'Pod' }), alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].actions?.map((action) => action.type)).toContain(TopologyAlertActionType.showLog)
  })
})
