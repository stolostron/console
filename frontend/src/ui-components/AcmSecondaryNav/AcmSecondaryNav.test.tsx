/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { BrowserRouter } from 'react-router-dom-v5-compat'
import { AcmSecondaryNav } from './AcmSecondaryNav'

describe('AcmSecondaryNav', () => {
  const SecondaryNav = () => (
    <BrowserRouter>
      <AcmSecondaryNav
        navItems={[
          {
            key: 'key-tab-1',
            title: 'Tab1',
            isActive: false,
            to: '/multicloud/test',
          },
          {
            key: 'key-tab-2',
            title: 'Tab2',
            isActive: true,
            to: '/multicloud/foo',
          },
        ]}
      />
    </BrowserRouter>
  )
  test('renders', () => {
    const { getByText } = render(<SecondaryNav />)

    expect(getByText('Tab1')).toBeInTheDocument()
    expect(getByText('Tab1')).toBeInstanceOf(HTMLSpanElement)
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<SecondaryNav />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
