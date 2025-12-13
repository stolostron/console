/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { BrowserRouter, Link } from 'react-router-dom-v5-compat'
import { AcmSecondaryNav, AcmSecondaryNavItem } from './AcmSecondaryNav'

describe('AcmSecondaryNav', () => {
  const SecondaryNav = () => (
    <BrowserRouter>
      <AcmSecondaryNav>
        <AcmSecondaryNavItem isActive={false}>
          <Link to={'/multicloud/test'}>{'Tab1'}</Link>
        </AcmSecondaryNavItem>
        <AcmSecondaryNavItem isActive={true}>
          <Link to={'/multicloud/foo'}>{'Tab2'}</Link>
        </AcmSecondaryNavItem>
      </AcmSecondaryNav>
    </BrowserRouter>
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
