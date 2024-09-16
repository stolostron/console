/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { AcmForm, AcmSubmit } from '../AcmForm/AcmForm'
import { AcmNumberInput } from './AcmNumberInput'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../lib/i18n';

describe('AcmNumberInput', () => {
  const NumberInput = () => <AcmNumberInput label="Number input" id="number-input" value={5} onChange={() => null} />

  test('renders', () => {
    const { getByText, getByLabelText } = render(<NumberInput />)
    expect(getByText('Number input')).toBeInTheDocument()
    expect(getByLabelText('Number input')).toBeInstanceOf(HTMLInputElement)
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(<NumberInput />)
    expect(await axe(container)).toHaveNoViolations()
  })

  test('validates required input', async () => {
    const Component = () => {
      const [value, setValue] = useState<number | undefined>(undefined)
      return (
        <AcmForm>
          <AcmNumberInput
            id="input"
            label="label"
            value={value}
            onChange={(event) => setValue(Number((event.target as HTMLInputElement).value))}
            required
          />
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }
    const { getByText, getByTestId, queryByText } = render(<Component />)
    expect(queryByText('Required')).toBeNull()
    getByText('Submit').click()
    expect(getByTestId('input-helper')).toBeInTheDocument()
    expect(getByTestId('input-helper')).toContainHTML('Required')
  })

  test('validates using function', async () => {
    const Component = () => {
      const [value, setValue] = useState<number>(0)
      return (
        <AcmForm>
          <AcmNumberInput
            id="input"
            label="label"
            value={value}
            onMinus={() => setValue(value - 1)}
            onPlus={() => setValue(value + 1)}
            validation={(value: number) => {
              if (value < 0) return 'Must be positive'
              return undefined
            }}
          />
          <AcmSubmit>Submit</AcmSubmit>
        </AcmForm>
      )
    }

    const { getByText, getByTestId, getByLabelText, queryByText } = render(<Component />)
    userEvent.click(getByLabelText('Minus'))
    getByText('Submit').click()
    expect(getByTestId('input-helper')).toBeInTheDocument()
    expect(getByTestId('input-helper')).toContainHTML('Must be positive')
    userEvent.click(getByLabelText('Plus'))
    userEvent.click(getByLabelText('Plus'))
    expect(queryByText('Must be positive')).toBeNull()
  })

  it('renders the help icon with tooltip when labelHelp is provided', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AcmNumberInput
          id="test-id"
          label="Test Label"
          labelHelp="This is a tooltip"
          required
          value={1}
          onChange={() => {}}
        />
      </I18nextProvider>
    );

     // Checking if the help icon is rendered
    const helpButton = screen.getByRole('button', { name: 'More info' });
    expect(helpButton).toBeInTheDocument();

    // Simulating a click on the help icon
    fireEvent.click(helpButton);

    // Checking if the tooltip text is rendered
    const tooltipText = await screen.findByText('This is a tooltip');
    expect(tooltipText).toBeInTheDocument();
  });


  it('does not render the help icon when labelHelp is not provided', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AcmNumberInput
          id="test-id"
          label="Test Label"
          required
          value={1}
          onChange={() => {}}
        />
      </I18nextProvider>
    );

    // Checking if the help icon is not rendered
    const helpButton = screen.queryByRole('button', { name: 'More info' });
    expect(helpButton).not.toBeInTheDocument();
  });
})
