/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import { request } from '../mock-request'
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import { VmiUsageType } from '../../src/lib/virtual-machine'

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
    const res = await request('POST', '/virtualmachinesnapshots/create', {
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

  it('should successfully get VM', async function () {
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
      .get('/testCluster/apis/kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName')
      .reply(200, {
        statusCode: 200,
      })
    const res = await request('GET', '/virtualmachines/get/testCluster/vmName/vmNamespace')
    expect(res.statusCode).toEqual(200)
  })

  it('should successfully get VM snapshot', async function () {
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
      .get('/testCluster/apis/snapshot.kubevirt.io/v1beta1/namespaces/vmNamespace/virtualmachinesnapshots/vmName')
      .reply(200, {
        statusCode: 200,
      })
    const res = await request('GET', '/virtualmachinesnapshots/get/testCluster/vmName/vmNamespace')
    expect(res.statusCode).toEqual(200)
  })

  it('should successfully delete VM', async function () {
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
      .delete('/testCluster/apis/kubevirt.io/v1/namespaces/vmNamespace/virtualmachines/vmName')
      .reply(200, {
        statusCode: 200,
      })
    const res = await request('DELETE', '/virtualmachines/delete', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
      reqBody: {},
    })
    expect(res.statusCode).toEqual(200)
  })

  it('should successfully delete VM Snapshot', async function () {
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
      .delete('/testCluster/apis/snapshot.kubevirt.io/v1beta1/namespaces/vmNamespace/virtualmachinesnapshots/vmName')
      .reply(200, {
        statusCode: 200,
      })
    const res = await request('DELETE', '/virtualmachinesnapshots/delete', {
      managedCluster: 'testCluster',
      vmName: 'vmName',
      vmNamespace: 'vmNamespace',
      reqBody: {},
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
    const podName = 'centos-launcher'
    const vmiName2 = 'fedora'
    const podName2 = 'fedora-launcher'

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
              name: podName,
              namespace: 'default',
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
              {
                name: 'compute',
                usage: {
                  cpu: '6894867n',
                  memory: '908492Ki',
                },
              },
            ],
          },
          {
            metadata: {
              name: podName2,
              namespace: 'default',
              labels: {
                'kubevirt.io': 'virt-launcher',
                'kubevirt.io/created-by': '113966b8-3b80-48cc-92da-71631d06a03f',
                'kubevirt.io/nodeName': 'worker-0-2',
                'network.kubevirt.io/headlessService': 'headless',
                'vm.kubevirt.io/name': vmiName2,
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
      .get(`/${clusterName}/api/v1/namespaces/${namespace}/pods?labelSelector=kubevirt.io=virt-launcher`)
      .reply(200, {
        kind: 'PodList',
        apiVersion: 'v1',
        metadata: {
          resourceVersion: '56375871',
        },
        items: [
          {
            metadata: {
              name: podName,
            },
            spec: {
              containers: [
                {
                  resources: {
                    requests: {
                      cpu: '100m',
                      memory: '2294Mi',
                    },
                  },
                },
              ],
            },
          },
          {
            metadata: {
              name: podName2,
            },
            spec: {
              containers: [
                {
                  resources: {
                    requests: {
                      cpu: '100m',
                      memory: '2294Mi',
                    },
                  },
                },
                {
                  resources: {
                    requests: {
                      cpu: '100m',
                      memory: '2294Mi',
                    },
                  },
                },
              ],
            },
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
            totalBytes: 32212254720, // 30Gib
            usedBytes: 1029201920, // 1Gib
          },
        ],
        metadata: {},
      })
    nock('https://cluster-proxy-addon-user.multicluster-engine.svc.cluster.local:9092')
      .get(
        `/${clusterName}/apis/subresources.kubevirt.io/v1/namespaces/${namespace}/virtualmachineinstances/${vmiName2}/filesystemlist`
      )
      .reply(200, {
        items: [
          {
            diskName: 'vda1',
            fileSystemType: 'ext4',
            mountPoint: '/',
            totalBytes: 42949672960, //40Gib
            usedBytes: 5368709120, // 5Gib
          },
        ],
        metadata: {},
      })

    const response = {
      cpu: 28, // millicores
      memory: 3548, // MiB
      storage: 6, // GiB
      vmisUsage: [
        {
          cpu: {
            requested: 100,
            usage: 14,
            usagePercent: 14,
          },
          memory: {
            requested: 2294,
            usage: 1774,
            usagePercent: 77,
          },
          storage: {
            requested: 30,
            usage: 1,
            usagePercent: 3,
          },
          podName: podName,
          vmiName: vmiName,
          namespace,
          clusterName,
        },
        {
          cpu: {
            requested: 200,
            usage: 14,
            usagePercent: 7,
          },
          memory: {
            requested: 4588,
            usage: 1774,
            usagePercent: 39,
          },
          storage: {
            requested: 40,
            usage: 5,
            usagePercent: 13,
          },
          podName: podName2,
          vmiName: vmiName2,
          namespace,
          clusterName,
        },
      ],
    }

    const res = await request('GET', `/vmResourceUsage/cluster/${clusterName}/namespace/${namespace}`)
    expect(res.statusCode).toEqual(200)
    const result = await parseResponseJsonBody(res)
    expect(result.cpu).toEqual(response.cpu)
    expect(result.memory).toEqual(response.memory)
    expect(result.storage).toEqual(response.storage)

    const centosUsage = (result['vmisUsage'] as VmiUsageType[]).find((vu) => vu.vmiName === vmiName)
    expect(centosUsage.cpu.requested).toEqual(response.vmisUsage[0].cpu.requested)
    expect(centosUsage.cpu.usage).toEqual(response.vmisUsage[0].cpu.usage)
    expect(centosUsage.cpu.usagePercent).toEqual(response.vmisUsage[0].cpu.usagePercent)
    expect(centosUsage.memory.usagePercent).toEqual(response.vmisUsage[0].memory.usagePercent)
    expect(centosUsage.storage.usagePercent).toEqual(response.vmisUsage[0].storage.usagePercent)
    expect(centosUsage.namespace).toEqual(response.vmisUsage[0].namespace)
    expect(centosUsage.clusterName).toEqual(response.vmisUsage[0].clusterName)

    const fedoraUsage = (result['vmisUsage'] as VmiUsageType[]).find((vu) => vu.vmiName === vmiName2)
    expect(fedoraUsage.cpu.requested).toEqual(response.vmisUsage[1].cpu.requested)
    expect(fedoraUsage.cpu.usage).toEqual(response.vmisUsage[1].cpu.usage)
    expect(fedoraUsage.cpu.usagePercent).toEqual(response.vmisUsage[1].cpu.usagePercent)
    expect(fedoraUsage.memory.usagePercent).toEqual(response.vmisUsage[1].memory.usagePercent)
    expect(fedoraUsage.storage.usagePercent).toEqual(response.vmisUsage[1].storage.usagePercent)
  })
})
