/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StepCreateNetwork } from './StepCreateNetwork'

describe('StepCreateNetwork', () => {
  test('should render the section title', () => {
    render(<StepCreateNetwork />)

    expect(
      screen.getByText('Create a Virtual Private Network (VPC) and necessary networking components.')
    ).toBeInTheDocument()
  })

  test('should render the VPC creation instruction', () => {
    render(<StepCreateNetwork />)

    expect(
      screen.getByText(
        'To create a Virtual Private Netwowrk (VPC) and all the necessary components, run this command:',
        { exact: false }
      )
    ).toBeInTheDocument()
  })

  test('should render the rosa create network command', () => {
    render(<StepCreateNetwork />)

    expect(screen.getByDisplayValue('rosa create network')).toBeInTheDocument()
  })

  test('should render the create network command link', () => {
    render(<StepCreateNetwork />)

    expect(screen.getByText('create network command')).toBeInTheDocument()
  })

  test('should render the create a VPC link', () => {
    render(<StepCreateNetwork />)

    expect(screen.getByText('create a VPC')).toBeInTheDocument()
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<StepCreateNetwork />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
