/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { UsersTablePage } from './UsersTablePage'

// Mock the UsersTable component and its dependencies
jest.mock('./UsersTable', () => ({
  UsersTable: jest.fn(() => <div data-testid="mocked-users-table">Mocked Users Table</div>),
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
})
