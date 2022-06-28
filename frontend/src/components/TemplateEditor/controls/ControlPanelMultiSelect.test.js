/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelMultiSelect from './ControlPanelMultiSelect'
import { render } from '@testing-library/react'

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
                <ControlPanelMultiSelect
                    key={'key'}
                    control={control}
                    controlId={'controlId'}
                    handleChange={fn}
                    i18n={fn}
                />
            )
        }
        const { asFragment } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
    })
})
