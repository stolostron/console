/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { managedClusterInfosState, managedClustersState, policiesState } from '../../../atoms'
import { nockGet } from '../../../lib/nock-util'
import { wait, waitForNocks } from '../../../lib/test-util'
import {
    ManagedCluster,
    ManagedClusterApiVersion,
    ManagedClusterInfo,
    ManagedClusterKind,
    Policy,
} from '../../../resources'
import { SearchResultCountDocument, SearchResultItemsDocument } from '../Search/search-sdk/search-sdk'
import OverviewPage from './OverviewPage'

const getAddonRequest = {
    apiVersion: 'view.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterView',
    metadata: {
        name: '46de65eb9b4a488e6744a0b264a076cc107fd55e',
        namespace: 'local-cluster',
        labels: {
            viewName: '46de65eb9b4a488e6744a0b264a076cc107fd55e',
        },
    },
    spec: {
        scope: {
            name: 'observability-controller',
            resource: 'clustermanagementaddon.v1alpha1.addon.open-cluster-management.io',
        },
    },
}

const getAddonResponse = {
    apiVersion: 'view.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterView',
    metadata: {
        name: '46de65eb9b4a488e6744a0b264a076cc107fd55e',
        namespace: 'local-cluster',
        labels: {
            viewName: '46de65eb9b4a488e6744a0b264a076cc107fd55e',
        },
    },
    spec: {
        scope: {
            name: 'observability-controller',
            resource: 'clustermanagementaddon.v1alpha1.addon.open-cluster-management.io',
        },
    },
    status: {
        conditions: [
            {
                message: 'Watching resources successfully',
                reason: 'GetResourceProcessing',
                status: 'True',
                type: 'Processing',
            },
        ],
    },
}

const managedClusterInfos: ManagedClusterInfo[] = [
    {
        apiVersion: 'internal.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterInfo',
        metadata: {
            creationTimestamp: '2022-06-27T13:03:37Z',
            labels: {
                openshiftVersion: '4.10.5',
                vendor: 'OpenShift',
                name: 'local-cluster',
                'installer.name': 'multiclusterhub',
                clusterID: '5b56530b-a1cd-407b-9a90-1a35ffa0d184',
                cloud: 'Amazon',
                'local-cluster': 'true',
            },
            name: 'local-cluster',
            namespace: 'local-cluster',
            resourceVersion: '4236111',
            uid: 'e98d2bac-4a21-4a9c-8f52-bcaae1d0fc90',
        },
        spec: {
            loggingCA:
                'LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURKVENDQWcyZ0F3SUJBZ0lJWEpsc0xPUWRWeEF3RFFZSktvWklodmNOQVFFTEJRQXdJREVlTUJ3R0ExVUUKQXhNVmIyTnRMV3RzZFhOMFpYSnNaWFF0Ykc5bloyVnlNQjRYRFRJeU1EWXlOekV6TURFeU9Gb1hEVEl6TURZeQpOekV6TURFeU9Wb3dJREVlTUJ3R0ExVUVBeE1WYjJOdExXdHNkWE4wWlhKc1pYUXRiRzluWjJWeU1JSUJJakFOCkJna3Foa2lHOXcwQkFRRUZBQU9DQVE4QU1JSUJDZ0tDQVFFQXFnc2gzaS9ZWVRvNDdZeHFTelZaRkczQk1Wbk4KdlRITXlidy9UK0p2aFdUd1VrY3Npdk9hWmJrYWppdnkwUGIxKys3c1BPWFZrL0NVYzY3c2daaTQ3WGx2TEJHQwphOEorM2dvQzZUM3gzbUdZOFBkd2JpRExwVlN6RlJteTl6aExWaGVpMkNDdnpqWDgxbUhVaGs3RkVGNDczVFhBCkpMU0pHM3FlbEsvUUt3aStJeWZsb0ZUWUl2TkZkSm9jbjI0RTh6MTRNUzI1d3NlRzVrR1EvZHJ0K21ISUdSK3UKUm5CdTJPYW5ybW9iaUpPcWErZEJidC9nTXVvbTNlcVgrWUdNVmtTSDIrTEVDN2VEMVQwQUpWVWZLWXNYOG1kTApNTWwvaWZORVd2T2t5WHEzVVpjK2FORFlNSDRJTkNvUHdQaTJXSHVoQjZNamRrdEdTMHEwRCtVK2VRSURBUUFCCm8yTXdZVEFPQmdOVkhROEJBZjhFQkFNQ0FxUXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVUKNjVlWk4rVGVqTEtEZU9Sc0M5NjljZXNLa3U0d0h3WURWUjBqQkJnd0ZvQVU2NWVaTitUZWpMS0RlT1JzQzk2OQpjZXNLa3U0d0RRWUpLb1pJaHZjTkFRRUxCUUFEZ2dFQkFIZ1BMTTdVc2NZaWdwUDZud1I0UWFKMnhmTUNHR3QvCjZoREtSSmJjYTlNcUZYSk1KVjd6c3hNeC8zbUJlNkEwQ3lReS9yMWx4RWpJWW9TUTFieUw3MnJFR296MWs4UWoKWUhjRVFuTFFMUmhTWGpWUDdBTTN5MHU5VDBOVWhRclUwa2ROV2orc2lVMk9XdlJvSnd6alIwVHlMcGpJUytxYgovV0lZQWJHZ2dKL3hPdk40YUdZMWJURnlWbjdPbmkweFBQQ3VOR2RFRFlNUHVvbmZTSG5YS2paTnRCNi9ZRndoCm9QWGgyTWgzRTdMYjFIOHFzSG1mYUxMOE50bSt4VCtjVThJU0w3TVlndGFlY2ViM3RmbkRjTTRFU1NEYmJwZTEKWVYxT1NnbEpDcHBvdWZKM0RPYmdPMHR4R1ZLYTdPTGZnaTdnNi95ZVpmUEEwZ1ltMUpoQnVxYz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=',
            masterEndpoint: 'https://api.sno-410-2xlarge-2zrhh.dev07.red-chesterfield.com:6443',
        },
        status: {
            loggingPort: {
                name: 'https',
                port: 443,
                protocol: 'TCP',
            },
            loggingEndpoint: {
                hostname: 'klusterlet-addon-workmgr.open-cluster-management-agent-addon.svc',
                ip: '',
            },
            kubeVendor: 'OpenShift',
            consoleURL: 'https://console-openshift-console.apps.sno-410-2xlarge-2zrhh.dev07.red-chesterfield.com',
            version: 'v1.23.3+e419edf',
            cloudVendor: 'Amazon',
        },
    },
]

const managedClusters: ManagedCluster[] = [
    {
        apiVersion: ManagedClusterApiVersion,
        kind: ManagedClusterKind,
        metadata: {
            labels: {
                cloud: 'Amazon',
                name: 'local-cluster',
                vendor: 'OpenShift',
            },
            name: 'local-cluster',
        },
        spec: {
            hubAcceptsClient: true,
        },
        status: {
            allocatable: {
                cpu: '42',
                memory: '179120384Ki',
            },
            capacity: {
                memory: '192932096Ki',
                cpu: '48',
            },
            clusterClaims: [
                {
                    name: 'id.k8s.io',
                    value: 'local-cluster',
                },
            ],
            conditions: [
                {
                    message: 'Accepted by hub cluster admin',
                    reason: 'HubClusterAdminAccepted',
                    status: 'True',
                    type: 'HubAcceptedManagedCluster',
                },
                {
                    message: 'Managed cluster is available',
                    reason: 'ManagedClusterAvailable',
                    status: 'True',
                    type: 'ManagedClusterConditionAvailable',
                },
            ],
            version: {
                kubernetes: 'v1.20.0+bbbc079',
            },
        },
    },
    {
        apiVersion: ManagedClusterApiVersion,
        kind: ManagedClusterKind,
        metadata: {
            labels: {
                cloud: 'Azure',
                region: 'us-east-1',
                name: 'managed-cluster',
                vendor: 'OpenShift',
            },
            name: 'managed-cluster',
        },
        spec: {
            hubAcceptsClient: true,
        },
        status: {
            allocatable: {
                cpu: '42',
                memory: '179120384Ki',
            },
            capacity: {
                memory: '192932096Ki',
                cpu: '48',
            },
            clusterClaims: [
                {
                    name: 'id.k8s.io',
                    value: 'managed-cluster',
                },
                {
                    name: 'platform.open-cluster-management.io',
                    value: 'AKS',
                },
            ],
            conditions: [
                {
                    message: 'Accepted by hub cluster admin',
                    reason: 'HubClusterAdminAccepted',
                    status: 'True',
                    type: 'HubAcceptedManagedCluster',
                },
                {
                    message: 'Managed cluster is available',
                    reason: 'ManagedClusterAvailable',
                    status: 'True',
                    type: 'ManagedClusterConditionAvailable',
                },
            ],
            version: {
                kubernetes: 'v1.20.0+bbbc079',
            },
        },
    },
]

const mockPolices: Policy[] = [
    {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {
            name: 'policy-compliant',
            creationTimestamp: '2021-10-28T00:31:36Z',
        },
        spec: {
            disabled: false,
            remediationAction: 'enforce',
        },
        status: {
            compliant: 'Compliant',
            placement: [
                {
                    placementBinding: 'binding-policy-pod',
                    placementRule: 'placement-policy-pod',
                },
            ],
            status: [
                {
                    clustername: 'local-cluster',
                    clusternamespace: 'local-cluster',
                    compliant: 'Compliant',
                },
            ],
        },
    },
    {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {
            name: 'policy-noncompliant',
            creationTimestamp: '2021-10-28T00:31:36Z',
        },
        spec: {
            disabled: false,
            remediationAction: 'enforce',
        },
        status: {
            compliant: 'NonCompliant',
            placement: [
                {
                    placementBinding: 'binding-policy-pod',
                    placementRule: 'placement-policy-pod',
                },
            ],
            status: [
                {
                    clustername: 'managed-cluster',
                    clusternamespace: 'managed-cluster',
                    compliant: 'NonCompliant',
                },
            ],
        },
    },
]

it('should render overview page in loading state', async () => {
    const getAddonNock = nockGet(getAddonRequest, getAddonResponse)

    render(
        <RecoilRoot>
            <Router history={createBrowserHistory()}>
                <MockedProvider mocks={[]}>
                    <OverviewPage />
                </MockedProvider>
            </Router>
        </RecoilRoot>
    )

    // Test the loading state while apollo query finishes
    await waitFor(() => expect(screen.getByText('Loading')).toBeInTheDocument())

    // Wait for delete resource requests to finish
    await waitForNocks([getAddonNock])
})

it('should render overview page in error state', async () => {
    const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
    const mocks = [
        {
            request: {
                query: SearchResultCountDocument,
            },
            result: {
                errors: [new GraphQLError('Error getting overview data')],
            },
        },
    ]

    render(
        <RecoilRoot>
            <Router history={createBrowserHistory()}>
                <MockedProvider mocks={mocks}>
                    <OverviewPage />
                </MockedProvider>
            </Router>
        </RecoilRoot>
    )

    // This wait pauses till apollo query is returning data
    await wait()

    // Wait for delete resource requests to finish
    await waitForNocks([getAddonNock])

    // Test that the component has rendered correctly with an error
    await waitFor(() => expect(screen.queryByText('An unexpected error occurred.')).toBeTruthy())
})

it('should render overview page with expected data', async () => {
    const getAddonNock = nockGet(getAddonRequest, getAddonResponse)
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
                                    values: ['node'],
                                },
                            ],
                        },
                        {
                            keywords: [],
                            filters: [
                                {
                                    property: 'kind',
                                    values: ['pod'],
                                },
                            ],
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
                                    values: ['Running', 'Completed'],
                                },
                            ],
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
                                    values: ['Pending', 'ContainerCreating', 'Waiting', 'Terminating'],
                                },
                            ],
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
                                        'Failed',
                                        'CrashLoopBackOff',
                                        'ImagePullBackOff',
                                        'Terminated',
                                        'OOMKilled',
                                        'Unknown',
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
            result: {
                data: {
                    searchResult: [
                        {
                            count: 6,
                            __typename: 'SearchResult',
                        },
                        {
                            count: 335,
                            __typename: 'SearchResult',
                        },
                        {
                            count: 335,
                            __typename: 'SearchResult',
                        },
                        {
                            count: 0,
                            __typename: 'SearchResult',
                        },
                        {
                            count: 0,
                            __typename: 'SearchResult',
                        },
                    ],
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
                                    values: ['policyreport'],
                                },
                                {
                                    property: 'scope',
                                    values: ['local-cluster', 'managed-cluster'],
                                },
                            ],
                        },
                    ],
                },
            },
            result: {
                data: {
                    searchResult: [
                        {
                            items: [
                                {
                                    kind: 'policyreport',
                                    name: 'local-cluster-policyreport',
                                    namespace: 'local-cluster',
                                    numRuleViolations: 1,
                                    scope: 'local-cluster',
                                    critical: 1,
                                    important: 0,
                                    moderate: 0,
                                    low: 0,
                                },
                                {
                                    kind: 'policyreport',
                                    name: 'managed-cluster-policyreport',
                                    namespace: 'managed-cluster',
                                    numRuleViolations: 2,
                                    scope: 'managed-cluster',
                                    critical: 1,
                                    important: 1,
                                    moderate: 0,
                                    low: 0,
                                },
                            ],
                            __typename: 'SearchResult',
                        },
                    ],
                },
            },
        },
    ]

    const { getAllByText, getByText } = render(
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(managedClustersState, managedClusters)
                snapshot.set(managedClusterInfosState, managedClusterInfos)
                snapshot.set(policiesState, mockPolices)
            }}
        >
            <Router history={createBrowserHistory()}>
                <MockedProvider mocks={mocks}>
                    <OverviewPage />
                </MockedProvider>
            </Router>
        </RecoilRoot>
    )

    // Wait for delete resource requests to finish
    await waitForNocks([getAddonNock])

    // This wait pauses till apollo query is returning data
    await wait()

    // Test that the component has rendered correctly with an error
    await waitFor(() => expect(getAllByText('Amazon')).toHaveLength(1))
    await waitFor(() => expect(getAllByText('Microsoft')).toHaveLength(1))

    // Check Cluster compliance chart rendered
    await waitFor(() => expect(getAllByText('Cluster violations')).toHaveLength(2))
    await waitFor(() => expect(getByText('1 Without violations')).toBeTruthy())
    await waitFor(() => expect(getByText('1 With violations')).toBeTruthy())

    // Check PolicyReport chart
    await waitFor(() => expect(getByText('2 Critical')).toBeTruthy())
    await waitFor(() => expect(getByText('1 Important')).toBeTruthy())
})
