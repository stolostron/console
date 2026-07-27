/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { ServiceAccountSteps } from './ServiceAccountSteps'

describe('ServiceAccountSteps', () => {
  const Component = () => (
    <MemoryRouter>
      <ServiceAccountSteps />
    </MemoryRouter>
  )

  test('should render the section title', () => {
    render(<Component />)

    expect(screen.getByText('RedHat service account prerequisites')).toBeInTheDocument()
  })

  test('should render the service account creation instruction', () => {
    render(<Component />)

    expect(
      screen.getByText('To create a ROSA HCP cluster, a Red Hat service account is required.', { exact: false })
    ).toBeInTheDocument()
  })

  test('should render the Create a service account link', () => {
    render(<Component />)

    expect(screen.getByText('Create a service account')).toBeInTheDocument()
    expect(screen.getByText('Create a service account').closest('a')).toHaveAttribute('target', '_blank')
  })

  test('should render the Add credentials link', () => {
    render(<Component />)

    expect(screen.getByText('Add credential.')).toBeInTheDocument()
  })

  test('should render the add credentials instruction text', () => {
    render(<Component />)

    expect(
      screen.getByText(
        'After creating a service account, please add it to your Red Hat Advanced Cluster Management for Kubernetes credentials.',
        {
          exact: false,
        }
      )
    ).toBeInTheDocument()
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<Component />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
