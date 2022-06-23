'use strict'

import React from 'react'
import ControlPanelNumber from './ControlPanelNumber'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
                <ControlPanelNumber key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={fn} />
            )
        }
        const { getByTestId, asFragment, rerender } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()

        userEvent.type(getByTestId('number-controlId'), '3')
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
