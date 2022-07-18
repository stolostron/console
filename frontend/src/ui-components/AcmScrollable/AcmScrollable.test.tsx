/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'

import { AcmScrollable } from './AcmScrollable'

describe('AcmScrollable', () => {
    const Component = () => {
        return <AcmScrollable>Content</AcmScrollable>
    }
    test('renders content', () => {
        const { getByText } = render(<Component />)
        expect(getByText('Content')).toBeInTheDocument()
    })
})
