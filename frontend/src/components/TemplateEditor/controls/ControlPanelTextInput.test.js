/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelTextInput from './ControlPanelTextInput'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export const control = {
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    controlData: [],
    id: 'name',
    type: 'text',
}
const fn = jest.fn()

describe('ControlPanelTextInput component', () => {
    it('renders as expected', () => {
        const Component = () => {
            return (
                <ControlPanelTextInput
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

        userEvent.type(getByTestId('controlId'), 'n')
        expect(control.active).toBe('n')

        control.name = ''
        control.exception = 'error'
        rerender(<Component />)
        control.placeholder = 'placeholder'
        rerender(<Component />)
        expect(asFragment()).toMatchSnapshot()
    })
})
