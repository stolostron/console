/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { setReady } from '../../src/routes/readiness'

describe(`readiness Route`, function () {
  it(`GET /readinessProbe should return status code 500 if not ready`, async function () {
    const res = await request('GET', '/readinessProbe')
    expect(res.statusCode).toEqual(500)
  })
  it(`GET /readinessProbe should return status code 200 after setReady`, async function () {
    setReady()
    const res = await request('GET', '/readinessProbe')
    expect(res.statusCode).toEqual(200)
  })
})
