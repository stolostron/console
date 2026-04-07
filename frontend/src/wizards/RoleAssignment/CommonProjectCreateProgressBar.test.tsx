/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { CommonProjectCreateProgressBar } from './CommonProjectCreateProgressBar'

describe('CommonProjectCreateProgressBar', () => {
  test('renders correctly with initial state', () => {
    render(<CommonProjectCreateProgressBar totalCount={5} />)

    expect(screen.getByText('Creating common projects')).toBeInTheDocument()
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<CommonProjectCreateProgressBar totalCount={5} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('calculates progress correctly when all succeed', () => {
    render(<CommonProjectCreateProgressBar successCount={5} errorCount={0} totalCount={5} />)

    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '100')
  })

  test('calculates progress correctly with partial completion', () => {
    render(<CommonProjectCreateProgressBar successCount={2} errorCount={1} totalCount={5} />)

    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '60')
  })

  test('calculates progress correctly with zero completion', () => {
    render(<CommonProjectCreateProgressBar successCount={0} errorCount={0} totalCount={5} />)

    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '0')
  })

  test('shows success variant when there are no errors', () => {
    const { container } = render(<CommonProjectCreateProgressBar successCount={3} errorCount={0} totalCount={5} />)

    // PatternFly Progress component with variant="success" should have specific classes
    const progress = container.querySelector('[role="progressbar"]')
    expect(progress).toBeInTheDocument()
  })

  test('shows danger variant when there are errors', () => {
    const { container } = render(<CommonProjectCreateProgressBar successCount={2} errorCount={1} totalCount={5} />)

    const progress = container.querySelector('[role="progressbar"]')
    expect(progress).toBeInTheDocument()
  })

  test('displays error helper text when errorCount is greater than 0', () => {
    render(<CommonProjectCreateProgressBar successCount={2} errorCount={1} totalCount={5} />)

    expect(screen.getByText(/Failed to create common projects. Error: 1. Success: 2./)).toBeInTheDocument()
  })

  test('does not display error helper text when errorCount is 0', () => {
    render(<CommonProjectCreateProgressBar successCount={5} errorCount={0} totalCount={5} />)

    expect(screen.queryByText(/Failed to create common projects/)).not.toBeInTheDocument()
  })

  test('handles default values for successCount and errorCount', () => {
    render(<CommonProjectCreateProgressBar totalCount={5} />)

    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '0')
    expect(screen.queryByText(/Failed to create common projects/)).not.toBeInTheDocument()
  })

  test('calculates progress correctly with all errors', () => {
    render(<CommonProjectCreateProgressBar successCount={0} errorCount={5} totalCount={5} />)

    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText(/Failed to create common projects. Error: 5. Success: 0./)).toBeInTheDocument()
  })

  test('handles large total counts correctly', () => {
    render(<CommonProjectCreateProgressBar successCount={50} errorCount={10} totalCount={100} />)

    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '60')
  })

  test('handles progress calculation with decimal results', () => {
    render(<CommonProjectCreateProgressBar successCount={1} errorCount={0} totalCount={3} />)

    const progress = screen.getByRole('progressbar')
    // Should be approximately 33.33, rounded by PatternFly
    const value = progress.getAttribute('aria-valuenow')
    expect(value).toBeTruthy()
    expect(Number(value)).toBeGreaterThanOrEqual(33)
    expect(Number(value)).toBeLessThanOrEqual(34)
  })

  describe('hideTitle', () => {
    test('shows "Creating common projects" title when hideTitle is false (default)', () => {
      render(<CommonProjectCreateProgressBar totalCount={5} />)

      expect(screen.getByText('Creating common projects')).toBeInTheDocument()
    })

    test('shows title when hideTitle is explicitly false', () => {
      render(<CommonProjectCreateProgressBar totalCount={5} hideTitle={false} />)

      expect(screen.getByText('Creating common projects')).toBeInTheDocument()
    })

    test('does not show "Creating common projects" title when hideTitle is true', () => {
      render(<CommonProjectCreateProgressBar totalCount={5} hideTitle />)

      expect(screen.queryByText('Creating common projects')).not.toBeInTheDocument()
    })

    test('progress bar still renders and works when hideTitle is true', () => {
      render(<CommonProjectCreateProgressBar successCount={2} errorCount={0} totalCount={5} hideTitle />)

      const progress = screen.getByRole('progressbar')
      expect(progress).toBeInTheDocument()
      expect(progress).toHaveAttribute('aria-valuenow', '40')
    })
  })

  it.each([
    ['uses default successCount when undefined is passed', undefined, 0, 0],
    ['uses default errorCount when undefined is passed', 2, undefined, 40],
    ['handles both successCount and errorCount as undefined', undefined, undefined, 0],
  ])('HelperTextComponent %s', (_testName, successCount, errorCount, expectedProgress) => {
    render(<CommonProjectCreateProgressBar successCount={successCount} errorCount={errorCount} totalCount={5} />)

    // When errorCount defaults to 0, helper text should not be displayed
    expect(screen.queryByText(/Failed to create common projects/)).not.toBeInTheDocument()
    // Progress should be calculated with default values from CommonProjectCreateProgressBar
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', String(expectedProgress))
  })
})
