/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import nock from 'nock'
import { apiServerPing } from '../../src/routes/liveness'

describe(`liveness Route`, function () {
  it(`GET /livenessProbe should return status code 200`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/.well-known/oauth-authorization-server').reply(200, {
      authorization_endpoint: 'https://oauth-openshift.apps.example.com/oauth/token',
    })
    const res = await request('GET', '/livenessProbe')
    expect(res.statusCode).toEqual(200)
  })
  it(`GET /livenessProbe should return status code 500 if dead`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(401)
    await apiServerPing()
    const res = await request('GET', '/livenessProbe')
    expect(res.statusCode).toEqual(500)
  })
})
