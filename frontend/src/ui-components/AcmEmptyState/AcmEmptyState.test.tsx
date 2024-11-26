/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmEmptyState } from './AcmEmptyState'
import { LoadStatusContext } from '../../components/LoadStatusProvider'

describe('AcmEmptyState', () => {
  test('renders with action', () => {
    const { getByText } = render(
      <LoadStatusContext.Provider
        value={{
          loadStarted: true,
          loadCompleted: true,
        }}
      >
        <AcmEmptyState title="Empty state title" message="Empty state message" action="Empty state action" />
      </LoadStatusContext.Provider>
    )
    expect(getByText('Empty state title')).toBeInTheDocument()
    expect(getByText('Empty state action')).toBeInstanceOf(HTMLDivElement)
  })
  test('renders without action', () => {
    const { container } = render(<AcmEmptyState title="Empty state title" message="Empty state message" />)
    expect(container.querySelector('button')).toBeNull()
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<AcmEmptyState title="Empty state title" message="Empty state message" />)
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders with imageOverride', async () => {
    const { container, getByText } = render(
      <LoadStatusContext.Provider
        value={{
          loadStarted: true,
          loadCompleted: true,
        }}
      >
        <AcmEmptyState title="Empty state title" message="Empty state message" action="Empty state action" />
      </LoadStatusContext.Provider>
    )
    expect(getByText('Empty state title')).toBeInTheDocument()
    expect(container.querySelector('button')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })
})
