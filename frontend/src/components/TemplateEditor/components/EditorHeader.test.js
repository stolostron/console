/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import EditorHeader from './EditorHeader'
import { render } from '@testing-library/react'

const type = 'application'
const otherYAMLTabs = []
const handleTabChange = jest.fn

describe('EditorHeader component', () => {
    it('renders as expected', () => {
        const fn = jest.fn()
        const Component = () => {
            return (
                <EditorHeader
                    otherYAMLTabs={otherYAMLTabs}
                    handleTabChange={handleTabChange}
                    type={type}
                    i18n={fn}
                    title=""
                />
            )
        }
        const { asFragment } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
    })
})
