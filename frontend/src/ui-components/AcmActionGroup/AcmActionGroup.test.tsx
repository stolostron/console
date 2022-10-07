/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { ActionGroup } from './AcmActionGroup.stories'

describe('AcmActionGroup', () => {
    test('renders', () => {
        const { container } = render(<ActionGroup />)
        expect(container.querySelectorAll('hr')).toHaveLength(4)
    })
})
