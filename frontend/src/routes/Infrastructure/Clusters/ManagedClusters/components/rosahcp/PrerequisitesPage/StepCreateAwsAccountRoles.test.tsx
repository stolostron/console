/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { StepCreateAWSAccountRoles } from './StepCreateAwsAccountRoles'

describe('StepCreateAWSAccountRoles', () => {
  test('should render the section title', () => {
    render(<StepCreateAWSAccountRoles />)

    expect(
      screen.getByText('Log in to the ROSA CLI with your Red Hat account and create AWS account roles and policies.')
    ).toBeInTheDocument()
  })

  test('should render the authentication instruction', () => {
    render(<StepCreateAWSAccountRoles />)

    expect(
      screen.getByText('To authenticate, run this command and enter your Red Hat login credentials via SSO', {
        exact: false,
      })
    ).toBeInTheDocument()
  })

  test('should render the rosa login command', () => {
    render(<StepCreateAWSAccountRoles />)

    expect(
      screen.getByDisplayValue('rosa login --client-id CLIENT_ID --client-secret CLIENT_SECRET')
    ).toBeInTheDocument()
  })

  test('should render the account roles creation instruction', () => {
    render(<StepCreateAWSAccountRoles />)

    expect(screen.getByText(/To create the necessary account-wide roles and policies quickly/)).toBeInTheDocument()
  })

  test('should render the rosa create account-roles command', () => {
    render(<StepCreateAWSAccountRoles />)

    expect(screen.getByDisplayValue('rosa create account-roles --hosted-cp --mode auto')).toBeInTheDocument()
  })

  test('should render the manual creation info alert', () => {
    render(<StepCreateAWSAccountRoles />)

    expect(
      screen.getByText(/If you would prefer to manually create the required roles and policies/)
    ).toBeInTheDocument()
  })

  test('should render the these instructions link', () => {
    render(<StepCreateAWSAccountRoles />)

    expect(screen.getByText('these instructions')).toBeInTheDocument()
    expect(screen.getByText('these instructions').closest('a')).toHaveAttribute('target', '_blank')
  })
})
