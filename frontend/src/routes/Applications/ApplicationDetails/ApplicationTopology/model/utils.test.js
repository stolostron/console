/* Copyright Contributors to the Open Cluster Management project */

import { getClusterName, addClusters, getApplicationData, processMultiples } from './utils'

describe('getClusterName', () => {
  it('get the cluster name from the id', () => {
    const nodeId =
      'member--deployed-resource--member--clusters--local-cluster--feng-error-app--helloworld-app-svc--service'
    expect(getClusterName(nodeId)).toEqual('local-cluster')
  })

  it('node id is undefined', () => {
    expect(getClusterName(undefined)).toEqual('')
  })
})

describe('addClusters', () => {
  it('create cluster from given data', () => {
    const parentId = 'member--subscription--feng-error-app--feng-error-app-subscription-1'
    const subscription = {
      metadata: {
        name: 'test',
      },
    }
    const clusterNames = ['local-cluster']
    const managedClusterNames = ['console-managed', 'local-cluster', 'rbrunopi-aws-01']
    const topology = {
      nodes: [
        {
          id: 'member--clusters--',
          specs: {
            appClusters: [],
            targetNamespaces: [],
          },
        },
      ],
    }
    const result = 'member--clusters--local-cluster--test'
    expect(addClusters(parentId, subscription, '', clusterNames, managedClusterNames, [], [], topology)).toEqual(result)
  })
})

describe('getApplicationData', () => {
  it('returns subscription app data from given nodes', () => {
    const nodes = [
      {
        type: 'application',
        specs: {
          raw: {
            apiVersion: 'app.k8s.io/v1beta1',
          },
        },
      },
      {
        type: 'subscription',
        name: 'my-subscription',
      },
      {
        type: 'cluster',
      },
      {
        type: 'replicaset',
      },
    ]
    const result = {
      isArgoApp: false,
      relatedKinds: ['application', 'subscription', 'cluster', 'replicaset'],
      subscription: 'my-subscription',
    }
    expect(getApplicationData(nodes)).toEqual(result)
  })

  it('returns argo app data from given nodes', () => {
    const nodes = [
      {
        type: 'application',
        specs: {
          raw: {
            apiVersion: 'argoproj.io/v1alpha1',
          },
        },
      },
      {
        type: 'cluster',
      },
      {
        type: 'replicaset',
      },
    ]
    const result = {
      cluster: 'local-cluster',
      isArgoApp: true,
      relatedKinds: ['replicaset'],
      source: {},
      subscription: null,
    }
    expect(getApplicationData(nodes)).toEqual(result)
  })
})

describe('getApplicationData', () => {
  it('returns subscription app data from given nodes', () => {
    const nodes = [
      {
        type: 'application',
        specs: {
          raw: {
            apiVersion: 'app.k8s.io/v1beta1',
          },
        },
      },
      {
        type: 'subscription',
        name: 'my-subscription',
      },
      {
        type: 'cluster',
      },
      {
        type: 'replicaset',
      },
    ]
    const result = {
      isArgoApp: false,
      relatedKinds: ['application', 'subscription', 'cluster', 'replicaset'],
      subscription: 'my-subscription',
    }
    expect(getApplicationData(nodes)).toEqual(result)
  })

  it('returns subscription app data with project', () => {
    const nodes = [
      {
        type: 'application',
        specs: {
          raw: {
            apiVersion: 'app.k8s.io/v1beta1',
          },
        },
      },
      {
        type: 'subscription',
        name: 'my-subscription',
      },
      {
        type: 'cluster',
      },
      {
        type: 'replicaset',
      },
      {
        type: 'project',
      },
    ]
    const result = {
      isArgoApp: false,
      relatedKinds: ['application', 'subscription', 'cluster', 'replicaset', 'namespace'],
      subscription: 'my-subscription',
    }
    expect(getApplicationData(nodes)).toEqual(result)
  })

  it('returns argo app data from given nodes', () => {
    const nodes = [
      {
        type: 'application',
        specs: {
          raw: {
            apiVersion: 'argoproj.io/v1alpha1',
          },
        },
      },
      {
        type: 'cluster',
      },
      {
        type: 'replicaset',
      },
    ]
    const result = {
      cluster: 'local-cluster',
      isArgoApp: true,
      relatedKinds: ['replicaset'],
      source: {},
      subscription: null,
    }
    expect(getApplicationData(nodes)).toEqual(result)
  })
})

describe('processMultiples', () => {
  const resources = [
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello',
      namespace: 'feng-cronjob',
    },
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello2',
      namespace: 'feng-cronjob',
    },
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello3',
      namespace: 'feng-cronjob',
    },
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello5',
      namespace: 'feng-cronjob',
    },
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello7',
      namespace: 'feng-cronjob',
    },
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello8',
      namespace: 'feng-cronjob',
    },
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello1',
      namespace: 'feng-cronjob',
    },
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello4',
      namespace: 'feng-cronjob',
    },
    {
      apiVersion: 'batch/v1',
      kind: 'CronJob',
      name: 'hello6',
      namespace: 'feng-cronjob',
    },
  ]

  const result1 = [
    {
      kind: 'CronJob',
      name: '',
      namespace: '',
      resourceCount: 18,
      resources: [
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello2',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello3',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello5',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello7',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello8',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello1',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello4',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello6',
          namespace: 'feng-cronjob',
        },
      ],
    },
  ]

  const result2 = [
    {
      kind: 'CronJob',
      name: '',
      namespace: '',
      resourceCount: 9,
      resources: [
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello2',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello3',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello5',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello7',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello8',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello1',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello4',
          namespace: 'feng-cronjob',
        },
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: 'hello6',
          namespace: 'feng-cronjob',
        },
      ],
    },
  ]

  it('can process resources', () => {
    expect(processMultiples(resources, 2)).toEqual(result1)
  })

  it('can process resources zero numOfDeployedClusters', () => {
    expect(processMultiples(resources, 0)).toEqual(result2)
  })
})
