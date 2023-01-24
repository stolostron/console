/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelMultiSelect from './ControlPanelMultiSelect'
import { render } from '@testing-library/react'

import i18n from 'i18next'

const t = i18n.t.bind(i18n)

export const control = {
  active: false,
  name: 'creation.app.name',
  tooltip: 'tooltip.creation.app.name',
  controlData: [],
  id: 'checkbox',
  type: 'checkbox',
}

describe('ControlPanelMultiSelect component', () => {
  it('renders as expected', () => {
    const fn = jest.fn()

    const Component = () => {
      return (
        <ControlPanelMultiSelect key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />
      )
    }
    const { asFragment } = render(<Component />)
    expect(asFragment()).toMatchSnapshot()
  })
})
