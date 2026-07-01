/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { StepDownloadROSAClI } from './StepDownloadROSACLI'

describe('StepDownloadROSAClI', () => {
  test('should render the download instruction heading', () => {
    render(<StepDownloadROSAClI />)

    expect(screen.getByText(/Download and install the ROSA and AWS command line tools/)).toBeInTheDocument()
  })

  test('should render the ROSA CLI download step', () => {
    render(<StepDownloadROSAClI />)

    expect(screen.getByText('Download the latest version of the ROSA CLI')).toBeInTheDocument()
  })

  test('should render the AWS CLI download step', () => {
    render(<StepDownloadROSAClI />)

    expect(screen.getByText('Download, setup and configure the AWS CLI version 2')).toBeInTheDocument()
  })

  test('should render the Help with ROSA CLI setup link', () => {
    render(<StepDownloadROSAClI />)

    expect(screen.getByText('Help with ROSA CLI setup')).toBeInTheDocument()
    expect(screen.getByText('Help with ROSA CLI setup').closest('a')).toHaveAttribute('target', '_blank')
  })

  test('should render the AWS CLI installing link', () => {
    render(<StepDownloadROSAClI />)

    expect(screen.getByText('installing')).toBeInTheDocument()
    expect(screen.getByText('installing').closest('a')).toHaveAttribute('target', '_blank')
  })

  test('should render the AWS CLI configuring link', () => {
    render(<StepDownloadROSAClI />)

    expect(screen.getByText('configuring')).toBeInTheDocument()
    expect(screen.getByText('configuring').closest('a')).toHaveAttribute('target', '_blank')
  })

  test('should render the DownloadAndOSSelection component', () => {
    render(<StepDownloadROSAClI />)

    expect(screen.getByLabelText('Select operating system')).toBeInTheDocument()
  })
})
