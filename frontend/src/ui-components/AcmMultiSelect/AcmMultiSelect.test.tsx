/* Copyright Contributors to the Open Cluster Management project */

import { SelectOption } from '@patternfly/react-core'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { AcmForm, AcmSubmit } from '../AcmForm/AcmForm'
import { AcmMultiSelect } from './AcmMultiSelect'

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

  test('can apply and clear selections', async () => {
    const { container, getByRole } = render(<Select />)

    expect(container.querySelector<HTMLSpanElement>('.pf-v6-c-badge')).toBeNull()
    userEvent.click(
      screen.getByRole('combobox', {
        name: /ACM select/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /red/i,
      })
    )
    await waitFor(() => {
      expect(container.querySelector<HTMLSpanElement>('.pf-v6-c-badge')).toHaveTextContent('1')
    })
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /green/i,
      })
    )
    await waitFor(() => {
      expect(container.querySelector<HTMLSpanElement>('.pf-v6-c-badge')).toHaveTextContent('2')
    })
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /green/i,
      })
    )
    await waitFor(() => {
      expect(container.querySelector<HTMLSpanElement>('.pf-v6-c-badge')).toHaveTextContent('1')
    })

    userEvent.click(getByRole('button', { name: 'Clear input value' }))
    await waitFor(() => {
      expect(container.querySelector<HTMLSpanElement>('.pf-v6-c-badge')).toBeNull()
    })
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
    const { getByText, getByTestId } = render(<Component />)
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    userEvent.click(getByText('Submit'))
    await waitFor(() => {
      expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    })
    userEvent.click(
      screen.getByRole('combobox', {
        name: /label/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /red/i,
      })
    )
    await waitFor(() => {
      expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    })
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
    const { getByText, getByTestId } = render(<Component />)
    expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    userEvent.click(getByText('Submit'))
    await waitFor(() => {
      expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    })
    userEvent.click(
      screen.getByRole('combobox', {
        name: /label/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /red/i,
      })
    )
    await waitFor(() => {
      expect(getByTestId('input-label')).not.toContainHTML('pf-m-error')
    })
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /red/i,
      })
    )
    await waitFor(() => {
      expect(getByTestId('input-label')).toContainHTML('pf-m-error')
    })
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

  test('hides component when hidden prop is true', () => {
    const HiddenSelect = () => {
      const [value, setValue] = useState<string[]>()
      return (
        <AcmMultiSelect id="acm-select" label="ACM select" value={value} onChange={setValue} hidden>
          <SelectOption key="red" value="red">
            Red
          </SelectOption>
        </AcmMultiSelect>
      )
    }
    const { queryByTestId, queryByText } = render(<HiddenSelect />)
    expect(queryByTestId('acm-select-label')).toBeNull()
    expect(queryByText('ACM select')).toBeNull()
  })

  test('shows component when hidden prop is false', () => {
    const VisibleSelect = () => {
      const [value, setValue] = useState<string[]>()
      return (
        <AcmMultiSelect id="acm-select" label="ACM select" value={value} onChange={setValue} hidden={false}>
          <SelectOption key="red" value="red">
            Red
          </SelectOption>
        </AcmMultiSelect>
      )
    }
    const { getByTestId, getByText } = render(<VisibleSelect />)
    expect(getByTestId('acm-select-label')).toBeVisible()
    expect(getByText('ACM select')).toBeInTheDocument()
  })
})
