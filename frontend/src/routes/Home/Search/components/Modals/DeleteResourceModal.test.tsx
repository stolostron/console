/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { nockCreate, nockDelete, nockGet, nockSearch } from '../../../../../lib/nock-util'
import { wait, waitForNocks } from '../../../../../lib/test-util'
import { SelfSubjectAccessReview } from '../../../../../resources'
import { DeleteResourceModal } from './DeleteResourceModal'

const deleteResourceSelfSubjectAccessRequest: SelfSubjectAccessReview = {
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

const deleteResourceSelfSubjectAccessResponse: SelfSubjectAccessReview = {
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

const deleteResourceRequest = {
    apiVersion: 'action.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterAction',
    metadata: {
        name: 'ba8c21e9e9628448d5d3bbf50ea9703f4ef16500',
        namespace: 'local-cluster',
    },
    spec: {
        cluster: {
            name: 'local-cluster',
        },
        type: 'Action',
        scope: {
            resourceType: 'pod',
            namespace: 'testNamespace',
        },
        actionType: 'Delete',
        kube: {
            resource: 'pod',
            name: 'testPod',
            namespace: 'testNamespace',
        },
    },
}

const deleteResourceResponse = {
    apiVersion: 'action.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterAction',
    metadata: {
        name: 'ba8c21e9e9628448d5d3bbf50ea9703f4ef16500',
        namespace: 'local-cluster',
    },
    spec: {
        cluster: {
            name: 'local-cluster',
        },
        type: 'Action',
        scope: {
            resourceType: 'pod',
            namespace: 'testNamespace',
        },
        actionType: 'Delete',
        kube: {
            resource: 'pod',
            name: 'testPod',
            namespace: 'testNamespace',
        },
    },
    status: {
        conditions: [
            {
                message: 'Action is done.',
                reason: 'ActionDone',
                status: 'done',
                type: 'Completed',
            },
        ],
    },
}

const getMCAResponse = {
    apiVersion: 'action.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterAction',
    metadata: {
        name: 'ba8c21e9e9628448d5d3bbf50ea9703f4ef16500',
        namespace: 'local-cluster',
    },
    spec: {
        cluster: {
            name: 'local-cluster',
        },
        type: 'Action',
        scope: {
            resourceType: 'pod',
            namespace: 'testNamespace',
        },
        actionType: 'Delete',
        kube: {
            resource: 'pod',
            name: 'testPod',
            namespace: 'testNamespace',
        },
    },
    status: {
        conditions: [
            {
                message: 'Action is done.',
                reason: 'ActionDone',
                status: 'done',
                type: 'Completed',
            },
        ],
    },
}

const mockSearchQuery = {
    operationName: 'searchResultItems',
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
    query: 'query searchResultItems($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    items\n    __typename\n  }\n}',
}

const mockSearchResponse = {
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
}

describe('DeleteResourceModal', () => {
    it('should call the delete resource mutation with a successful response', async () => {
        const deleteResourceSelfSubjectAccessNock = nockCreate(
            deleteResourceSelfSubjectAccessRequest,
            deleteResourceSelfSubjectAccessResponse
        )
        const createMCA = nockCreate(deleteResourceRequest, deleteResourceResponse)
        const deleteMCA = nockDelete(deleteResourceRequest, deleteResourceResponse)
        const getSuccessfulActionNock = nockGet(getMCAResponse)
        const search = nockSearch(mockSearchQuery, mockSearchResponse)

        render(
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
        )

        // wait for user access query to finish
        await waitForNocks([deleteResourceSelfSubjectAccessNock])

        // find the button and simulate a click
        const submitButton = screen.getByText('Delete')
        expect(submitButton).toBeTruthy()
        userEvent.click(submitButton)

        // Wait for MCA to be created
        await waitForNocks([createMCA])

        // Wait for MCA polling to complete
        await waitForNocks([getSuccessfulActionNock])

        // Wait for MCA to be deleted
        await waitForNocks([deleteMCA])

        // update the apollo cache
        await waitFor(() => expect(search.isDone()).toBeTruthy())

        await wait() // Test that the component has rendered correctly
        await waitFor(() => expect(screen.queryByTestId('delete-resource-error')).not.toBeInTheDocument())
    })
})
