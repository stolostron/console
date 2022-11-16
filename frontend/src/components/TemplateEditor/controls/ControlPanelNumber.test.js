/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelNumber from './ControlPanelNumber'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from 'i18next'

const t = i18n.t.bind(i18n)

export const control = {
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    controlData: [],
    id: 'name',
    type: 'number',
    initial: '3',
}
const fn = jest.fn()

describe('ControlPanelNumber component', () => {
    it('renders as expected', () => {
        const Component = () => {
            return (
                <ControlPanelNumber key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />
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
})
