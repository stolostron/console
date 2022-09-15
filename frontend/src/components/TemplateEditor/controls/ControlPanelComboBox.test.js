/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelComboBox from './ControlPanelComboBox'
import { render, fireEvent, waitFor } from '@testing-library/react'

export const control = {
    active: 'typed',
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    controlData: [],
    availableMap: {},
    hasReplacements: false,
    id: 'checkbox',
    type: 'checkbox',
}

describe('ControlPanelComboBox component', () => {
    it('renders as expected', async () => {
        const fn = jest.fn()

        const Component = () => {
            return (
                <ControlPanelComboBox
                    key={'key'}
                    control={control}
                    controlId={'controlId'}
                    handleChange={fn}
                    i18n={fn}
                />
            )
        }
        const { asFragment, getByTestId } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()

        // click on input
        const input = getByTestId('controlId')
        fireEvent(
            input,
            new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                x: 100,
                y: 0,
            })
        )
        await waitFor(() => expect(input.value).toBe('typed'))
    })
})
