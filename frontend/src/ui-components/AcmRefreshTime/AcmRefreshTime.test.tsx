/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmRefreshTime } from './AcmRefreshTime'

// Mock AcmTimestamp component
jest.mock('../../lib/AcmTimestamp', () => ({
  __esModule: true,
  default: () => <span data-testid="timestamp">7:00:00 PM</span>,
}))

describe('AcmRefreshTime', () => {
  const mockTimestamp = '2024-02-14T19:00:00Z'

  describe('with reloading state', () => {
    test('validates reloading spinner is present', () => {
      render(<AcmRefreshTime timestamp={mockTimestamp} reloading={true} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    test('has zero accessibility defects', async () => {
      const { container } = render(<AcmRefreshTime timestamp={mockTimestamp} reloading={true} />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })

  describe('without reloading state', () => {
    test('validates RefreshTime component renders', () => {
      render(<AcmRefreshTime timestamp={mockTimestamp} />)

      expect(screen.getByText('Last update:')).toBeInTheDocument()
    })

    test('has zero accessibility defects', async () => {
      const { container } = render(<AcmRefreshTime timestamp={mockTimestamp} />)
      expect(await axe(container)).toHaveNoViolations()
    })
  })
})
