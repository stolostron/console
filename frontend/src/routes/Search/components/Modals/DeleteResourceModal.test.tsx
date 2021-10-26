/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteResourceDocument, UserAccessDocument } from '../../../../console-sdk/console-sdk'
import { wait } from '../../../../lib/test-util'
import { SearchResultItemsDocument } from '../../../../search-sdk/search-sdk'
import { DeleteResourceModal } from './DeleteResourceModal'

describe('DeleteResourceModal', () => {
    it('should call the delete resource mutation with a successful response', async () => {
        const mocks = [
            {
                request: {
                    query: UserAccessDocument,
                    variables: {
                        kind: 'pod',
                        action: 'delete',
                        namespace: 'testNamespace',
                        apiGroup: '',
                        version: 'v1',
                    },
                },
                result: {
                    data: {
                        userAccess: {
                            allowed: true,
                            reason: 'RBAC: allowed by ...',
                            namespace: 'testNamespace',
                            verb: 'delete',
                            group: '',
                            version: 'v1',
                            resource: 'pods',
                        },
                    },
                },
            },
            {
                request: {
                    query: DeleteResourceDocument,
                    variables: {
                        apiVersion: 'v1',
                        name: 'testPod',
                        namespace: 'testNamespace',
                        cluster: 'local-cluster',
                        kind: 'pod',
                    },
                },
                result: {
                    data: {
                        deleteResource: {
                            apiVersion: 'v1',
                            kind: 'pod',
                            metadata: {
                                name: 'testPod',
                                namespace: 'testNamespace',
                            },
                        },
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
                                        values: ['pod'],
                                    },
                                ],
                            },
                        ],
                    },
                    fetchPolicy: 'cache-first',
                },
                result: {
                    data: {
                        searchResult: [
                            {
                                items: [
                                    {
                                        apiversion: 'v1',
                                        cluster: 'local-cluster',
                                        container: 'installer',
                                        created: '2021-01-04T14:53:52Z',
                                        hostIP: '10.0.128.203',
                                        kind: 'pod',
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
            <MockedProvider mocks={mocks} addTypename={false}>
                <DeleteResourceModal
                    open={true}
                    currentQuery={'kind:pod'}
                    resource={{
                        name: 'testPod',
                        namespace: 'testNamespace',
                        kind: 'pod',
                        apiversion: 'v1',
                        cluster: 'local-cluster',
                        _hubClusterResource: 'true',
                    }}
                    close={() => {}}
                />
            </MockedProvider>
        )

        // wait for userAccess query to finish
        await wait()

        // find the button and simulate a click
        const submitButton = screen.getByText('search.modal.delete.resource.action.delete')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)

        await wait() // Test that the component has rendered correctly
        await waitFor(() => expect(screen.queryByTestId('delete-resource-error')).not.toBeInTheDocument())
    })
})
