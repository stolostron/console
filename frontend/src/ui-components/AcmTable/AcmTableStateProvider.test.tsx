/* Copyright Contributors to the Open Cluster Management project */

import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useContext } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import {
  AcmTableStateContext,
  AcmTableStateProvider,
  getItemWithExpiration,
  setItemWithExpiration,
} from './AcmTableStateProvider'

// Helper component to display and interact with the context values
// Note: This project uses 'id' as the testIdAttribute (configured in setupTests.ts)
function TableStateConsumer({ testId }: { testId: string }) {
  const { search, setSearch, page, setPage, perPage, setPerPage } = useContext(AcmTableStateContext)

  return (
    <div id={testId}>
      <span id={`${testId}-search`}>{search}</span>
      <span id={`${testId}-page`}>{page}</span>
      <span id={`${testId}-perPage`}>{perPage}</span>
      <button id={`${testId}-set-search`} onClick={() => setSearch?.('test-search-value')}>
        Set Search
      </button>
      <button id={`${testId}-set-page`} onClick={() => setPage?.(5)}>
        Set Page
      </button>
      <button id={`${testId}-set-perPage`} onClick={() => setPerPage?.(50)}>
        Set PerPage
      </button>
    </div>
  )
}

// Wrapper component that provides the router context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/*" element={children} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AcmTableStateProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('setItemWithExpiration and getItemWithExpiration', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test('stores and retrieves value with timestamp', () => {
      setItemWithExpiration('test-key', 'test-value')
      const result = getItemWithExpiration('test-key')
      expect(result).toBe('test-value')
    })

    test('returns null for non-existent key', () => {
      const result = getItemWithExpiration('non-existent-key')
      expect(result).toBeNull()
    })

    test('returns null for expired item (older than 30 minutes)', () => {
      setItemWithExpiration('test-key', 'test-value')

      // Advance time by 31 minutes
      jest.advanceTimersByTime(31 * 60 * 1000)

      const result = getItemWithExpiration('test-key')
      expect(result).toBeNull()
      // Verify the item was removed from localStorage
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    test('returns value for non-expired item (within 30 minutes)', () => {
      setItemWithExpiration('test-key', 'test-value')

      // Advance time by 29 minutes
      jest.advanceTimersByTime(29 * 60 * 1000)

      const result = getItemWithExpiration('test-key')
      expect(result).toBe('test-value')
    })

    test('returns null for invalid JSON in localStorage', () => {
      localStorage.setItem('invalid-key', 'not-valid-json')
      const result = getItemWithExpiration('invalid-key')
      expect(result).toBeNull()
    })
  })

  describe('localStorageKey isolation', () => {
    test('different localStorageKey values create isolated storage', async () => {
      // Pre-populate localStorage with different search values for different keys
      setItemWithExpiration('table-a-search', 'search-value-a')
      setItemWithExpiration('table-b-search', 'search-value-b')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="table-a">
              <TableStateConsumer testId="table-a" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="table-b">
              <TableStateConsumer testId="table-b" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('table-a-search')).toHaveTextContent('search-value-a')
        expect(screen.getByTestId('table-b-search')).toHaveTextContent('search-value-b')
      })
    })

    test('setting search in one provider does not affect another provider with different key', async () => {
      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="isolated-table-1">
              <TableStateConsumer testId="table-1" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="isolated-table-2">
              <TableStateConsumer testId="table-2" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('table-1-set-search')).toBeInTheDocument()
      })

      // Set search in table-1
      await act(async () => {
        userEvent.click(screen.getByTestId('table-1-set-search'))
      })

      await waitFor(() => {
        expect(screen.getByTestId('table-1-search')).toHaveTextContent('test-search-value')
        // table-2 should remain empty
        expect(screen.getByTestId('table-2-search')).toHaveTextContent('')
      })

      // Verify localStorage has the correct keys
      expect(getItemWithExpiration('isolated-table-1-search')).toBe('test-search-value')
      expect(getItemWithExpiration('isolated-table-2-search')).toBeNull()
    })

    test('providers with same localStorageKey share state', async () => {
      render(
        <TestWrapper>
          <AcmTableStateProvider localStorageKey="shared-table">
            <TableStateConsumer testId="table-1" />
            <TableStateConsumer testId="table-2" />
          </AcmTableStateProvider>
        </TestWrapper>
      )

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('table-1-set-search')).toBeInTheDocument()
      })

      // Set search using table-1's button
      await act(async () => {
        userEvent.click(screen.getByTestId('table-1-set-search'))
      })

      await waitFor(() => {
        // Both tables should show the same search value since they share the same provider
        expect(screen.getByTestId('table-1-search')).toHaveTextContent('test-search-value')
        expect(screen.getByTestId('table-2-search')).toHaveTextContent('test-search-value')
      })
    })
  })

  describe('ClustersTable localStorageKey scenarios', () => {
    test('managed-clusters-table-state key is isolated from clusters-table-state', async () => {
      // Simulate the scenario where ManagedClusters page uses 'managed-clusters-table-state'
      // and another component uses the default 'clusters-table-state'
      setItemWithExpiration('managed-clusters-table-state-search', 'managed-cluster-search')
      setItemWithExpiration('clusters-table-state-search', 'default-cluster-search')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="managed-clusters-table-state">
              <TableStateConsumer testId="managed-clusters" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="clusters-table-state">
              <TableStateConsumer testId="default-clusters" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('managed-clusters-search')).toHaveTextContent('managed-cluster-search')
        expect(screen.getByTestId('default-clusters-search')).toHaveTextContent('default-cluster-search')
      })
    })

    test('role-assignment-clusters-table-state is isolated from managed-clusters-table-state', async () => {
      // Simulate the scenario where RoleAssignment wizard uses 'role-assignment-clusters-table-state'
      setItemWithExpiration('role-assignment-clusters-table-state-search', 'role-assignment-search')
      setItemWithExpiration('managed-clusters-table-state-search', 'managed-search')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="role-assignment-clusters-table-state">
              <TableStateConsumer testId="role-assignment" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="managed-clusters-table-state">
              <TableStateConsumer testId="managed" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('role-assignment-search')).toHaveTextContent('role-assignment-search')
        expect(screen.getByTestId('managed-search')).toHaveTextContent('managed-search')
      })
    })
  })

  describe('ClusterSetsTable localStorageKey scenarios', () => {
    test('role-assignment-cluster-sets-table-state is isolated from cluster-sets-table-state', async () => {
      setItemWithExpiration('role-assignment-cluster-sets-table-state-search', 'role-assignment-sets-search')
      setItemWithExpiration('cluster-sets-table-state-search', 'default-sets-search')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="role-assignment-cluster-sets-table-state">
              <TableStateConsumer testId="role-assignment-sets" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="cluster-sets-table-state">
              <TableStateConsumer testId="default-sets" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('role-assignment-sets-search')).toHaveTextContent('role-assignment-sets-search')
        expect(screen.getByTestId('default-sets-search')).toHaveTextContent('default-sets-search')
      })
    })
  })

  describe('UsersTable localStorageKey scenarios', () => {
    test('role-assignment-users-table-state is isolated from users-table-state', async () => {
      setItemWithExpiration('role-assignment-users-table-state-search', 'role-assignment-users-search')
      setItemWithExpiration('users-table-state-search', 'default-users-search')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="role-assignment-users-table-state">
              <TableStateConsumer testId="role-assignment-users" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="users-table-state">
              <TableStateConsumer testId="default-users" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('role-assignment-users-search')).toHaveTextContent('role-assignment-users-search')
        expect(screen.getByTestId('default-users-search')).toHaveTextContent('default-users-search')
      })
    })
  })

  describe('GroupsTable localStorageKey scenarios', () => {
    test('role-assignment-groups-table-state is isolated from groups-table-state', async () => {
      setItemWithExpiration('role-assignment-groups-table-state-search', 'role-assignment-groups-search')
      setItemWithExpiration('groups-table-state-search', 'default-groups-search')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="role-assignment-groups-table-state">
              <TableStateConsumer testId="role-assignment-groups" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="groups-table-state">
              <TableStateConsumer testId="default-groups" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('role-assignment-groups-search')).toHaveTextContent('role-assignment-groups-search')
        expect(screen.getByTestId('default-groups-search')).toHaveTextContent('default-groups-search')
      })
    })
  })

  describe('page and perPage isolation', () => {
    test('page state is isolated between different localStorageKeys', async () => {
      setItemWithExpiration('table-a-page', '3')
      setItemWithExpiration('table-b-page', '7')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="table-a">
              <TableStateConsumer testId="table-a" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="table-b">
              <TableStateConsumer testId="table-b" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('table-a-page')).toHaveTextContent('3')
        expect(screen.getByTestId('table-b-page')).toHaveTextContent('7')
      })
    })

    test('perPage state is isolated between different localStorageKeys', async () => {
      // perPage uses localStorage directly without expiration
      localStorage.setItem('table-a-perPage', '25')
      localStorage.setItem('table-b-perPage', '100')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="table-a">
              <TableStateConsumer testId="table-a" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="table-b">
              <TableStateConsumer testId="table-b" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('table-a-perPage')).toHaveTextContent('25')
        expect(screen.getByTestId('table-b-perPage')).toHaveTextContent('100')
      })
    })
  })

  describe('default localStorageKey behavior', () => {
    test('uses pathname-based key when localStorageKey is not provided', async () => {
      render(
        <MemoryRouter initialEntries={['/clusters']}>
          <Routes>
            <Route
              path="/clusters"
              element={
                <AcmTableStateProvider>
                  <TableStateConsumer testId="default-key-table" />
                </AcmTableStateProvider>
              }
            />
          </Routes>
        </MemoryRouter>
      )

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('default-key-table-set-search')).toBeInTheDocument()
      })

      // Set a search value
      await act(async () => {
        userEvent.click(screen.getByTestId('default-key-table-set-search'))
      })

      await waitFor(() => {
        // The default key should be based on the pathname: 'clusters-table-state'
        expect(getItemWithExpiration('clusters-table-state-search')).toBe('test-search-value')
      })
    })
  })

  describe('complete isolation scenario - all table types', () => {
    test('all different table types maintain isolated search state', async () => {
      // Set up different search values for each table type
      setItemWithExpiration('managed-clusters-table-state-search', 'managed-clusters')
      setItemWithExpiration('role-assignment-clusters-table-state-search', 'ra-clusters')
      setItemWithExpiration('cluster-sets-table-state-search', 'cluster-sets')
      setItemWithExpiration('role-assignment-cluster-sets-table-state-search', 'ra-cluster-sets')
      setItemWithExpiration('users-table-state-search', 'users')
      setItemWithExpiration('role-assignment-users-table-state-search', 'ra-users')
      setItemWithExpiration('groups-table-state-search', 'groups')
      setItemWithExpiration('role-assignment-groups-table-state-search', 'ra-groups')

      render(
        <TestWrapper>
          <>
            <AcmTableStateProvider localStorageKey="managed-clusters-table-state">
              <TableStateConsumer testId="managed-clusters" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="role-assignment-clusters-table-state">
              <TableStateConsumer testId="ra-clusters" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="cluster-sets-table-state">
              <TableStateConsumer testId="cluster-sets" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="role-assignment-cluster-sets-table-state">
              <TableStateConsumer testId="ra-cluster-sets" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="users-table-state">
              <TableStateConsumer testId="users" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="role-assignment-users-table-state">
              <TableStateConsumer testId="ra-users" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="groups-table-state">
              <TableStateConsumer testId="groups" />
            </AcmTableStateProvider>
            <AcmTableStateProvider localStorageKey="role-assignment-groups-table-state">
              <TableStateConsumer testId="ra-groups" />
            </AcmTableStateProvider>
          </>
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByTestId('managed-clusters-search')).toHaveTextContent('managed-clusters')
        expect(screen.getByTestId('ra-clusters-search')).toHaveTextContent('ra-clusters')
        expect(screen.getByTestId('cluster-sets-search')).toHaveTextContent('cluster-sets')
        expect(screen.getByTestId('ra-cluster-sets-search')).toHaveTextContent('ra-cluster-sets')
        expect(screen.getByTestId('users-search')).toHaveTextContent('users')
        expect(screen.getByTestId('ra-users-search')).toHaveTextContent('ra-users')
        expect(screen.getByTestId('groups-search')).toHaveTextContent('groups')
        expect(screen.getByTestId('ra-groups-search')).toHaveTextContent('ra-groups')
      })
    })
  })
})
