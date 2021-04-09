/* Copyright Contributors to the Open Cluster Management project */

import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusSummaryCount } from './StatusSummaryCount'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { nockSearch, nockNamespacedList } from '../../../../lib/nock-util'

window.open = jest.fn()

const mockCluster: Cluster = {
    name: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.ready,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: '1.19',
    },
    labels: undefined,
    nodes: {
        nodeList: [
            {
                capacity: { cpu: '4', memory: '16416940Ki' },
                conditions: [{ status: 'True', type: 'Ready' }],
                labels: {
                    'beta.kubernetes.io/instance-type': 'm4.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm4.xlarge',
                },
                name: 'ip-10-0-137-106.ec2.internal',
            },
            {
                capacity: { cpu: '8', memory: '32932196Ki' },
                conditions: [{ status: 'True', type: 'Ready' }],
                labels: {
                    'beta.kubernetes.io/instance-type': 'm4.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 'm4.2xlarge',
                },
                name: 'ip-10-0-138-153.ec2.internal',
            },
            {
                capacity: { cpu: '8', memory: '32931992Ki' },
                conditions: [{ status: 'True', type: 'Ready' }],
                labels: {
                    'beta.kubernetes.io/instance-type': 'm4.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 'm4.2xlarge',
                },
                name: 'ip-10-0-153-194.ec2.internal',
            },
            {
                capacity: { cpu: '4', memory: '16416932Ki' },
                conditions: [{ status: 'True', type: 'Ready' }],
                labels: {
                    'beta.kubernetes.io/instance-type': 'm4.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm4.xlarge',
                },
                name: 'ip-10-0-158-2.ec2.internal',
            },
            {
                capacity: { cpu: '8', memory: '32931984Ki' },
                conditions: [{ status: 'True', type: 'Ready' }],
                labels: {
                    'beta.kubernetes.io/instance-type': 'm4.2xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 'm4.2xlarge',
                },
                name: 'ip-10-0-160-159.ec2.internal',
            },
            {
                capacity: { cpu: '4', memory: '16416932Ki' },
                conditions: [{ status: 'True', type: 'Ready' }],
                labels: {
                    'beta.kubernetes.io/instance-type': 'm4.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm4.xlarge',
                },
                name: 'ip-10-0-170-150.ec2.internal',
            },
        ],
        active: 6,
        inactive: 0,
    },
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            kubeconfig: '',
            kubeadmin: '',
            installConfig: '',
        },
    },
    isHive: false,
    isManaged: true,
}

const mockSearchQuery = {
    operationName: 'searchResult',
    variables: {
        input: [
            {
                filters: [
                    { property: 'kind', values: ['subscription'] },
                    { property: 'cluster', values: ['test-cluster'] },
                ],
                relatedKinds: ['application'],
            },
            {
                filters: [
                    { property: 'compliant', values: ['!Compliant'] },
                    { property: 'kind', values: ['policy'] },
                    { property: 'namespace', values: ['test-cluster'] },
                    { property: 'cluster', values: 'local-cluster' },
                ],
            },
        ],
    },
    query:
        'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n    related {\n      kind\n      count\n      __typename\n    }\n    __typename\n  }\n}\n',
}

const mockSearchResponse = {
    data: {
        searchResult: [
            { count: 14, related: [{ kind: 'application', count: 4 }], __typename: 'SearchResult' },
            {
                count: 1,
                related: [
                    { kind: 'cluster', count: 1, __typename: 'SearchRelatedResult' },
                    { kind: 'configurationpolicy', count: 1, __typename: 'SearchRelatedResult' },
                    { kind: 'policy', count: 1, __typename: 'SearchRelatedResult' },
                ],
                __typename: 'SearchResult',
            },
        ],
    },
}

const mockPolicyReportList = {
    kind: 'PolicyReportList',
    apiVersion: 'v1',
    metadata: {},
    items: [
        {
            apiVersion: 'wgpolicyk8s.io/v1alpha2',
            kind: 'PolicyReport',
            metadata: {
                creationTimestamp: '2021-03-06T18:38:14Z',
                name: 'policyreport testing risk 1 policy',
                namespace: 'test-cluster',
                uid: 'uid.report.risk.1',
            },
            results: [
                {
                    category: 'category,category1,category2',
                    properties: {
                        created_at: '2021-03-02T21:26:04Z',
                        details: 'policyreport testing risk 1 details',
                        reason: 'policyreport testing risk 1 reason',
                        resolution: 'policyreport testing risk 1 resolution',
                        total_risk: '1',
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
                creationTimestamp: '2021-03-06T18:38:14Z',
                name: 'policyreport testing risk 2 policy',
                namespace: 'test-cluster',
                uid: 'uid.report.risk.2',
            },
            results: [
                {
                    category: 'category,category1,category2',
                    properties: {
                        created_at: '2021-03-02T21:26:04Z',
                        details: 'policyreport testing risk 2 details',
                        reason: 'policyreport testing risk 2 reason',
                        resolution: 'policyreport testing risk 2 resolution',
                        total_risk: '2',
                    },
                    message: 'policyreport testing risk 2',
                    policy: 'policyreport testing risk 2 policy',
                    result: 'policyreport testing risk 2 result',
                },
            ],
        },
    ],
}

describe('StatusSummaryCount', () => {
    const Component = () => (
        <MemoryRouter>
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <StatusSummaryCount />
            </ClusterContext.Provider>
        </MemoryRouter>
    )
    test('renders', async () => {
        const search = nockSearch(mockSearchQuery, mockSearchResponse)
        const policyReportNock = nockNamespacedList(
            {
                apiVersion: 'wgpolicyk8s.io/v1alpha2',
                kind: 'PolicyReport',
                metadata: { namespace: 'test-cluster' },
            },
            mockPolicyReportList
        )
        render(<Component />)
        await act(async () => {
            await waitFor(() => expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0))
            await waitFor(() => expect(search.isDone()).toBeTruthy())
            await waitFor(() => expect(policyReportNock.isDone()).toBeTruthy())
            await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
            await waitFor(() => expect(screen.getByTestId('summary-status')).toBeInTheDocument())

            userEvent.click(screen.getByText(4))
            expect(window.open).toHaveBeenCalled()

            userEvent.click(screen.getByText('summary.applications.launch'))
            expect(window.open).toHaveBeenCalled()

            userEvent.click(screen.getByText(1))
            expect(window.open).toHaveBeenCalled()

            userEvent.click(screen.getByText('summary.violations.launch'))
            expect(window.open).toHaveBeenCalled()

            userEvent.click(screen.getByText(6))
            await new Promise((resolve) => setTimeout(resolve, 1500))

            waitFor(() => expect(screen.getByText('summary.cluster.issues')).toBeInTheDocument())
            expect(screen.getByText('summary.cluster.issues.description.count')).toBeInTheDocument()
        })
    })
})
