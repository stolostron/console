/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockRequest } from '../../../lib/nock-util'
import { wait, waitForNocks } from '../../../lib/test-util'
import { UserPreference } from '../../../resources/userpreference'
import {
  GetMessagesDocument,
  SearchCompleteDocument,
  SearchResultItemsDocument,
  SearchSchemaDocument,
} from './search-sdk/search-sdk'
import SearchPage from './SearchPage'

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

describe('SearchPage', () => {
  it('should render default search page correctly', async () => {
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
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
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([getUserPreferenceNock])

    // Test the loading state while apollo query finishes - testing that saved searches card label is not present
    expect(screen.getAllByText('Saved searches')[1]).toBeFalsy()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Open new search tab')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Saved searches')).toBeTruthy())

    // Validate that message about disabled cluster doesn't appear.
    await waitFor(() => expect(screen.queryByText('More on disabled clusters')).toBeFalsy())
  })

  it('should render page with errors', async () => {
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
    const mocks = [
      {
        request: {
          query: SearchSchemaDocument,
        },
        result: {
          errors: [new GraphQLError('Error getting search schema data')],
        },
      },
      {
        request: {
          query: SearchSchemaDocument,
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
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([getUserPreferenceNock])

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

  it('should render search page correctly and add a search', async () => {
    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
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
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([getUserPreferenceNock])

    // Test the loading state while apollo query finishes - testing that saved searches card label is not present
    expect(screen.getAllByText('Saved searches')[1]).toBeFalsy()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Open new search tab')).toBeTruthy())
    await waitFor(() => expect(screen.queryByText('Saved searches')).toBeTruthy())

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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - ts has issue with deleting location as it is not an optional property. Ignoring as it is immediately readded.
    delete window.location
    window.location = {
      href: 'http://testing.com//multicloud/home/search',
      search: '?filters={"textsearch":"kind%3APod%20name%3AtestPod"}',
    } as Location

    const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
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
      <RecoilRoot>
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([getUserPreferenceNock])

    // Test the loading state while apollo query finishes - testing that saved searches card label is not present
    expect(screen.getAllByText('Saved searches')[1]).toBeFalsy()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    await waitFor(() => expect(screen.queryByText('Show related resources')).toBeTruthy())
  })
})
