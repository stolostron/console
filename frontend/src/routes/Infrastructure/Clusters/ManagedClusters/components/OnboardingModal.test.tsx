/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { DOC_HOME } from '../../../../../lib/doc-util'
import { clickByText, waitForText } from '../../../../../lib/test-util'
import { OnboardingModal } from './OnboardingModal'

describe('OnboardingModal open', () => {
  beforeEach(async () => {
    render(
      <MemoryRouter>
        <OnboardingModal
          open={true}
          close={() => {
            console.log('clicked!')
          }}
        />
      </MemoryRouter>
    )

    await waitForText('Managing clusters')
  })

  it('should render OnboardingModal', async () => {
    window.open = jest.fn()
    expect(screen.getByTestId('clustersOnboardingModal')).toHaveAttribute(
      'data-ouia-component-id',
      'clustersOnboardingModal'
    )
    expect(screen.queryAllByText('Import an existing cluster').length).toBe(1)
    expect(screen.queryAllByText('Connect your cloud provider').length).toBe(1)
    expect(screen.queryAllByText('Discover hosts to create host inventory').length).toBe(1)

    await clickByText('Want to learn more?')
    const consoleSpy = jest.spyOn(console, 'log')

    console.log('clicked!')
    await clickByText('Get started with on-premise host inventory')
    expect(consoleSpy).toHaveBeenCalledWith('clicked!')

    userEvent.click(
      screen.getByRole('button', {
        name: /learn more about red hat advanced cluster management for kubernetes/i,
      })
    )
    expect(window.open).toHaveBeenCalledWith(DOC_HOME, '_blank')
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
