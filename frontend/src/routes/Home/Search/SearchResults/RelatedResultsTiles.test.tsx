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
import { wait } from '../../../../lib/test-util'
import { SearchResultRelatedCountDocument } from '../search-sdk/search-sdk'
import RelatedResultsTiles from './RelatedResultsTiles'

describe('RelatedResultsTiles', () => {
  const RelatedTiles = () => {
    const [selectedKinds, setSelectedKinds] = useState<string[]>([])
    return (
      <RelatedResultsTiles
        currentQuery={'kind:pod'}
        selectedKinds={selectedKinds}
        setSelectedKinds={setSelectedKinds}
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
                    values: ['pod'],
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
      <Router history={createBrowserHistory()}>
        <MockedProvider mocks={mocks}>
          <RelatedTiles />
        </MockedProvider>
      </Router>
    )
    // Test the loading state while apollo query finishes
    expect(screen.getAllByTestId('acmtile-loading')).toHaveLength(4)
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
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
                    values: ['pod'],
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
                    kind: 'cluster',
                    count: 1,
                    __typename: 'SearchRelatedResult',
                  },
                  {
                    kind: 'node',
                    count: 6,
                    __typename: 'SearchRelatedResult',
                  },
                  {
                    kind: 'secret',
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
      <Router history={createBrowserHistory()}>
        <MockedProvider mocks={mocks}>
          <RelatedTiles />
        </MockedProvider>
      </Router>
    )
    // Test the loading state while apollo query finishes
    expect(screen.getAllByTestId('acmtile-loading')).toHaveLength(4)
    // This wait pauses till apollo query is returning data
    await wait()
    // Test that the component has rendered correctly with data
    const secretTile = screen.getByTestId('related-tile-secret')
    await waitFor(() => expect(secretTile).toBeTruthy())
    expect(secretTile).toHaveAttribute('aria-selected', 'false')

    // selected the secret related tile
    userEvent.click(secretTile)

    // Check to see if the selection was successful
    await waitFor(() => expect(secretTile).toHaveAttribute('aria-selected', 'true'))
  })
})
