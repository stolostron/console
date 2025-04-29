/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { request } from '../mock-request'

describe('metrics proxy route', function () {
  it('Successfully calls prometheus endpoint', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    const res = await request('GET', '/prometheus/query')
    expect(res.statusCode).toEqual(200)
  })
  it(`Successfully calls observability endpoint`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    const res = await request('GET', '/observability/query')
    expect(res.statusCode).toEqual(200)
  })
})
