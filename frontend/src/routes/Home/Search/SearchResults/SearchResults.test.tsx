/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { ApolloError } from '@apollo/client'
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { Settings, settingsState } from '../../../../atoms'
import { wait } from '../../../../lib/test-util'
import {
  SearchResultItemsDocument,
  SearchResultRelatedCountDocument,
  SearchResultRelatedItemsDocument,
} from '../search-sdk/search-sdk'
import SearchResults from './SearchResults'

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

describe('SearchResults Page', () => {
  it('should render page in loading state', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={[]}>
            <SearchResults
              currentQuery={'kind:Pod testCluster'}
              preSelectedRelatedResources={[]}
              error={undefined}
              loading={true}
              data={{}}
            />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )
    // Test the loading state while apollo query finishes
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('should render page with correct data from search WITH keyword', async () => {
    const mocks = [
      {
        request: {
          query: SearchResultItemsDocument,
          variables: {
            input: [
              {
                keywords: ['testCluster'],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
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
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchResults
              currentQuery={'kind:Pod testCluster'}
              preSelectedRelatedResources={[]}
              error={undefined}
              loading={false}
              data={{
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
                  },
                ],
              }}
            />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Pod')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('(1)')).toBeTruthy())
  })

  it('should render page with correct data from search WITHOUT keyword', async () => {
    const mocks = [
      {
        request: {
          query: SearchResultRelatedCountDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
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
                related: [
                  {
                    kind: 'Cluster',
                    count: 1,
                    __typename: 'SearchRelatedResult',
                  },
                  {
                    kind: 'Node',
                    count: 6,
                    __typename: 'SearchRelatedResult',
                  },
                  {
                    kind: 'Secret',
                    count: 203,
                    __typename: 'SearchRelatedResult',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
          },
        },
      },
      {
        request: {
          query: SearchResultRelatedCountDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
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
                related: [
                  {
                    kind: 'Cluster',
                    count: 1,
                    __typename: 'SearchRelatedResult',
                  },
                  {
                    kind: 'Node',
                    count: 6,
                    __typename: 'SearchRelatedResult',
                  },
                  {
                    kind: 'Secret',
                    count: 203,
                    __typename: 'SearchRelatedResult',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
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
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchResults
              currentQuery={'kind:Pod'}
              preSelectedRelatedResources={[]}
              error={undefined}
              loading={false}
              data={{
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
                  },
                ],
              }}
            />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered search result table correctly
    await waitFor(() => expect(screen.queryByText('Pod')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('(1)')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('testPod')).toBeTruthy())

    // Test the related resources section is hidden behind expandable section and click
    screen.queryByText('Show related resources')?.click()
  })

  it('should render page with correct data from search WITHOUT keyword & preselected related resources', async () => {
    const mocks = [
      {
        request: {
          query: SearchResultRelatedCountDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
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
                related: [
                  {
                    kind: 'Node',
                    count: 2,
                    __typename: 'SearchRelatedResult',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
          },
        },
      },
      {
        request: {
          query: SearchResultRelatedItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
                  },
                ],
                relatedKinds: ['Node'],
                limit: 1000,
              },
            ],
          },
        },
        result: {
          data: {
            searchResult: [
              {
                related: [
                  {
                    kind: 'Node',
                    items: [
                      {
                        apiversion: 'v1',
                        architecture: 'amd64',
                        cluster: 'testCluster',
                        cpu: 4,
                        created: '2021-01-04T14:42:49Z',
                        kind: 'Node',
                        name: 'testNode',
                        osImage: 'Red Hat Enterprise Linux CoreOS 45.82.202008290529-0 (Ootpa)',
                        role: 'master',
                        _uid: 'testing-search-related-results-node',
                      },
                      {
                        apiversion: 'v1',
                        architecture: 'amd64',
                        cluster: 'testCluster',
                        cpu: 4,
                        created: '2021-01-04T14:42:49Z',
                        kind: 'Node',
                        name: 'testNode1',
                        osImage: 'Red Hat Enterprise Linux CoreOS 45.82.202008290529-0 (Ootpa)',
                        role: 'master',
                        _uid: 'testing-search-related-results-node',
                      },
                    ],
                    __typename: 'SearchRelatedResult',
                  },
                ],
                __typename: 'SearchResult',
              },
            ],
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
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchResults
              currentQuery={'kind:Pod'}
              preSelectedRelatedResources={['Node']}
              error={undefined}
              loading={false}
              data={{
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
                  },
                ],
              }}
            />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Pod')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('(1)')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Node')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('(2)')).toBeTruthy())
  })

  it('should render page with errors', async () => {
    const mocks = [
      {
        request: {
          query: SearchResultRelatedCountDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
                  },
                ],
                limit: 1000,
              },
            ],
          },
        },
        result: {
          data: {},
          errors: [new GraphQLError('Error getting related count data')],
        },
      },
      {
        request: {
          query: SearchResultRelatedItemsDocument,
          variables: {
            input: [
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
                  },
                ],
                relatedKinds: ['Node'],
                limit: 1000,
              },
            ],
          },
        },
        result: {
          data: {},
          errors: [new GraphQLError('Error getting related items data')],
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
                ],
                limit: 1000,
              },
            ],
          },
        },
        result: {
          data: {},
          errors: [new GraphQLError('Error getting search data')],
        },
      },
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchResults
              currentQuery={'kind:Pod'}
              preSelectedRelatedResources={['Node']}
              error={{ message: 'Error getting search data' } as ApolloError}
              loading={false}
              data={{}}
            />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered errors correctly
    await waitFor(() => expect(screen.queryByText('Error querying search results')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error occurred while contacting the search service.')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Error getting search data')).toBeTruthy())
  })
})
