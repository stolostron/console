/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import nock from 'nock'
import { apiServerPing } from '../../src/routes/liveness'

describe(`readiness Route`, function () {
  it(`GET /readinessProbe should return status code 200`, async function () {
    const res = await request('GET', '/readinessProbe')
    expect(res.statusCode).toEqual(200)
  })
  it(`GET /readinessProbe should return status code 500 if dead`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(401)
    await apiServerPing()
    const res = await request('GET', '/readinessProbe')
    expect(res.statusCode).toEqual(500)
  })
})
