/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { waitForText } from '../../../../../lib/test-util'
import { OnboardingModal } from './OnboardingModal'
import '@testing-library/jest-dom'
describe('OnboardingModal open', () => {
    beforeEach(async () => {
        render(
            <MemoryRouter>
                <OnboardingModal open={true} close={() => {}} />
            </MemoryRouter>
        )

        await waitForText('Managing clusters')
    })

    it('should render OnboardingModal', async () => {
        expect(screen.getByTestId('clustersOnboardingModal')).toHaveAttribute(
            'data-ouia-component-id',
            'clustersOnboardingModal'
        )
        expect(screen.getByTestId('clustersOnboardingModal')).toHaveAttribute('data-testid', 'clustersOnboardingModal')
        expect(screen.queryAllByText('Import an existing cluster').length).toBe(1)
        expect(screen.queryAllByText('Connect your cloud provider').length).toBe(1)
        expect(screen.queryAllByText('Discover hosts to create host inventory').length).toBe(1)
    })
})

describe('OnboardingModal closed', () => {
    beforeEach(async () => {
        render(
            <MemoryRouter>
                <OnboardingModal open={false} close={() => {}} />
            </MemoryRouter>
        )
    })

    it('should render OnboardingModal', async () => {
        expect(screen.queryAllByText('Import an existing cluster').length).toBe(0)
        expect(screen.queryAllByText('Connect your cloud provider').length).toBe(0)
        expect(screen.queryAllByText('Discover hosts to create host inventory').length).toBe(0)
    })
})
