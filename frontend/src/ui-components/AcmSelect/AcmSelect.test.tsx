/* Copyright Contributors to the Open Cluster Management project */

import { SelectOption } from '@patternfly/react-core'
import { render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { AcmForm, AcmSubmit } from '../AcmForm/AcmForm'
import { AcmSelect } from './AcmSelect'
import { SelectVariant } from '../../components/AcmSelectBase'

describe('AcmSelect', () => {
  const Select = () => {
    const [value, setValue] = useState<string>()
    return (
      <AcmSelect id="acm-select" label="ACM select" value={value} onChange={setValue} placeholder="Select one">
        <SelectOption key="red" value="red">
          Red
        </SelectOption>
        <SelectOption key="green" value="green">
          Green
        </SelectOption>
      </AcmSelect>
    )
  }

  test('can apply and clear selections', async () => {
    const { queryByText } = render(<Select />)
    expect(queryByText('Select one')).toBeVisible()
    screen
      .getByRole('combobox', {
        name: 'ACM select',
      })
      .click()
    await waitFor(() => expect(screen.getByText(/red/i)).toBeVisible())
    screen
      .getByRole('option', {
        name: /red/i,
      })
      .click()
    await waitFor(() => expect(screen.getByText(/red/i)).toBeVisible())
    screen
      .getByRole('button', {
        name: /clear input value/i,
      })
      .click()
    expect(queryByText('Red')).toBeNull()
  })

  test('typeahead varient shows placeholder text', async () => {
    const TypeaheadSelect = () => {
      const [value, setValue] = useState<string>()
      return (
        <AcmSelect
          variant={SelectVariant.typeahead}
          id="acm-select"
          label="ACM select"
          value={value}
          onChange={setValue}
          placeholder="Select one"
        >
          <SelectOption key="red" value="red">
            Red
          </SelectOption>
          <SelectOption key="green" value="green">
            Green
          </SelectOption>
        </AcmSelect>
      )
    }
    const { getByPlaceholderText } = render(<TypeaheadSelect />)
    expect(getByPlaceholderText('Select one')).toBeInTheDocument()
  })

  test('validates required input', async () => {
    const Component = () => {
      const [value, setValue] = useState<string | undefined>(undefined)
      return (
        <AcmForm>
          <AcmSelect id="input" label="label" value={value} onChange={setValue} isRequired>
            <SelectOption value="red">Red</SelectOption>
            <SelectOption value="green">Green</SelectOption>
          </AcmSelect>
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }
    const { getByText, getByTestId, getAllByRole } = render(<Component />)
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    getByText('Submit').click()
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    screen
      .getByRole('combobox', {
        name: 'label',
      })
      .click()
    getAllByRole('option')[0].click()
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
  })

  test('validates required input empty string', async () => {
    const Component = () => {
      const [value, setValue] = useState<string | undefined>('')
      return (
        <AcmForm>
          <AcmSelect id="input" label="label" value={value} onChange={setValue} isRequired>
            <SelectOption value="red">Red</SelectOption>
            <SelectOption value="green">Green</SelectOption>
          </AcmSelect>
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }
    const { getByText, getByTestId, getAllByRole } = render(<Component />)
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    getByText('Submit').click()
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    screen
      .getByRole('combobox', {
        name: 'label',
      })
      .click()
    getAllByRole('option')[0].click()
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
  })

  test('validates using function', async () => {
    const mockFn = jest.fn()
    const Component = () => {
      const [value, setValue] = useState<string | undefined>(undefined)
      return (
        <AcmForm>
          <AcmSelect id="input" label="label" value={value} onChange={setValue} validation={mockFn}>
            <SelectOption key="red" value="red">
              Red
            </SelectOption>
            <SelectOption key="green" value="green">
              Green
            </SelectOption>
          </AcmSelect>
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }
    const { getByText } = render(<Component />)
    getByText('Submit').click()
    expect(mockFn).toHaveBeenCalled()
  })
})
