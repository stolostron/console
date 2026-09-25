/* Copyright Contributors to the Open Cluster Management project */

import { SelectOption } from '@patternfly/react-core'
import { render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { SelectVariant } from '../../components/AcmSelectBase'
import { AcmForm, AcmSubmit } from '../AcmForm/AcmForm'
import { AcmSelect } from './AcmSelect'
import { clickElement, typeElement } from '~/lib/test-util'

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
    await clickElement(
      screen.getByRole('combobox', {
        name: 'ACM select',
      })
    )
    await waitFor(() => expect(screen.getByText(/red/i)).toBeVisible())
    await clickElement(
      screen.getByRole('option', {
        name: /red/i,
      })
    )
    await waitFor(() => expect(screen.getByText(/red/i)).toBeVisible())
    await clickElement(
      screen.getByRole('button', {
        name: /clear input value/i,
      })
    )
    expect(queryByText('Red')).toBeNull()
  })

  test('typeahead variant shows placeholder text', async () => {
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

  test('select menu is scrollable so long option lists do not overflow (ACM-44806)', async () => {
    const ManyOptionsSelect = () => {
      const [value, setValue] = useState<string>()
      const options = Array.from({ length: 40 }, (_, index) => `namespace-${index}`)
      return (
        <AcmSelect id="acm-select" label="ACM select" value={value} onChange={setValue} placeholder="Select one">
          {options.map((option) => (
            <SelectOption key={option} value={option}>
              {option}
            </SelectOption>
          ))}
        </AcmSelect>
      )
    }

    render(<ManyOptionsSelect />)
    await clickElement(
      screen.getByRole('combobox', {
        name: 'ACM select',
      })
    )
    await waitFor(() => expect(screen.getByText('namespace-0')).toBeVisible())
    const menu = document.querySelector('.pf-v6-c-menu')
    expect(menu).toBeInTheDocument()
    expect(menu).toHaveClass('pf-m-scrollable')
  })

  test('typeahead variant disables browser autocomplete on the input (ACM-42794)', async () => {
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
        </AcmSelect>
      )
    }
    const { getByPlaceholderText } = render(<TypeaheadSelect />)
    expect(getByPlaceholderText('Select one')).toHaveAttribute('autocomplete', 'off')
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
    await clickElement(getByText('Submit'))
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    await clickElement(
      screen.getByRole('combobox', {
        name: 'label',
      })
    )
    await clickElement(getAllByRole('option')[0])
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
    await clickElement(getByText('Submit'))
    expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    await clickElement(
      screen.getByRole('combobox', {
        name: 'label',
      })
    )
    await clickElement(getAllByRole('option')[0])
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
    await clickElement(getByText('Submit'))
    expect(mockFn).toHaveBeenCalled()
  })

  describe('typeahead multi variant', () => {
    const TypeaheadMultiSelect = () => {
      const [value, setValue] = useState<string>()
      return (
        <AcmSelect
          variant={SelectVariant.typeaheadMulti}
          id="acm-select"
          label="ACM select"
          value={value}
          onChange={setValue}
          placeholder="Select one"
          isCreatable
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

    it('shows placeholder text', async () => {
      // Act
      const { getByPlaceholderText } = render(<TypeaheadMultiSelect />)

      // Assert
      expect(getByPlaceholderText('Select one')).toBeInTheDocument()
    })

    it('is able to create a new option', async () => {
      // Arrange
      const onChangeMock = jest.fn()
      const TypeaheadMultiSelectWithMock = () => {
        const [value, setValue] = useState<string>()
        const handleChange = (newValue: string | undefined) => {
          setValue(newValue)
          onChangeMock(newValue)
        }
        return (
          <AcmSelect
            variant={SelectVariant.typeaheadMulti}
            id="acm-select"
            label="ACM select"
            value={value}
            onChange={handleChange}
            placeholder="Select one"
            isCreatable
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
      const { getByPlaceholderText, getAllByRole } = render(<TypeaheadMultiSelectWithMock />)

      // Act
      await typeElement(getByPlaceholderText('Select one'), 'Yellow')

      // Assert
      await waitFor(() => expect(screen.getByText(/create new yellow/i)).toBeVisible())
      await clickElement(getAllByRole('option')[0])
      await waitFor(() => {
        expect(onChangeMock).toHaveBeenCalledWith('Yellow')
      })
    })
  })
})
