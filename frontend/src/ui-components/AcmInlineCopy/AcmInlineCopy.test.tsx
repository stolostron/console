/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmInlineCopy } from './AcmInlineCopy'
import { clickElement } from '~/lib/test-util'

document.execCommand = jest.fn()

describe('AcmInlineCopy', () => {
  test('renders', async () => {
    const { getByTestId, container } = render(<AcmInlineCopy text="copy text" id="copy" />)
    expect(getByTestId('copy')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
    await clickElement(getByTestId('copy'))
    expect(document.execCommand).toHaveBeenCalled()
  })
  test('renders with display text', async () => {
    const { getByText, getByTestId, container } = render(
      <AcmInlineCopy displayText="Non-copy text" text="copy text" id="copy" />
    )
    expect(getByTestId('copy')).toBeInTheDocument()
    expect(getByText('Non-copy text')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
    await clickElement(getByTestId('copy'))
    expect(document.execCommand).toHaveBeenCalled()
  })
})
