/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { DOC_HOME } from '../../../../../lib/doc-util'
import { defaultPlugin, PluginContext } from '../../../../../lib/PluginContext'
import { clickByText, createClusterVersionMock, waitForText } from '../../../../../lib/test-util'
import { OnboardingModal } from './OnboardingModal'

const mockUseClusterVersion = createClusterVersionMock()
jest.mock('../../../../../hooks/use-cluster-version', () => ({
  useClusterVersion: () => mockUseClusterVersion(),
}))

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

describe('OnboardingModal - Version-specific URLs', () => {
  describe('OCP 4.20+ (uses /catalog)', () => {
    it('should use /catalog path for ACM operator link on OCP 4.20', async () => {
      window.open = jest.fn()
      render(
        <PluginContext.Provider value={{ ...defaultPlugin, isACMAvailable: false }}>
          <MemoryRouter>
            <OnboardingModal open={true} close={() => {}} />
          </MemoryRouter>
        </PluginContext.Provider>
      )
      await waitForText('Managing clusters')
      await clickByText('Want to learn more?')

      const button = screen.getByRole('button', {
        name: /learn more about red hat advanced cluster management for kubernetes/i,
      })
      userEvent.click(button)

      expect(window.open).toHaveBeenCalledWith(
        '/catalog/all-namespaces?selectedId=advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
    })
  })

  describe('OCP 4.19 and below (uses /operatorhub)', () => {
    beforeEach(() => {
      mockUseClusterVersion.mockReturnValue({
        version: '4.19',
        isLoading: false,
        error: undefined,
      })
    })

    it('should use /operatorhub path for ACM operator link on OCP 4.19', async () => {
      window.open = jest.fn()
      render(
        <PluginContext.Provider value={{ ...defaultPlugin, isACMAvailable: false }}>
          <MemoryRouter>
            <OnboardingModal open={true} close={() => {}} />
          </MemoryRouter>
        </PluginContext.Provider>
      )
      await waitForText('Managing clusters')
      await clickByText('Want to learn more?')

      const button = screen.getByRole('button', {
        name: /learn more about red hat advanced cluster management for kubernetes/i,
      })
      userEvent.click(button)

      expect(window.open).toHaveBeenCalledWith(
        '/operatorhub/all-namespaces?details-item=advanced-cluster-management-redhat-operators-openshift-marketplace'
      )
    })
  })
})
