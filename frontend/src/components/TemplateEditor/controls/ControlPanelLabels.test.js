/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelLabels from './ControlPanelLabels'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from 'i18next'

const t = i18n.t.bind(i18n)

export const control = {
  name: 'creation.app.name',
  tooltip: 'tooltip.creation.app.name',
  controlData: [],
  id: 'name',
  type: 'labels',
}
const fn = jest.fn()

describe('ControlPanelLabels component', () => {
  it('renders as expected', () => {
    const Component = () => {
      return <ControlPanelLabels key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />
    }
    const { getByTestId, getByRole, asFragment } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()

    userEvent.type(getByTestId('controlId'), 'label=test{enter}')
    expect(control.active).toEqual([{ key: 'label', value: 'test' }])
    userEvent.type(getByTestId('controlId'), 'label=test2{enter}')
    userEvent.click(getByRole('button', { name: 'Close label=test' }))
    expect(control.active).toEqual([])
    userEvent.type(getByTestId('controlId'), 'label=test,')
    userEvent.type(getByTestId('controlId'), 'label={esc}')
    userEvent.type(getByTestId('controlId'), '{backspace}')
    expect(control.active).toEqual([])
    getByTestId('controlId').blur()
  })
})
