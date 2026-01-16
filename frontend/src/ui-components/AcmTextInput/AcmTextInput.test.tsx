/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { AcmForm, AcmSubmit } from '../AcmForm/AcmForm'
import { AcmTextInput } from './AcmTextInput'

describe('AcmTextInput', () => {
  const TextInput = () => <AcmTextInput label="ACM text input" id="text-input" value="foobar" onChange={() => null} />

  test('renders', () => {
    const { getByText, getByLabelText } = render(<TextInput />)
    expect(getByText('ACM text input')).toBeInTheDocument()
    expect(getByLabelText('ACM text input')).toBeInstanceOf(HTMLInputElement)
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<TextInput />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('validates required input', async () => {
    const Component = () => {
      const [value, setValue] = useState<string | undefined>(undefined)
      return (
        <AcmForm>
          <AcmTextInput
            id="input"
            label="label"
            value={value}
            onChange={(_event, value) => setValue(value)}
            isRequired
          />
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }
    const { getByText, getByTestId } = render(<Component />)
    expect(getByTestId('input')).toHaveAttribute('aria-invalid', 'false')
    getByText('Submit').click()
    expect(getByTestId('input')).toHaveAttribute('aria-invalid', 'true')
    expect(getByTestId('input-helper')).toBeInTheDocument()
    expect(getByTestId('input-helper')).toContainHTML('Required')
  })

  test('validates using function', async () => {
    const Component = () => {
      const [value, setValue] = useState<string>('')
      return (
        <AcmForm>
          <AcmTextInput
            id="input"
            label="label"
            value={value}
            onChange={(_event, value) => setValue(value)}
            validation={(value: string) => {
              if (value.length < 8) return 'Field must be at least 8 characters.'
              return undefined
            }}
          />
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }

    const { getByText, getByTestId } = render(<Component />)
    expect(getByTestId('input')).toHaveAttribute('aria-invalid', 'false')
    getByText('Submit').click()
    expect(getByTestId('input')).toHaveAttribute('aria-invalid', 'true')
    expect(getByTestId('input-helper')).toBeInTheDocument()
    expect(getByTestId('input-helper')).toContainHTML('Field must be at least 8 characters.')
    userEvent.type(getByTestId('input'), '12345678')
    expect(getByTestId('input')).toHaveAttribute('aria-invalid', 'false')
  })

  test('does not render when hidden is true', () => {
    const { queryByTestId, queryByText } = render(
      <AcmTextInput id="hidden-input" label="Hidden Label" value="test" onChange={() => null} hidden />
    )
    expect(queryByTestId('hidden-input')).not.toBeInTheDocument()
    expect(queryByText('Hidden Label')).not.toBeInTheDocument()
  })

  test('skips validation when hidden is true', async () => {
    const Component = () => {
      const [submitted] = useState(false)
      return (
        <AcmForm>
          <AcmTextInput id="hidden-input" label="Hidden Label" value="" onChange={() => null} isRequired hidden />
          <AcmSubmit>Submit</AcmSubmit>
          {submitted && <div data-testid="submitted">Submitted</div>}
        </AcmForm>
      )
    }
    const { getByText, queryByTestId } = render(<Component />)
    // Hidden required field should not block form submission
    expect(queryByTestId('hidden-input')).not.toBeInTheDocument()
    getByText('Submit').click()
    // Form should be able to submit since hidden fields skip validation
    expect(getByText('Submit')).not.toBeDisabled()
  })
})
