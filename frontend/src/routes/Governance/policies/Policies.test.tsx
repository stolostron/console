/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policiesState, policySetsState } from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import PoliciesPage from './Policies'
import { mockPolicy, mockEmptyPolicy, mockPolicySet } from './Policy.sharedMocks'

describe('Policies Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })
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

        await waitForText("You don't have any policies")
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

        await waitForText(mockPolicy[0].metadata.name!)
    })

    test('Should have correct links to PolicySet & Policy detail results pages', async () => {
        const { container } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policiesState, mockPolicy)
                    snapshot.set(policySetsState, mockPolicySet)
                }}
            >
                <MemoryRouter>
                    <PoliciesPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        // Wait for page load
        await waitForText(mockPolicy[0].metadata.name!)

        // Verify the PolicySet column has loaded correctly and has the correct link to PolicySets page
        await waitForText(mockPolicySet[0].metadata.name!)
        await waitFor(() =>
            // need to use index [1] because the name column is also an "a" element
            expect(container.querySelectorAll('a')[1]).toHaveAttribute(
                'href',
                '/multicloud/governance/policy-sets?search%3D%7B%22name%22%3A%5B%22policy-set-with-1-placement%22%5D%2C%22namespace%22%3A%5B%22test%22%5D%7D'
            )
        )

        // Verify the Cluster violation column has the correct link to policy details page
        await waitFor(() =>
            // need to use index [1] because the name column is also an "a" element
            expect(container.querySelectorAll('a')[2]).toHaveAttribute(
                'href',
                '/multicloud/governance/policies/details/test/policy-set-with-1-placement-policy-1/results?sort=-1'
            )
        )
    })
})
