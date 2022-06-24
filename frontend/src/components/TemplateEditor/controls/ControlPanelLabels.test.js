'use strict'

import React from 'react'
import ControlPanelLabels from './ControlPanelLabels'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export const control = {
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    controlData: [],
    id: 'name',
    type: 'labels',
}
const fn = jest.fn()
const i18n = (key) => {
    return key
}

describe('ControlPanelLabels component', () => {
    it('renders as expected', () => {
        const Component = () => {
            return (
                <ControlPanelLabels
                    key={'key'}
                    control={control}
                    controlId={'controlId'}
                    handleChange={fn}
                    i18n={i18n}
                />
            )
        }
        const { getByTestId, asFragment, container } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()

        userEvent.type(getByTestId('controlId'), 'label=test{enter}')
        expect(control.active).toEqual([{ key: 'label', value: 'test' }])
        userEvent.type(getByTestId('controlId'), 'label=test2{enter}')
        container.querySelector('.pf-c-button').click()
        expect(control.active).toEqual([])
        userEvent.type(getByTestId('controlId'), 'label=test,')
        userEvent.type(getByTestId('controlId'), 'label={esc}')
        userEvent.type(getByTestId('controlId'), '{backspace}')
        expect(control.active).toEqual([])
        getByTestId('controlId').blur()
    })
})
