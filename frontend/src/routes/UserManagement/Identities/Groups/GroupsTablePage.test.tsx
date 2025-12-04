/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { GroupsTablePage } from './GroupsTablePage'

// Mock the GroupsTable component and its dependencies
jest.mock('./GroupsTable', () => ({
  GroupsTable: jest.fn(() => <div data-testid="mocked-groups-table">Mocked Groups Table</div>),
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
})
