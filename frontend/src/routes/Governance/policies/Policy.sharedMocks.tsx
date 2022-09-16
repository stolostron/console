/* Copyright Contributors to the Open Cluster Management project */

import { Policy, PolicySet } from '../../../resources'

export const policyName = 'policy0'
export const policyNamespace = 'default'

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
