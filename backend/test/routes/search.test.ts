/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import nock from 'nock'

describe(`search Route`, function () {
  it(`uses search-api in the namespace of the MultiClusterHub`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs')
      .reply(200, {
        items: [
          {
            metadata: {
              namespace: 'ocm',
            },
            status: {
              currentVersion: '2.5.1',
            },
          },
        ],
      })
    nock('https://search-search-api.ocm.svc.cluster.local:4010').post('/searchapi/graphql').reply(200)
    await request('POST', '/proxy/search')
    // TODO - pipeline is not writing response
    //expect(res.statusCode).toEqual(200)
  })
  it(`uses search-api in namespace of pod if no MultiClusterHub`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL).get('/apis/operator.open-cluster-management.io/v1/multiclusterhubs').reply(200, {
      items: [],
    })
    nock('https://search-search-api.undefined.svc.cluster.local:4010').post('/searchapi/graphql').reply(200)
    await request('POST', '/proxy/search')
    // TODO - pipeline is not writing response
    //expect(res.statusCode).toEqual(200)
  })
})
