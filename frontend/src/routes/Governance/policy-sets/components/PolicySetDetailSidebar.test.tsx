/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { managedClustersState, policiesState } from '../../../../atoms'
import { clickByText, waitForText } from '../../../../lib/test-util'
import { ManagedCluster } from '../../../../resources/managed-cluster'
import { Policy } from '../../../../resources/policy'
import { PolicySet } from '../../../../resources/policy-set'
import { PolicySetDetailSidebar } from './PolicySetDetailSidebar'

const mockLocalCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        labels: {
            cloud: 'Amazon',
            name: 'local-cluster',
            openshiftVersion: '4.9.7',
            vendor: 'OpenShift',
        },
        name: 'local-cluster',
    },
}

const mockManaged: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        labels: {
            cloud: 'Amazon',
            name: 'managed',
            openshiftVersion: '4.9.7',
            vendor: 'OpenShift',
        },
        name: 'managed',
    },
}
export const mockManagedClusters: ManagedCluster[] = [mockLocalCluster, mockManaged]

const mockPolicyRole: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'policy-role',
        namespace: 'policies',
        ownerReferences: [
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                name: 'demo-stable-policies-sub',
                uid: 'cb14759d-b895-4ced-a481-e76fab556b3b',
            },
        ],
    },
    spec: {
        disabled: false,
        remediationAction: 'inform',
    },
    status: { placement: [{ placementBinding: 'binding-policy-role', placementRule: 'placement-policy-role' }] },
}
const mockPolicyTesting: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'policy-testing',
        namespace: 'policies',
        ownerReferences: [
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                name: 'demo-stable-policies-sub',
                uid: 'cb14759d-b895-4ced-a481-e76fab556b3b',
            },
        ],
    },
    spec: {
        disabled: false,
        remediationAction: 'inform',
    },
    status: {
        placement: [
            {
                placementBinding: 'binding-policy-limitclusteradmin',
                placementRule: 'placement-policy-limitclusteradmin',
            },
        ],
    },
}
const mockPolicySecurityContextConstraints: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'policy-securitycontextconstraints',
        namespace: 'policies',
        ownerReferences: [
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
                kind: 'Subscription',
                name: 'demo-stable-policies-sub',
                uid: 'cb14759d-b895-4ced-a481-e76fab556b3b',
            },
        ],
    },
    spec: {
        disabled: false,
        remediationAction: 'enforce',
    },
    status: {
        placement: [
            {
                placementBinding: 'binding-policy-limitclusteradmin',
                placementRule: 'placement-policy-limitclusteradmin',
            },
        ],
    },
}
export const mockPolicies: Policy[] = [mockPolicyRole, mockPolicyTesting, mockPolicySecurityContextConstraints]

describe('PolicySets Page', () => {
    test('Should render PolicySet page correctly', async () => {
        const policySet: PolicySet = {
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'PolicySet',
            metadata: { name: 'test-policyset', namespace: 'test-ns' },
            spec: {
                description: 'Policies for PCI-2 compliance',
                policies: ['policy-testing', 'policy-role', 'policy-securitycontextconstraints'],
            },
            status: {
                placement: [
                    {
                        placement: 'placement',
                        placementBinding: 'placementBinding',
                        placementDecisions: ['placementDecision'],
                    },
                ],
                results: [
                    {
                        policy: 'policy-testing',
                        compliant: 'Compliant',
                        clusters: [
                            { clusterName: 'local-cluster', clusterNamespace: 'local-cluster', compliant: 'Compliant' },
                            { clusterName: 'managed', clusterNamespace: 'managed', compliant: 'Compliant' },
                        ],
                    },
                    {
                        policy: 'policy-role',
                        compliant: 'NonCompliant',
                        clusters: [{ clusterName: 'managed', clusterNamespace: 'managed', compliant: 'NonCompliant' }],
                    },
                    {
                        policy: 'policy-securitycontextconstraints',
                        compliant: 'Compliant',
                        clusters: [
                            { clusterName: 'local-cluster', clusterNamespace: 'local-cluster', compliant: 'Compliant' },
                        ],
                    },
                ],
            },
        }

        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicies)
                    snapshot.set(managedClustersState, mockManagedClusters)
                }}
            >
                <MemoryRouter>
                    <PolicySetDetailSidebar policySet={policySet} />
                </MemoryRouter>
            </RecoilRoot>
        )

        // find the PolicySet name
        await waitForText(policySet.metadata.name!)

        // Check clusters with violation count
        await waitForText('1 Clusters with policy violations')
        // Check policies with violation count
        await waitForText('1 Clusters without policy violations')

        // Find the cluster names iin table
        await waitForText(mockLocalCluster.metadata.name!)
        await waitForText(mockManaged.metadata.name!)

        // switch to the policies table
        await clickByText('Policies')

        // find the policy names in table
        await waitForText(mockPolicyRole.metadata.name!)
        await waitForText(mockPolicyTesting.metadata.name!)
        await waitForText(mockPolicySecurityContextConstraints.metadata.name!)
    })
})
