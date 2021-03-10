/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, act } from '@testing-library/react'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { PolicyReport } from '../../../../resources/policy-report'
import { clickByText, waitForText } from '../../../../lib/test-util'

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
                    resolution: 'policyreport testing\n\nrisk 1 resolution',
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
            await waitForText('policy.report.flyout.description')

            // wait for policy reports to be displayed and click the first report in table
            await waitForText('policyreport testing risk 1')
            await clickByText('policyreport testing risk 1')

            // Wait for the policyreport remediation text to be displayed
            await waitForText('policy.report.flyout.details.tab.remediation')
            await waitForText('policyreport testing')
            await waitForText('risk 1 resolution')

            // Click reason tab and wait for text to be displayed
            await clickByText('policy.report.flyout.details.tab.reason')
            await waitForText('policyreport testing risk 1 reason')

            // Click back button and wait for static text
            await clickByText('policy.report.flyout.back')
            await waitForText('policy.report.flyout.description')
        })
    })
})
