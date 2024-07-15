/* Copyright Contributors to the Open Cluster Management project */

import { MockedProvider } from '@apollo/client/testing'
import { render, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Settings, settingsState } from '../../../../src/atoms'
import { nockIgnoreApiPaths } from '../../../lib/nock-util'
import { SavedSearch } from '../../../resources'
import { SearchResultCountDocument } from '../Search/search-sdk/search-sdk'
import SavedSearchesCard from './SavedSearchesCard'

jest.mock('../../../resources/userpreference', () => ({
  listResources: jest.fn(() => ({
    promise: Promise.resolve([
      {
        status: {
          conditions: [
            {
              lastTransitionTime: '2024-02-21T19:34:39Z',
              message: 'Check status of deployment: search-api',
              reason: 'NoPodsFound',
              status: 'False',
              type: 'Ready--search-api',
            },
          ],
        },
      },
    ]),
  })),
}))

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

const savedSearches: SavedSearch[] = [
  {
    description: '',
    id: '1706740156345',
    name: 'All pods',
    searchText: 'kind:Pod',
  },
  {
    description: 'Search pods with label:app=search',
    id: '1706740212332',
    name: 'Search pods',
    searchText: 'label:app=search kind:Pod namespace:open-cluster-management',
  },
]

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
                property: 'label',
                values: ['app=search'],
              },
              {
                property: 'kind',
                values: ['Pod'],
              },
              {
                property: 'namespace',
                values: ['open-cluster-management'],
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
            count: 10,
            __typename: 'SearchResult',
          },
          {
            count: 2,
            __typename: 'SearchResult',
          },
        ],
      },
    },
  },
]

const errorMock = [
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
                property: 'label',
                values: ['app=search'],
              },
              {
                property: 'kind',
                values: ['Pod'],
              },
              {
                property: 'namespace',
                values: ['open-cluster-management'],
              },
            ],
            limit: 1000,
          },
        ],
      },
    },
    result: {
      errors: [new GraphQLError('Error getting overview data')],
    },
  },
]

describe('SavedSearchesCard', () => {
  test('Renders valid SavedSearchesCard with no saved searches', async () => {
    const { getByText } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={[]}>
            <SavedSearchesCard isUserPreferenceLoading={false} savedSearches={[]} />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Check header strings
    await waitFor(() => expect(getByText('Personalize this view')).toBeTruthy())
    await waitFor(() =>
      expect(
        getByText('Use search to query your resources. When you save a search query, this view will show your data.')
      ).toBeTruthy()
    )
    await waitFor(() => expect(getByText('Go to search')).toBeTruthy())
  })

  test('Renders correctly with saved search count', async () => {
    const { getByText } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={mocks}>
            <SavedSearchesCard isUserPreferenceLoading={false} savedSearches={savedSearches} />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Check header strings
    await waitFor(() => expect(getByText('Saved searches')).toBeTruthy())
    await waitFor(() => expect(getByText('Manage')).toBeTruthy())

    // check saved search name & desc
    await waitFor(() => expect(getByText('All pods')).toBeTruthy())
    await waitFor(() => expect(getByText('Search pods')).toBeTruthy())
    await waitFor(() => expect(getByText('Search pods with label:app=search')).toBeTruthy())

    // Wait for and verify the saved search count query
    await waitFor(() => expect(getByText('10')).toBeTruthy())
    await waitFor(() => expect(getByText('2')).toBeTruthy())
  })

  test('Renders error correctly when search is disabled', async () => {
    nockIgnoreApiPaths()
    const { getByText } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <MemoryRouter>
          <MockedProvider mocks={errorMock}>
            <SavedSearchesCard isUserPreferenceLoading={false} savedSearches={savedSearches} />
          </MockedProvider>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Check header strings
    await waitFor(() => expect(getByText('Saved searches')).toBeTruthy())
    await waitFor(() => expect(getByText('This view is disabled with the current configuration.')).toBeTruthy())
    await waitFor(() => expect(getByText('Enable the search service to see this view.')).toBeTruthy())
  })
})
