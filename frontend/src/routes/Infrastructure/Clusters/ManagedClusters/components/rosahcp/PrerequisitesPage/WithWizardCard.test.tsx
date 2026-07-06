/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { WithWizardCard } from './WithWizardCard'

describe('WithWizardCard', () => {
  const mockSetModalIsOpen = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render the card title', () => {
    render(<WithWizardCard setModalIsOpen={mockSetModalIsOpen} />)

    expect(screen.getAllByText('Deploy with web interface')).toHaveLength(2)
  })

  test('should render the card body description', () => {
    render(<WithWizardCard setModalIsOpen={mockSetModalIsOpen} />)

    expect(screen.getByText('You can deploy your cluster with the web interface.')).toBeInTheDocument()
  })

  test('should render the info alert about AWS account association', () => {
    render(<WithWizardCard setModalIsOpen={mockSetModalIsOpen} />)

    expect(
      screen.getByText('Your AWS account will need to be associated with your Red Hat account.')
    ).toBeInTheDocument()
  })

  test('should call setModalIsOpen with true when button is clicked', async () => {
    render(<WithWizardCard setModalIsOpen={mockSetModalIsOpen} />)

    const button = screen.getByRole('button', { name: 'Deploy with web interface' })
    await userEvent.click(button)

    expect(mockSetModalIsOpen).toHaveBeenCalledWith(true)
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<WithWizardCard setModalIsOpen={mockSetModalIsOpen} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
