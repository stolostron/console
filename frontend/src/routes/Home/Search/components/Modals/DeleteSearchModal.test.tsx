/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MockedProvider } from '@apollo/client/testing'
import { GraphQLError } from 'graphql'
import { wait } from '../../../../../lib/test-util'
import { DeleteSearchModal } from './DeleteSearchModal'
import { DeleteSearchDocument, SavedSearchesDocument } from '../../search-sdk/search-sdk'

describe('DeleteSearchModal', () => {
    it('should call the delete mutation with a successful response', async () => {
        const mocks = [
            {
                request: {
                    query: DeleteSearchDocument,
                    variables: {
                        resource: {
                            name: 'test-saved-search',
                        },
                    },
                },
                result: {
                    data: {
                        resource: {
                            name: 'test-saved-search',
                        },
                    },
                },
            },
            {
                request: {
                    query: SavedSearchesDocument,
                },
                result: {
                    data: {
                        items: [
                            {
                                id: '1609811592984',
                                name: 'test',
                                description: 'test',
                                searchText: 'kind:pod',
                                __typename: 'userSearch',
                            },
                            {
                                id: '1609885947014',
                                name: 'test2',
                                description: 'test2',
                                searchText: 'kind:cluster',
                                __typename: 'userSearch',
                            },
                        ],
                    },
                },
            },
        ]
        render(
            <MockedProvider mocks={mocks} addTypename={false}>
                <DeleteSearchModal deleteSearch={{ name: 'test-saved-search' }} onClose={() => {}} />
            </MockedProvider>
        )

        // find the button and simulate a click
        const submitButton = screen.getByText('Delete')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)

        await wait() // Test that the component has rendered correctly with an error
        await waitFor(() => expect(screen.queryByTestId('delete-saved-search-error')).not.toBeInTheDocument())
    })

    it('should call the delete mutation with errors', async () => {
        const mocks = [
            {
                request: {
                    query: DeleteSearchDocument,
                    variables: {
                        resource: {
                            name: 'test-saved-search',
                        },
                    },
                },
                result: {
                    errors: [new GraphQLError('error deleting saved search')],
                    loading: false,
                },
            },
            {
                request: {
                    query: SavedSearchesDocument,
                },
                result: {
                    data: {
                        items: [
                            {
                                id: '1609811592984',
                                name: 'test',
                                description: 'test',
                                searchText: 'kind:pod',
                                __typename: 'userSearch',
                            },
                            {
                                id: '1609885947014',
                                name: 'test2',
                                description: 'test2',
                                searchText: 'kind:cluster',
                                __typename: 'userSearch',
                            },
                        ],
                    },
                },
            },
        ]
        render(
            <MockedProvider
                mocks={mocks}
                addTypename={false}
                defaultOptions={{
                    mutate: {
                        errorPolicy: 'all',
                    },
                }}
            >
                <DeleteSearchModal deleteSearch={{ name: 'test-saved-search' }} onClose={() => {}} />
            </MockedProvider>
        )

        // find the button and simulate a click
        const submitButton = screen.getByText('Delete')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)

        // This wait pauses till apollo query is returning data
        await wait()
        await waitFor(() => expect(screen.queryByText('error deleting saved search')).toBeInTheDocument())
    })
})
