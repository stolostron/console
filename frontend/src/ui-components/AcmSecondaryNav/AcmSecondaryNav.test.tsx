/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { BrowserRouter } from 'react-router-dom-v5-compat'
import { AcmSecondaryNav } from './AcmSecondaryNav'

describe('AcmSecondaryNav', () => {
  const SecondaryNavTo = () => (
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
  const SecondaryNavOnClick = () => (
    <BrowserRouter>
      <AcmSecondaryNav
        navItems={[
          {
            key: 'key-tab-1',
            title: 'Tab1',
            isActive: false,
            onClick: () => {},
          },
          {
            key: 'key-tab-2',
            title: 'Tab2',
            isActive: true,
            onClick: () => {},
          },
        ]}
      />
    </BrowserRouter>
  )
  test('renders with location "to" field', () => {
    const { getByText } = render(<SecondaryNavTo />)

    expect(getByText('Tab1')).toBeInTheDocument()
    expect(getByText('Tab1')).toBeInstanceOf(HTMLSpanElement)

    expect(getByText('Tab2')).toBeInTheDocument()
    getByText('Tab2').click()
  })
  test('renders with onClick', () => {
    const { getByText } = render(<SecondaryNavOnClick />)

    expect(getByText('Tab1')).toBeInTheDocument()
    expect(getByText('Tab1')).toBeInstanceOf(HTMLSpanElement)

    expect(getByText('Tab2')).toBeInTheDocument()
    getByText('Tab2').click()
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<SecondaryNavTo />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
