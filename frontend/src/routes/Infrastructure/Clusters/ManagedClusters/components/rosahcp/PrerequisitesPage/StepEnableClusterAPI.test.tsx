/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StepEnableClusterAPI } from './StepEnableClusterAPI'

describe('StepEnableClusterAPI', () => {
  test('should render the title', () => {
    render(<StepEnableClusterAPI />)

    expect(
      screen.getByText(
        'Enable Cluster API (CAPI) and Cluster API Provider AWS (CAPA) in the MultiClusterEngine resource.'
      )
    ).toBeInTheDocument()
  })

  test('should render the verify MCE command', () => {
    render(<StepEnableClusterAPI />)

    expect(screen.getByDisplayValue('oc get multiclusterengine')).toBeInTheDocument()
  })

  test('should render the edit MCE command', () => {
    render(<StepEnableClusterAPI />)

    expect(screen.getByDisplayValue('oc edit multiclusterengine')).toBeInTheDocument()
  })

  test('should render the verify deployments command', () => {
    render(<StepEnableClusterAPI />)

    expect(
      screen.getByDisplayValue('oc get deploy -n multicluster-engine capi-controller-manager capa-controller-manager')
    ).toBeInTheDocument()
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<StepEnableClusterAPI />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
