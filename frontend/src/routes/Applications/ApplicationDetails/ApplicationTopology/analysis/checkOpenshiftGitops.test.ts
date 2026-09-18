/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { analyzeTopologyHealth } from './analyzeTopologyHealth'
import { checkOpenshiftGitops } from './checkOpenshiftGitops'
import type { TopologyAlert } from './utils'
import { TopologyAlertActionType } from './utils'
import { CLUSTER_NAME, createAppSetNode, createPlacementNode } from './__fixtures__/topologyAnalysisFixtures'

jest.mock('../../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(),
}))

jest.mock('../../../../Search/search-sdk/search-client', () => ({
  searchClient: {
    query: jest.fn(),
  },
}))

const mockFleetResourceRequest = fleetResourceRequest as jest.MockedFunction<typeof fleetResourceRequest>
const mockSearchQuery = searchClient.query as jest.Mock

const POD_NAME = 'openshift-gitops-server-abc'

const createRelatedPodSearchResult = (
  pods: Array<{
    name?: string
    namespace?: string
    cluster?: string
    status?: string
    restarts?: number | string
  }>
) => ({
  data: {
    searchResult: [
      {
        items: [],
        related: [
          {
            kind: 'Pod',
            items: pods,
          },
        ],
      },
    ],
  },
})

const createTerminatedPodResponse = (reason: string) =>
  ({
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: { name: POD_NAME, namespace: 'openshift-gitops' },
    status: {
      containerStatuses: [
        {
          lastState: {
            terminated: { reason },
          },
        },
      ],
    },
  }) as never

describe('checkOpenshiftGitops', () => {
  beforeEach(() => {
    mockFleetResourceRequest.mockReset()
    mockSearchQuery.mockReset()
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [{ items: [], related: [] }] } })
  })

  it('does nothing when there are no unhealthy clusters', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode()
    const health = analyzeTopologyHealth(appSet, [])

    await expect(checkOpenshiftGitops(appSet, [appSet], health, alerts, t)).resolves.toBe(false)

    expect(mockFleetResourceRequest).not.toHaveBeenCalled()
    expect(mockSearchQuery).not.toHaveBeenCalled()
    expect(alerts).toEqual([])
  })

  it('searches for ArgoCD related pods on unhealthy clusters', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode()
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)

    expect(mockSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          input: [
            expect.objectContaining({
              filters: expect.arrayContaining([
                { property: 'name', values: ['openshift-gitops'] },
                { property: 'namespace', values: ['openshift-gitops'] },
                { property: 'kind', values: ['ArgoCD'] },
                { property: 'cluster', values: [CLUSTER_NAME] },
                { property: 'apigroup', values: ['argoproj.io'] },
              ]),
              relatedKinds: ['Pod'],
            }),
          ],
        }),
      })
    )
    expect(mockFleetResourceRequest).not.toHaveBeenCalled()
    expect(alerts).toEqual([])
  })

  it('creates an alert for non-running ArgoCD pods with a terminated reason', async () => {
    const alerts: TopologyAlert[] = []
    mockSearchQuery.mockResolvedValue(
      createRelatedPodSearchResult([
        {
          name: POD_NAME,
          namespace: 'openshift-gitops',
          cluster: CLUSTER_NAME,
          status: 'CrashLoopBackOff',
          restarts: 5,
        },
      ])
    )
    mockFleetResourceRequest.mockResolvedValue(createTerminatedPodResponse('OOMKilled'))
    const appSet = createAppSetNode()
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await expect(checkOpenshiftGitops(appSet, [appSet], health, alerts, t)).resolves.toBe(true)

    expect(mockFleetResourceRequest).toHaveBeenCalledWith('GET', CLUSTER_NAME, {
      apiVersion: 'v1',
      kind: 'Pod',
      name: POD_NAME,
      namespace: 'openshift-gitops',
    })
    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe(`OOMKilled on cluster ${CLUSTER_NAME}`)
    expect(alerts[0].status).toBe('red')
    expect(alerts[0].description?.message).toContain(POD_NAME)
    expect(alerts[0].description?.message).toContain('5')
  })

  it('creates an alert for running pods with more than 3 restarts', async () => {
    const alerts: TopologyAlert[] = []
    mockSearchQuery.mockResolvedValue(
      createRelatedPodSearchResult([
        {
          name: POD_NAME,
          namespace: 'openshift-gitops',
          cluster: CLUSTER_NAME,
          status: 'Running',
          restarts: 4,
        },
      ])
    )
    mockFleetResourceRequest.mockResolvedValue(createTerminatedPodResponse('Error'))
    const appSet = createAppSetNode()
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await expect(checkOpenshiftGitops(appSet, [appSet], health, alerts, t)).resolves.toBe(true)

    expect(mockFleetResourceRequest).toHaveBeenCalled()
    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe(`Error on cluster ${CLUSTER_NAME}`)
  })

  it('does not create an alert for healthy running pods', async () => {
    const alerts: TopologyAlert[] = []
    mockSearchQuery.mockResolvedValue(
      createRelatedPodSearchResult([
        {
          name: POD_NAME,
          namespace: 'openshift-gitops',
          cluster: CLUSTER_NAME,
          status: 'Running',
          restarts: 1,
        },
      ])
    )
    const appSet = createAppSetNode()
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await expect(checkOpenshiftGitops(appSet, [appSet], health, alerts, t)).resolves.toBe(false)

    expect(mockFleetResourceRequest).not.toHaveBeenCalled()
    expect(alerts).toEqual([])
  })

  it('skips pods when the fleet request returns an error', async () => {
    const alerts: TopologyAlert[] = []
    mockSearchQuery.mockResolvedValue(
      createRelatedPodSearchResult([
        {
          name: POD_NAME,
          namespace: 'openshift-gitops',
          cluster: CLUSTER_NAME,
          status: 'CrashLoopBackOff',
          restarts: 5,
        },
      ])
    )
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'not found' } as never)
    const appSet = createAppSetNode()
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await expect(checkOpenshiftGitops(appSet, [appSet], health, alerts, t)).resolves.toBe(false)
    expect(alerts).toEqual([])
  })

  it('skips pods without a terminated container reason', async () => {
    const alerts: TopologyAlert[] = []
    mockSearchQuery.mockResolvedValue(
      createRelatedPodSearchResult([
        {
          name: POD_NAME,
          namespace: 'openshift-gitops',
          cluster: CLUSTER_NAME,
          status: 'Pending',
          restarts: 0,
        },
      ])
    )
    mockFleetResourceRequest.mockResolvedValue({
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: POD_NAME, namespace: 'openshift-gitops' },
      status: { containerStatuses: [{ lastState: {} }] },
    } as never)
    const appSet = createAppSetNode()
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await expect(checkOpenshiftGitops(appSet, [appSet], health, alerts, t)).resolves.toBe(false)
    expect(alerts).toEqual([])
  })

  it('ignores fleet request failures when fetching pods', async () => {
    const alerts: TopologyAlert[] = []
    mockSearchQuery.mockResolvedValue(
      createRelatedPodSearchResult([
        {
          name: POD_NAME,
          namespace: 'openshift-gitops',
          cluster: CLUSTER_NAME,
          status: 'CrashLoopBackOff',
          restarts: 5,
        },
      ])
    )
    mockFleetResourceRequest.mockRejectedValue(new Error('network'))
    const appSet = createAppSetNode()
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await expect(checkOpenshiftGitops(appSet, [appSet], health, alerts, t)).resolves.toBe(false)
    expect(alerts).toEqual([])
  })

  it('creates a warning when the pull model targets the local hub cluster', async () => {
    const alerts: TopologyAlert[] = []
    const placement = createPlacementNode()
    const appSet = createAppSetNode({ isArgoCDPullModelTargetLocalCluster: true })
    const health = analyzeTopologyHealth(appSet, [])

    await expect(checkOpenshiftGitops(appSet, [appSet, placement], health, alerts, t)).resolves.toBe(false)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('Warning')
    expect(alerts[0].status).toBe('yellow')
    expect(alerts[0].description?.message).toContain('hub cluster')
    expect(alerts[0].actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Edit application',
          type: TopologyAlertActionType.editAppSet,
          node: placement,
        }),
        expect.objectContaining({
          label: 'Edit YAML',
          type: TopologyAlertActionType.editYaml,
          node: placement,
          highlightEditorPath: 'Placement.spec.predicates',
        }),
      ])
    )
  })

  it('uses the appSet node for pull-model warning actions when placement is missing', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({ isArgoCDPullModelTargetLocalCluster: true })
    const health = analyzeTopologyHealth(appSet, [])

    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)

    expect(alerts).toHaveLength(1)
    expect(alerts[0].actions?.[0].node).toBe(appSet)
    expect(alerts[0].actions?.[1].node).toBe(appSet)
  })

  it('does not duplicate the pull-model local-cluster warning', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({ isArgoCDPullModelTargetLocalCluster: true })
    const health = analyzeTopologyHealth(appSet, [])

    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)
    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)

    expect(alerts).toHaveLength(1)
  })
})
