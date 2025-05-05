/* Copyright Contributors to the Open Cluster Management project */

import { MockedProvider } from '@apollo/client/testing'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  applicationsState,
  channelsState,
  managedClusterInfosState,
  managedClustersState,
  namespacesState,
  placementDecisionsState,
  placementRulesState,
  subscriptionsState,
} from '../../../atoms'
import { nockAggegateRequest, nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../../lib/nock-util'
import { defaultPlugin, PluginContext } from '../../../lib/PluginContext'
import { waitForNocks, waitForText } from '../../../lib/test-util'
import { ActionExtensionProps } from '../../../plugin-extensions/properties'
import { AcmExtension } from '../../../plugin-extensions/types'
import { GetMessagesDocument, SearchSchemaDocument } from '../../Search/search-sdk/search-sdk'
import {
  mockApplication0,
  mockApplications,
  mockChannels,
  mockManagedClusterInfos,
  mockManagedClusters,
  mockNamespaces,
  mockPlacementrules,
  mockPlacementsDecisions,
  mockSubscriptions,
  uidata,
} from '../Application.sharedmocks'
import ApplicationDetailsPage from './ApplicationDetails'

const applicationActionProps: ActionExtensionProps[] = [
  {
    id: 'action1',
    title: 'Action1',
    model: [
      {
        apiVersion: 'app.k8s.io/v1beta1',
        kind: 'Application',
      },
    ],
    component: (props) => <>{props?.resource?.metadata?.name}</>,
  },
  {
    id: 'action2',
    title: 'Action2',
    component: (props) => <>{props?.resource?.metadata?.name}</>,
  },
]

const acmExtension: AcmExtension = {
  applicationAction: applicationActionProps,
}

const mockSearchQuery = {
  operationName: 'searchResultItemsAndRelatedItems',
  variables: {
    input: [
      {
        keywords: [],
        filters: [
          { property: 'kind', values: ['subscription'] },
          { property: 'name', values: ['subscription-0'] },
          { property: 'namespace', values: ['namespace-0'] },
        ],
        relatedKinds: ['application', 'subscription', 'placements', 'cluster'],
      },
    ],
  },
  query:
    'query searchResultItemsAndRelatedItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    related {\n      kind\n      items\n      __typename\n    }\n    __typename\n  }\n}',
}

const mockSearchResponse = {
  data: {
    searchResult: [
      {
        items: [
          {
            _uid: 'local-cluster/86f54fc2-9565-48b6-a6c8-9bce8ad10942',
            created: '2022-08-05T18:06:55Z',
            _rbac: 'namespace_apps.open-cluster-management.io_subscriptions',
            kind: 'subscription',
            _gitbranch: 'main',
            namespace: 'namespace-0',
            channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
            _hubClusterResource: 'true',
            cluster: 'local-cluster',
            apiversion: 'v1',
            label:
              'app.kubernetes.io/part-of=application; app=application; apps.open-cluster-management.io/reconcile-rate=medium',
            name: 'subscription-0',
            _gitpath: 'helloworld',
            localPlacement: 'false',
            timeWindow: 'none',
            apigroup: 'apps.open-cluster-management.io',
            kind_plural: 'subscriptions',
            status: 'Propagated',
          },
        ],
        related: [
          {
            kind: 'cluster',
            items: [
              {
                _uid: 'cluster__local-cluster',
                memory: '97683300Ki',
                _rbac: 'local-cluster_internal.open-cluster-management.io_managedclusterinfos',
                label:
                  'cloud=Amazon; cluster.open-cluster-management.io/clusterset=default; clusterID=c5f0b499-3a45-4280-bb80-b1547a948fe3; feature.open-cluster-management.io/addon-application-manager=available; feature.open-cluster-management.io/addon-cert-policy-controller=available; feature.open-cluster-management.io/addon-cluster-proxy=available; feature.open-cluster-management.io/addon-config-policy-controller=available; feature.open-cluster-management.io/addon-governance-policy-framework=unreachable; feature.open-cluster-management.io/addon-hypershift-addon=available; feature.open-cluster-management.io/addon-work-manager=available; installer.name=multiclusterhub; installer.namespace=open-cluster-management; local-cluster=true; name=local-cluster; openshiftVersion=4.10.20; velero.io/exclude-from-backup=true; vendor=OpenShift',
                name: 'local-cluster',
                cpu: 24,
                created: '2022-08-03T17:50:15Z',
                _clusterNamespace: 'local-cluster',
                ManagedClusterImportSucceeded: 'True',
                apigroup: 'internal.open-cluster-management.io',
                ManagedClusterConditionAvailable: 'True',
                ManagedClusterJoined: 'True',
                HubAcceptedManagedCluster: 'True',
                kind: 'cluster',
                kubernetesVersion: 'v1.23.5+3afdacb',
                addon:
                  'application-manager=true; cert-policy-controller=true; policy-controller=true; search-collector=false',
                consoleURL: 'https://console-openshift-console.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
                nodes: 3,
                status: 'OK',
              },
            ],
            __typename: 'SearchRelatedResult',
          },
          {
            kind: 'application',
            items: [
              {
                _uid: 'local-cluster/fc9496f0-7236-4dd5-8cca-2dc003556a41',
                kind_plural: 'applications',
                name: 'application-0',
                _rbac: 'namespace_app.k8s.io_applications',
                _hubClusterResource: 'true',
                apigroup: 'app.k8s.io',
                kind: 'application',
                created: '2022-08-05T18:06:55Z',
                namespace: 'namespace-0',
                cluster: 'local-cluster',
                apiversion: 'v1beta1',
              },
            ],
            __typename: 'SearchRelatedResult',
          },
          {
            kind: 'pod',
            items: [
              {
                _uid: 'local-cluster/d821661c-61c6-4b71-9d78-2c5045b8f038',
                _hubClusterResource: 'true',
                hostIP: '10.0.156.177',
                kind: 'pod',
                label: 'app=helloworld-app; pod-template-hash=7998d94b96',
                status: 'Running',
                restarts: 0,
                startedAt: '2022-08-05T18:06:56Z',
                image: 'quay.io/fxiang1/helloworld:0.0.1',
                apiversion: 'v1',
                _ownerUID: 'local-cluster/a668c477-0f98-4eda-94c2-4f4609d86ed6',
                container: 'helloworld-app-container',
                kind_plural: 'pods',
                cluster: 'local-cluster',
                namespace: 'namespace-0',
                created: '2022-08-05T18:06:56Z',
                _rbac: 'namespace_null_pods',
                name: 'helloworld-app-deploy-7998d94b96-wl8tp',
                podIP: '10.128.0.158',
              },
            ],
            __typename: 'SearchRelatedResult',
          },
          {
            kind: 'deployment',
            items: [
              {
                _uid: 'local-cluster/4fb438fd-8355-4185-8669-cc8856edd222',
                _hostingSubscription: 'namespace/application-subscription-1-local',
                ready: 1,
                available: 1,
                current: 1,
                kind: 'deployment',
                apigroup: 'apps',
                _rbac: 'namespace_apps_deployments',
                namespace: 'namespace-0',
                name: 'helloworld-app-deploy',
                kind_plural: 'deployments',
                apiversion: 'v1',
                created: '2022-08-05T18:06:56Z',
                desired: 1,
                cluster: 'local-cluster',
                label:
                  'app.kubernetes.io/part-of=application; app=helloworld-app; apps.open-cluster-management.io/reconcile-rate=medium',
                _hubClusterResource: 'true',
              },
            ],
            __typename: 'SearchRelatedResult',
          },
          {
            kind: 'replicaset',
            items: [
              {
                _uid: 'local-cluster/a668c477-0f98-4eda-94c2-4f4609d86ed6',
                _hubClusterResource: 'true',
                desired: 1,
                _rbac: 'namespace_apps_replicasets',
                apiversion: 'v1',
                cluster: 'local-cluster',
                current: 1,
                name: 'helloworld-app-deploy-7998d94b96',
                namespace: 'namespace-0',
                label: 'app=helloworld-app; pod-template-hash=7998d94b96',
                kind: 'replicaset',
                _hostingSubscription: 'namespace/application-subscription-1-local',
                created: '2022-08-05T18:06:56Z',
                apigroup: 'apps',
                kind_plural: 'replicasets',
              },
            ],
            __typename: 'SearchRelatedResult',
          },
          {
            kind: 'route',
            items: [
              {
                _uid: 'local-cluster/78a6045a-052e-4668-bed5-2d4bd6c55bc5',
                cluster: 'local-cluster',
                _rbac: 'namespace_route.openshift.io_routes',
                apiversion: 'v1',
                namespace: 'namespace-0',
                apigroup: 'route.openshift.io',
                kind: 'route',
                created: '2022-08-05T18:06:56Z',
                label:
                  'app.kubernetes.io/part-of=application; app=helloworld-app; apps.open-cluster-management.io/reconcile-rate=medium',
                kind_plural: 'routes',
                name: 'helloworld-app-route',
                _hostingSubscription: 'namespace/application-subscription-1-local',
                _hubClusterResource: 'true',
              },
            ],
            __typename: 'SearchRelatedResult',
          },
          {
            kind: 'service',
            items: [
              {
                _uid: 'local-cluster/96ae003d-6be6-45aa-98f3-0f61c3d0bdcd',
                kind_plural: 'services',
                _hubClusterResource: 'true',
                _rbac: 'namespace_null_services',
                type: 'NodePort',
                label:
                  'app.kubernetes.io/part-of=application; app=helloworld-app; apps.open-cluster-management.io/reconcile-rate=medium',
                name: 'helloworld-app-svc',
                port: '3002:32314/TCP',
                _hostingSubscription: 'namespace/application-subscription-1-local',
                namespace: 'namespace-0',
                clusterIP: '172.30.32.158',
                created: '2022-08-05T18:06:56Z',
                kind: 'service',
                apiversion: 'v1',
                cluster: 'local-cluster',
              },
            ],
            __typename: 'SearchRelatedResult',
          },
          {
            kind: 'subscription',
            items: [
              {
                _uid: 'local-cluster/b67c1760-e9d9-4edc-a526-9f36ae55aa10',
                _hostingSubscription: 'namespace/subscription-0',
                name: 'subscription-0-local',
                _gitpath: 'helloworld',
                timeWindow: 'none',
                kind: 'subscription',
                label:
                  'app.kubernetes.io/part-of=application; app=application; apps.open-cluster-management.io/reconcile-rate=medium',
                apigroup: 'apps.open-cluster-management.io',
                apiversion: 'v1',
                cluster: 'local-cluster',
                _hubClusterResource: 'true',
                channel: 'ggithubcom-fxiang1-app-samples-ns/ggithubcom-fxiang1-app-samples',
                localPlacement: 'true',
                kind_plural: 'subscriptions',
                namespace: 'namespace-0',
                status: 'Subscribed',
                _gitbranch: 'main',
                _rbac: 'namespace_apps.open-cluster-management.io_subscriptions',
                created: '2022-08-05T18:06:56Z',
              },
            ],
          },
        ],
      },
    ],
  },
}

jest.mock('react-router-dom-v5-compat', () => {
  const originalModule = jest.requireActual('react-router-dom-v5-compat')
  return {
    __esModule: true,
    ...originalModule,
    useParams: () => {
      return { name: 'application-0', namespace: 'namespace-0' }
    },
    useNavigate: () => jest.fn(),
  }
})

describe('Applications Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockIgnoreApiPaths()
    const nock = nockAggegateRequest('uidata', mockApplication0, uidata, 200, true)
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
        },
        result: {
          data: {
            searchSchema: {
              allProperties: ['cluster', 'kind', 'label', 'name', 'namespace'],
            },
          },
        },
      },
      {
        request: {
          query: GetMessagesDocument,
        },
        result: {
          data: {
            messages: [],
          },
        },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(applicationsState, mockApplications)
          snapshot.set(subscriptionsState, mockSubscriptions)
          snapshot.set(channelsState, mockChannels)
          snapshot.set(placementRulesState, mockPlacementrules)
          snapshot.set(placementDecisionsState, mockPlacementsDecisions)
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
          snapshot.set(namespacesState, mockNamespaces)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <PluginContext.Provider
              value={{
                ...defaultPlugin,
                acmExtensions: acmExtension,
              }}
            >
              <ApplicationDetailsPage />
            </PluginContext.Provider>
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    // wait for page to load
    await waitForText(mockApplication0.metadata.name!, true)
    await waitForNocks([nock])
  })

  test('Render ApplicationDetailsPage', async () => {
    expect(screen.getByText('Overview')).toBeTruthy()
    expect(screen.getByText('Topology')).toBeTruthy()
    await waitForText('Actions', true)
    userEvent.click(screen.getByText('Actions'))
    userEvent.click(
      screen.getByRole('menuitem', {
        name: /delete application/i,
      })
    )
    expect(screen.getByText(/permanently delete application application-0\?/i)).toBeTruthy()
  })
})
