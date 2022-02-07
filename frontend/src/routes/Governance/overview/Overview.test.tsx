/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../atoms'
import { waitForText } from '../../../lib/test-util'
import { Policy, PolicyApiVersion, PolicyKind } from '../../../resources'
import GovernanceOverview from './Overview'

const policyWithoutStatus: Policy = {
    apiVersion: PolicyApiVersion,
    kind: PolicyKind,
    metadata: {
        name: 'policy-0',
        namespace: 'policy-0-ns',
    },
    spec: {
        disabled: false,
        remediationAction: '',
    },
}

export const mockEmptyPolicy: Policy[] = []
export const mockPoliciesNoStatus: Policy[] = [policyWithoutStatus]

describe('Overview Page', () => {
    test('Should render empty Overview page with create policy message correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockEmptyPolicy)
                }}
            >
                <MemoryRouter>
                    <GovernanceOverview />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText('Use the following button to create a policy.')
    })
    test('Should render empty Overview page with manage policies message correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPoliciesNoStatus)
                }}
            >
                <MemoryRouter>
                    <GovernanceOverview />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText('Use the following button to manage policies.')
    })
})
