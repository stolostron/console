/* Copyright Contributors to the Open Cluster Management project */

import { SelectOption } from '@patternfly/react-core'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { AcmForm, AcmSubmit } from '../AcmForm/AcmForm'
import { AcmMultiSelect } from './AcmMultiSelect'
import { configureAxe } from 'jest-axe'
const axe = configureAxe({
  rules: {
    // Disable this rule for https://github.com/patternfly/patternfly-react/issues/5904
    'aria-required-children': { enabled: false },
  },
})

describe('AcmMultiSelect', () => {
  const Select = () => {
    const [value, setValue] = useState<string[]>()
    return (
      <AcmMultiSelect id="acm-select" label="ACM select" value={value} onChange={setValue}>
        <SelectOption key="red" value="red">
          Red
        </SelectOption>
        <SelectOption key="green" value="green">
          Green
        </SelectOption>
      </AcmMultiSelect>
    )
  }

  test('can apply and clear selections', () => {
    const { container, getByRole } = render(<Select />)

    expect(container.querySelector<HTMLSpanElement>('.pf-c-badge')).toBeNull()
    container.querySelector<HTMLButtonElement>('.pf-c-select__toggle')?.click()

    container.querySelectorAll<HTMLInputElement>('.pf-c-check__input')[0].click()
    expect(container.querySelector<HTMLSpanElement>('.pf-c-badge')).toHaveTextContent('1')

    container.querySelectorAll<HTMLInputElement>('.pf-c-check__input')[1].click()
    expect(container.querySelector<HTMLSpanElement>('.pf-c-badge')).toHaveTextContent('2')

    container.querySelectorAll<HTMLInputElement>('.pf-c-check__input')[1].click()
    expect(container.querySelector<HTMLSpanElement>('.pf-c-badge')).toHaveTextContent('1')

    userEvent.click(getByRole('button', { name: 'Clear all' }))
    expect(container.querySelector<HTMLSpanElement>('.pf-c-badge')).toBeNull()
  })

  test('has zero accessibility defects', async () => {
    const { getByRole, container } = render(<Select />)
    expect(await axe(container)).toHaveNoViolations()

    userEvent.click(getByRole('button'))
    expect(await axe(container)).toHaveNoViolations()
  })

  test('validates required input if undefined', async () => {
    const Component = () => {
      const [value, setValue] = useState<string[] | undefined>(undefined)
      return (
        <AcmForm>
          <AcmMultiSelect id="input" label="label" value={value} onChange={setValue} isRequired>
            <SelectOption value="red">Red</SelectOption>
            <SelectOption value="green">Green</SelectOption>
          </AcmMultiSelect>
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }
    const { getByText, getByTestId, container } = render(<Component />)
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    getByText('Submit').click()
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    container.querySelector<HTMLButtonElement>('.pf-c-select__toggle')?.click()
    container.querySelector<HTMLInputElement>('.pf-c-check__input')?.click()
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
  })

  test('validates required input if empty array', async () => {
    const Component = () => {
      const [value, setValue] = useState<string[] | undefined>([])
      return (
        <AcmForm>
          <AcmMultiSelect id="input" label="label" value={value} onChange={setValue} isRequired>
            <SelectOption key="red" value="red">
              Red
            </SelectOption>
            <SelectOption key="green" value="green">
              Green
            </SelectOption>
          </AcmMultiSelect>
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }
    const { getByText, getByTestId, container } = render(<Component />)
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    getByText('Submit').click()
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    container.querySelector<HTMLButtonElement>('.pf-c-select__toggle')?.click()
    container.querySelector<HTMLInputElement>('.pf-c-check__input')?.click()
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    container.querySelector<HTMLInputElement>('.pf-c-check__input')?.click()
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
  })

  test('validates using function', async () => {
    const mockFn = jest.fn()
    const Component = () => {
      const [value, setValue] = useState<string[] | undefined>(undefined)
      return (
        <AcmForm>
          <AcmMultiSelect id="input" label="label" value={value} onChange={setValue} validation={mockFn}>
            <SelectOption key="red" value="red">
              Red
            </SelectOption>
            <SelectOption key="green" value="green">
              Green
            </SelectOption>
          </AcmMultiSelect>
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }
    const { getByText } = render(<Component />)
    getByText('Submit').click()
    expect(mockFn).toHaveBeenCalled()
  })
})
