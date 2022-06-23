'use strict'

import React from 'react'
import EditorBar from './EditorBar'
import { render } from '@testing-library/react'

describe('EditorBar component', () => {
    it('renders as expected', () => {
        const fn = jest.fn()
        const exceptions = [{ text: 'bad', row: 0 }]
        const Component = () => {
            return (
                <EditorBar
                    hasUndo={false}
                    hasRedo={true}
                    exceptions={exceptions}
                    gotoEditorLine={fn}
                    handleEditorCommand={fn}
                    handleSearchChange={fn}
                    i18n={fn}
                />
            )
        }
        const { asFragment } = render(<Component />)
        expect(asFragment()).toMatchSnapshot()
    })
})
