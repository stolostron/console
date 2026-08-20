/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StepEnableAutoImport } from './StepEnableAutoImport'

describe('StepEnableAutoImport', () => {
  test('should render the title', () => {
    render(<StepEnableAutoImport />)

    expect(
      screen.getByText('Enable auto import so that provisioned clusters are automatically registered with ACM.')
    ).toBeInTheDocument()
  })

  test('should render the edit ClusterManager command', () => {
    render(<StepEnableAutoImport />)

    expect(screen.getByDisplayValue('oc edit ClusterManager cluster-manager')).toBeInTheDocument()
  })

  test('should render the ClusterRoleBinding apply command', () => {
    render(<StepEnableAutoImport />)

    expect(screen.getByDisplayValue(/cluster-manager-registration-capi/)).toBeInTheDocument()
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<StepEnableAutoImport />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
