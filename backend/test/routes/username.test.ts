/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

describe('username Route', function () {
  it('should return the username', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .post('/apis/authentication.k8s.io/v1/tokenreviews')
      .reply(200, {
        status: {
          user: {
            username: 'testuser',
          },
        },
      })
    const res = await request('GET', '/username')
    expect(res.statusCode).toEqual(200)
    const { body } = await parseResponseJsonBody(res)
    expect(body).toEqual({ username: 'testuser' })
  })
  it('should return empty string if no username provided', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .post('/apis/authentication.k8s.io/v1/tokenreviews')
      .reply(200, {
        status: {
          user: {},
        },
      })
    const res = await request('GET', '/username')
    expect(res.statusCode).toEqual(200)
    const { body } = await parseResponseJsonBody(res)
    expect(body).toEqual({ username: '' })
  })
  it('should handle errors', async function () {
    nock(process.env.CLUSTER_API_URL).post('/apis/authentication.k8s.io/v1/tokenreviews').replyWithError('failed')
    const res = await request('GET', '/username')
    expect(res.statusCode).toEqual(500)
  })
})
