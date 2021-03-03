/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { nockGet } from '../../../../lib/nock-util'
import { PolicyReport } from '../../../../resources/policy-report'

const testData = [
    {
        data: {
            searchResult: [
                {
                    count: 3,
                    items: [
                        {
                            apigroup: 'wgpolicyk8s.io',
                            apiversion: 'v1alpha1',
                            category: 'category,category1,category2',
                            cluster: 'test-cluster',
                            created: '2021-03-02T21:26:04Z',
                            kind: 'policyreport',
                            message: 'policyreport testing risk 1',
                            name: 'report.risk.1',
                            namespace: 'test-cluster',
                            risk: '1',
                            _hubClusterResource: 'true',
                            _uid: 'policyreport1',
                        },
                        {
                            apigroup: 'wgpolicyk8s.io',
                            apiversion: 'v1alpha1',
                            category: 'category,category1,category2',
                            cluster: 'test-cluster',
                            created: '2021-03-02T21:26:04Z',
                            kind: 'policyreport',
                            message: 'policyreport testing risk 2',
                            name: 'report.risk.2',
                            namespace: 'test-cluster',
                            risk: '2',
                            _hubClusterResource: 'true',
                            _uid: 'policyreport2',
                        },
                        {
                            apigroup: 'wgpolicyk8s.io',
                            apiversion: 'v1alpha1',
                            category: '',
                            cluster: 'test-cluster',
                            created: '2021-03-02T21:26:04Z',
                            kind: 'policyreport',
                            message: 'policyreport testing risk 3',
                            name: 'report.risk.3',
                            namespace: 'test-cluster',
                            risk: '3',
                            _hubClusterResource: 'true',
                            _uid: 'policyreport3',
                        },
                    ],
                },
            ],
        },
    },
]

const getPolicyReport: PolicyReport = {
    kind: 'PolicyReport',
    apiVersion: 'wgpolicyk8s.io/v1alpha1',
    metadata: {
        name: 'report.risk.1',
        namespace: 'test-cluster',
    },
}

const getPolicyReportResponse: PolicyReport = {
    kind: 'PolicyReport',
    apiVersion: 'wgpolicyk8s.io/v1alpha1',
    metadata: {
        name: 'report.risk.1',
        namespace: 'test-cluster',
    },
    results: [
        {
            category: 'category,category1,category2',
            data: {
                created_at: '2021-03-02T21:26:04Z',
                details: 'policyreport testing risk 1 details',
                reason: 'policyreport testing risk 1 reason',
                resolution: 'policyreport testing risk 1 resolution',
                total_risk: '1',
            },
            message: 'policyreport testing risk 1',
            policy: 'policyreport testing risk 1 policy',
            status: 'policyreport testing risk 1 status',
        },
    ],
}

describe('ClusterPolicySidebar', () => {
    const getSecretNock = nockGet(getPolicyReport, getPolicyReportResponse)
    const Component = () => <ClusterPolicySidebar data={testData} loading={false} />
    test('renders', async () => {
        render(<Component />)
        await act(async () => {
            // Check the sidebar has loaded with static text
            await waitFor(() => expect(screen.getByText('policy.report.flyout.description')).toBeInTheDocument())
            // wait for policy reports to be displayed and click the first report in table
            await waitFor(() => expect(screen.getByText('policyreport testing risk 1')).toBeInTheDocument())
            userEvent.click(screen.getByText('policyreport testing risk 1'))
            // wait for get policy report response
            await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())
            // Wait for the policyreport remediation text to be displayed
            await waitFor(() =>
                expect(screen.getByText('policy.report.flyout.details.tab.remediation')).toBeInTheDocument()
            )
            await waitFor(() => expect(screen.getByText('policyreport testing risk 1 resolution')).toBeInTheDocument())
            // Click reason tab and wait for text to be displayed
            userEvent.click(screen.getByText('policy.report.flyout.details.tab.reason'))
            await waitFor(() => expect(screen.getByText('policyreport testing risk 1 reason')).toBeInTheDocument())
            // Click back button and wait for static text
            userEvent.click(screen.getByText('policy.report.flyout.back'))
            await waitFor(() => expect(screen.getByText('policy.report.flyout.description')).toBeInTheDocument())
        })
    })
})
