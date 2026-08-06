/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { analyzeTopologyHealth } from './analyzeTopologyHealth'
import { checkOpenshiftGitops } from './checkOpenshiftGitops'
import type { TopologyAlert } from './utils'
import { CLUSTER_NAME, createAppSetNode } from './__fixtures__/topologyAnalysisFixtures'

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

describe('checkOpenshiftGitops', () => {
  beforeEach(() => {
    mockFleetResourceRequest.mockReset()
    mockSearchQuery.mockReset()
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [{ items: [], related: [] }] } })
  })

  it('does nothing for push-model application sets', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({ specs: { isAppSetPullModel: false } })
    const health = analyzeTopologyHealth(appSet, [])

    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)

    expect(mockFleetResourceRequest).not.toHaveBeenCalled()
    expect(mockSearchQuery).not.toHaveBeenCalled()
    expect(alerts).toEqual([])
  })

  it('creates a GitOps operator missing alert for pull-model clusters', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'not found' } as never)
    const appSet = createAppSetNode({ specs: { isAppSetPullModel: true } })
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)

    expect(mockFleetResourceRequest).toHaveBeenCalledWith('GET', CLUSTER_NAME, {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'Subscription',
      name: 'openshift-gitops-operator',
      namespace: 'openshift-gitops-operator',
    })
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
    expect(alerts).toHaveLength(1)
    expect(alerts[0].title).toBe('OpenShift GitOps Operator Missing')
    expect(appSet.specs.pulse).toBe('red')
  })

  it('does not create an alert when the GitOps operator is present', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockResolvedValue({
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'Subscription',
      metadata: { name: 'openshift-gitops-operator' },
    } as never)
    const appSet = createAppSetNode({ specs: { isAppSetPullModel: true } })
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)

    expect(alerts).toEqual([])
  })

  it('limits verification to three clusters', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'not found' } as never)
    const appSet = createAppSetNode({
      specs: {
        isAppSetPullModel: true,
        appSetClusters: [{ name: 'c1' }, { name: 'c2' }, { name: 'c3' }, { name: 'c4' }],
      },
    })
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set(['c1', 'c2', 'c3', 'c4']),
    }

    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)

    expect(mockFleetResourceRequest).toHaveBeenCalledTimes(3)
  })

  it('ignores fleet request failures', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockRejectedValue(new Error('network'))
    const appSet = createAppSetNode({ specs: { isAppSetPullModel: true } })
    const health = {
      ...analyzeTopologyHealth(appSet, []),
      unhealthyClusterSet: new Set([CLUSTER_NAME]),
    }

    await expect(checkOpenshiftGitops(appSet, [appSet], health, alerts, t)).resolves.toBe(false)
    expect(alerts).toEqual([])
  })

  it('skips pull-model verification when there are no unhealthy clusters', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({ specs: { isAppSetPullModel: true } })
    const health = analyzeTopologyHealth(appSet, [])

    await checkOpenshiftGitops(appSet, [appSet], health, alerts, t)

    expect(mockFleetResourceRequest).not.toHaveBeenCalled()
    expect(mockSearchQuery).not.toHaveBeenCalled()
    expect(alerts).toEqual([])
  })
})
