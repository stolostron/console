/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import ControlPanelPrompt from './ControlPanelPrompt'
import { render } from '@testing-library/react'

import i18n from 'i18next'

const t = i18n.t.bind(i18n)

export const control = {
    name: 'creation.app.name',
    tooltip: 'tooltip.creation.app.name',
    controlData: [],
    id: 'name',
    type: 'text',
    prompts: {
        prompt: 'creation.ocp.cloud.add.connection',
        type: 'link',
        url: 'mylink',
        positionBottomRight: true,
        id: 'add-provider-connection',
    },
}
const fn = jest.fn()

describe('ControlPanelPrompt component', () => {
    it('renders as expected', () => {
        const Component = () => {
            return (
                <ControlPanelPrompt key={'key'} control={control} controlId={'controlId'} handleChange={fn} i18n={t} />
            )
        }

        const { asFragment, rerender } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
        control.prompts.type = ''
        rerender(<Component />)
        expect(asFragment()).toMatchSnapshot()
        control.prompts = undefined
        rerender(<Component />)
    })
})
