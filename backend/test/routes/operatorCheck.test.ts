/* Copyright Contributors to the Open Cluster Management project */
import { request, requestMultiChunk } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import nock from 'nock'

const subscriptionOperators = {
  items: [
    {
      metadata: { name: 'openshift-gitops' },
      spec: { name: 'openshift-gitops-operator' },
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

const clusterExtensions = {
  items: [
    {
      metadata: { name: 'ansible-automation-platform' },
      spec: {
        namespace: 'ansible-automation-platform',
        source: {
          sourceType: 'Catalog',
          catalog: { packageName: 'ansible-automation-platform-operator' },
        },
      },
      status: {
        install: { bundle: { version: '2.5.0' } },
        conditions: [{ type: 'Installed', status: 'True', reason: 'Succeeded' }],
      },
    },
  ],
}

describe(`operatorCheck Route`, function () {
  it(`returns valid response with version for installed operator`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
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
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operators.coreos.com/v1alpha1/subscriptions')
      .reply(200, subscriptionOperators)
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/olm.operatorframework.io/v1/clusterextensions')
      .reply(200, { items: [] })
    const res = await request('POST', '/operatorCheck', { operator: 'ansible-automation-platform-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'ansible-automation-platform-operator',
      installed: false,
    })
  })
  it(`returns installed via ClusterExtension when Subscription is missing`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL).get('/apis/operators.coreos.com/v1alpha1/subscriptions').reply(200, { items: [] })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/olm.operatorframework.io/v1/clusterextensions')
      .reply(200, clusterExtensions)
    const res = await request('POST', '/operatorCheck', { operator: 'ansible-automation-platform-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'ansible-automation-platform-operator',
      installed: true,
      version: '2.5.0',
    })
  })
  it(`prefers Subscription when both Subscription and ClusterExtension are present`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
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
  it(`returns installed Subscription when an unhealthy package match precedes a healthy one`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operators.coreos.com/v1alpha1/subscriptions')
      .reply(200, {
        items: [
          {
            metadata: { name: 'openshift-gitops-unhealthy' },
            spec: { name: 'openshift-gitops-operator' },
            status: {
              installedCSV: 'openshift-gitops-operator.v1.0.0',
              conditions: [{ status: 'True', type: 'CatalogSourcesUnhealthy' }],
            },
          },
          {
            metadata: { name: 'openshift-gitops' },
            spec: { name: 'openshift-gitops-operator' },
            status: {
              installedCSV: 'openshift-gitops-operator.v1.8.2',
              conditions: [{ status: 'False', type: 'CatalogSourcesUnhealthy' }],
            },
          },
        ],
      })
    const res = await request('POST', '/operatorCheck', { operator: 'openshift-gitops-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'openshift-gitops-operator',
      installed: true,
      version: 'openshift-gitops-operator.v1.8.2',
    })
  })
  it(`returns installed ClusterExtension when an uninstalled package match precedes an installed one`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL).get('/apis/operators.coreos.com/v1alpha1/subscriptions').reply(200, { items: [] })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/olm.operatorframework.io/v1/clusterextensions')
      .reply(200, {
        items: [
          {
            metadata: { name: 'ansible-automation-platform-pending' },
            spec: {
              namespace: 'ansible-automation-platform',
              source: {
                sourceType: 'Catalog',
                catalog: { packageName: 'ansible-automation-platform-operator' },
              },
            },
            status: {
              install: { bundle: { version: '2.4.0' } },
              conditions: [{ type: 'Installed', status: 'False', reason: 'Failed' }],
            },
          },
          {
            metadata: { name: 'ansible-automation-platform' },
            spec: {
              namespace: 'ansible-automation-platform',
              source: {
                sourceType: 'Catalog',
                catalog: { packageName: 'ansible-automation-platform-operator' },
              },
            },
            status: {
              install: { bundle: { version: '2.5.0' } },
              conditions: [{ type: 'Installed', status: 'True', reason: 'Succeeded' }],
            },
          },
        ],
      })
    const res = await request('POST', '/operatorCheck', { operator: 'ansible-automation-platform-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'ansible-automation-platform-operator',
      installed: true,
      version: '2.5.0',
    })
  })
  it(`falls back to ClusterExtension when Subscription matches but is unhealthy`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operators.coreos.com/v1alpha1/subscriptions')
      .reply(200, {
        items: [
          {
            metadata: { name: 'ansible-automation-platform-unhealthy' },
            spec: { name: 'ansible-automation-platform-operator' },
            status: {
              installedCSV: 'ansible-automation-platform-operator.v2.4.0',
              conditions: [{ status: 'True', type: 'CatalogSourcesUnhealthy' }],
            },
          },
        ],
      })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/olm.operatorframework.io/v1/clusterextensions')
      .reply(200, clusterExtensions)
    const res = await request('POST', '/operatorCheck', { operator: 'ansible-automation-platform-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'ansible-automation-platform-operator',
      installed: true,
      version: '2.5.0',
    })
  })
  it(`returns not installed when ClusterExtension CRD is missing`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL).get('/apis/operators.coreos.com/v1alpha1/subscriptions').reply(200, { items: [] })
    nock(process.env.CLUSTER_API_URL).get('/apis/olm.operatorframework.io/v1/clusterextensions').reply(404, {
      kind: 'Status',
      apiVersion: 'v1',
      metadata: {},
      status: 'Failure',
      message: 'the server could not find the requested resource',
      reason: 'NotFound',
      code: 404,
    })
    const res = await request('POST', '/operatorCheck', { operator: 'openshift-gitops-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'openshift-gitops-operator',
      installed: false,
    })
  })
  it(`returns not installed when ClusterExtension query fails`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL).get('/apis/operators.coreos.com/v1alpha1/subscriptions').reply(200, { items: [] })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/olm.operatorframework.io/v1/clusterextensions')
      .replyWithError('getaddrinfo ENOTFOUND')
    const res = await request('POST', '/operatorCheck', { operator: 'openshift-gitops-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'openshift-gitops-operator',
      installed: false,
    })
  })
  it(`returns bad request for arbitrary operator`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operators.coreos.com/v1alpha1/subscriptions')
      .reply(200, subscriptionOperators)
    const res = await request('POST', '/operatorCheck', { operator: 'multicluster-engine' })
    expect(res.statusCode).toEqual(400)
  })

  it('correctly parses request body received in multiple chunks', async function () {
    nock(process.env.CLUSTER_API_URL).get('/api').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/operators.coreos.com/v1alpha1/subscriptions')
      .reply(200, subscriptionOperators)
    const res = await requestMultiChunk('POST', '/operatorCheck', { operator: 'openshift-gitops-operator' })
    expect(res.statusCode).toEqual(200)
    expect(await parseResponseJsonBody(res)).toEqual({
      operator: 'openshift-gitops-operator',
      installed: true,
      version: 'openshift-gitops-operator.v1.8.2',
    })
  })
})
