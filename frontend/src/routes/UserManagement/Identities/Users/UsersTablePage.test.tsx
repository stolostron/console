/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { UsersTablePage } from './UsersTablePage'

// Mock the UsersTable component and its dependencies
jest.mock('./UsersTable', () => ({
  UsersTable: jest.fn((props: any) => (
    <div data-testid="mocked-users-table" data-hiddencolumns={JSON.stringify(props.hiddenColumns)}>
      Mocked Users Table
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
  useSharedAtoms: jest.fn(() => ({ usersState: {} })),
}))

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <UsersTablePage />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('UsersTablePage', () => {
  test('should render component without errors', () => {
    const { container } = render(<Component />)
    expect(container).toBeInTheDocument()
  })

  test('should render UsersTablePage structure', () => {
    const { container } = render(<Component />)
    // Just verify the component structure exists
    expect(container.firstChild).toBeInTheDocument()
  })

  test('should pass hiddenColumns prop to UsersTable with radio column hidden', () => {
    const { container } = render(<Component />)

    const usersTable = container.querySelector('[data-testid="mocked-users-table"]')
    expect(usersTable).toBeInTheDocument()
    expect(usersTable).toHaveAttribute('data-hiddencolumns', '["radio"]')
  })

  test('should wrap UsersTable with AcmTableStateProvider using correct localStorageKey', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    expect(provider).toBeInTheDocument()
    expect(provider).toHaveAttribute('data-localstorage-key', 'identities-users-table-state')
  })

  test('should render UsersTable as a child of AcmTableStateProvider', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    const usersTable = provider?.querySelector('[data-testid="mocked-users-table"]')
    expect(usersTable).toBeInTheDocument()
  })
})
