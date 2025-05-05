/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { parsePipedJsonBody } from '../../src/lib/body-parser'
import { request } from '../mock-request'

describe('global hub', function () {
  it('should return the boolean', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/apiextensions.k8s.io/v1/customresourcedefinitions') // .reply(200, { isGlobalHub: true })
      .reply(200, {
        items: [
          {
            kind: 'CustomResourceDefinition',
            apiVersion: 'apiextensions.k8s.io/v1',
            metadata: {
              name: 'multiclusterglobalhubs.operator.open-cluster-management.io',
            },
          },
        ],
      })
    const res = await request('GET', '/hub')
    expect(res.statusCode).toEqual(200)
    const parsed = await parsePipedJsonBody(res)
    expect(parsed).toEqual({ localHubName: 'local-cluster', isGlobalHub: true, isHubSelfManaged: undefined })
  })
})
