/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelLabels from './ControlPanelLabels'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from 'i18next'

const t = i18n.t.bind(i18n)

export const control = {
  name: 'Additional labels',
  tooltip: 'tooltip.creation.app.name',
  controlData: [],
  id: 'name',
  type: 'labels',
  active: [],
}
const fn = jest.fn()

describe('ControlPanelLabels component', () => {
  beforeEach(() => {
    control.active = []
    control.exception = ''
    fn.mockClear()
  })

  it('renders key, value, and Add controls', () => {
    const { asFragment } = render(
      <ControlPanelLabels key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />
    )
    expect(screen.getByTestId('label-key-controlId')).toBeInTheDocument()
    expect(screen.getByTestId('label-value-controlId')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    expect(asFragment()).toMatchSnapshot()
  })

  it('adds a label with Add and removes it from the group', async () => {
    const user = userEvent.setup()
    render(<ControlPanelLabels key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />)

    await user.type(screen.getByTestId('label-key-controlId'), 'label')
    await user.type(screen.getByTestId('label-value-controlId'), 'test')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(control.active).toEqual([{ key: 'label', value: 'test' }])
    expect(fn).toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Close label=test' }))
    expect(control.active).toEqual([])
  })

  it('adds a label on Enter', async () => {
    const user = userEvent.setup()
    render(<ControlPanelLabels key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />)

    await user.type(screen.getByTestId('label-key-controlId'), 'env')
    await user.type(screen.getByTestId('label-value-controlId'), 'prod{Enter}')

    expect(control.active).toEqual([{ key: 'env', value: 'prod' }])
  })

  it('clears drafts on Escape', async () => {
    const user = userEvent.setup()
    render(<ControlPanelLabels key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />)

    await user.type(screen.getByTestId('label-key-controlId'), 'label')
    await user.type(screen.getByTestId('label-value-controlId'), 'test{Escape}')

    expect(screen.getByTestId('label-key-controlId')).toHaveValue('')
    expect(screen.getByTestId('label-value-controlId')).toHaveValue('')
    expect(control.active).toEqual([])
  })
})
