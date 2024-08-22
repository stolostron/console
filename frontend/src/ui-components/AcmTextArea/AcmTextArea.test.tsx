/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { AcmForm, AcmSubmit } from '../AcmForm/AcmForm'
import { AcmTextArea } from './AcmTextArea'

describe('AcmTextArea', () => {
  const TextArea = () => <AcmTextArea label="ACM text Area" id="text-Area" value="foobar" onChange={() => null} />

  test('renders', () => {
    const { getByText, getByLabelText } = render(<TextArea />)
    expect(getByText('ACM text Area')).toBeInTheDocument()
    expect(getByLabelText('ACM text Area')).toBeInstanceOf(HTMLTextAreaElement)
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<TextArea />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('validates required Area', async () => {
    const Component = () => {
      const [value, setValue] = useState<string | undefined>(undefined)
      return (
        <AcmForm>
          <AcmTextArea
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
    userEvent.type(getByTestId('input'), '12345678')
    expect(getByTestId('input')).toHaveAttribute('aria-invalid', 'false')
  })

  test('validates using function', async () => {
    const Component = () => {
      const [value, setValue] = useState<string>('')
      return (
        <AcmForm>
          <AcmTextArea
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
})
