// Copyright (c) 2023 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import i18next from 'i18next'
import { NavigateFunction } from 'react-router-dom-v5-compat'
import { ClusterStatus } from '../../../resources'
import { getSearchDefinitions } from '../searchDefinitions'
import { generateSearchResultExport, GetRowActions } from './utils'

const mockHistoryPush = jest.fn()
const navigate: NavigateFunction = jest.fn()
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}))

const t = i18next.t.bind(i18next)

const allClusters = [
  {
    name: 'local-cluster',
    namespace: 'local-cluster',
    consoleURL: 'https://local-cluster.com',
    uid: '',
    status: ClusterStatus.ready,
    hasAutomationTemplate: false,
    hive: {
      isHibernatable: false,
    },
    isHive: false,
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isRegionalHubCluster: true,
    owner: {},
    isSNOCluster: false,
    isHypershift: false,
  },
  {
    name: 'leaf-hub',
    namespace: 'leaf-hub',
    consoleURL: 'https://leaf-hub.com',
    uid: '',
    status: ClusterStatus.ready,
    hasAutomationTemplate: false,
    hive: {
      isHibernatable: false,
    },
    isHive: false,
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isRegionalHubCluster: true,
    owner: {},
    isSNOCluster: false,
    isHypershift: false,
  },
]

test('Correctly return row Actions', () => {
  const res = GetRowActions(
    'Pod',
    'kind:Pod',
    false,
    () => {},
    () => {},
    allClusters,
    navigate,
    t
  )
  res[0].click({ kind: 'Pod' }) // edit resource
  res[1].click({ kind: 'Pod' }) // view related resources
  res[2].click({ kind: 'Pod' }) // delete resource
  expect(res).toMatchSnapshot()
})

test('Correctly return empty row Actions for restricted resource', () => {
  const res = GetRowActions(
    'Cluster',
    'kind:Cluster',
    false,
    () => {},
    () => {},
    allClusters,
    navigate,
    t
  )
  expect(res).toMatchSnapshot()
})

test('Correctly return empty row Actions for Application', () => {
  const res = GetRowActions(
    'Application',
    'kind:Application',
    false,
    () => {},
    () => {},
    allClusters,
    navigate,
    t
  )
  res[0].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'local-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
  }) // edit app
  res[1].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'local-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
  }) // view app topology
  expect(res).toMatchSnapshot()
})

test('Correctly return row Actions for Application in global search', () => {
  const res = GetRowActions(
    'Application',
    'kind:Application',
    false,
    () => {},
    () => {},
    allClusters,
    navigate,
    t
  )
  res[0].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'leaf-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
    managedHub: 'global-hub',
  }) // edit app
  res[1].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'leaf-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
    managedHub: 'global-hub',
  }) // view app topology
  res[2].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'leaf-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
    managedHub: 'global-hub',
  }) // edit app
  res[3].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'leaf-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
    managedHub: 'global-hub',
  }) // view related app resources
  res[4].click({
    apigroup: 'app.k8s.io',
    kind: 'Application',
    cluster: 'leaf-cluster',
    name: 'testApp',
    namespace: 'testAppNs',
    managedHub: 'global-hub',
  }) // delete app
  expect(res).toMatchSnapshot()
})

test('generateSearchResultExport - Correctly generates and triggers csv download for single resource kind', () => {
  const toastContextMock: any = {
    addAlert: jest.fn(),
  }
  const t = (key: string) => key
  window.URL.createObjectURL = jest.fn()

  const searchResultDataMock = {
    searchResult: [
      {
        items: [
          {
            apigroup: 'operators.coreos.com',
            apiversion: 'v1alpha1',
            channel: 'release-2.11',
            cluster: 'local-cluster',
            created: '2024-04-15T14:20:26Z',
            installplan: 'advanced-cluster-management.v2.11.0',
            kind: 'Subscription',
            kind_plural: 'subscriptions',
            label: 'operators.coreos.com/advanced-cluster-management.open-cluster-management=',
            name: 'acm-operator-subscription',
            namespace: 'open-cluster-management',
            package: 'advanced-cluster-management',
            phase: 'AtLatestKnown',
            source: 'acm-custom-registry',
          },
        ],
        __typename: 'SearchResult',
      },
    ],
  }

  const searchDefinitions = getSearchDefinitions((key) => key)
  generateSearchResultExport('test-search-export', searchResultDataMock, searchDefinitions, toastContextMock, t)

  expect(toastContextMock.addAlert).toHaveBeenCalledWith({
    title: 'Generating data. Download may take a moment to start.',
    type: 'info',
    autoClose: true,
  })
  expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1)
  expect(toastContextMock.addAlert).toHaveBeenCalledWith({
    title: 'Export successful',
    type: 'success',
    autoClose: true,
  })
})

test('generateSearchResultExport - Correctly generates and triggers csv download for multi resource kind', () => {
  const toastContextMock: any = {
    addAlert: jest.fn(),
  }
  const t = (key: string) => key
  window.URL.createObjectURL = jest.fn()

  const searchResultDataMock = {
    searchResult: [
      {
        items: [
          {
            apigroup: 'operators.coreos.com',
            apiversion: 'v1alpha1',
            channel: 'release-2.11',
            cluster: 'local-cluster',
            created: '2024-04-15T14:20:26Z',
            installplan: 'advanced-cluster-management.v2.11.0',
            kind: 'Subscription',
            kind_plural: 'subscriptions',
            label: 'operators.coreos.com/advanced-cluster-management.open-cluster-management=',
            name: 'acm-operator-subscription',
            namespace: 'open-cluster-management',
            package: 'advanced-cluster-management',
            phase: 'AtLatestKnown',
            source: 'acm-custom-registry',
          },
          {
            _hubClusterResource: 'true',
            _ownerUID: 'local-cluster/1234-abcd',
            _uid: 'local-cluster/1234-abcd',
            apiversion: 'v1',
            cluster: 'local-cluster',
            container: 'search-api',
            created: '2024-04-15T14:23:59Z',
            hostIP: '10.0.3.162',
            image: 'quay.io/image',
            kind: 'Pod',
            kind_plural: 'pods',
            label: 'app=search; component=search-v2-operator; name=search-api; pod-template-hash=69775dc595',
            name: 'search-api-69775dc595-lhrk9',
            namespace: 'open-cluster-management',
            podIP: '10.130.0.114',
            restarts: '0',
            startedAt: '2024-04-15T14:23:59Z',
            status: 'Running',
          },
          {
            _hubClusterResource: 'true',
            _ownerUID: 'local-cluster/1234-abcd',
            _uid: 'local-cluster/1234-abcd',
            apiversion: 'v1',
            cluster: 'local-cluster',
            container: 'search-collector',
            created: '2024-04-15T14:23:59Z',
            hostIP: '10.0.68.86',
            image: 'quay.io/image',
            kind: 'Pod',
            kind_plural: 'pods',
            name: 'search-collector-764d748c4f-pbgrb',
            namespace: 'open-cluster-management',
            podIP: '10.129.0.117',
            restarts: '0',
            startedAt: '2024-04-15T14:23:59Z',
            status: 'Running',
          },
        ],
        __typename: 'SearchResult',
      },
    ],
  }

  const searchDefinitions = getSearchDefinitions((key) => key)
  generateSearchResultExport('test-search-export', searchResultDataMock, searchDefinitions, toastContextMock, t)

  expect(toastContextMock.addAlert).toHaveBeenCalledWith({
    title: 'Generating data. Download may take a moment to start.',
    type: 'info',
    autoClose: true,
  })
  expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1)
  expect(toastContextMock.addAlert).toHaveBeenCalledWith({
    title: 'Export successful',
    type: 'success',
    autoClose: true,
  })
})
