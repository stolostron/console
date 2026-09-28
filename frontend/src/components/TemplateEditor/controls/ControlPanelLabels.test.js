/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelLabels from './ControlPanelLabels'
import { render } from '@testing-library/react'

import i18n from 'i18next'
import { clickElement, typeElement } from '~/lib/test-util'

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
  it('renders as expected', async () => {
    const Component = () => {
      return <ControlPanelLabels key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />
    }
    const { getByTestId, getByRole, asFragment } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()

    await typeElement(getByTestId('controlId'), 'label=test{enter}')
    expect(control.active).toEqual([{ key: 'label', value: 'test' }])
    await typeElement(getByTestId('controlId'), 'label=test2{enter}')
    await clickElement(getByRole('button', { name: 'Close label=test' }))
    expect(control.active).toEqual([])
    await typeElement(getByTestId('controlId'), 'label=test,')
    await typeElement(getByTestId('controlId'), 'label={Escape}')
    await typeElement(getByTestId('controlId'), '{backspace}')
    expect(control.active).toEqual([])
    getByTestId('controlId').blur()
  })
})
