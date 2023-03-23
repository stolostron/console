/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2022 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphQLError } from 'graphql'
import { createBrowserHistory } from 'history'
import { useState } from 'react'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { Settings, settingsState } from '../../../../atoms'
import { wait } from '../../../../lib/test-util'
import { SearchResultRelatedCountDocument } from '../search-sdk/search-sdk'
import RelatedResults from './RelatedResults'

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

describe('RelatedResults', () => {
  const RelatedTiles = () => {
    const [selectedKinds, setSelectedKinds] = useState<string[]>([])
    return (
      <RelatedResults
        currentQuery={'kind:Pod'}
        selectedRelatedKinds={selectedKinds}
        setSelectedRelatedKinds={setSelectedKinds}
        setDeleteResource={() => {}}
      />
    )
  }

  it('should render query error correctly', async () => {
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
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <RelatedTiles />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )
    // Test the loading state while apollo query finishes
    expect(screen.getAllByTestId('loading-acc-item-1')).toBeTruthy()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered with an error
    await waitFor(() => expect(screen.queryByText('Error getting related count data')).toBeTruthy())
  })

  it('should render related tiles correctly and select a tile', async () => {
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
    ]

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(settingsState, mockSettings)
        }}
      >
        <Router history={createBrowserHistory()}>
          <MockedProvider mocks={mocks}>
            <RelatedTiles />
          </MockedProvider>
        </Router>
      </RecoilRoot>
    )
    // Test the loading state while apollo query finishes
    expect(screen.getAllByTestId('loading-acc-item-1')).toBeTruthy()
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    const secretTile = screen.getByTestId('Secret-2')
    await waitFor(() => expect(secretTile).toBeTruthy())
    expect(secretTile).toHaveAttribute('aria-expanded', 'false')

    // selected the secret related tile
    userEvent.click(secretTile)

    // Check to see if the selection was successful
    await waitFor(() => expect(secretTile).toHaveAttribute('aria-expanded', 'true'))
  })
})
