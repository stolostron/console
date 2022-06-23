'use strict'

import React from 'react'
import ControlPanelCheckbox from './ControlPanelCheckbox'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export const control = {
    active: false,
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    controlData: [],
    id: 'checkbox',
    type: 'checkbox',
}

const fn = jest.fn()

describe('ControlPanelCheckbox component', () => {
    it('renders as expected', () => {
        const Component = () => {
            return (
                <ControlPanelCheckbox
                    key={'key'}
                    control={control}
                    controlId={'controlId'}
                    handleChange={fn}
                    i18n={fn}
                />
            )
        }

        const { getByTestId, asFragment, rerender } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()

        userEvent.click(getByTestId('checkbox-controlId'))
        expect(control.active).toBe(true)

        control.active = 'true'
        rerender(<Component />)
        userEvent.click(getByTestId('checkbox-controlId'))
        expect(control.active).toBe(false)
    })
})
