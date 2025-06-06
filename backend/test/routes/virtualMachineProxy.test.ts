/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
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

  it('should successfully call pause action', async function () {
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
      .put('/testCluster/apis/subresources.kubevirt.io/v1/namespaces/vmNamespace/virtualmachineinstances/vmName/pause')
      .reply(200, {
        statusCode: 200,
      })
    const res = await request('PUT', '/virtualmachineinstances/pause', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
    })
    expect(res.statusCode).toEqual(200)
  })

  it('should successfully take snapshot action', async function () {
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
      .post('/testCluster/apis/snapshot.kubevirt.io/v1beta1/namespaces/vmNamespace/virtualmachinesnapshots')
      .reply(200, {
        statusCode: 200,
      })
    const res = await request('POST', '/virtualmachinesnapshots', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
      reqBody: {
        apiVersion: 'snapshot.kubevirt.io/v1beta1',
        kind: 'VirtualMachineSnapshot',
        metadata: {
          name: 'test-snapshot',
          namespace: 'vmNamespace',
          ownerReferences: [
            {
              apiVersion: 'kubevirt.io/v1',
              blockOwnerDeletion: false,
              kind: 'VirtualMachine',
              name: 'test-vm',
              uid: '1234-abcd',
            },
          ],
        },
        spec: {
          source: {
            apiGroup: 'kubevirt.io',
            kind: 'VirtualMachine',
            name: 'test-vm',
          },
        },
      },
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
      .reply(500)
    const res = await request('PUT', '/virtualmachines/start', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
    })
    expect(res.statusCode).toEqual(500)
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

  it('should successfully restore a snapshot', async function () {
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
      .post('/testCluster/apis/snapshot.kubevirt.io/v1beta1/namespaces/vmNamespace/virtualmachinerestores')
      .reply(200, {
        statusCode: 200,
      })
    const res = await request('POST', '/virtualmachinerestores', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
      reqBody: {
        apiVersion: 'snapshot.kubevirt.io/v1beta1',
        kind: 'VirtualMachineRestore',
        metadata: {
          name: 'test-snapshot',
          namespace: 'vmNamespace',
          ownerReferences: [
            {
              apiVersion: 'kubevirt.io/v1',
              blockOwnerDeletion: false,
              kind: 'VirtualMachine',
              name: 'test-vm',
              uid: '1234-abcd',
            },
          ],
        },
        spec: {
          target: {
            apiGroup: 'kubevirt.io',
            kind: 'VirtualMachine',
            name: 'test-vm',
          },
        },
      },
    })
    expect(res.statusCode).toEqual(200)
  })
})

describe('vmResourceUsageProxy', () => {
  beforeEach(() => {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)
  })
  afterEach(() => {
    nock.cleanAll()
  })
  it('returns 400 if cluster or namespace param is missing', async () => {
    const clusterName = ''
    const namespace = 'vmNamespace'
    const res = await request('GET', `/vmResourceUsage/cluster/${clusterName}/namespace/${namespace}`)
    expect(res.statusCode).toEqual(400)
  })
  it('aggregates cpu, memory, storage and returns 200', async () => {
    const clusterName = 'testCluster'
    const namespace = 'vmNamespace'
    const vmiName = 'centos'

    nock('https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092')
      .get(
        `/${clusterName}/apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods?labelSelector=kubevirt.io=virt-launcher`
      )
      .reply(200, {
        kind: 'PodMetricsList',
        apiVersion: 'metrics.k8s.io/v1beta1',
        metadata: {},
        items: [
          {
            metadata: {
              name: 'virt-launcher-centos-stream9-white-mackerel-48-fjd5p',
              namespace: 'default',
              creationTimestamp: '2025-06-05T15:57:55Z',
              labels: {
                'kubevirt.io': 'virt-launcher',
                'kubevirt.io/created-by': '113966b8-3b80-48cc-92da-71631d06a03f',
                'kubevirt.io/nodeName': 'worker-0-2',
                'network.kubevirt.io/headlessService': 'headless',
                'vm.kubevirt.io/name': vmiName,
              },
            },
            timestamp: '2025-06-05T15:57:41Z',
            window: '12.508s',
            containers: [
              {
                name: 'compute',
                usage: {
                  cpu: '6894867n',
                  memory: '908492Ki',
                },
              },
            ],
          },
        ],
      })
    nock('https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092')
      .get(
        `/${clusterName}/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${vmiName}/filesystemlist`
      )
      .reply(200, {
        items: [
          {
            diskName: 'vda1',
            fileSystemType: 'ext4',
            mountPoint: '/',
            totalBytes: 3927900160,
            usedBytes: 1029201920,
          },
        ],
        metadata: {},
      })

    const res = await request('GET', `/vmResourceUsage/cluster/${clusterName}/namespace/${namespace}`)
    expect(res.statusCode).toEqual(200)
  })
})
