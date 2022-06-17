/* Copyright Contributors to the Open Cluster Management project */


import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmSecondaryNav, AcmSecondaryNavItem } from './AcmSecondaryNav'

describe('AcmSecondaryNav', () => {
    const SecondaryNav = () => (
        <AcmSecondaryNav>
            <AcmSecondaryNavItem isActive={false} to={'/multicloud/test'}>
                Tab1
            </AcmSecondaryNavItem>
            <AcmSecondaryNavItem isActive={true} to={'/multicloud/foo'}>
                Tab2
            </AcmSecondaryNavItem>
        </AcmSecondaryNav>
    )
    test('renders', () => {
        const { getByText } = render(<SecondaryNav />)

        expect(getByText('Tab1')).toBeInTheDocument()
        expect(getByText('Tab1')).toBeInstanceOf(HTMLAnchorElement)
        expect(getByText('Tab1').getAttribute('href')).toEqual('/multicloud/test')
    })
    test('has zero accessibility defects', async () => {
        const { container } = render(<SecondaryNav />)
        expect(await axe(container)).toHaveNoViolations()
    })
})
