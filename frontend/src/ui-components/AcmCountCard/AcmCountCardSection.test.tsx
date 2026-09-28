/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AcmCountCardSection } from './AcmCountCardSection'
import { clickElement } from '~/lib/test-util'

const cards = [
  {
    id: 'nodes',
    count: 6,
    countClick: jest.fn(),
    title: 'Nodes',
    description: '0 nodes inactive',
  },
  {
    id: 'applications',
    count: 0,
    countClick: jest.fn(),
    title: 'Applications',
    linkText: 'Go to Applications',
    onLinkClick: jest.fn(),
  },
  {
    id: 'violations',
    count: 5,
    countClick: jest.fn(),
    title: 'Policy violations',
    linkText: 'Go to Policies',
    onLinkClick: jest.fn(),
    isDanger: true,
  },
]

describe('AcmCountCardSection', () => {
  const Component = () => <AcmCountCardSection title="Status" id="status" cards={cards} />
  test('renders', async () => {
    const { getByTestId, getByText } = render(<Component />)
    expect(getByTestId('status')).toBeInTheDocument()

    await clickElement(getByText('6'))
    expect(cards[0].countClick).toHaveBeenCalled()
    expect(getByText('0 nodes inactive')).toBeInTheDocument()
    await clickElement(getByText('0'))
    expect(cards[1].countClick).not.toHaveBeenCalled()
    await clickElement(getByText('Go to Policies'))
    expect(cards[2].onLinkClick).toHaveBeenCalled()
  })
  test('has zero accessibility defects', async () => {
    const { container } = render(<Component />)
    expect(await axe(container)).toHaveNoViolations()
  })
  test('renders skeleton state when loading', async () => {
    const Component = () => (
      <AcmCountCardSection title="Status" id="status" cards={cards} loading={true} loadingAriaLabel="Loading results" />
    )
    const { container, getAllByRole } = render(<Component />)
    expect(getAllByRole('progressbar').length).toBeGreaterThan(0)
    expect(await axe(container)).toHaveNoViolations()
  })
})
