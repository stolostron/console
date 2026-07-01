/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { WithCLICard } from './WithCLICard'

describe('WithCLICard', () => {
  test('should render the card title', () => {
    render(<WithCLICard />)

    expect(screen.getByText('Deploy with CLI')).toBeInTheDocument()
  })

  test('should render the card body description', () => {
    render(<WithCLICard />)

    expect(
      screen.getByText('Run the create command in your terminal to begin setup in interactive mode.')
    ).toBeInTheDocument()
  })

  test('should render the rosa create cluster command', () => {
    render(<WithCLICard />)

    expect(screen.getByDisplayValue('rosa create cluster')).toBeInTheDocument()
  })

  test('should render the learn how to deploy link', () => {
    render(<WithCLICard />)

    expect(screen.getByText('deploy ROSA clusters with the ROSA CLI')).toBeInTheDocument()
    expect(screen.getByText('deploy ROSA clusters with the ROSA CLI').closest('a')).toHaveAttribute('target', '_blank')
  })
})
