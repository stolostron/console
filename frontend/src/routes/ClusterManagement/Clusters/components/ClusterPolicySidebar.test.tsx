/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { PolicyReport } from '../../../../resources/policy-report'

const testData: PolicyReport[] = [
    {
        apiVersion: 'wgpolicyk8s.io/v1alpha1',
        kind: 'PolicyReport',
        metadata: {
            name: 'policyreport testing risk 1 policy',
            namespace: 'test-cluster',
            uid: 'uid.report.risk.1',
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
    },
    {
        apiVersion: 'wgpolicyk8s.io/v1alpha1',
        kind: 'PolicyReport',
        metadata: {
            name: 'policyreport testing risk 2 policy',
            namespace: 'test-cluster',
            uid: 'uid.report.risk.2',
        },
        results: [
            {
                category: 'category,category1,category2',
                data: {
                    created_at: '2021-03-02T21:26:04Z',
                    details: 'policyreport testing risk 2 details',
                    reason: 'policyreport testing risk 2 reason',
                    resolution: 'policyreport testing risk 2 resolution',
                    total_risk: '2',
                },
                message: 'policyreport testing risk 2',
                policy: 'policyreport testing risk 2 policy',
                status: 'policyreport testing risk 2 status',
            },
        ],
    },
]

describe('ClusterPolicySidebar', () => {
    const Component = () => <ClusterPolicySidebar data={testData} />
    test('renders', async () => {
        render(<Component />)
        await act(async () => {
            // Check the sidebar has loaded with static text
            await waitFor(() => expect(screen.getByText('policy.report.flyout.description')).toBeInTheDocument())
            // wait for policy reports to be displayed and click the first report in table
            await waitFor(() => expect(screen.getByText('policyreport testing risk 1')).toBeInTheDocument())
            userEvent.click(screen.getByText('policyreport testing risk 1'))
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
