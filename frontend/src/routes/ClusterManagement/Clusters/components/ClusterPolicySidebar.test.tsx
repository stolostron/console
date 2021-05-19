/* Copyright Contributors to the Open Cluster Management project */

import { render, act } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { configMapsState } from '../../../../atoms'
import { ClusterPolicySidebar } from './ClusterPolicySidebar'
import { PolicyReport } from '../../../../resources/policy-report'
import { ConfigMap } from '../../../../resources/configmap'
import { clickByText, waitForText } from '../../../../lib/test-util'

const mockPolicyReports: PolicyReport = {
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
                total_risk: '0',
                component: 'rule.id.0',
            },
            message: 'policyreport testing risk 0',
            policy: 'policyreport testing risk 0 policy',
            result: 'policyreport testing risk 0 result',
        },
        {
            category: 'category,category1,category2',
            scored: false,
            properties: {
                created_at: '2021-03-02T21:26:04Z',
                total_risk: '1',
                component: 'rule.id.1',
            },
            message: 'policyreport testing risk 1',
            policy: 'policyreport testing risk 1 policy',
            result: 'policyreport testing risk 1 result',
        },
        {
            category: 'category,category1,category2',
            scored: false,
            properties: {
                created_at: '2021-03-02T21:26:04Z',
                total_risk: '2',
                component: 'rule.id.2',
            },
            message: 'policyreport testing risk 2',
            policy: 'policyreport testing risk 2 policy',
            result: 'policyreport testing risk 2 result',
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
        {
            category: 'category,category1,category2',
            scored: false,
            properties: {
                created_at: '2021-03-02T21:26:04Z',
                total_risk: '4',
                component: 'rule.id.4',
            },
            message: 'policyreport testing risk 4',
            policy: 'policyreport testing risk 4 policy',
            result: 'policyreport testing risk 4 result',
        },
    ],
}

const mockConfigmap: ConfigMap[] = [
    {
        kind: 'ConfigMap',
        apiVersion: 'v1',
        metadata: {
            name: 'insight-content-data',
            namespace: 'open-cluster-management',
        },
        data: {
            'policyreport testing risk 1 policy': '{"reason":"testing-reason","resolution":"testing-resolution"}',
        },
    },
]

describe('ClusterPolicySidebar', () => {
    const Component = () => (
        <RecoilRoot initializeState={(snapshot) => snapshot.set(configMapsState, mockConfigmap)}>
            <ClusterPolicySidebar data={mockPolicyReports} />
        </RecoilRoot>
    )
    test('renders', async () => {
        render(<Component />)
        await act(async () => {
            // Check the sidebar has loaded with static text
            await waitForText('policy.report.flyout.description')

            // wait for policy reports to be displayed and click the first report in table
            await waitForText('policyreport testing risk 1')
            await clickByText('policyreport testing risk 1')

            // wait for drilldown risk subdetail component
            await waitForText('policy.report.low')

            // wait for resolution
            await waitForText('testing-resolution')

            // wait for reason
            await clickByText('policy.report.flyout.details.tab.reason')
            await waitForText('testing-reason')

            // Click back button and wait for static text
            await clickByText('policy.report.flyout.back')
            await waitForText('policy.report.flyout.description')
        })
    })
})
