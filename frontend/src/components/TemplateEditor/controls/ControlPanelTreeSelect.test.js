'use strict'

import React from 'react'
import ControlPanelTreeSelect from './ControlPanelTreeSelect'
import { render } from '@testing-library/react'

export const control = {
    active: false,
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    controlData: [],
    id: 'checkbox',
    type: 'checkbox',
}

describe('ControlPanelTreeSelect component', () => {
    it('renders as expected', () => {
        const fn = jest.fn()

        const Component = () => {
            return (
                <ControlPanelTreeSelect
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
