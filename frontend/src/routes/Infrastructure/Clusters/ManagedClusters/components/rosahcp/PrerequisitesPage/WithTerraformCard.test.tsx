/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { WithTerraFormCard } from './WithTerraformCard'

describe('WithTerraFormCard', () => {
  test('should render the card title', () => {
    render(<WithTerraFormCard />)

    expect(screen.getByText('Deploy with Teraform')).toBeInTheDocument()
  })

  test('should render the card body description', () => {
    render(<WithTerraFormCard />)

    expect(screen.getByText('Create a ROSA HCP cluster using Terraform')).toBeInTheDocument()
  })

  test('should render the deploy ROSA HCP cluster link', () => {
    render(<WithTerraFormCard />)

    expect(screen.getByText('deploy a ROSA HCP cluster')).toBeInTheDocument()
    expect(screen.getByText('deploy a ROSA HCP cluster').closest('a')).toHaveAttribute('target', '_blank')
  })

  test('should render the visit Terraform registry link', () => {
    render(<WithTerraFormCard />)

    expect(screen.getByText('visit the Terraform registry')).toBeInTheDocument()
    expect(screen.getByText('visit the Terraform registry').closest('a')).toHaveAttribute('target', '_blank')
  })
})
