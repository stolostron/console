/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmRefreshTime } from './AcmRefreshTime'

jest.mock('moment', () => () => ({ format: () => '7:00:00 PM' }))

// Reloading Timestamp tests

describe('AcmRefreshTimeReloading', () => {
    const ReloadingRefreshTime = () => {
        return <AcmRefreshTime timestamp={''} reloading={true} />
    }
    test('validates reloading spinner is present', () => {
        const { getByRole } = render(<ReloadingRefreshTime />)
        expect(getByRole('progressbar')).toBeInTheDocument()
    })

    test('has zero accessibility defects', async () => {
        const { container } = render(<ReloadingRefreshTime />)
        expect(await axe(container)).toHaveNoViolations
    })
})

// Timestamp tests

describe('AcmRefreshTime', () => {
    const RefreshTime = () => {
        return <AcmRefreshTime timestamp={''} />
    }

    test('has zero accessibility defects', async () => {
        const { container } = render(<RefreshTime />)
        expect(await axe(container)).toHaveNoViolations
    })

    test('validates RefreshTime component renders', () => {
        const { getByText } = render(<RefreshTime />)
        expect(getByText('Last update: 7:00:00 PM')).toBeInTheDocument()
    })
})
