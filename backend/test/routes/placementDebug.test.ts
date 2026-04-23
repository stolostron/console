/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import nock from 'nock'

const upstreamHost = 'https://cluster-manager-placement.open-cluster-management-hub.svc.cluster.local:9443'

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

  it(`uses dev agent when PLACEMENT_DEBUG_URL is set`, async function () {
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

  it(`handles upstream connection errors`, async function () {
    nockAuth()
    nock(upstreamHost).post('/debug/placements/').replyWithError('ECONNREFUSED')
    const res = await request('POST', '/placement-debug', { placement: 'test' })
    expect(res.statusCode).toEqual(500)
  })

  it(`rejects oversized request body`, async function () {
    nockAuth()
    const largeBody = { data: 'x'.repeat(1024 * 1024 + 1) }
    const res = await request('POST', '/placement-debug', largeBody)
    expect(res.statusCode).toEqual(413)
  })
})
