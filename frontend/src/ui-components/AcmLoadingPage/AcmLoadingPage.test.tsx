/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { configureAxe } from 'jest-axe'

import { AcmLoadingPage } from './AcmLoadingPage'
const axe = configureAxe({
    rules: {
        'aria-progressbar-name': { enabled: false },
    },
})

describe('AcmLoadingPage', () => {
    test('renders', () => {
        const { getByText } = render(<AcmLoadingPage />)
        expect(getByText('Loading')).toBeInTheDocument()
        expect(getByText('Loading')).toBeInstanceOf(HTMLHeadingElement)
    })
    test('has zero accessibility defects', async () => {
        const { container } = render(<AcmLoadingPage title="Loading title" message="Loading message here" />)
        expect(await axe(container)).toHaveNoViolations()
    })
})
