/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { RecoilRoot } from 'recoil'
import { multiClusterEnginesState } from '../../../../../../../atoms'
import { HostedCard } from './HostedCard'

describe('HostedCard', () => {
  const mockSetIsModalOpen = jest.fn()
  const mockWithCliClick = jest.fn()

  const Component = () => (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(multiClusterEnginesState, [
          {
            spec: {
              overrides: {
                components: [],
              },
            },
          },
        ] as any)
      }}
    >
      <MemoryRouter>
        <HostedCard setIsModalOpen={mockSetIsModalOpen} withCliClick={mockWithCliClick} />
      </MemoryRouter>
    </RecoilRoot>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render the ROSA card with expected content', () => {
    render(<Component />)

    expect(screen.getByText('ROSA')).toBeInTheDocument()
    expect(screen.getByText('Managed by Red Hat')).toBeInTheDocument()
    expect(screen.getByText('Red Hat SRE managed')).toBeInTheDocument()
    expect(screen.getByText('Zero-cost control plane infra')).toBeInTheDocument()
    expect(screen.getByText('Full compliance certifications')).toBeInTheDocument()
  })

  test('should render the AWS self managed card with expected content', () => {
    render(<Component />)

    expect(screen.getByText('AWS (self managed)')).toBeInTheDocument()
    expect(screen.getByText('Managed by you')).toBeInTheDocument()
    expect(screen.getByText('Fully self-managed control')).toBeInTheDocument()
  })

  test('should call setIsModalOpen when Deploy with web interface button is clicked', async () => {
    render(<Component />)

    const deployButton = screen.getByRole('button', { name: 'Deploy with web interface' })
    await userEvent.click(deployButton)

    expect(mockSetIsModalOpen).toHaveBeenCalledWith(true)
  })

  test('should call withCliClick when Deploy with CLI button is clicked', async () => {
    render(<Component />)

    const cliButton = screen.getByRole('button', { name: 'Deploy with CLI' })
    await userEvent.click(cliButton)

    expect(mockWithCliClick).toHaveBeenCalled()
  })

  test('should render the View ROSA prerequisites link', () => {
    render(<Component />)

    expect(screen.getByText('View ROSA prerequisites')).toBeInTheDocument()
  })
})
