/* Copyright Contributors to the Open Cluster Management project */
import { constants } from 'http2'
import nock from 'nock'
import { parsePipedJsonBody } from '../../src/lib/body-parser'
import { request } from '../mock-request'

describe('Virtual Machine actions', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should successfully call start action', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
    nock(process.env.CLUSTER_API_URL)
      .post(
        '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
        '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"action.open-cluster-management.io","namespace":"testCluster","resource":"managedclusteractions","verb":"create"}}}'
      )
      .reply(200, {
        status: {
          allowed: true,
        },
      })
    nock(process.env.CLUSTER_API_URL)
      .get('/api/v1/namespaces/testCluster/secrets')
      .reply(200, {
        statusCode: 200,
        apiVersion: 'v1',
        kind: 'SecretList',
        items: [
          {
            kind: 'Secret',
            apiVersion: 'v1',
            metadata: {
              name: 'vm-actor',
              namespace: 'testCluster',
            },
            data: {
              // test-vm-token
              token: 'dGVzdC12bS10b2tlbg==', // notsecret
            },
            type: 'Opaque',
          },
        ],
      })
    nock('https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092')
      .put('/testCluster/apis/subresources.kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName/start')
      .reply(200, {
        statusCode: 200,
      })
    const res = await request('PUT', '/virtualmachines/start', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
    })
    expect(res.statusCode).toEqual(200)
  })

  it('should error on start action request', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
    nock(process.env.CLUSTER_API_URL)
      .post(
        '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
        '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"action.open-cluster-management.io","namespace":"testCluster","resource":"managedclusteractions","verb":"create"}}}'
      )
      .reply(200, {
        status: {
          allowed: true,
        },
      })
    nock(process.env.CLUSTER_API_URL)
      .get('/api/v1/namespaces/testCluster/secrets')
      .reply(200, {
        statusCode: 200,
        apiVersion: 'v1',
        kind: 'SecretList',
        items: [
          {
            kind: 'Secret',
            apiVersion: 'v1',
            metadata: {
              name: 'vm-actor',
              namespace: 'testCluster',
            },
            data: {
              // test-vm-token
              token: 'dGVzdC12bS10b2tlbg==', // notsecret
            },
            type: 'Opaque',
          },
        ],
      })
    nock('https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092')
      .put('/testCluster/apis/subresources.kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName/start')
      .reply(500, {
        name: 'fetchError',
        message: 'error testing...',
      })
    const res = await request('PUT', '/virtualmachines/start', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
    })
    expect(res.statusCode).toEqual(500)
    expect(JSON.stringify(await parsePipedJsonBody(res))).toEqual(
      JSON.stringify({
        name: 'fetchError',
        message: 'error testing...',
      })
    )
  })

  it('should fail with invalid route and secret', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
    nock(process.env.CLUSTER_API_URL)
      .post(
        '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
        '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"action.open-cluster-management.io","namespace":"testCluster","resource":"managedclusteractions","verb":"create"}}}'
      )
      .reply(200, {
        status: {
          allowed: true,
        },
      })
    nock(process.env.CLUSTER_API_URL).get('/api/v1/namespaces/testCluster/secrets').reply(400, {
      statusCode: 400,
      apiVersion: 'v1',
      kind: 'SecretList',
      items: [],
    })
    nock('https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092')
      .put('/testCluster/apis/subresources.kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName/start')
      .reply(500, {
        name: 'Error',
        message: 'error testing...',
      })
    const res = await request('PUT', '/virtualmachines/start', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
    })
    expect(res.statusCode).toEqual(500)
  })

  it('should fail with 502 - content type text/plain error', async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
    nock(process.env.CLUSTER_API_URL)
      .post(
        '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
        '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"action.open-cluster-management.io","namespace":"testCluster","resource":"managedclusteractions","verb":"create"}}}'
      )
      .reply(200, {
        status: {
          allowed: true,
        },
      })
    nock(process.env.CLUSTER_API_URL)
      .get('/api/v1/namespaces/testCluster/secrets')
      .reply(200, {
        statusCode: 200,
        apiVersion: 'v1',
        kind: 'SecretList',
        items: [
          {
            kind: 'Secret',
            apiVersion: 'v1',
            metadata: {
              name: 'vm-actor',
              namespace: 'testCluster',
            },
            data: {
              // test-vm-token
              token: 'dGVzdC12bS10b2tlbg==', // notsecret
            },
            type: 'Opaque',
          },
        ],
      })
    nock('https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092')
      .put('/testCluster/apis/subresources.kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName/start')
      .reply(502, 'plain text error', { [constants.HTTP2_HEADER_CONTENT_TYPE]: ['text/plain'] })
    const res = await request('PUT', '/virtualmachines/start', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
    })
    expect(res.statusCode).toEqual(502)
    expect(await parsePipedJsonBody(res)).toEqual('plain text error')
  })
})
