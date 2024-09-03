/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { request } from '../mock-request'

describe('metrics proxy route', function () {
  it('uses successfully calls prometheus endpoint', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/route.openshift.io/v1/namespaces/openshift-monitoring/routes/prometheus-k8s')
      .reply(200, {
        kind: 'Route',
        apiVersion: 'route.openshift.io/v1',
        metadata: {
          name: 'prometheus-k8s',
          namespace: 'openshift-monitoring',
        },
        spec: {
          host: 'prometheus.testing.com',
          path: '/api',
          to: {
            kind: 'Service',
            name: 'prometheus',
            weight: 100,
          },
          port: {
            targetPort: 'web',
          },
          tls: {
            termination: 'reencrypt',
            insecureEdgeTerminationPolicy: 'Redirect',
          },
          wildcardPolicy: 'None',
        },
      })
    const res = await request('GET', '/prometheus/query')
    expect(res.statusCode).toEqual(200)
  })
  it('should error on observability route', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/route.openshift.io/v1/namespaces/openshift-monitoring/routes/')
      .replyWithError('bad request')
    const res = await request('GET', '/prometheus/query')
    expect(res.statusCode).toEqual(500)
  })
  it('should query prometheus with bad proxy route host', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/route.openshift.io/v1/namespaces/openshift-monitoring/routes/prometheus-k8s')
      .reply(200, {
        kind: 'Route',
        apiVersion: 'route.openshift.io/v1',
        metadata: {
          name: 'prometheus-k8s',
          namespace: 'openshift-monitoring',
        },
      })
    const res = await request('GET', '/prometheus/query')
    expect(res.statusCode).toEqual(500)
  })
  it(`uses successfully calls observability endpoint`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/route.openshift.io/v1/namespaces/open-cluster-management-observability/routes/rbac-query-proxy')
      .reply(200, {
        kind: 'Route',
        apiVersion: 'route.openshift.io/v1',
        metadata: {
          name: 'rbac-query-proxy',
          namespace: 'open-cluster-management-observability',
        },
        spec: {
          host: 'rbac-query-proxy.testing.com',
          to: {
            kind: 'Service',
            name: 'rbac-query-proxy',
            weight: 100,
          },
          port: {
            targetPort: 'https',
          },
          tls: {
            termination: 'reencrypt',
            insecureEdgeTerminationPolicy: 'Redirect',
          },
          wildcardPolicy: 'None',
        },
      })
    const res = await request('GET', '/observability/query')
    expect(res.statusCode).toEqual(200)
  })
  it('should error on observability route', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/route.openshift.io/v1/open-cluster-management-observability/routes/')
      .replyWithError('bad request')
    const res = await request('GET', '/observability/query')
    expect(res.statusCode).toEqual(500)
  })
  it('should query observability with bad proxy route host', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200, {
      status: 200,
    })
    nock(process.env.CLUSTER_API_URL)
      .get('/apis/route.openshift.io/v1/namespaces/open-cluster-management-observability/routes/rbac-query-proxy')
      .reply(200, {
        kind: 'Route',
        apiVersion: 'route.openshift.io/v1',
        metadata: {
          name: 'rbac-query-proxy',
          namespace: 'open-cluster-management-observability',
        },
      })
    const res = await request('GET', '/observability/query')
    expect(res.statusCode).toEqual(500)
  })
})
