/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import ControlPanelMultiTextInput from './ControlPanelMultiTextInput'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from 'i18next'
import { getIPValidator } from '../utils/validation-types'
const t = i18n.t.bind(i18n)

export const control = {
  tooltip: 'Add the ingress to be created',
  id: 'ingressVIP',
  type: 'multitext',
  name: 'IngressVIPs',
  placeholder: 'Enter ingressVIP',
  addButtonText: 'Add additional ingressVIP',
  active: {
    multitextEntries: [''],
  },
  controlData: [
    {
      id: 'ingressVIP',
      type: 'multitextMember',
      active: '',
      validation: {
        required: true,
      },
    },
  ],
  exception: '',
  validation: getIPValidator({
    subnet: { controlID: 'machineCIDR', groupID: 'networks' },
    differentFrom: ['apiVIP'],
  }),
}
const fn = jest.fn()

describe('ControlPanelTextInput component', () => {
  it('renders as expected', () => {
    const Component = () => {
      return (
        <ControlPanelMultiTextInput
          key={'key'}
          control={control}
          controlId={'controlId'}
          handleChange={fn}
          i18n={t}
          controlData={undefined}
          addButtonText={'Add additional ingressVIP'}
        />
      )
    }

    const { getByText, getByPlaceholderText } = render(<Component />)
    expect(getByText('IngressVIPs')).toBeInTheDocument()
    expect(getByPlaceholderText('Enter ingressVIP')).toBeInTheDocument()
    expect(getByText('Add additional ingressVIP')).toBeInTheDocument()
  })

  it('creates new fields', () => {
    const Component = () => {
      return (
        <ControlPanelMultiTextInput
          key={'key'}
          control={control}
          controlId={'controlId'}
          handleChange={fn}
          i18n={t}
          controlData={undefined}
          addButtonText={'Add additional ingressVIP'}
        />
      )
    }
    const { getByText, getAllByPlaceholderText, rerender } = render(<Component />)

    expect(getAllByPlaceholderText('Enter ingressVIP')).toHaveLength(1)
    userEvent.click(getByText('Add additional ingressVIP'))
    rerender(<Component />)
    expect(getAllByPlaceholderText('Enter ingressVIP')).toHaveLength(2)
  })

  it('deletes field', () => {
    const Component = () => {
      return (
        <ControlPanelMultiTextInput
          key={'key'}
          control={control}
          controlId={'controlId'}
          handleChange={fn}
          i18n={t}
          controlData={undefined}
          addButtonText={'Add additional ingressVIP'}
        />
      )
    }
    const { getByText, getAllByPlaceholderText, getAllByTestId, rerender } = render(<Component />)
    expect(getAllByPlaceholderText('Enter ingressVIP')).toHaveLength(2)
    userEvent.click(getByText('Add additional ingressVIP'))
    rerender(<Component />)
    expect(getAllByPlaceholderText('Enter ingressVIP')).toHaveLength(3)
    userEvent.click(getAllByTestId('remove-item')[0])
    rerender(<Component />)
    userEvent.click(getAllByTestId('remove-item')[0])
    rerender(<Component />)
    expect(getAllByPlaceholderText('Enter ingressVIP')).toHaveLength(1)
  })
})
