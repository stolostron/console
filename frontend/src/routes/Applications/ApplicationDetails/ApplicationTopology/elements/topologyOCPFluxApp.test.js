// Copyright Contributors to the Open Cluster Management project
'use strict'

import { getQueryStringForLabel, processSearchResults, generateTopology } from './topologyOCPFluxApp'

describe('getQueryStringForLabel', () => {
  const label = 'label:app=test-app,app.kubernetes.io/part-of=test-app'
  const namespace = 'test-ns'
  const cluster = 'local-cluster'

  const result = {
    filters: [
      { property: 'label', values: ['app=test-app', 'app.kubernetes.io/part-of=test-app'] },
      { property: 'namespace', values: ['test-ns'] },
      { property: 'cluster', values: ['local-cluster'] },
    ],
    keywords: [],
    relatedKinds: [],
  }
  it('should getQueryStringForLabel', () => {
    expect(getQueryStringForLabel(label, namespace, cluster)).toEqual(result)
  })
})

describe('processSearchResults', () => {
  const searchResults = {
    data: {
      searchResult: [
        {
          items: [
            {
              _uid: 'local-cluster/5be22d12-76ed-4c39-bcf9-b0d74e8a7a77',
              name: 'nodejs-sample',
              apiversion: 'v1',
              namespace: 'app1',
              cluster: 'local-cluster',
              _hubClusterResource: 'true',
              _rbac: 'app1_null_services',
              created: '2022-06-06T18:44:37Z',
              label:
                'app.kubernetes.io/component=nodejs-sample; app.kubernetes.io/instance=nodejs-sample; app.kubernetes.io/name=nodejs-sample; app.kubernetes.io/part-of=sample-app; app.openshift.io/runtime-version=16-ubi8; app.openshift.io/runtime=nodejs; app=nodejs-sample',
              clusterIP: '172.30.78.24',
              kind: 'service',
              port: '8080/TCP',
              type: 'ClusterIP',
            },
          ],
          related: [
            {
              kind: 'pod',
              items: [
                {
                  _uid: 'local-cluster/c0a54edb-09ab-42e4-8a34-e4e013be1d27',
                  status: 'Running',
                  kind: 'pod',
                  namespace: 'feng-helloworld',
                  hostIP: '10.0.152.184',
                  image: 'quay.io/fxiang1/helloworld:0.0.1',
                  name: 'helloworld-app-deploy-7998d94b96-xswjc',
                  cluster: 'local-cluster',
                  restarts: 1,
                  label: 'app=helloworld-app; pod-template-hash=7998d94b96',
                  podIP: '10.130.0.28',
                  startedAt: '2022-06-20T23:31:55Z',
                  _rbac: 'feng-helloworld_null_pods',
                  apiversion: 'v1',
                  container: 'helloworld-app-container',
                  _ownerUID: 'local-cluster/19ab64af-9d16-4f79-9fab-de246f61e122',
                  _hubClusterResource: 'true',
                  created: '2022-06-20T23:31:55Z',
                },
              ],
            },
          ],
        },
      ],
    },
  }

  const result = [
    {
      _hubClusterResource: 'true',
      _rbac: 'app1_null_services',
      _uid: 'local-cluster/5be22d12-76ed-4c39-bcf9-b0d74e8a7a77',
      apiversion: 'v1',
      cluster: 'local-cluster',
      clusterIP: '172.30.78.24',
      created: '2022-06-06T18:44:37Z',
      kind: 'service',
      label:
        'app.kubernetes.io/component=nodejs-sample; app.kubernetes.io/instance=nodejs-sample; app.kubernetes.io/name=nodejs-sample; app.kubernetes.io/part-of=sample-app; app.openshift.io/runtime-version=16-ubi8; app.openshift.io/runtime=nodejs; app=nodejs-sample',
      name: 'nodejs-sample',
      namespace: 'app1',
      port: '8080/TCP',
      type: 'ClusterIP',
    },
    {
      _hubClusterResource: 'true',
      _ownerUID: 'local-cluster/19ab64af-9d16-4f79-9fab-de246f61e122',
      _rbac: 'feng-helloworld_null_pods',
      _uid: 'local-cluster/c0a54edb-09ab-42e4-8a34-e4e013be1d27',
      apiversion: 'v1',
      cluster: 'local-cluster',
      container: 'helloworld-app-container',
      created: '2022-06-20T23:31:55Z',
      hostIP: '10.0.152.184',
      image: 'quay.io/fxiang1/helloworld:0.0.1',
      kind: 'pod',
      label: 'app=helloworld-app; pod-template-hash=7998d94b96',
      name: 'helloworld-app-deploy-7998d94b96-xswjc',
      namespace: 'feng-helloworld',
      podIP: '10.130.0.28',
      restarts: 1,
      startedAt: '2022-06-20T23:31:55Z',
      status: 'Running',
    },
  ]
  it('should processSearchResults', () => {
    expect(processSearchResults(searchResults)).toEqual(result)
  })
})

describe('generateTopology', () => {
  const application = {
    app: {
      apiVersion: 'ocp',
      cluster: {
        name: 'local-cluster',
        namespace: 'local-cluster',
        status: 'ready',
      },
      kind: 'OCPApplication',
    },
    metadata: { name: 'nodejs-sample', namespace: 'app1' },
    isAppSet: false,
    isArgoApp: false,
    isFluxApp: false,
    isOCPApp: true,
    name: 'nodejs-sample',
    namespace: 'app1',
    placement: undefined,
  }
  const resources = [
    {
      _hubClusterResource: 'true',
      _rbac: 'app1_null_services',
      _uid: 'local-cluster/5be22d12-76ed-4c39-bcf9-b0d74e8a7a77',
      apiversion: 'v1',
      cluster: 'local-cluster',
      clusterIP: '172.30.78.24',
      created: '2022-06-06T18:44:37Z',
      kind: 'Service',
      label:
        'app.kubernetes.io/component=nodejs-sample; app.kubernetes.io/instance=nodejs-sample; app.kubernetes.io/name=nodejs-sample; app.kubernetes.io/part-of=sample-app; app.openshift.io/runtime-version=16-ubi8; app.openshift.io/runtime=nodejs; app=nodejs-sample',
      name: 'nodejs-sample',
      namespace: 'app1',
      port: '8080/TCP',
      type: 'ClusterIP',
    },
    {
      _hubClusterResource: 'true',
      _ownerUID: 'local-cluster/19ab64af-9d16-4f79-9fab-de246f61e122',
      _rbac: 'feng-helloworld_null_pods',
      _uid: 'local-cluster/c0a54edb-09ab-42e4-8a34-e4e013be1d27',
      apiversion: 'v1',
      cluster: 'local-cluster',
      container: 'helloworld-app-container',
      created: '2022-06-20T23:31:55Z',
      hostIP: '10.0.152.184',
      image: 'quay.io/fxiang1/helloworld:0.0.1',
      kind: 'Pod',
      label: 'app=helloworld-app; pod-template-hash=7998d94b96',
      name: 'helloworld-app-deploy-7998d94b96-xswjc',
      namespace: 'feng-helloworld',
      podIP: '10.130.0.28',
      restarts: 1,
      startedAt: '2022-06-20T23:31:55Z',
      status: 'Running',
    },
  ]

  const result = {
    links: [
      {
        from: {
          uid: 'application--nodejs-sample',
        },
        specs: {
          isDesign: true,
        },
        to: {
          uid: 'member--clusters--',
        },
        type: '',
      },
      {
        from: {
          uid: 'member--clusters--',
        },
        to: {
          uid: 'member--member--deployable--member--clusters----service--app1--nodejs-sample',
        },
        type: '',
      },
    ],
    nodes: [
      {
        id: 'application--nodejs-sample',
        name: 'nodejs-sample',
        namespace: 'app1',
        specs: {
          allClusters: {
            isLocal: true,
            remoteCount: 0,
          },
          clusterNames: ['local-cluster'],
          isDesign: true,
          pulse: 'green',
          raw: {
            apiVersion: 'ocp',
            cluster: {
              name: 'local-cluster',
              namespace: 'local-cluster',
              status: 'ready',
            },
            kind: 'OCPApplication',
          },
          resourceCount: 0,
        },
        type: 'ocpapplication',
        uid: 'application--nodejs-sample',
      },
      {
        id: 'member--clusters--',
        name: 'local-cluster',
        namespace: '',
        specs: {
          appClusters: undefined,
          clusters: [
            {
              metadata: {
                name: 'local-cluster',
                namespace: 'local-cluster',
              },
              status: 'ready',
            },
          ],
          clustersNames: ['local-cluster'],
          resourceCount: 1,
          sortedClusterNames: ['local-cluster'],
          subscription: null,
          targetNamespaces: undefined,
          title: null,
        },
        type: 'cluster',
        uid: 'member--clusters--',
      },
      {
        id: 'member--member--deployable--member--clusters----service--app1--nodejs-sample',
        name: 'nodejs-sample',
        namespace: 'app1',
        specs: {
          clustersNames: ['local-cluster'],
          isDesign: false,
          parent: {
            clusterId: 'member--clusters--',
          },
          raw: {
            apiVersion: 'v1',
            metadata: {
              name: 'nodejs-sample',
              namespace: 'app1',
            },
          },
          resourceCount: 1,
          resources: undefined,
        },
        type: 'service',
        uid: 'member--member--deployable--member--clusters----service--app1--nodejs-sample',
      },
    ],
    rawSearchData: {},
  }
  it('should generateTopology', () => {
    expect(generateTopology(application, resources, {}, 'local-cluster')).toEqual(result)
  })
})
