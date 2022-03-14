/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState, policySetsState } from '../../../atoms'
import { waitForText } from '../../../lib/test-util'
import { Policy, PolicySet } from '../../../resources'
import PoliciesPage from './Policies'

const rootPolicy: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'policy-set-with-1-placement-policy-1',
        namespace: 'test',
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'ConfigurationPolicy',
                    metadata: { name: 'policy-set-with-1-placement-policy-1' },
                    spec: {
                        namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
                        remediationAction: 'inform',
                        severity: 'low',
                    },
                },
            },
        ],
        remediationAction: 'inform',
    },
    status: {
        compliant: 'Compliant',
        placement: [
            {
                placement: 'policy-set-with-1-placement',
                placementBinding: 'policy-set-with-1-placement',
                policySet: 'policy-set-with-1-placement',
            },
        ],
        status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'Compliant' }],
    },
}

const policy0: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'test.policy-set-with-1-placement-policy-1',
        namespace: 'local-cluster',
        labels: {
            'policy.open-cluster-management.io/cluster-name': 'local-cluster',
            'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
            'policy.open-cluster-management.io/root-policy': 'test.policy-set-with-1-placement-policy-1',
        },
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'ConfigurationPolicy',
                    metadata: { name: 'policy-set-with-1-placement-policy-1' },
                    spec: {
                        namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
                        remediationAction: 'inform',
                        severity: 'low',
                    },
                },
            },
        ],
        remediationAction: 'inform',
    },
    status: {
        compliant: 'Compliant',
        details: [
            {
                compliant: 'Compliant',
                history: [
                    {
                        eventName: 'test.policy-set-with-1-placement-policy-1.16d459c516462fbf',
                        lastTimestamp: '2022-02-16T19:07:46Z',
                        message:
                            'Compliant; notification - namespaces [test] found as specified, therefore this Object template is compliant',
                    },
                ],
                templateMeta: { creationTimestamp: null, name: 'policy-set-with-1-placement-policy-1' },
            },
        ],
    },
}

const policySet0: PolicySet = {
    apiVersion: 'policy.open-cluster-management.io/v1beta1',
    kind: 'PolicySet',
    metadata: {
        name: 'policy-set-with-1-placement',
        namespace: 'test',
    },
    spec: {
        description: 'Policy set with a single Placement and PlacementBinding.',
        policies: ['policy-set-with-1-placement-policy-1', 'policy-set-with-1-placement-policy-2'],
    },
    status: {
        compliant: 'Compliant',
        placement: [{ placement: 'policy-set-with-1-placement', placementBinding: 'policy-set-with-1-placement' }],
    },
}

export const mockEmptyPolicy: Policy[] = []
export const mockPolicy: Policy[] = [rootPolicy, policy0]
export const mockPolicySet: PolicySet[] = [policySet0]

describe('Policies Page', () => {
    test('Should render empty Policies page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockEmptyPolicy)
                }}
            >
                <MemoryRouter>
                    <PoliciesPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText('Use the following button to create a policy.')
    })

    test('Should render Policies page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicy)
                }}
            >
                <MemoryRouter>
                    <PoliciesPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText(rootPolicy.metadata.name!)
    })

    test('Should have correct links to PolicySet & Policy detail results pages', async () => {
        const { container } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicy)
                    snapshot.set(policySetsState, mockPolicySet)
                }}
            >
                <MemoryRouter>
                    <PoliciesPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        // Wait for page load
        await waitForText(rootPolicy.metadata.name!)

        // Verify the PolicySet column has loaded correctly and has the correct link to PolicySets page
        await waitForText(policySet0.metadata.name!)
        await waitFor(() =>
            // need to use index [1] because the name column is also an "a" element
            expect(container.querySelectorAll('a')[1]).toHaveAttribute(
                'href',
                '/multicloud/governance/policy-sets?names%3D%5B%22policy-set-with-1-placement%22%5D%26namespaces%3D%5B%22test%22%5D'
            )
        )

        // Verify the Cluster violation column has the correct link to policy details page
        await waitFor(() =>
            // need to use index [1] because the name column is also an "a" element
            expect(container.querySelectorAll('a')[2]).toHaveAttribute(
                'href',
                '/multicloud/governance/policies/details/test/policy-set-with-1-placement-policy-1/results'
            )
        )
    })
})
