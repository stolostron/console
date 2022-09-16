/* Copyright Contributors to the Open Cluster Management project */

import { PolicySet, PolicySetApiVersion, PolicySetKind } from '../../../resources'

export const policySetName = 'policySet0'
export const policySetNamespace = 'default'

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
        compliant: 'NonCompliant',
        placement: [
            {
                placement: 'placement1',
                placementBinding: 'binding1',
                placementDecisions: ['placementdecision1'],
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
        compliant: 'Compliant',
        placement: [
            {
                placement: 'placement1',
                placementBinding: 'binding1',
                placementDecisions: ['placementdecision1'],
            },
        ],
    },
}
export const mockEmptyPolicySets: PolicySet[] = []
export const mockPolicySets: PolicySet[] = [policySet0, policySet1]
