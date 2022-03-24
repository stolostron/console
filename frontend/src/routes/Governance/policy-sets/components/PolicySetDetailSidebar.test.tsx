/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    managedClustersState,
    placementBindingsState,
    placementDecisionsState,
    placementRulesState,
    policiesState,
} from '../../../../atoms'
import { clickByText, waitForText } from '../../../../lib/test-util'
import { PlacementBinding, PlacementDecision, PlacementRule, Policy, PolicySet } from '../../../../resources'
import { ManagedCluster } from '../../../../resources/managed-cluster'
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

const mockManagedClusters: ManagedCluster[] = [mockLocalCluster]

const mockPolicy: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        annotations: {
            'policy.open-cluster-management.io/categories': 'PR.IP Information Protection Processes and Procedures',
            'policy.open-cluster-management.io/controls': 'PR.IP-1 Baseline Configuration',
            'policy.open-cluster-management.io/standards': 'NIST-CSF',
        },
        name: 'policy-set-with-1-placement-rule-policy-1',
        namespace: 'test',
        resourceVersion: '830175',
        uid: 'cd18cf67-fe2d-4141-8649-4a2f002898d9',
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'ConfigurationPolicy',
                    metadata: {
                        name: 'policy-set-with-1-placement-rule-policy-1',
                    },
                    spec: {
                        namespaceSelector: {
                            exclude: ['kube-*'],
                            include: ['default'],
                        },
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
                placementBinding: 'policy-set-with-1-placement-rule',
                placementRule: 'policy-set-with-1-placement-rule',
                policySet: 'policy-set-with-1-placement-rule',
            },
        ],
        status: [
            {
                clustername: 'local-cluster',
                clusternamespace: 'local-cluster',
                compliant: 'Compliant',
            },
        ],
    },
}
const mockPolicy0: Policy = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
        annotations: {
            'policy.open-cluster-management.io/categories': 'PR.IP Information Protection Processes and Procedures',
            'policy.open-cluster-management.io/controls': 'PR.IP-1 Baseline Configuration',
            'policy.open-cluster-management.io/standards': 'NIST-CSF',
        },
        labels: {
            'policy.open-cluster-management.io/cluster-name': 'local-cluster',
            'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
            'policy.open-cluster-management.io/root-policy': 'test.policy-set-with-1-placement-rule-policy-1',
        },
        name: 'test.policy-set-with-1-placement-rule-policy-1',
        namespace: 'local-cluster',
    },
    spec: {
        disabled: false,
        'policy-templates': [
            {
                objectDefinition: {
                    apiVersion: 'policy.open-cluster-management.io/v1',
                    kind: 'ConfigurationPolicy',
                    metadata: {
                        name: 'policy-set-with-1-placement-rule-policy-1',
                    },
                    spec: {
                        namespaceSelector: {
                            exclude: ['kube-*'],
                            include: ['default'],
                        },
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
                        eventName: 'test.policy-set-with-1-placement-rule-policy-1.16db07645ba22e3d',
                        lastTimestamp: '2022-03-10T13:16:56Z',
                        message:
                            'Compliant; notification - namespaces [test] found as specified, therefore this Object template is compliant',
                    },
                ],
                templateMeta: {
                    creationTimestamp: null,
                    name: 'policy-set-with-1-placement-rule-policy-1',
                },
            },
        ],
    },
}
const mockPolicies: Policy[] = [mockPolicy, mockPolicy0]

const mockPlacementRule: PlacementRule = {
    apiVersion: 'apps.open-cluster-management.io/v1',
    kind: 'PlacementRule',
    metadata: {
        name: 'policy-set-with-1-placement-rule',
        namespace: 'test',
        uid: 'ff9f446b-c3e2-49ff-9305-b8385344070b',
    },
    spec: {
        clusterConditions: [
            {
                status: 'True',
                type: 'ManagedClusterConditionAvailable',
            },
        ],
        clusterSelector: {
            matchExpressions: [
                {
                    key: 'local-cluster',
                    operator: 'In',
                    values: ['true'],
                },
            ],
        },
    },
    status: {
        decisions: [
            {
                clusterName: 'local-cluster',
                clusterNamespace: 'local-cluster',
            },
        ],
    },
}
const mockPlacementRules: PlacementRule[] = [mockPlacementRule]

const mockPlacementBinding: PlacementBinding = {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'PlacementBinding',
    metadata: {
        name: 'policy-set-with-1-placement-rule',
        namespace: 'test',
        resourceVersion: '152043',
        uid: '2c3359ea-b9b6-451e-981d-8107a1060281',
    },
    placementRef: {
        apiGroup: 'apps.open-cluster-management.io',
        kind: 'PlacementRule',
        name: 'policy-set-with-1-placement-rule',
    },
    subjects: [
        { apiGroup: 'policy.open-cluster-management.io', kind: 'PolicySet', name: 'policy-set-with-1-placement-rule' },
    ],
}
const mockPlacementBindings: PlacementBinding[] = [mockPlacementBinding]

const mockPlacementDecision: PlacementDecision = {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'PlacementDecision',
    metadata: {
        resourceVersion: '152066',
        name: 'policy-set-with-1-placement-rule-decision-1',
        namespace: 'test',
        ownerReferences: [
            {
                apiVersion: 'apps.open-cluster-management.io/v1',
                blockOwnerDeletion: true,
                controller: true,
                kind: 'PlacementRule',
                name: 'policy-set-with-1-placement-rule',
                uid: 'ff9f446b-c3e2-49ff-9305-b8385344070b',
            },
        ],
        labels: { 'cluster.open-cluster-management.io/placementrule': 'policy-set-with-1-placement-rule' },
    },
    status: { decisions: [{ clusterName: 'local-cluster', reason: '' }] },
}
const mockPlacementDecisions: PlacementDecision[] = [mockPlacementDecision]

describe('PolicySets Page', () => {
    test('Should render PolicySet page correctly', async () => {
        const policySet: PolicySet = {
            apiVersion: 'policy.open-cluster-management.io/v1beta1',
            kind: 'PolicySet',
            metadata: {
                name: 'policy-set-with-1-placement-rule',
                namespace: 'test',
            },
            spec: {
                description: 'Policy set with a single PlacementRule and PlacementBinding.',
                policies: ['policy-set-with-1-placement-rule-policy-1'],
            },
            status: {
                compliant: 'Compliant',
                placement: [
                    {
                        placementBinding: 'policy-set-with-1-placement-rule',
                        placementRule: 'policy-set-with-1-placement-rule',
                    },
                ],
            },
        }

        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicies)
                    snapshot.set(managedClustersState, mockManagedClusters)
                    snapshot.set(placementRulesState, mockPlacementRules)
                    snapshot.set(placementBindingsState, mockPlacementBindings)
                    snapshot.set(placementDecisionsState, mockPlacementDecisions)
                }}
            >
                <MemoryRouter>
                    <PolicySetDetailSidebar policySet={policySet} />
                </MemoryRouter>
            </RecoilRoot>
        )

        // Check clusters with violation count
        await waitForText('0 Clusters with policy violations')
        // Check policies with violation count
        await waitForText('1 Cluster without policy violations')

        // Find the cluster names iin table
        await waitForText(mockLocalCluster.metadata.name!)

        // switch to the policies table
        await clickByText('Policies')

        // find the policy names in table
        await waitForText(mockPolicy.metadata.name!)
    })
})
