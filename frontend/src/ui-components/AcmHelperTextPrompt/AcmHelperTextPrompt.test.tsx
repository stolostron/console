/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { AcmSelect } from '../AcmSelect'
import { AcmHelperTextPrompt } from './AcmHelperTextPrompt'
import { clickElement } from '~/lib/test-util'

describe('AcmHelperTextPrompt renders', () => {
  test('renders', async () => {
    const { getByText } = render(
      <AcmSelect
        id="test-select"
        label="test-select"
        onChange={() => {}}
        value={''}
        helperText={AcmHelperTextPrompt({
          prompt: { label: 'Visit selected value', href: '/test-url', isDisabled: false },
        })}
      ></AcmSelect>
    )
    expect(getByText('Visit selected value')).toBeInTheDocument()
    window.open = jest.fn()
    await clickElement(getByText('Visit selected value'))
    expect(window.open).toHaveBeenCalledWith('/test-url')
  })
  test('renders with helper text', async () => {
    const { getByText } = render(
      <AcmSelect
        id="test-select"
        label="test-select"
        onChange={() => {}}
        value={''}
        helperText={AcmHelperTextPrompt({
          helperText: "I'm here to help",
          prompt: { label: 'Visit selected value', href: '/test-url', isDisabled: true },
        })}
      ></AcmSelect>
    )
    expect(getByText('Visit selected value')).toBeInTheDocument()
    expect(getByText("I'm here to help")).toBeInTheDocument()
  })
})
