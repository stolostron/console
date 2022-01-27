/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policySetsState } from '../../../atoms'
import { waitForText } from '../../../lib/test-util'
import { PolicySet, PolicySetApiVersion, PolicySetKind } from '../../../resources'
import PolicySetsPage from './PolicySets'

const policySet0: PolicySet = {
    apiVersion: PolicySetApiVersion,
    kind: PolicySetKind,
    metadata: {
        name: 'policy-set-0',
        namespace: 'policy-set-0-ns',
    },
    spec: {
        description: 'Policies for PCI-2 compliance',
        policies: [
            'policy-testing',
            'policy-role',
            'policy-securitycontextconstraints',
            'policy-testing-1',
            'policy-role-1',
            'policy-securitycontextconstraints-1',
        ],
    },
    status: {
        placement: [
            {
                placement: 'placement1',
                placementBinding: 'binding1',
                placementDecisions: ['placementdecision1'],
            },
        ],
        results: [
            {
                policy: 'policy-testing',
                compliant: 'NonCompliant',
                clusters: [
                    {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                        compliant: 'Compliant',
                    },
                    {
                        clusterName: 'managed1',
                        clusterNamespace: 'managed1',
                        compliant: 'NonCompliant',
                    },
                    {
                        clusterName: 'managed2',
                        clusterNamespace: 'managed2',
                        compliant: 'NonCompliant',
                    },
                ],
            },
            {
                policy: 'policy-role',
                compliant: 'NonCompliant',
                clusters: [
                    {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                        compliant: 'Compliant',
                    },
                    {
                        clusterName: 'managed2',
                        clusterNamespace: 'managed2',
                        compliant: 'NonCompliant',
                    },
                ],
            },
            {
                policy: 'policy-securitycontextconstraints',
                compliant: 'Compliant',
                clusters: [
                    {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                        compliant: 'Compliant',
                    },
                ],
            },
            {
                policy: 'policy-testing-1',
                compliant: 'Compliant',
                clusters: [
                    {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                        compliant: 'Compliant',
                    },
                    {
                        clusterName: 'managed1',
                        clusterNamespace: 'managed1',
                        compliant: 'NonCompliant',
                    },
                    {
                        clusterName: 'managed2',
                        clusterNamespace: 'managed2',
                        compliant: 'NonCompliant',
                    },
                ],
            },
            {
                policy: 'policy-role-1',
                compliant: 'Compliant',
                clusters: [
                    {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                        compliant: 'Compliant',
                    },
                    {
                        clusterName: 'managed2',
                        clusterNamespace: 'managed2',
                        compliant: 'NonCompliant',
                    },
                ],
            },
            {
                policy: 'policy-securitycontextconstraints-1',
                compliant: 'Compliant',
                clusters: [
                    {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                        compliant: 'Compliant',
                    },
                ],
            },
        ],
    },
}
const policySet1: PolicySet = {
    apiVersion: PolicySetApiVersion,
    kind: PolicySetKind,
    metadata: {
        name: 'policy-set-1',
        namespace: 'policy-set-1-ns',
    },
    spec: {
        description: 'Policies for compliance',
        policies: ['policy-1'],
    },
    status: {
        placement: [
            {
                placement: 'placement1',
                placementBinding: 'binding1',
                placementDecisions: ['placementdecision1'],
            },
        ],
        results: [
            {
                policy: 'policy-1',
                compliant: 'Compliant',
                clusters: [
                    {
                        clusterName: 'local-cluster',
                        clusterNamespace: 'local-cluster',
                        compliant: 'Compliant',
                    },
                    {
                        clusterName: 'managed1',
                        clusterNamespace: 'managed1',
                        compliant: 'Compliant',
                    },
                    {
                        clusterName: 'managed2',
                        clusterNamespace: 'managed2',
                        compliant: 'NonCompliant',
                    },
                ],
            },
        ],
    },
}
export const mockEmptyPolicySets: PolicySet[] = []
export const mockPolicySets: PolicySet[] = [policySet0, policySet1]

describe('PolicySets Page', () => {
    test('Should render empty PolicySet page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policySetsState, mockEmptyPolicySets)
                }}
            >
                <MemoryRouter>
                    <PolicySetsPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText('Use the button below to create a policy set.')
    })

    test('Should render PolicySet page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policySetsState, mockPolicySets)
                }}
            >
                <MemoryRouter>
                    <PolicySetsPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText(policySet0.metadata.name!)
        await waitForText(policySet1.metadata.name!)
    })
})
