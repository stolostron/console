/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelCheckbox from './ControlPanelCheckbox'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import i18n from 'i18next'

const t = i18n.t.bind(i18n)

export const control = {
    active: false,
    name: 'Name',
    tooltip: 'Application name',
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
                    i18n={t}
                />
            )
        }

        const { getByTestId, asFragment, rerender } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()

        userEvent.click(getByTestId('controlId'))
        expect(control.active).toBe(true)

        control.active = 'true'
        rerender(<Component />)
        userEvent.click(getByTestId('controlId'))
        expect(control.active).toBe(false)
    })
})
