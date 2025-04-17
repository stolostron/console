/* Copyright Contributors to the Open Cluster Management project */

import { MenuToggle, MenuToggleElement, Select, SelectList, SelectOption } from '@patternfly/react-core'
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
  const [selected, setSelected] = useState<string>('')

  return (
    <Select
      isOpen={isOpen}
      onOpenChange={(isOpen) => setOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} onClick={() => setOpen(!isOpen)} isExpanded={isOpen} icon={<CaretDownIcon />}>
          All providers
        </MenuToggle>
      )}
      id="fake"
      selected={selected}
      onSelect={(_ev, value) => value && setSelected(value.toString())}
    >
      <SelectList>
        <SelectOption value="Amazon" isSelected={selected === 'Amazon'}>
          Amazon
        </SelectOption>
        <SelectOption value="Google" isSelected={selected === 'Google'} isDisabled>
          Google
        </SelectOption>
      </SelectList>
    </Select>
  )
}
