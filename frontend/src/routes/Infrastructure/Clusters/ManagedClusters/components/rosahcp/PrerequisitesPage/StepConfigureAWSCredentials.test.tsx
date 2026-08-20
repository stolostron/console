/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StepConfigureAWSCredentials } from './StepConfigureAWSCredentials'

describe('StepConfigureAWSCredentials', () => {
  test('should render the title', () => {
    render(<StepConfigureAWSCredentials />)

    expect(
      screen.getByText('Configure AWS credentials for the CAPA controller so it can provision AWS resources.')
    ).toBeInTheDocument()
  })

  test('should render the edit secret command', () => {
    render(<StepConfigureAWSCredentials />)

    expect(
      screen.getByDisplayValue('oc edit secret -n multicluster-engine capa-manager-bootstrap-credentials')
    ).toBeInTheDocument()
  })

  test('should render the restart command', () => {
    render(<StepConfigureAWSCredentials />)

    expect(
      screen.getByDisplayValue('oc rollout restart deployment capa-controller-manager -n multicluster-engine')
    ).toBeInTheDocument()
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<StepConfigureAWSCredentials />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
