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
import { wait } from '../../../lib/test-util'
import {
    GetMessagesDocument,
    SavedSearchesDocument,
    SearchCompleteDocument,
    SearchSchemaDocument,
} from './search-sdk/search-sdk'
import SearchPage from './SearchPage'

describe('SearchPage', () => {
    it('should render default search page correctly', async () => {
        const mocks = [
            {
                request: {
                    query: SavedSearchesDocument,
                },
                result: {
                    data: {
                        items: [
                            {
                                description: 'testSavedQueryDesc1',
                                id: '1609811592984',
                                name: 'testSavedQuery1',
                                searchText: 'kind:pod',
                                __typename: 'userSearch',
                            },
                        ],
                    },
                },
            },
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
        const mocks = [
            {
                request: {
                    query: SavedSearchesDocument,
                },
                result: {
                    data: {
                        items: [
                            {
                                description: 'testSavedQueryDesc1',
                                id: '1609811592984',
                                name: 'testSavedQuery1',
                                searchText: 'kind:pod',
                                __typename: 'userSearch',
                            },
                        ],
                    },
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
        // Test the loading state while apollo query finishes - testing that saved searches card label is not present
        expect(screen.getAllByText('Saved searches')[1]).toBeFalsy()
        // This wait pauses till apollo query is returning data
        await wait()
        // Test that the component has rendered correctly with data
        await waitFor(() => expect(screen.queryByText('An unexpected error occurred.')).toBeTruthy())
        // Test that UI shows the error message received from API.
        await waitFor(() => expect(screen.queryByText('Error getting search schema data')).toBeTruthy())
        // Validate message when managed clusters are disabled.
        await waitFor(() => expect(screen.queryByText('More on disabled clusters')).toBeFalsy())
    })

    it('should render search page correctly and add a search', async () => {
        const mocks = [
            {
                request: {
                    query: SavedSearchesDocument,
                },
                result: {
                    data: {
                        items: [
                            {
                                description: 'testSavedQueryDesc1',
                                id: '1609811592984',
                                name: 'testSavedQuery1',
                                searchText: 'kind:pod',
                                __typename: 'userSearch',
                            },
                        ],
                    },
                },
            },

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
                        searchComplete: ['cluster', 'pod', 'deployment'],
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
        // Test the loading state while apollo query finishes - testing that saved searches card label is not present
        expect(screen.getAllByText('Saved searches')[1]).toBeFalsy()
        // This wait pauses till apollo query is returning data
        await wait()
        // Test that the component has rendered correctly with data
        await waitFor(() => expect(screen.queryByText('Open new search tab')).toBeTruthy())
        await waitFor(() => expect(screen.queryByText('Saved searches')).toBeTruthy())

        const searchbar = screen.getByText('Search items')
        expect(searchbar).toBeTruthy()
        userEvent.click(searchbar)
        userEvent.type(searchbar, 'kind ')

        // check if the three values are diplayed
        await waitFor(() => expect(screen.queryByText('cluster')).toBeTruthy())
        await waitFor(() => expect(screen.queryByText('pod')).toBeTruthy())
        await waitFor(() => expect(screen.queryByText('deployment')).toBeTruthy())

        // click on a value
        const suggestionItem = screen.getByText('deployment')
        expect(suggestionItem).toBeTruthy()
        userEvent.click(suggestionItem)

        // check searchbar updated properly
        await waitFor(() => expect(screen.queryByText('kind:deployment')).toBeTruthy())

        // Validate message when managed clusters are disabled. We don't have translation in this context.
        await waitFor(() => expect(screen.queryByText('Search is disabled on some clusters.')).toBeTruthy())
    })
})
