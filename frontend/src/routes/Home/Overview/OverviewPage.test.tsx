/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { MockedProvider } from '@apollo/client/testing'
import { render, screen, waitFor } from '@testing-library/react'
import { GraphQLError } from 'graphql'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { managedClustersState, policiesState, policyreportState } from '../../../atoms'
import { nockGet } from '../../../lib/nock-util'
import { wait, waitForNocks } from '../../../lib/test-util'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind, Policy, PolicyReport } from '../../../resources'
import { SearchResultCountDocument } from '../Search/search-sdk/search-sdk'
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

const mockPolicyReports: PolicyReport[] = [
    {
        apiVersion: 'wgpolicyk8s.io/v1alpha2',
        kind: 'PolicyReport',
        metadata: {
            name: 'local-cluster-policyreport',
            namespace: 'local-cluster',
            uid: 'uid.report.risk.1',
        },
        scope: {
            kind: 'cluster',
            name: 'local-cluster',
            namespace: 'local-cluster',
        },
        results: [
            {
                category: 'category,category1,category2',
                scored: false,
                source: 'insights',
                properties: {
                    created_at: '2021-03-02T21:26:04Z',
                    total_risk: '4',
                    component: 'rule.id.0',
                },
                message: 'policyreport testing risk 0',
                policy: 'policyreport testing risk 0 policy',
                result: 'policyreport testing risk 0 result',
            },
            {
                category: 'category,category1,category2',
                scored: false,
                source: 'insights',
                properties: {
                    created_at: '2021-03-02T21:26:04Z',
                    total_risk: '3',
                    component: 'rule.id.1',
                },
                message: 'policyreport testing risk 1',
                policy: 'policyreport testing risk 1 policy',
                result: 'policyreport testing risk 1 result',
            },
        ],
    },
    {
        apiVersion: 'wgpolicyk8s.io/v1alpha2',
        kind: 'PolicyReport',
        metadata: {
            name: 'managed-cluster-policyreport',
            namespace: 'managed-cluster',
            uid: 'uid.report.risk.1',
        },
        scope: {
            kind: 'cluster',
            name: 'managed-cluster',
            namespace: 'managed-cluster',
        },
        results: [
            {
                category: 'category,category1,category2',
                scored: false,
                source: 'insights',
                properties: {
                    created_at: '2021-03-02T21:26:04Z',
                    total_risk: '4',
                    component: 'rule.id.0',
                },
                message: 'policyreport testing risk 0',
                policy: 'policyreport testing risk 0 policy',
                result: 'policyreport testing risk 0 result',
            },
            {
                category: 'category,category1,category2',
                scored: false,
                source: 'grc',
                properties: {
                    created_at: '2021-03-02T21:26:04Z',
                    total_risk: '2',
                    component: 'rule.id.0',
                },
                message: 'policyreport testing risk 2 and grc filtering',
                policy: 'policyreport testing risk 2 and grc filtering - policy',
                result: 'policyreport testing risk 2 and grc filtering - result',
            },
        ],
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
    ]

    const { getAllByText, getByText } = render(
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(managedClustersState, managedClusters)
                snapshot.set(policiesState, mockPolices)
                snapshot.set(policyreportState, mockPolicyReports)
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
    await waitFor(() => expect(getByText('0 Moderate')).toBeTruthy())
    await waitFor(() => expect(getByText('0 Low')).toBeTruthy())
})
