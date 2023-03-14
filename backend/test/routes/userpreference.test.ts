/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { parsePipedJsonBody } from '../../src/lib/body-parser'
import { request } from '../mock-request'

describe('userpreference Route', function () {
  it('should return the userpreference', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
    nock(process.env.CLUSTER_API_URL)
      .post('/apis/authentication.k8s.io/v1/tokenreviews')
      .reply(200, {
        status: {
          user: {
            username: 'kube:admin',
          },
        },
      })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/console.open-cluster-management.io/v1/userpreferences/kube-admin')
      .reply(200, {
        apiVersion: 'console.open-cluster-management.io/v1',
        kind: 'UserPreference',
        metadata: {
          name: 'kube-admin',
        },
        spec: {
          savedSearches: [{ description: '', id: '1678205878189', name: 'testing', searchText: 'kind:Pod' }],
        },
      })
    const res = await request('GET', '/userpreference')
    expect(res.statusCode).toEqual(200)
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(
      JSON.stringify({
        apiVersion: 'console.open-cluster-management.io/v1',
        kind: 'UserPreference',
        metadata: {
          name: 'kube-admin',
        },
        spec: {
          savedSearches: [{ description: '', id: '1678205878189', name: 'testing', searchText: 'kind:Pod' }],
        },
      })
    )
  })
  it('should create the userpreference', async function () {
    const postBody = {
      apiVersion: 'console.open-cluster-management.io/v1',
      kind: 'UserPreference',
      metadata: {
        name: 'kube-admin',
      },
      spec: {
        savedSearches: [{ description: '', id: '1678205878189', name: 'testing', searchText: 'kind:Pod' }],
      },
    }
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
    nock(process.env.CLUSTER_API_URL)
      .post('/apis/authentication.k8s.io/v1/tokenreviews')
      .reply(200, {
        status: {
          user: {
            username: 'kube:admin',
          },
        },
      })
    nock(process.env.CLUSTER_API_URL)
      .post('/apis/console.open-cluster-management.io/v1/userpreferences')
      .reply(200, postBody)
    const res = await request('POST', '/userpreference', postBody)
    expect(res.statusCode).toEqual(200)
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(JSON.stringify(postBody))
  })
})
