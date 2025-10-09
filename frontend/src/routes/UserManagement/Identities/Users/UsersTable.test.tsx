/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { User } from '../../../../resources/rbac'
import { UsersTable } from './UsersTable'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'

jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'alice.trask',
      uid: 'alice.trask',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'bob.levy',
      uid: 'bob.levy',
      creationTimestamp: '2023-01-02T00:00:00Z',
    },
  },
]

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <UsersTable />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Users Page', () => {
  beforeEach(() => {
    mockUseSharedAtoms.mockReturnValue({
      usersState: {} as any,
    } as any)

    mockUseRecoilValue.mockReturnValue(mockUsers)
  })

  test('should render users table with mock users', async () => {
    render(<Component />)

    await waitFor(() => {
      // Check for actual mock users that are rendered by UsersTable
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
      expect(screen.getByText('bob.levy')).toBeInTheDocument()
    })
  })

  test('should render component without errors', () => {
    render(<Component />)

    expect(document.body).toBeInTheDocument()
  })
})
