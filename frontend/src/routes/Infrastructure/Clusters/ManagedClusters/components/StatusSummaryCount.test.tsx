/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policyreportState } from '../../../../../atoms'
import { Cluster, ClusterStatus } from '../../../../../lib/get-cluster'
import { nockSearch } from '../../../../../lib/nock-util'
import { clickByText, waitForText } from '../../../../../lib/test-util'
import { PolicyReport } from '../../../../../resources/policy-report'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { StatusSummaryCount } from './StatusSummaryCount'

window.open = jest.fn()

const mockCluster: Cluster = {
    name: 'test-cluster',
    displayName: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.ready,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: '1.19',
        isManagedOpenShift: false,
    },
    labels: undefined,
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
    isCurator: false,
    owner: {}
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
    query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n    related {\n      kind\n      count\n      __typename\n    }\n    __typename\n  }\n}\n',
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

const mockPolicyReports: PolicyReport[] = [
    {
        apiVersion: 'wgpolicyk8s.io/v1alpha2',
        kind: 'PolicyReport',
        metadata: {
            name: 'test-cluster',
            namespace: 'test-cluster',
            uid: 'uid.report.risk.1',
        },
        results: [
            {
                category: 'category,category1,category2',
                scored: false,
                properties: {
                    created_at: '2021-03-02T21:26:04Z',
                    total_risk: '1',
                    component: 'rule.id.3',
                },
                message: 'policyreport testing risk 1',
                policy: 'policyreport testing risk 1 policy',
                result: 'policyreport testing risk 1 result',
            },
            {
                category: 'category,category1,category2',
                scored: false,
                properties: {
                    created_at: '2021-04-02T21:26:04Z',
                    total_risk: '3',
                    component: 'rule.id.3',
                },
                message: 'policyreport testing risk 3',
                policy: 'policyreport testing risk 3 policy',
                result: 'policyreport testing risk 3 result',
            },
        ],
    },
]

describe('StatusSummaryCount', () => {
    const Component = () => (
        <RecoilRoot initializeState={(snapshot) => snapshot.set(policyreportState, mockPolicyReports)}>
            <MemoryRouter>
                <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                    <StatusSummaryCount />
                </ClusterContext.Provider>
            </MemoryRouter>
        </RecoilRoot>
    )
    test('renders', async () => {
        const search = nockSearch(mockSearchQuery, mockSearchResponse)
        render(<Component />)
        await act(async () => {
            await waitFor(() => expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0))
            await waitFor(() => expect(search.isDone()).toBeTruthy())
            await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
            await waitFor(() => expect(screen.getByTestId('summary-status')).toBeInTheDocument())

            await clickByText('4')
            expect(window.open).toHaveBeenCalled()

            await clickByText('summary.applications.launch')
            expect(window.open).toHaveBeenCalled()

            await clickByText('1')
            expect(window.open).toHaveBeenCalled()

            await clickByText('summary.violations.launch')
            expect(window.open).toHaveBeenCalled()

            await clickByText('6')

            await waitForText('summary.cluster.issues')
            await waitForText('summary.cluster.issues.description.count')
        })
    })
})
