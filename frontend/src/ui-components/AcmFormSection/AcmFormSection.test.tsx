/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AcmFormSection } from './AcmFormSection'

describe('AcmFormSection', () => {
    test('renders', () => {
        const { getByText } = render(<AcmFormSection title="TITLE" spacing />)
        expect(getByText('TITLE')).toBeInTheDocument()
    })

    test('renders with tooltip', async () => {
        const { getByText, getByTestId } = render(<AcmFormSection id="section" title="TITLE" tooltip="TOOLTIP" />)
        userEvent.tab()
        userEvent.hover(getByText('TITLE'))
        await waitFor(() => expect(getByTestId('section-label-help-button')).toHaveFocus())
        userEvent.unhover(getByTestId('section-label-help-button'))
    })
})
