/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../atoms'
import GovernanceOverview from './Overview'
import { mockEmptyPolicy, mockPolicyNoStatus, mockPolicy } from '../governance.sharedMocks'

describe('Overview Page', () => {
    test('Should render empty Overview page with create policy button correctly', async () => {
        const { queryAllByText } = await render(
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

        expect(queryAllByText('Create policy').length).toBe(2)
    })

    test('Should render empty Overview page with manage policies button correctly', async () => {
        const { queryAllByText } = await render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, [mockPolicyNoStatus])
                }}
            >
                <MemoryRouter>
                    <GovernanceOverview />
                </MemoryRouter>
            </RecoilRoot>
        )
        expect(queryAllByText('Manage policies').length).toBe(2)
    })

    test('Should render Overview page correctly', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicy)
                }}
            >
                <MemoryRouter>
                    <GovernanceOverview />
                </MemoryRouter>
            </RecoilRoot>
        )

        expect(screen.getByText(/[0-9]+ pending/i)).toBeTruthy()
    })
})
