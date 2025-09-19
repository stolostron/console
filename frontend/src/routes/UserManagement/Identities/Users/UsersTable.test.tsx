/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { User } from '../../../../resources/rbac'
import { UsersTable } from './UsersTable'

jest.mock('../../../../lib/useQuery', () => ({
  useQuery: jest.fn(),
}))

import { useQuery } from '../../../../lib/useQuery'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

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
    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    // Mock useQuery to return our mock data
    mockUseQuery.mockReturnValue({
      data: mockUsers,
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })
  })

  test('should render users table with mock users', async () => {
    // No nockList needed since UsersTable uses hardcoded mock data
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
