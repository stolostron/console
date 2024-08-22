/* Copyright Contributors to the Open Cluster Management project */

import { SelectOption, SelectVariant } from '@patternfly/react-core/deprecated'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { AcmForm, AcmSubmit } from '../AcmForm/AcmForm'
import { AcmSelect } from './AcmSelect'

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

  test('can apply and clear selections', () => {
    const { container, getByRole, getByText, getAllByRole, queryByTestId, queryByText } = render(<Select />)
    expect(queryByText('Select one')).toBeVisible()
    container.querySelector<HTMLButtonElement>('.pf-v5-c-select__toggle')?.click()
    expect(getByText('Red')).toBeVisible()
    getAllByRole('option')[0].click()
    expect(getByText('Red')).toBeVisible()
    getByRole('button', { name: 'Clear all' }).click()
    expect(queryByTestId('acm-select')).toBeNull()
    expect(queryByText('Red')).toBeNull()
  })

  test('typeahead varient shows placeholder text', () => {
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
    const { container } = render(<TypeaheadSelect />)
    expect(container.querySelector<HTMLInputElement>('.pf-v5-c-select__toggle-typeahead')).toHaveAttribute(
      'placeholder',
      'Select one'
    )
  })

  test('has zero accessibility defects', async () => {
    const { getByRole, container } = render(<Select />)
    expect(await axe(container)).toHaveNoViolations()

    userEvent.click(getByRole('button'))
    expect(await axe(container)).toHaveNoViolations()
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
    const { getByText, getByTestId, getAllByRole, container } = render(<Component />)
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    getByText('Submit').click()
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    container.querySelector<HTMLButtonElement>('.pf-v5-c-select__toggle')?.click()
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
    const { getByText, getByTestId, getAllByRole, container } = render(<Component />)
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    getByText('Submit').click()
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    container.querySelector<HTMLButtonElement>('.pf-v5-c-select__toggle')?.click()
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
