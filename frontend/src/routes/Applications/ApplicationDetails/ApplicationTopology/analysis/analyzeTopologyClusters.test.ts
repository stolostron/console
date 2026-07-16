/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import { analyzeTopologyClusters } from './analyzeTopologyClusters'
import type { TopologyAlert } from './utils'
import { CLUSTER_NAME, createAppSetNode } from './__fixtures__/topologyAnalysisFixtures'

jest.mock('../../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(),
}))

const mockFleetResourceRequest = fleetResourceRequest as jest.MockedFunction<typeof fleetResourceRequest>

describe('analyzeTopologyClusters', () => {
  beforeEach(() => {
    mockFleetResourceRequest.mockReset()
  })

  it('does nothing for push-model application sets', async () => {
    const alerts: TopologyAlert[] = []
    const appSet = createAppSetNode({ specs: { isAppSetPullModel: false } })

    await analyzeTopologyClusters(appSet, [appSet], alerts, t)

    expect(mockFleetResourceRequest).not.toHaveBeenCalled()
    expect(alerts).toEqual([])
  })

  it('creates a GitOps operator missing alert for pull-model clusters', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'not found' } as never)
    const appSet = createAppSetNode({ specs: { isAppSetPullModel: true } })

    await analyzeTopologyClusters(appSet, [appSet], alerts, t)

    expect(mockFleetResourceRequest).toHaveBeenCalledWith('GET', CLUSTER_NAME, {
      apiVersion: 'operators.coreos.com/v1alpha1',
      kind: 'Subscription',
      name: 'openshift-gitops-operator',
      namespace: 'openshift-gitops-operator',
    })
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

    await analyzeTopologyClusters(appSet, [appSet], alerts, t)

    expect(alerts).toEqual([])
  })

  it('limits verification to three clusters', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockResolvedValue({ errorMessage: 'not found' } as never)
    const appSet = createAppSetNode({
      specs: {
        isAppSetPullModel: true,
        appSetClusters: [
          { name: 'c1' },
          { name: 'c2' },
          { name: 'c3' },
          { name: 'c4' },
        ],
      },
    })

    await analyzeTopologyClusters(appSet, [appSet], alerts, t)

    expect(mockFleetResourceRequest).toHaveBeenCalledTimes(3)
  })

  it('ignores fleet request failures', async () => {
    const alerts: TopologyAlert[] = []
    mockFleetResourceRequest.mockRejectedValue(new Error('network'))
    const appSet = createAppSetNode({ specs: { isAppSetPullModel: true } })

    await expect(analyzeTopologyClusters(appSet, [appSet], alerts, t)).resolves.toBeUndefined()
    expect(alerts).toEqual([])
  })
})
