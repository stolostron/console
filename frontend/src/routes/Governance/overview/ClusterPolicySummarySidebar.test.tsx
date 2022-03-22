/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../atoms'
import { waitForText } from '../../../lib/test-util'
import { ManagedCluster, Policy } from '../../../resources'
import { ClusterPolicySummarySidebar } from './ClusterPolicySummarySidebar'

const rootPolicy0: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'policy-0',
        namespace: 'test',
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'ConfigurationPolicy',
                    metadata: { name: 'policy-0' },
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
        compliant: 'NonCompliant',
        placement: [
            {
                placement: 'policy-0-placement',
                placementBinding: 'policy-0-placement',
                policySet: 'policy-0-placement',
            },
        ],
        status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'NonCompliant' }],
    },
}

const rootPolicy1: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'policy-1',
        namespace: 'test',
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'ConfigurationPolicy',
                    metadata: { name: 'policy-1' },
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
                placement: 'policy-1-placement',
                placementBinding: 'policy-1-placement',
                policySet: 'policy-1-placement',
            },
        ],
        status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'Compliant' }],
    },
}
export const mockPolicy: Policy[] = [rootPolicy0, rootPolicy1]

const mockCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        name: 'local-cluster',
        namespace: 'local-cluster',
    },
}

describe('Policies Page', () => {
    test('Should render empty Policies page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicy)
                }}
            >
                <MemoryRouter>
                    <ClusterPolicySummarySidebar cluster={mockCluster} compliance={'compliant'} />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText(rootPolicy0.metadata.name!)
        await waitForText(rootPolicy1.metadata.name!)
    })
})
