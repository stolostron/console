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
import { userPreferencesState } from '../../../atoms'
import { nockRequest } from '../../../lib/nock-util'
import { wait, waitForNocks } from '../../../lib/test-util'
import { UserPreference } from '../../../resources/userpreference'
import { GetMessagesDocument, SearchCompleteDocument, SearchSchemaDocument } from './search-sdk/search-sdk'
import SearchPage from './SearchPage'

const mockUserPreferences: UserPreference[] = [
  {
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
  },
]

const getUsernameResponse = {
  body: {
    username: 'kube:admin',
  },
  statusCode: 200,
}

describe('SearchPage', () => {
  it('should render default search page correctly', async () => {
    const getUsernameNock = nockRequest('/username', getUsernameResponse)
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
          snapshot.set(userPreferencesState, mockUserPreferences)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([getUsernameNock])

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
    const getUsernameNock = nockRequest('/username', getUsernameResponse)
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
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(userPreferencesState, mockUserPreferences)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([getUsernameNock])

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
    const getUsernameNock = nockRequest('/username', getUsernameResponse)
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
              limit: 1000,
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
          snapshot.set(userPreferencesState, mockUserPreferences)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <SearchPage />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )

    // Wait for username resource requests to finish
    await waitForNocks([getUsernameNock])

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
})
