/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { RecoilRoot } from 'recoil'
import { secretsState } from '../../../../../../../atoms'
import { Secret } from '../../../../../../../resources'
import { RosaHCPModal } from './RosaHCPModal'

const mockRhocmSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'my-service-account',
    namespace: 'default',
    labels: {
      'cluster.open-cluster-management.io/credentials': '',
      'cluster.open-cluster-management.io/type': 'rhocm',
    },
  },
}

describe('RosaHCPModal', () => {
  const mockClose = jest.fn()
  const mockSetSelectedSecret = jest.fn()

  const Component = ({
    isModalOpen = true,
    secrets = [mockRhocmSecret],
    selectedSecret,
  }: {
    isModalOpen?: boolean
    secrets?: Secret[]
    selectedSecret?: Secret[]
  }) => (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(secretsState, secrets as any)
      }}
    >
      <MemoryRouter>
        <RosaHCPModal
          isModalOpen={isModalOpen}
          close={mockClose}
          selectedSecret={selectedSecret}
          setSelectedSecret={mockSetSelectedSecret}
        />
      </MemoryRouter>
    </RecoilRoot>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render modal with title and description when open', () => {
    render(<Component />)

    expect(screen.getByRole('heading', { name: 'Select service account' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'To create a ROSA cluster, select a service account credential. This establishes the connection between Advanced Cluster Manager (ACM) and OpenShift Cluster Manager (OCM).'
      )
    ).toBeInTheDocument()
  })

  test('should render the continue button as disabled when no secret is selected', () => {
    render(<Component selectedSecret={undefined} />)

    const continueButton = screen.getByRole('button', { name: 'Continue to ROSA cluster creation' })
    expect(continueButton).toBeDisabled()
  })

  test('should call close when Cancel button is clicked', async () => {
    render(<Component />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await userEvent.click(cancelButton)

    expect(mockClose).toHaveBeenCalled()
  })

  test('should render the "Add one" link for missing service accounts', () => {
    render(<Component />)

    expect(screen.getByText('Missing a service account?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add one' })).toBeInTheDocument()
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<Component />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
