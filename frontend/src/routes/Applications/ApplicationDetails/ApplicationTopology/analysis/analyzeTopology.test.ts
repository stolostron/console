/* Copyright Contributors to the Open Cluster Management project */
import { t } from '~/lib/test-helpers'
import { analyzeTopology } from './analyzeTopology'
import { createAppSetNode, createPlacementNode } from './__fixtures__/topologyAnalysisFixtures'

jest.mock('../../../../../resources/utils/fleet-resource-request', () => ({
  fleetResourceRequest: jest.fn(() => Promise.resolve({ errorMessage: 'not available' })),
}))

describe('analyzeTopology', () => {
  it('returns an empty list when there is no applicationset node', async () => {
    const alerts = await analyzeTopology([createPlacementNode()], t)
    expect(alerts).toEqual([])
  })

  it('analyzes applicationset topology and returns alerts', async () => {
    const appSet = createAppSetNode()
    const placement = createPlacementNode('No ManagedCluster matches any of the cluster predicate')

    const alerts = await analyzeTopology([appSet, placement], t)

    expect(alerts.length).toBeGreaterThan(0)
    expect(alerts[0].description?.bullets?.[0].title).toBe('Current predicates')
  })
})
