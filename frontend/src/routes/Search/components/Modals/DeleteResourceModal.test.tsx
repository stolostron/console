/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteResourceDocument } from '../../../../console-sdk/console-sdk'
import { nockCreate } from '../../../../lib/nock-util'
import { wait, waitForNocks } from '../../../../lib/test-util'
import { SelfSubjectAccessReview } from '../../../../resources'
import { SearchResultItemsDocument } from '../../../../search-sdk/search-sdk'
import { DeleteResourceModal } from './DeleteResourceModal'

const deleteResourceUpdateSelfSubjectAccessRequest: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            resource: 'pods',
            verb: 'delete',
            group: '',
            namespace: 'testNamespace',
            name: 'testPod',
        },
    },
}

const deleteResourceUpdateSelfSubjectAccessResponse: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            resource: 'pods',
            verb: 'delete',
            group: '',
            namespace: 'testNamespace',
            name: 'testPod',
        },
    },
    status: {
        allowed: true,
    },
}

describe('DeleteResourceModal', () => {
    it('should call the delete resource mutation with a successful response', async () => {
        const deleteResourceUpdateNock = nockCreate(
            deleteResourceUpdateSelfSubjectAccessRequest,
            deleteResourceUpdateSelfSubjectAccessResponse
        )
        const mocks = [
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

        // wait for user access query to finish
        await waitForNocks([deleteResourceUpdateNock])

        // find the button and simulate a click
        const submitButton = screen.getByText('search.modal.delete.resource.action.delete')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)

        await wait() // Test that the component has rendered correctly
        await waitFor(() => expect(screen.queryByTestId('delete-resource-error')).not.toBeInTheDocument())
    })
})
