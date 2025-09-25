/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { configMapsState, isGlobalHubState, Settings, settingsState } from '../../atoms'
import { nockIgnoreOperatorCheck, nockPostRequest, nockRequest } from '../../lib/nock-util'
import { wait, waitForNocks } from '../../lib/test-util'
import { ConfigMap } from '../../resources'
import { UserPreference } from '../../resources/userpreference'
import {
  GetMessagesDocument,
  SearchCompleteDocument,
  SearchResultItemsDocument,
  SearchSchemaDocument,
} from './search-sdk/search-sdk'
import SearchPage from './SearchPage'

// Mock the KubevirtProviderAlert component
jest.mock('../../components/KubevirtProviderAlert', () => ({
  KubevirtProviderAlert: ({ variant, component }: { variant: string; component: string }) => (
    <div data-testid="kubevirt-provider-alert" data-variant={variant} data-component={component}>
      KubevirtProviderAlert
    </div>
  ),
}))

const mockUserPreference: UserPreference = {
  apiVersion: 'console.open-cluster-management.io/v1',
  kind: 'UserPreference',
  metadata: {
    name: 'kube-admin',
  },
  spec: {
    savedSearches: [
      {
        description: 'testSavedQueryDesc1',
        id: '1609811592984',
        name: 'testSavedQuery1',
        searchText: 'kind:pod',
      },
    ],
  },
}

const mockSuggestedSearchConfigMap: ConfigMap[] = [
  {
    kind: 'ConfigMap',
    apiVersion: 'v1',
    metadata: {
      name: 'console-search-config',
      namespace: 'default',
      labels: {
        app: 'console',
        chart: 'console-chart-2.11.0',
        component: 'console',
        release: 'console-chart',
      },
    },
    data: {
      suggestedSearches:
        '[{"id":"search.suggested.workloads.name","name":"Workloads","description":"A pre-defined search to help you review your workloads","searchText":"kind:DaemonSet,Deployment,Job,StatefulSet,ReplicaSet"},{"id":"search.suggested.unhealthy.name","name":"Unhealthy pods","description":"Show pods with unhealthy status","searchText":"kind:Pod status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating"},{"id":"search.suggested.createdLastHour.name","name":"Created last hour","description":"Search for resources created within the last hour","searchText":"created:hour"}]',
    },
  },
]

describe('SearchPage', () => {
  it('should render default search page correctly', async () => {
    nockIgnoreOperatorCheck()
    const metricNock = nockPostRequest('/metrics?search', {})
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
          variables: {
            query: {
              filters: [],
              keywords: [],
              limit: 10000,
            },
          },
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
          snapshot.set(configMapsState, mockSuggestedSearchConfigMap)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([metricNock, getUserPreferenceNock])

    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Open new search tab')).toBeTruthy())
    await waitFor(() => expect(screen.getAllByText('Saved searches')[1]).toBeTruthy())

    // Validate that message about disabled cluster doesn't appear.
    await waitFor(() => expect(screen.queryByText('More on disabled clusters')).toBeFalsy())
  })

  it('should render page with errors', async () => {
    nockIgnoreOperatorCheck()
    const metricNock = nockPostRequest('/metrics?search', {})
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
          variables: {
            query: {
              filters: [],
              keywords: [],
              limit: 10000,
            },
          },
        },
        result: {
          errors: [new GraphQLError('Error getting search schema data')],
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
          snapshot.set(configMapsState, mockSuggestedSearchConfigMap)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([metricNock, getUserPreferenceNock])

    // Test the loading state while apollo query finishes - testing that saved searches card label is not present
    expect(screen.getAllByText('Saved searches')[1]).toBeFalsy()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('An unexpected error occurred.')).toBeTruthy())
    // Test that UI shows the error message received from API.
    await waitFor(() => expect(screen.queryByText('Error occurred while contacting the search service.')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error getting search schema data')).toBeTruthy())
    // Validate message when managed clusters are disabled.
    await waitFor(() => expect(screen.queryByText('More on disabled clusters')).toBeFalsy())
  })

  it('should render page with global search federated error', async () => {
    nockIgnoreOperatorCheck()
    const mockSettings: Settings = {
      globalSearchFeatureFlag: 'enabled',
    }
    const metricNock = nockPostRequest('/metrics?search', {})
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
          variables: {
            query: {
              filters: [],
              keywords: [],
              limit: 10000,
            },
          },
        },
        result: {
          errors: ['error sending federated request' as unknown as GraphQLError],
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
          snapshot.set(isGlobalHubState, true)
          snapshot.set(settingsState, mockSettings)
          snapshot.set(configMapsState, mockSuggestedSearchConfigMap)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([metricNock, getUserPreferenceNock])

    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Open new search tab')).toBeTruthy())
    await waitFor(() => expect(screen.getAllByText('Saved searches').length).toBeGreaterThan(0))

    // Validate that message about disabled cluster doesn't appear.
    await waitFor(() => expect(screen.queryByText('More on disabled clusters')).toBeFalsy())
  })

  it('should render search page correctly and add a search', async () => {
    nockIgnoreOperatorCheck()
    const metricNock = nockPostRequest('/metrics?search', {})
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
          variables: {
            query: {
              filters: [],
              keywords: [],
              limit: 10000,
            },
          },
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
          query: SearchCompleteDocument,
          variables: {
            property: 'kind',
            query: {
              filters: [],
              keywords: [],
              limit: 10000,
            },
          },
        },
        result: {
          data: {
            searchComplete: ['configmap', 'pod', 'deployment'],
          },
        },
      },
      {
        request: {
          query: GetMessagesDocument,
        },
        result: {
          data: {
            messages: [
              {
                id: 'S20',
                kind: 'info',
                description: 'Search is disabled on some of your managed clusters.',
                __typename: 'Message',
              },
            ],
          },
        },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(configMapsState, mockSuggestedSearchConfigMap)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([metricNock, getUserPreferenceNock])

    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Open new search tab')).toBeTruthy())
    await waitFor(() => expect(screen.getAllByText('Saved searches')[1]).toBeTruthy())

    const searchbar = screen.getByLabelText('Search input')
    expect(searchbar).toBeTruthy()
    userEvent.click(searchbar)
    userEvent.type(searchbar, 'kind ')
    expect(screen.queryByText('kind:')).toBeTruthy()
    expect(screen.getByLabelText('Search input')).toBeTruthy()
    userEvent.type(searchbar, 'deployment ')

    // check searchbar updated properly
    await waitFor(() => expect(screen.queryByText('kind:deployment')).toBeTruthy())

    // Validate message when managed clusters are disabled. We don't have translation in this context.
    await waitFor(() => expect(screen.queryByText('Search is disabled on some clusters.')).toBeTruthy())
  })
  it('should render SearchPage with predefined query', async () => {
    nockIgnoreOperatorCheck()
    const metricNock = nockPostRequest('/metrics?search', {})
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
          variables: {
            query: {
              filters: [
                { property: 'kind', values: ['Pod'] },
                { property: 'name', values: ['testPod'] },
              ],
              keywords: [],
              limit: 10000,
            },
          },
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
      {
        request: {
          query: SearchResultItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
                  },
                  {
                    property: 'name',
                    values: ['testPod'],
                  },
                ],
                limit: 1000,
              },
            ],
          },
        },
        result: {
          data: {
            searchResult: [
              {
                items: [
                  {
                    apiversion: 'v1',
                    cluster: 'testCluster',
                    container: 'installer',
                    created: '2021-01-04T14:53:52Z',
                    hostIP: '10.0.128.203',
                    kind: 'Pod',
                    name: 'testPod',
                    namespace: 'testNamespace',
                    podIP: '10.129.0.40',
                    restarts: 0,
                    startedAt: '2021-01-04T14:53:52Z',
                    status: 'Completed',
                    _uid: 'testing-search-results-pod',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
          },
        },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(configMapsState, mockSuggestedSearchConfigMap)
        }}
      >
        <MemoryRouter
          initialEntries={[
            { pathname: '/multicloud/search', search: '?filters={"textsearch":"kind%3APod%20name%3AtestPod"}' },
          ]}
        >
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([metricNock, getUserPreferenceNock])

    // Test the loading state while apollo query finishes - testing that saved searches card label is not present
    expect(screen.getAllByText('Saved searches')[1]).toBeFalsy()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Show related resources')).toBeTruthy())
  })

  it('should render KubevirtProviderAlert when searching for VirtualMachine kinds', async () => {
    nockIgnoreOperatorCheck()
    const metricNock = nockPostRequest('/metrics?search', {})
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
          variables: {
            query: { filters: [{ property: 'kind', values: ['VirtualMachine'] }], keywords: [], limit: 10000 },
          },
        },
        result: { data: { searchSchema: { allProperties: ['cluster', 'kind', 'label', 'name', 'namespace'] } } },
      },
      { request: { query: GetMessagesDocument }, result: { data: { messages: [] } } },
      {
        request: {
          query: SearchResultItemsDocument,
          variables: {
            input: [{ keywords: [], filters: [{ property: 'kind', values: ['VirtualMachine'] }], limit: 1000 }],
          },
        },
        result: { data: { searchResult: [{ items: [], __typename: 'SearchResult' }] } },
      },
    ]

    render(
      <RecoilRoot initializeState={(snapshot) => snapshot.set(configMapsState, mockSuggestedSearchConfigMap)}>
        <MemoryRouter
          initialEntries={[
            { pathname: '/multicloud/search', search: '?filters={"textsearch":"kind%3AVirtualMachine"}' },
          ]}
        >
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForNocks([metricNock, getUserPreferenceNock])
    await wait()

    await waitFor(() => expect(screen.getByText('KubevirtProviderAlert')).toBeTruthy())
  })
})
