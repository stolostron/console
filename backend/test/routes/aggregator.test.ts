/* Copyright Contributors to the Open Cluster Management project */
import { parseResponseJsonBody } from '../../src/lib/body-parser'
import { aggregateKubeApplications, aggregatSearchAPIApplications } from '../../src/routes/aggregators/applications'
import { pagedSearchQueries } from '../../src/lib/search'
import { initResourceCache } from '../../src/routes/events'
import { request } from '../mock-request'
import nock from 'nock'

/// to get exact nock request body, put bp at line 303 in /backend/node_modules/nock/lib/intercepted_request_router.js
describe(`aggregator Route`, function () {
  it(`should page Unfiltered Applications`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)

    // initialize events
    initResourceCache(resourceCache)

    // setup nocks
    setupNocks()

    // fill in application cache from resourceCache and search api mocks
    aggregateKubeApplications()
    await aggregatSearchAPIApplications(1)

    // NO FILTER
    const res = await request('POST', '/aggregate/applications', {
      page: 1,
      perPage: 10,
      sortBy: {
        index: 0,
        direction: 'asc',
      },
    })
    expect(res.statusCode).toEqual(200)
    expect(JSON.stringify(await parseResponseJsonBody(res))).toEqual(JSON.stringify(responseNoFilter))
  })
  it(`should page Filtered Applications`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)

    // initialize events
    initResourceCache(resourceCache)

    // setup nocks
    setupNocks()

    // fill in application cache from resourceCache and search api mocks
    aggregateKubeApplications()
    await aggregatSearchAPIApplications(1)

    // FILTERED
    const res = await request('POST', '/aggregate/applications', {
      page: 1,
      perPage: 10,
      search: 'tes',
      filters: {
        type: ['subscription'],
      },
      sortBy: {
        index: 0,
        direction: 'desc',
      },
    })
    expect(res.statusCode).toEqual(200)
    expect(JSON.stringify(await parseResponseJsonBody(res))).toEqual(JSON.stringify(responseFiltered))
  })
  it(`should return application  counts`, async function () {
    nock(process.env.CLUSTER_API_URL).get('/apis').reply(200)

    // initialize events
    initResourceCache(resourceCache)

    // setup nocks
    setupNocks()

    // fill in application cache from resourceCache and search api mocks
    aggregateKubeApplications()
    await aggregatSearchAPIApplications(1)

    // FILTERED
    const res = await request('POST', '/aggregate/statuses', {
      clusters: ['local-cluster'],
    })
    expect(res.statusCode).toEqual(200)
    expect(JSON.stringify(await parseResponseJsonBody(res))).toEqual(JSON.stringify(responseCount))
  })
})

const responseCount = {
  itemCount: '3',
  filterCounts: {
    type: {
      subscription: 1,
      appset: 1,
      openshift: 1,
    },
    cluster: {
      'local-cluster': 3,
    },
  },
  loading: false,
}

const responseNoFilter = {
  page: 1,
  items: [
    {
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'ApplicationSet',
      metadata: {
        name: 'argoapplication-1',
        namespace: 'openshift-gitops',
      },
    },
    {
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: {
        name: 'argoapplication-1',
        namespace: 'openshift-gitops',
      },
      spec: {
        destination: {
          namespace: 'argoapplication-1-ns',
          server: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
        },
        project: 'default',
        source: {
          path: 'foo',
          repoURL: 'https://test.com/test.git',
          targetRevision: 'HEAD',
        },
        syncPolicy: {},
      },
      status: {},
    },
    {
      apiVersion: 'apps/v1',
      kind: 'deployment',
      label: 'app=authentication-operator',
      metadata: {
        name: 'authentication-operator',
        namespace: 'authentication-operator-ns',
      },
      status: {
        cluster: 'local-cluster',
        resourceName: 'authentication-operator',
      },
    },
    {
      apiVersion: 'apps/v1',
      kind: 'deployment',
      label: 'app=authentication-operator',
      metadata: {
        name: 'authentication-operator',
        namespace: 'authentication-operator-ns',
      },
      status: {
        cluster: 'test-cluster',
        resourceName: 'authentication-operator',
      },
    },
    {
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'Application',
      metadata: {
        name: 'feng-remote-argo8',
        namespace: 'openshift-gitops',
        creationTimestamp: '2021-12-03T18:55:47Z',
      },
      spec: {
        destination: {
          namespace: 'feng-remote-namespace',
          name: 'in-cluster',
        },
        source: {
          path: 'helloworld-perf',
          repoURL: 'https://github.com/fxiang1/app-samples',
          targetRevision: 'HEAD',
        },
      },
      status: {
        cluster: 'feng-managed',
        health: {},
        sync: {},
      },
    },
    {
      apiVersion: 'app.k8s.io/v1beta1',
      kind: 'Application',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {
          'apps.open-cluster-management.io/deployables': '',
          'apps.open-cluster-management.io/subscriptions':
            'default/test-subscription-1,default/test-subscription-1-local',
        },
      },
    },
    {
      apiVersion: 'apps/v1',
      kind: 'deployment',
      label: 'app=test-app;kustomize.toolkit.fluxcd.io/name=test-app;kustomize.toolkit.fluxcd.io/namespace=test-app-ns',
      metadata: {
        name: 'test-app',
        namespace: 'test-app-ns',
      },
      status: {
        cluster: 'test-cluster',
        resourceName: 'test-app',
      },
    },
  ],
  processedItemCount: 7,
  emptyResult: false,
  isPreProcessed: true,
  request: {
    page: 1,
    perPage: 10,
    sortBy: {
      index: 0,
      direction: 'asc',
    },
  },
}

const responseFiltered = {
  page: 1,
  items: [
    {
      apiVersion: 'app.k8s.io/v1beta1',
      kind: 'Application',
      metadata: {
        name: 'test',
        namespace: 'default',
        annotations: {
          'apps.open-cluster-management.io/deployables': '',
          'apps.open-cluster-management.io/subscriptions':
            'default/test-subscription-1,default/test-subscription-1-local',
        },
      },
    },
  ],
  processedItemCount: 1,
  emptyResult: false,
  isPreProcessed: true,
  request: {
    page: 1,
    perPage: 10,
    search: 'tes',
    filters: {
      type: ['subscription'],
    },
    sortBy: {
      index: 0,
      direction: 'desc',
    },
  },
}

/// to get exact nock request body, put bp at line 303 in /backend/node_modules/nock/lib/intercepted_request_router.js
function setupNocks() {
  //
  // REMOTE ARGO
  pagedSearchQueries.forEach((query, inx) => {
    const nocked = nock('https://search-search-api.undefined.svc.cluster.local:4010').post(
      '/searchapi/graphql',
      `{"operationName":"searchResult","variables":{"input":[{"filters":[{"property":"kind","values":["Application"]},{"property":"apigroup","values":["argoproj.io"]},{"property":"cluster","values":["!local-cluster"]},{"property":"name","values":[${query.map((q) => `"${q}"`).join(',')}]}],"limit":100}]},"query":"query searchResult($input: [SearchInput]) {\\n  searchResult: search(input: $input) {\\n    items\\n  }\\n}"}`
    )
    if (inx === 0) {
      nocked.reply(200, {
        data: {
          searchResult: [
            {
              items: [
                {
                  apigroup: 'argoproj.io',
                  apiversion: 'v1alpha1',
                  cluster: 'feng-managed',
                  created: '2021-12-03T18:55:47Z',
                  destinationName: 'in-cluster',
                  destinationNamespace: 'feng-remote-namespace',
                  kind: 'application',
                  name: 'feng-remote-argo8',
                  namespace: 'openshift-gitops',
                  path: 'helloworld-perf',
                  repoURL: 'https://github.com/fxiang1/app-samples',
                  status: 'Healthy',
                  targetRevision: 'HEAD',
                  _clusterNamespace: 'feng-managed',
                  _rbac: 'feng-managed_argoproj.io_applications',
                  _uid: 'feng-managed/9896aad3-6789-4350-876c-bd3749c85b5d',
                },
              ],
            },
          ],
        },
      })
    } else {
      nocked.reply(200, {})
    }
  })

  //
  // REMOTE/LOCAL OCP and FLUX--NOT SYSTEM
  pagedSearchQueries.forEach((query, inx) => {
    const nocked = nock('https://search-search-api.undefined.svc.cluster.local:4010').post(
      '/searchapi/graphql',
      `{"operationName":"searchResult","variables":{"input":[{"filters":[{"property":"kind","values":["Deployment"]},{"property":"label","values":["kustomize.toolkit.fluxcd.io/name=*","helm.toolkit.fluxcd.io/name=*","app=*","app.kubernetes.io/part-of=*"]},{"property":"namespace","values":["!openshift*"]},{"property":"namespace","values":["!open-cluster-management*"]},{"property":"name","values":[${query.map((q) => `"${q}"`).join(',')}]}],"limit":100}]},"query":"query searchResult($input: [SearchInput]) {\\n  searchResult: search(input: $input) {\\n    items\\n  }\\n}"}`
    )
    if (inx === 0) {
      nocked.reply(200, {
        data: {
          searchResult: [
            {
              items: [
                // local OCP
                {
                  apiversion: 'apps/v1',
                  kind: 'deployment',
                  label: 'app=authentication-operator',
                  name: 'authentication-operator',
                  namespace: 'authentication-operator-ns',
                  cluster: 'local-cluster',
                },
                // remote OCP
                {
                  apiversion: 'apps/v1',
                  kind: 'deployment',
                  label: 'app=authentication-operator',
                  name: 'authentication-operator',
                  namespace: 'authentication-operator-ns',
                  cluster: 'test-cluster',
                },
                // FLUX
                {
                  apiversion: 'apps/v1',
                  kind: 'deployment',
                  name: 'test-app',
                  namespace: 'test-app-ns',
                  label:
                    'app=test-app;kustomize.toolkit.fluxcd.io/name=test-app;kustomize.toolkit.fluxcd.io/namespace=test-app-ns',
                  cluster: 'test-cluster',
                },
              ],
            },
          ],
        },
      })
    } else {
      nocked.reply(200, {})
    }
  })

  // SYSTEM APPS
  const nocked = nock('https://search-search-api.undefined.svc.cluster.local:4010').post(
    '/searchapi/graphql',
    '{"operationName":"searchResult","variables":{"input":[{"filters":[{"property":"kind","values":["Deployment"]},{"property":"label","values":["kustomize.toolkit.fluxcd.io/name=*","helm.toolkit.fluxcd.io/name=*","app=*","app.kubernetes.io/part-of=*"]},{"property":"namespace","values":["openshift*","open-cluster-management*"]},{"property":"cluster","values":["local-cluster"]}],"limit":20000}]},"query":"query searchResult($input: [SearchInput]) {\\n  searchResult: search(input: $input) {\\n    items\\n  }\\n}"}'
  )
  nocked.reply(200, {})
  //
  // RBAC
  nock(process.env.CLUSTER_API_URL)
    .post(
      '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"argoproj.io","resource":"applications","verb":"list"}}}'
    )
    .reply(200, {
      status: {
        allowed: true,
      },
    })
  nock(process.env.CLUSTER_API_URL)
    .post(
      '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"view.open-cluster-management.io","namespace":"default","resource":"managedclusterviews","verb":"create"}}}'
    )
    .reply(200, {
      status: {
        allowed: true,
      },
    })

  nock(process.env.CLUSTER_API_URL)
    .post(
      '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"app.k8s.io","resource":"applications","verb":"list"}}}'
    )
    .reply(200, {
      status: {
        allowed: true,
      },
    })
  nock(process.env.CLUSTER_API_URL)
    .post(
      '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"argoproj.io","resource":"applicationsets","verb":"list"}}}'
    )
    .reply(200, {
      status: {
        allowed: true,
      },
    })
  nock(process.env.CLUSTER_API_URL)
    .post(
      '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"apps","resource":"deployments","verb":"list"}}}'
    )
    .reply(200, {
      status: {
        allowed: true,
      },
    })
  nock(process.env.CLUSTER_API_URL)
    .post(
      '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"view.open-cluster-management.io","namespace":"openshift-gitops","resource":"managedclusterviews","verb":"create"}}}'
    )
    .reply(200, {
      status: {
        allowed: true,
      },
    })
  nock(process.env.CLUSTER_API_URL)
    .post(
      '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"view.open-cluster-management.io","namespace":"authentication-operator-ns","resource":"managedclusterviews","verb":"create"}}}'
    )
    .reply(200, {
      status: {
        allowed: true,
      },
    })
  nock(process.env.CLUSTER_API_URL)
    .post(
      '/apis/authorization.k8s.io/v1/selfsubjectaccessreviews',
      '{"apiVersion":"authorization.k8s.io/v1","kind":"SelfSubjectAccessReview","metadata":{},"spec":{"resourceAttributes":{"group":"view.open-cluster-management.io","namespace":"test-app-ns","resource":"managedclusterviews","verb":"create"}}}'
    )
    .reply(200, {
      status: {
        allowed: true,
      },
    })
}

const resourceCache = {
  // subscription app
  '/app.k8s.io/v1beta1/applications': {
    'cc84e62f-edb9-413b-8bd7-38a32a21ce72': {
      resource: {
        apiVersion: 'app.k8s.io/v1beta1',
        kind: 'Application',
        metadata: {
          name: 'test',
          namespace: 'default',
          annotations: {
            'apps.open-cluster-management.io/deployables': '',
            'apps.open-cluster-management.io/subscriptions':
              'default/test-subscription-1,default/test-subscription-1-local',
          },
        },
      },
      eventID: 0,
    },
  },

  // local argo app
  '/argoproj.io/v1alpha1/applications': {
    'cc84e62f-edb9-413b-8bd7-38a32a21ce72': {
      resource: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'Application',
        metadata: {
          name: 'argoapplication-1',
          namespace: 'openshift-gitops',
        },
        spec: {
          destination: {
            namespace: 'argoapplication-1-ns',
            server: 'https://api.console-aws-48-pwc27.dev02.red-chesterfield.com:6443',
          },
          project: 'default',
          source: {
            path: 'foo',
            repoURL: 'https://test.com/test.git',
            targetRevision: 'HEAD',
          },
          syncPolicy: {},
        },
        status: {},
      },
      eventID: 0,
    },
  },
  // app set
  '/argoproj.io/v1alpha1/applicationsets': {
    'cc84e62f-edb9-413b-8bd7-38a32a21ce72': {
      resource: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: {
          name: 'argoapplication-1',
          namespace: 'openshift-gitops',
        },
      },
      eventID: 0,
    },
  },
  '/apps.open-cluster-management.io/v1/subscriptions': {
    '8b6d6503-dc8c-4ed6-b420-aa0df015fbf1': {
      resource: {
        apiVersion: 'apps.open-cluster-management.io/v1',
        kind: 'Subscription',
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/git-branch': 'main',
            'apps.open-cluster-management.io/git-current-commit': '8f862b04775d23ba4aefe3064d031c968fdc5a3f',
            'apps.open-cluster-management.io/git-path': 'helloworld',
            'apps.open-cluster-management.io/reconcile-option': 'merge',
            'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
            'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
          },
          creationTimestamp: '2024-07-02T17:45:25Z',
          generation: 1,
          labels: {
            app: 'test',
            'app.kubernetes.io/part-of': 'test',
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
          },
          name: 'test-subscription-1',
          namespace: 'default',
          resourceVersion: '1625088',
          uid: '8b6d6503-dc8c-4ed6-b420-aa0df015fbf1',
        },
        spec: {
          channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
          placement: {
            placementRef: {
              kind: 'Placement',
              name: 'test-placement-1',
            },
          },
        },
        status: {
          lastUpdateTime: '2024-07-02T17:45:26Z',
          message: 'Active',
          phase: 'Propagated',
        },
      },
      eventID: 7,
    },

    'b7009958-d850-4ffc-9b04-57baa403ce47': {
      resource: {
        apiVersion: 'apps.open-cluster-management.io/v1',
        kind: 'Subscription',
        metadata: {
          annotations: {
            'apps.open-cluster-management.io/git-branch': 'main',
            'apps.open-cluster-management.io/git-path': 'helloworld',
            'apps.open-cluster-management.io/hosting-subscription': 'default/test-subscription-1',
            'apps.open-cluster-management.io/reconcile-option': 'merge',
            'open-cluster-management.io/user-group': 'c3lzdGVtOmNsdXN0ZXItYWRtaW5zLHN5c3RlbTphdXRoZW50aWNhdGVk',
            'open-cluster-management.io/user-identity': 'a3ViZTphZG1pbg==',
          },
          creationTimestamp: '2024-07-02T17:45:26Z',
          generation: 1,
          labels: {
            app: 'test',
            'app.kubernetes.io/part-of': 'test',
            'apps.open-cluster-management.io/reconcile-rate': 'medium',
          },
          name: 'test-subscription-1-local',
          namespace: 'default',
          ownerReferences: [
            {
              apiVersion: 'work.open-cluster-management.io/v1',
              kind: 'AppliedManifestWork',
              name: '099081ddd1c54a21bda5eae2f2c5013f0947c6ba3b8bdb1ceb7c38d7cfae3685-default-test-subscription-1',
              uid: 'e9054859-bfca-46d2-8952-bea381adc6fa',
            },
          ],
          resourceVersion: '2441151',
          uid: 'b7009958-d850-4ffc-9b04-57baa403ce47',
        },
        spec: {
          channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
          placement: {
            local: true,
          },
        },
        status: {
          ansiblejobs: {},
          appstatusReference: 'kubectl get appsubstatus -n default test-subscription-1',
          lastUpdateTime: '2024-07-03T13:05:00Z',
          message: 'Active',
          phase: 'Subscribed',
        },
      },
      eventID: 627,
    },
  },
  '/cluster.open-cluster-management.io/v1beta1/placementdecisions': {
    '7ba09bb1-5211-490f-a6d1-456322886ab0': {
      resource: {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'PlacementDecision',
        metadata: {
          creationTimestamp: '2024-07-02T17:45:25Z',
          generation: 1,
          labels: {
            'cluster.open-cluster-management.io/decision-group-index': '0',
            'cluster.open-cluster-management.io/decision-group-name': '',
            'cluster.open-cluster-management.io/placement': 'test-placement-1',
          },
          name: 'test-placement-1-decision-1',
          namespace: 'default',
          ownerReferences: [
            {
              apiVersion: 'cluster.open-cluster-management.io/v1beta1',
              blockOwnerDeletion: true,
              controller: true,
              kind: 'Placement',
              name: 'test-placement-1',
              uid: '458708a1-f9fd-498b-9c2f-420ba246fe3f',
            },
          ],
          resourceVersion: '1625071',
          uid: '7ba09bb1-5211-490f-a6d1-456322886ab0',
        },
        status: {
          decisions: [
            {
              clusterName: 'local-cluster',
              reason: '',
            },
          ],
        },
      },
      eventID: 31,
    },
    'c93db359-83b3-435b-9e30-065ac8a10143': {
      resource: {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'PlacementDecision',
        metadata: {
          creationTimestamp: '2024-07-01T04:36:10Z',
          generation: 1,
          labels: {
            'cluster.open-cluster-management.io/decision-group-index': '0',
            'cluster.open-cluster-management.io/decision-group-name': '',
            'cluster.open-cluster-management.io/placement': 'global',
          },
          name: 'global-decision-1',
          namespace: 'open-cluster-management-global-set',
          ownerReferences: [
            {
              apiVersion: 'cluster.open-cluster-management.io/v1beta1',
              blockOwnerDeletion: true,
              controller: true,
              kind: 'Placement',
              name: 'global',
              uid: '8e2ff464-d716-4be2-95e5-498cd5a14258',
            },
          ],
          resourceVersion: '33592',
          uid: 'c93db359-83b3-435b-9e30-065ac8a10143',
        },
        status: {
          decisions: [
            {
              clusterName: 'local-cluster',
              reason: '',
            },
          ],
        },
      },
      eventID: 33,
    },
  },
}
