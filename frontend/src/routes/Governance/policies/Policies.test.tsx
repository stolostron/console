/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../atoms'
import { waitForText } from '../../../lib/test-util'
import { Policy, PolicyApiVersion, PolicyKind } from '../../../resources'
import PoliciesPage from './Policies'

const policy0: Policy = {
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
    status: {},
}

export const mockEmptyPolicy: Policy[] = []
export const mockPolicy: Policy[] = [policy0]

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

        await waitForText(policy0.metadata.name!)
    })
})
