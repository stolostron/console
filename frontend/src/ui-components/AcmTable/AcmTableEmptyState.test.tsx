/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmTableEmptyState } from './AcmTableEmptyState'

describe('AcmTableEmptyState', () => {
    test('renders with action', () => {
        const { getByText } = render(
            <AcmTableEmptyState title="Empty state title" message="Empty state message" action="Empty state action" />
        )
        expect(getByText('Empty state title')).toBeInTheDocument()
        expect(getByText('Empty state action')).toBeInstanceOf(HTMLButtonElement)
    })
    test('renders without action', () => {
        const { container } = render(<AcmTableEmptyState title="Empty state title" message="Empty state message" />)
        expect(container.querySelector('button')).toBeNull()
    })
    test('has zero accessibility defects', async () => {
        const { container } = render(<AcmTableEmptyState title="Empty state title" message="Empty state message" />)
        expect(await axe(container)).toHaveNoViolations()
    })
})
