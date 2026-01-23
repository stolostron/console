/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { GroupsTablePage } from './GroupsTablePage'

// Mock the GroupsTable component and its dependencies
jest.mock('./GroupsTable', () => ({
  GroupsTable: jest.fn((props: any) => (
    <div data-testid="mocked-groups-table" data-hiddencolumns={JSON.stringify(props.hiddenColumns)}>
      Mocked Groups Table
    </div>
  )),
}))

// Mock AcmTableStateProvider
jest.mock('../../../../ui-components', () => ({
  AcmTableStateProvider: jest.fn(
    ({ children, localStorageKey }: { children: React.ReactNode; localStorageKey: string }) => (
      <div data-testid="acm-table-state-provider" data-localstorage-key={localStorageKey}>
        {children}
      </div>
    )
  ),
}))

jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(() => []),
  useSharedAtoms: jest.fn(() => ({ groupsState: {} })),
}))

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupsTablePage />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupsTablePage', () => {
  test('should render component without errors', () => {
    const { container } = render(<Component />)
    expect(container).toBeInTheDocument()
  })

  test('should render GroupsTablePage structure', () => {
    const { container } = render(<Component />)
    // Just verify the component structure exists
    expect(container.firstChild).toBeInTheDocument()
  })

  test('should pass hiddenColumns prop to GroupsTable with radio column hidden', () => {
    const { container } = render(<Component />)

    const groupsTable = container.querySelector('[data-testid="mocked-groups-table"]')
    expect(groupsTable).toBeInTheDocument()
    expect(groupsTable).toHaveAttribute('data-hiddencolumns', '["radio"]')
  })

  test('should wrap GroupsTable with AcmTableStateProvider using correct localStorageKey', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    expect(provider).toBeInTheDocument()
    expect(provider).toHaveAttribute('data-localstorage-key', 'identities-groups-table-state')
  })

  test('should render GroupsTable as a child of AcmTableStateProvider', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    const groupsTable = provider?.querySelector('[data-testid="mocked-groups-table"]')
    expect(groupsTable).toBeInTheDocument()
  })
})
