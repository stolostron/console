/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'

import { AcmFormSection } from './AcmFormSection'
import { tab, hoverElement, unhoverElement } from '~/lib/test-util'

describe('AcmFormSection', () => {
  test('renders', () => {
    const { getByText } = render(<AcmFormSection title="TITLE" spacing />)
    expect(getByText('TITLE')).toBeInTheDocument()
  })

  test('renders with tooltip', async () => {
    const { getByText, getByTestId } = render(<AcmFormSection id="section" title="TITLE" tooltip="TOOLTIP" />)
    await tab()
    await hoverElement(getByText('TITLE'))
    await waitFor(() => expect(getByTestId('section-label-help-button')).toHaveFocus())
    await unhoverElement(getByTestId('section-label-help-button'))
  })
})
