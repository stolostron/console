/* Copyright Contributors to the Open Cluster Management project */
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

const subscriptionOperators = {
  items: [
    {
      metadata: { name: 'openshift-gitops-operator' },
      status: {
        installedCSV: 'openshift-gitops-operator.v1.8.2',
        conditions: [
          {
            status: 'False',
            type: 'CatalogSourcesUnhealthy',
          },
        ],
      },
    },
  ],
}

describe(`operatorCheck Route`, function () {
  it(`returns valid response with version for installed operator`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operators.coreos.com/v1alpha1/subscriptions')
      .reply(200, subscriptionOperators)
    const res = await request('POST', '/operatorCheck', { operator: 'openshift-gitops-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'openshift-gitops-operator',
      installed: true,
      version: 'openshift-gitops-operator.v1.8.2',
    })
  })
  it(`returns valid response for not-installed operator`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operators.coreos.com/v1alpha1/subscriptions')
      .reply(200, subscriptionOperators)
    const res = await request('POST', '/operatorCheck', { operator: 'ansible-automation-platform-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'ansible-automation-platform-operator',
      installed: false,
    })
  })
  it(`returns bad request for arbitrary operator`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operators.coreos.com/v1alpha1/subscriptions')
      .reply(200, subscriptionOperators)
    const res = await request('POST', '/operatorCheck', { operator: 'multicluster-engine' })
    expect(res.statusCode).toEqual(400)
  })
})
