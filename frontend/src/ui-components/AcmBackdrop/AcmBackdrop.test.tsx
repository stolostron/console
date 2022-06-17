/* Copyright Contributors to the Open Cluster Management project */


import { render } from '@testing-library/react'
import { configureAxe } from 'jest-axe'
import { AcmSpinnerBackdrop } from './AcmBackdrop'
const axe = configureAxe({
    rules: {
        'aria-progressbar-name': { enabled: false },
    },
})

describe('AcmSpinnerBackdrop', () => {
    test('renders', () => {
        const { getByRole } = render(<AcmSpinnerBackdrop />)
        expect(getByRole('progressbar')).toBeInTheDocument()
    })
    test('has zero accessibility defects', async () => {
        const { container } = render(<AcmSpinnerBackdrop />)
        expect(await axe(container)).toHaveNoViolations()
    })
})
