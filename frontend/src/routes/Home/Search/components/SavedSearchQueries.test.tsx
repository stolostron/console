/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { wait } from '../../../../lib/test-util'
import { SearchResultCountDocument } from '../search-sdk/search-sdk'
import SavedSearchQueries from './SavedSearchQueries'

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
                                        values: ['pod'],
                                    },
                                ],
                                limit: 1000,
                            },
                            {
                                keywords: [],
                                filters: [
                                    {
                                        property: 'kind',
                                        values: ['daemonset', 'deployment', 'job', 'statefulset', 'replicaset'],
                                    },
                                ],
                                limit: 1000,
                            },
                            {
                                keywords: [],
                                filters: [
                                    {
                                        property: 'kind',
                                        values: ['pod'],
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
            <Router history={createBrowserHistory()}>
                <MockedProvider mocks={mocks}>
                    <SavedSearchQueries
                        savedSearches={[
                            {
                                description: 'testSavedQueryDesc1',
                                id: '1609811592984',
                                name: 'testSavedQuery1',
                                searchText: 'kind:pod',
                            },
                        ]}
                        setSelectedSearch={() => {}}
                    />
                </MockedProvider>
            </Router>
        )
        // Test the loading state while apollo query finishes
        expect(screen.queryByText('Suggested search templates')).not.toBeInTheDocument()
        // This wait pauses till apollo query is returning data
        await wait()
        // Test that the component has rendered correctly with data
        await waitFor(() => expect(screen.queryByText('testSavedQuery1')).toBeTruthy())
        await waitFor(() => expect(screen.queryByText('testSavedQueryDesc1')).toBeTruthy())
        await waitFor(() => expect(screen.queryByText('Show all (1)')).toBeTruthy())
    })
})
