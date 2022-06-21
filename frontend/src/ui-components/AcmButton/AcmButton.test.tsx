/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { AcmButton } from './AcmButton'

describe('AcmButton', () => {
    test('renders', () => {
        const { getByText } = render(<AcmButton onClick={() => null}>Button Label</AcmButton>)
        expect(getByText('Button Label')).toBeInTheDocument()
        expect(getByText('Button Label')).toBeInstanceOf(HTMLButtonElement)
    })
    test('renders with tooltip', async () => {
        const { getByText } = render(
            <AcmButton onClick={() => null} isDisabled={true} tooltip="Tooltip text">
                Button Label
            </AcmButton>
        )
        userEvent.tab()
        userEvent.hover(getByText('Button Label'))
        expect(getByText('Button Label')).toHaveFocus()
        await waitFor(() => expect(screen.getByRole('tooltip')).toBeInTheDocument())
        userEvent.unhover(getByText('Button Label'))
        await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
        await new Promise((resolve) => setTimeout(resolve, 0))
    })
    test('has zero accessibility defects', async () => {
        const { container } = render(<AcmButton onClick={() => null}>Button Label</AcmButton>)
        expect(await axe(container)).toHaveNoViolations()
    })
})
