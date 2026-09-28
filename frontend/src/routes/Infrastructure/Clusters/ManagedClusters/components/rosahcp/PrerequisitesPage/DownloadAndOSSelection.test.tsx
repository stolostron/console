/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import DownloadAndOSSelection from './DownloadAndOSSelection'
import { selectOptionsElement, clickElement } from '~/lib/test-util'

describe('DownloadAndOSSelection', () => {
  test('should render the OS dropdown', () => {
    render(<DownloadAndOSSelection />)

    expect(screen.getByLabelText('Select operating system')).toBeInTheDocument()
  })

  test('should render the download button', () => {
    render(<DownloadAndOSSelection />)

    expect(screen.getByText('Download the ROSA CLI')).toBeInTheDocument()
  })

  test('should display all OS options in the select', () => {
    render(<DownloadAndOSSelection />)

    expect(screen.getByText('Linux')).toBeInTheDocument()
    expect(screen.getByText('MacOS')).toBeInTheDocument()
    expect(screen.getByText('Windows')).toBeInTheDocument()
  })

  test('should change download URL when OS selection changes', async () => {
    render(<DownloadAndOSSelection />)

    const select = screen.getByLabelText('Select operating system')
    await selectOptionsElement(select, 'windows')

    const downloadLink = screen.getByText('Download the ROSA CLI').closest('a')
    expect(downloadLink).toHaveAttribute('href', expect.stringContaining('rosa-windows.zip'))
  })

  test('should call onDownloadClick callback when download button is clicked', async () => {
    const mockOnDownloadClick = jest.fn()
    render(<DownloadAndOSSelection onDownloadClick={mockOnDownloadClick} />)

    const downloadButton = screen.getByText('Download the ROSA CLI')
    await clickElement(downloadButton)

    expect(mockOnDownloadClick).toHaveBeenCalledWith(expect.stringContaining('rosa-'), expect.any(String))
  })

  test('should have correct download URL for Linux', () => {
    Object.defineProperty(window.navigator, 'platform', { value: 'Linux', configurable: true })
    render(<DownloadAndOSSelection />)

    const downloadLink = screen.getByText('Download the ROSA CLI').closest('a')
    expect(downloadLink).toHaveAttribute('href', expect.stringContaining('rosa-linux.tar.gz'))
  })

  test('should have no accessibility violations', async () => {
    const { container } = render(<DownloadAndOSSelection />)

    expect(await axe(container)).toHaveNoViolations()
  })
})
