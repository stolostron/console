/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Settings, settingsState } from '../../../atoms'
import { nockSearch } from '../../../lib/nock-util'
import { wait, waitForNocks } from '../../../lib/test-util'
import { SearchResultCountDocument } from '../search-sdk/search-sdk'
import SavedSearchQueries from './SavedSearchQueries'

const mockSettings: Settings = {
  SAVED_SEARCH_LIMIT: '5',
}

describe('SavedSearchQueries Page', () => {
  it('should render page with correct data', async () => {
    const mocks = [
      {
        request: {
          query: SearchResultCountDocument,
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
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['DaemonSet', 'Deployment', 'Job', 'StatefulSet', 'ReplicaSet'],
                  },
                ],
                limit: 1000,
              },
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['Pod'],
                  },
                  {
                    property: 'status',
                    values: [
                      'Pending',
                      'Error',
                      'Failed',
                      'Terminating',
                      'ImagePullBackOff',
                      'CrashLoopBackOff',
                      'RunContainerError',
                      'ContainerCreating',
                    ],
                  },
                ],
                limit: 1000,
              },
              {
                keywords: [],
                filters: [
                  {
                    property: 'created',
                    values: ['hour'],
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
                count: 1,
                __typename: 'SearchResult',
              },
              {
                count: 2,
                __typename: 'SearchResult',
              },
              {
                count: 3,
                __typename: 'SearchResult',
              },
              {
                count: 4,
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
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SavedSearchQueries
              isUserPreferenceLoading={false}
              savedSearches={[
                {
                  description: 'testSavedQueryDesc1',
                  id: '1609811592984',
                  name: 'testSavedQuery1',
                  searchText: 'kind:Pod',
                },
              ]}
              setSelectedSearch={() => {}}
              setUserPreference={() => {}}
              suggestedSearches={[
                {
                  id: 'search.suggested.workloads.name',
                  name: 'Workloads',
                  description: 'A pre-defined search to help you review your workloads',
                  searchText: 'kind:DaemonSet,Deployment,Job,StatefulSet,ReplicaSet',
                },
                {
                  id: 'search.suggested.unhealthy.name',
                  name: 'Unhealthy pods',
                  description: 'Show pods with unhealthy status',
                  searchText:
                    'kind:Pod status:Pending,Error,Failed,Terminating,ImagePullBackOff,CrashLoopBackOff,RunContainerError,ContainerCreating',
                },
                {
                  id: 'search.suggested.createdLastHour.name',
                  name: 'Created last hour',
                  description: 'Search for resources created within the last hour',
                  searchText: 'created:hour',
                },
              ]}
            />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    // Test the loading state while apollo query finishes
    expect(screen.queryByText('Suggested search templates')).not.toBeInTheDocument()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('testSavedQuery1')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('testSavedQueryDesc1')).toBeTruthy())
  })

  it('should export saved search results', async () => {
    const mockSearchQuery = {
      operationName: 'searchResultItems',
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
            limit: -1,
          },
        ],
      },
      query:
        'query searchResultItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}',
    }

    const mockSearchResponse = {
      data: {
        searchResult: [
          {
            items: [
              {
                apiversion: 'v1',
                cluster: 'local-cluster',
                container: 'test-container',
                created: '2024-08-01T21:27:06Z',
                kind: 'Pod',
                kind_plural: 'pods',
                name: 'test-pod',
                namespace: 'test-pod-ns',
                restarts: '1',
                startedAt: '2024-08-01T21:27:06Z',
                status: 'Running',
              },
            ],
            __typename: 'SearchResult',
          },
        ],
      },
    }

    const mockSuggestedSearchQuery = {
      operationName: 'searchResultItems',
      variables: {
        input: [
          {
            keywords: [],
            filters: [
              {
                property: 'kind',
                values: ['DaemonSet', 'Deployment', 'Job', 'StatefulSet', 'ReplicaSet'],
              },
            ],
            limit: -1,
          },
        ],
      },
      query:
        'query searchResultItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}',
    }

    const mockSuggestedSearchResponse = {
      data: {
        searchResult: [
          {
            items: [
              {
                apiversion: 'v1',
                cluster: 'local-cluster',
                container: 'test-container',
                created: '2024-08-01T21:27:06Z',
                kind: 'Deployment',
                kind_plural: 'deployments',
                name: 'test-deployment',
                namespace: 'test-deployment-ns',
                restarts: '1',
                startedAt: '2024-08-01T21:27:06Z',
                status: 'Running',
              },
            ],
            __typename: 'SearchResult',
          },
        ],
      },
    }

    const savedSearch = nockSearch(mockSearchQuery, mockSearchResponse)
    const suggestedSearch = nockSearch(mockSuggestedSearchQuery, mockSuggestedSearchResponse)
    const mocks = [
      {
        request: {
          query: SearchResultCountDocument,
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
                limit: -1,
              },
              {
                keywords: [],
                filters: [
                  {
                    property: 'kind',
                    values: ['DaemonSet', 'Deployment', 'Job', 'StatefulSet', 'ReplicaSet'],
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
                count: 1,
                __typename: 'SearchResult',
              },
              {
                count: 1,
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
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SavedSearchQueries
              isUserPreferenceLoading={false}
              savedSearches={[
                {
                  description: 'testSavedQueryDesc1',
                  id: '1609811592984',
                  name: 'testSavedQuery1',
                  searchText: 'kind:Pod',
                },
              ]}
              setSelectedSearch={() => {}}
              setUserPreference={() => {}}
              suggestedSearches={[
                {
                  id: 'search.suggested.workloads.name',
                  name: 'Workloads',
                  description: 'A pre-defined search to help you review your workloads',
                  searchText: 'kind:DaemonSet,Deployment,Job,StatefulSet,ReplicaSet',
                },
              ]}
            />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )
    // Test the loading state while apollo query finishes
    expect(screen.queryByText('Suggested search templates')).not.toBeInTheDocument()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('testSavedQuery1')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('testSavedQueryDesc1')).toBeTruthy())

    // open action menu for saved search
    const savedActionBtn = screen.getAllByRole('button', {
      name: /actions/i,
    })
    expect(savedActionBtn[0]).toBeTruthy()
    userEvent.click(savedActionBtn[0])

    // click export
    const savedActionItemBtns = screen.getAllByRole('menuitem')
    expect(savedActionItemBtns[2]).toBeTruthy()
    userEvent.click(savedActionItemBtns[2])

    await waitForNocks([savedSearch])
    // hide saved search menu
    userEvent.click(savedActionBtn[0])
    expect(savedActionItemBtns[2]).not.toBeVisible()

    // open action menu for suggested search
    const suggestedActionBtn = screen.getAllByRole('button', {
      name: /actions/i,
    })
    expect(suggestedActionBtn[1]).toBeTruthy()
    userEvent.click(suggestedActionBtn[1])

    // click export
    const suggestedActionItemBtns = screen.getAllByRole('menuitem')
    expect(suggestedActionItemBtns[5]).toBeTruthy()
    userEvent.click(suggestedActionItemBtns[5])

    await waitForNocks([suggestedSearch])
  })
})
