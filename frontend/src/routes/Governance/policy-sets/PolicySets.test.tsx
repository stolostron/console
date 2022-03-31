/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import nock from 'nock'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policySetsState } from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import { PolicySet, PolicySetApiVersion, PolicySetKind, Project, ProjectApiVersion, ProjectKind } from '../../../resources'
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

const mockProjects: Project[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name },
}))

describe('PolicySets Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        nock(process.env.JEST_DEFAULT_HOST as string, { encodedQueryParams: true })
            .persist()
            .get('/apis/project.openshift.io/v1/projects')
            .reply(200, mockProjects)
    })
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

        await waitForText("You don't have any policy sets")
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
