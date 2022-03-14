/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { placementBindingsState, placementDecisionsState, placementsState, policySetsState } from '../../../../atoms'
import { waitForText } from '../../../../lib/test-util'
import { Placement, PlacementBinding, PlacementDecision, Policy, PolicySet } from '../../../../resources'
import PolicyDetailsOverview from './PolicyDetailsOverview'

const rootPolicy: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        name: 'policy-set-with-1-placement-policy',
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

const policySet: PolicySet = {
    apiVersion: 'policy.open-cluster-management.io/v1beta1',
    kind: 'PolicySet',
    metadata: {
        annotations: {
            'kubectl.kubernetes.io/last-applied-configuration':
                '{"apiVersion":"policy.open-cluster-management.io/v1","kind":"PolicySet","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"spec":{"description":"Policy set with a single Placement and PlacementBinding.","policies":["policy-set-with-1-placement-policy-1","policy-set-with-1-placement-policy-2"]}}\n',
        },
        creationTimestamp: '2022-02-23T12:34:35Z',
        name: 'policy-set-with-1-placement',
        namespace: 'test',
        uid: '20761783-5b48-4f9c-b12c-d5a6b2fac4b5',
    },
    spec: {
        description: 'Policy set with a single Placement and PlacementBinding.',
        policies: ['policy-set-with-1-placement-policy'],
    },
    status: {
        compliant: 'Compliant',
        placement: [{ placement: 'policy-set-with-1-placement', placementBinding: 'policy-set-with-1-placement' }],
    },
}

const placement: Placement = {
    apiVersion: 'cluster.open-cluster-management.io/v1alpha1',
    kind: 'Placement',
    metadata: {
        annotations: {
            'kubectl.kubernetes.io/last-applied-configuration':
                '{"apiVersion":"cluster.open-cluster-management.io/v1alpha1","kind":"Placement","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"spec":{"clusterSets":["cluster-set"],"numberOfClusters":1,"predicates":[{"requiredClusterSelector":{"labelSelector":{"matchLabels":{"local-cluster":"true"}}}}]}}\n',
        },
        creationTimestamp: '2022-03-02T14:45:53Z',
        name: 'policy-set-with-1-placement',
        namespace: 'test',
        resourceVersion: '307980',
        uid: '8258c5bb-dd06-4934-94ad-0774c0608abb',
    },
    spec: {
        clusterSets: ['cluster-set'],
        numberOfClusters: 1,
        predicates: [{ requiredClusterSelector: { labelSelector: { matchLabels: { 'local-cluster': 'true' } } } }],
    },
    status: {
        conditions: [
            {
                lastTransitionTime: new Date('2022-03-02T14:45:53Z'),
                message: 'All ManagedClusterSets [cluster-set] have no member ManagedCluster',
                reason: 'AllManagedClusterSetsEmpty',
                status: 'False',
                type: 'PlacementSatisfied',
            },
        ],
        numberOfSelectedClusters: 1,
    },
}

const placementBinding: PlacementBinding = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'PlacementBinding',
    metadata: {
        annotations: {
            'kubectl.kubernetes.io/last-applied-configuration':
                '{"apiVersion":"policy.open-cluster-management.io/v1","kind":"PlacementBinding","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"placementRef":{"apiGroup":"cluster.open-cluster-management.io","kind":"Placement","name":"policy-set-with-1-placement"},"subjects":[{"apiGroup":"policy.open-cluster-management.io","kind":"PolicySet","name":"policy-set-with-1-placement"}]}\n',
        },
        creationTimestamp: '2022-03-02T14:45:53Z',
        name: 'policy-set-with-1-placement',
        namespace: 'test',
        resourceVersion: '307982',
        uid: 'aff1ea59-7f6d-4ff7-ba2e-e9bc7bd1dca1',
    },
    placementRef: {
        apiGroup: 'cluster.open-cluster-management.io',
        kind: 'Placement',
        name: 'policy-set-with-1-placement',
    },
    subjects: [
        { apiGroup: 'policy.open-cluster-management.io', kind: 'PolicySet', name: 'policy-set-with-1-placement' },
    ],
}

const placementDecision: PlacementDecision = {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'PlacementDecision',
    metadata: {
        resourceVersion: '379369',
        name: 'policy-set-with-1-placement-decision-1',
        uid: 'b6151850-a636-4aa0-b803-66776fec511c',
        creationTimestamp: '2022-03-02T15:20:53Z',
        namespace: 'test',
        ownerReferences: [
            {
                apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'Placement',
                name: 'policy-set-with-1-placement',
                uid: '8258c5bb-dd06-4934-94ad-0774c0608abb',
            },
        ],
        labels: { 'cluster.open-cluster-management.io/placement': 'policy-set-with-1-placement' },
    },
    status: { decisions: [{ clusterName: 'local-cluster', reason: '' }] },
}

export const mockPolicySets: PolicySet[] = [policySet]
export const mockPlacements: Placement[] = [placement]
export const mockPlacementBindings: PlacementBinding[] = [placementBinding]
export const mockPlacementDecision: PlacementDecision[] = [placementDecision]

describe('Policy Details Results', () => {
    test('Should render Policy Details Results Page content correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(placementsState, mockPlacements)
                    snapshot.set(policySetsState, mockPolicySets)
                    snapshot.set(placementBindingsState, mockPlacementBindings)
                    snapshot.set(placementDecisionsState, mockPlacementDecision)
                }}
            >
                <MemoryRouter>
                    <PolicyDetailsOverview policy={rootPolicy} />
                </MemoryRouter>
            </RecoilRoot>
        )

        // wait page load
        await waitForText('policy-set-with-1-placement-policy')

        // verify decsription card items
        await waitForText('test')
        await waitForText('Enabled')
        await waitForText('inform')

        // verify placement table
        await waitForText('policy-set-with-1-placement')
        await waitForText('Without violations:')
    })
})
