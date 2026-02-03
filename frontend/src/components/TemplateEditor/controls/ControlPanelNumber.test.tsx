/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { cleanup, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ControlPanelNumber from './ControlPanelNumber'

import i18n from 'i18next'

const t = i18n.t.bind(i18n)
const fn = jest.fn()

describe('ControlPanelNumber component', () => {
  afterEach(cleanup)
  it('renders as expected', () => {
    const control: {
      name: string
      tooltip: string
      controlData: unknown[]
      id: string
      type: string
      initial: string
      active?: string
      exception?: string
    } = {
      name: 'creation.app.name',
      tooltip: 'tooltip.creation.app.name',
      controlData: [],
      id: 'name',
      type: 'number',
      initial: '3',
    }
    const Component = () => {
      return (
        <ControlPanelNumber
          key={'key'}
          control={control}
          controlData={control.controlData}
          controlId={'controlId'}
          handleChange={fn}
          i18n={t}
        />
      )
    }
    const { getByTestId, asFragment, rerender } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()

    userEvent.type(getByTestId('controlId'), '3')
    expect(control.active).toBe('3')
    userEvent.click(getByTestId('up-controlId'))
    expect(control.active).toBe('4')
    control.active = '0'
    control.exception = 'error'
    rerender(<Component />)
    expect(asFragment()).toMatchSnapshot()
    userEvent.click(getByTestId('down-controlId'))
    expect(control.active).toBe('0')
  })
  it('renders as expected with min int value', () => {
    const control: {
      name: string
      tooltip: string
      controlData: unknown[]
      id: string
      type: string
      initial: string
      min: number
      active?: string
    } = {
      name: 'creation.app.name',
      tooltip: 'tooltip.creation.app.name',
      controlData: [],
      id: 'name-min',
      type: 'number',
      initial: '3',
      min: 1,
    }
    const Component = () => {
      return (
        <ControlPanelNumber
          key={'key'}
          control={control}
          controlData={control.controlData}
          controlId={'controlId-min'}
          handleChange={fn}
          i18n={t}
        />
      )
    }
    const { getByTestId } = render(<Component />)

    userEvent.type(getByTestId('controlId-min'), '2')
    expect(control.active).toBe('2')
    userEvent.click(getByTestId('down-controlId-min'))
    expect(control.active).toBe('1')
    userEvent.click(getByTestId('down-controlId-min'))
    expect(control.active).toBe('1')
  })
})
