/* Copyright Contributors to the Open Cluster Management project */

import { OptionsMenu, OptionsMenuItem, OptionsMenuToggleWithText } from '@patternfly/react-core/deprecated'
import { CaretDownIcon } from '@patternfly/react-icons'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { AcmSummaryList } from './AcmSummaryList'

describe('AcmSummaryList', () => {
  const list = [
    { description: 'Applications', count: 3, href: '/search?query=apps' },
    { description: 'Clusters', count: 2, href: '/search?query=clusters' },
    { description: 'Kubernetes type', count: 1 },
    { description: 'Region', count: 1 },
    { description: 'Nodes', count: 3, href: '/search?query=nodes' },
    { description: 'Pods', count: 3, href: '/search?query=pods' },
  ]
  test('renders', () => {
    const { getByTestId } = render(
      <MemoryRouter>
        <AcmSummaryList title="Summary" list={list} />
      </MemoryRouter>
    )
    expect(getByTestId('applications-summary')).toBeInTheDocument()
  })

  test('renders skeleton component', () => {
    const { queryByText } = render(<AcmSummaryList title="Summary" list={[]} loading={true} />)
    expect(queryByText('Summary')).toBeInTheDocument()
  })

  test('renders individual list item skeleton component', () => {
    const list = [
      { description: 'Applications', count: 3, href: '/search?query=apps' },
      { description: 'Clusters', count: 2, href: '/search?query=clusters' },
      { description: 'Kubernetes type', count: 1 },
      { description: 'Region', count: 1 },
      { description: 'Nodes', count: 3, href: '/search?query=nodes' },
      { description: 'Pods', count: 3, href: '/search?query=pods', isLoading: true },
    ]
    const { getByTestId } = render(
      <MemoryRouter>
        <AcmSummaryList title="Summary" list={list} />
      </MemoryRouter>
    )
    expect(getByTestId('applications-summary')).toBeInTheDocument()
    expect(getByTestId('loading-Pods')).toBeInTheDocument()
  })

  test('has zero accessibility defects', async () => {
    const { container } = render(
      <MemoryRouter>
        <AcmSummaryList title="Summary" list={list} />
      </MemoryRouter>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

export const Menu = () => {
  const [isOpen, setOpen] = useState<boolean>(false)
  const noop = () => null
  const menuItems = [
    <OptionsMenuItem id="aws" key="1" onSelect={noop}>
      Amazon
    </OptionsMenuItem>,
    <OptionsMenuItem id="gcp" key="2" onSelect={noop}>
      Google
    </OptionsMenuItem>,
  ]
  const toggle = (
    <OptionsMenuToggleWithText
      toggleText="All providers"
      toggleButtonContents={<CaretDownIcon />}
      onToggle={() => setOpen(!isOpen)}
    />
  )
  return <OptionsMenu id="fake" menuItems={menuItems} isOpen={isOpen} isPlain isText toggle={toggle} />
}
