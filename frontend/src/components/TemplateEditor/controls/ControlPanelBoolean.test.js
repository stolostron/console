/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ControlPanelBoolean from './ControlPanelBoolean'

import i18n from 'i18next'

const t = i18n.t.bind(i18n)

export const control = {
  active: false,
  name: 'Name',
  tooltip: 'Application name',
  controlData: [],
  id: 'boolean',
  type: 'boolean',
  isTrue: false,
}

const fn = jest.fn()

describe('ControlPanelBoolean component', () => {
  it('renders as expected', () => {
    const Component = () => {
      return <ControlPanelBoolean key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />
    }

    const { getByTestId, asFragment, rerender } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()

    userEvent.click(getByTestId('controlId-true'))
    expect(control.active).toBe(true)
    expect(control.isTrue).toBe(true)

    // control.active = 'true'
    rerender(<Component />)
    userEvent.click(getByTestId('controlId-false'))
    expect(control.active).toBe(false)
    expect(control.isTrue).toBe(false)
  })
})
