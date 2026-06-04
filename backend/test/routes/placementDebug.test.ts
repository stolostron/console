/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import nock from 'nock'

const upstreamHost = 'https://cluster-manager-placement.open-cluster-management-hub.svc.cluster.local:9443'

jest.mock('../../src/lib/placementDebugCAWatch', () => ({
  getPlacementDebugCA: jest.fn(() => 'mock-ca-cert'),
  watchPlacementDebugCA: jest.fn(() => jest.fn()),
}))

function nockAuth(status = 200) {
  nock(process.env.CLUSTER_API_URL).get('/apis').reply(status, { status })
}

describe(`placementDebug Route`, function () {
  it(`proxies placement debug request to upstream service`, async function () {
    nockAuth()
    nock(upstreamHost).post('/debug/placements/').reply(200, { aggregatedScores: [] })
    const res = await request('POST', '/placement-debug', { placement: 'test' })
    expect(res.statusCode).toEqual(200)
  })

  it(`handles upstream errors`, async function () {
    nockAuth()
    nock(upstreamHost).post('/debug/placements/').reply(500, { error: 'internal server error' })
    const res = await request('POST', '/placement-debug', { placement: 'test' })
    expect(res.statusCode).toEqual(500)
  })

  it(`rejects unauthenticated requests`, async function () {
    nockAuth(401)
    const res = await request('POST', '/placement-debug', { placement: 'test' })
    expect(res.statusCode).toEqual(401)
  })

  it(`uses custom URL when PLACEMENT_DEBUG_URL is set`, async function () {
    const original = process.env.PLACEMENT_DEBUG_URL
    process.env.PLACEMENT_DEBUG_URL = 'https://localhost:9443/debug/placements/'
    try {
      nockAuth()
      nock('https://localhost:9443').post('/debug/placements/').reply(200, { aggregatedScores: [] })
      const res = await request('POST', '/placement-debug', { placement: 'test' })
      expect(res.statusCode).toEqual(200)
    } finally {
      if (original === undefined) {
        delete process.env.PLACEMENT_DEBUG_URL
      } else {
        process.env.PLACEMENT_DEBUG_URL = original
      }
    }
  })

  it(`returns 503 when CA bundle is not available`, async function () {
    const { getPlacementDebugCA } = await import('../../src/lib/placementDebugCAWatch')
    const { invalidatePlacementDebugAgent } = await import('../../src/lib/agent')
    const mockedGetCA = getPlacementDebugCA as jest.MockedFunction<typeof getPlacementDebugCA>
    mockedGetCA.mockReturnValueOnce(undefined)
    invalidatePlacementDebugAgent()

    nockAuth()
    const res = await request('POST', '/placement-debug', { placement: 'test' })
    expect(res.statusCode).toEqual(503)
  })

  // Connection errors are handled by the pipeline error callback in placementDebug.ts.
  // The mock-request test infrastructure doesn't reliably capture pipeline-level errors
  // (same limitation as proxy.ts and metricsProxy.ts, which also omit connection error tests).
})
