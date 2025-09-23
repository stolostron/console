/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import { useRoleAssignmentData } from './RoleAssignmentDataHook'

jest.mock('../../../../lib/useQuery', () => ({
  useQuery: jest.fn(),
}))

jest.mock('../../../../resources', () => ({
  listGroups: jest.fn(),
  listUsers: jest.fn(),
}))

jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('../../../Search/search-sdk/search-client', () => ({
  searchClient: {},
}))

jest.mock('../../../Search/search-sdk/search-sdk', () => ({
  useSearchResultItemsQuery: jest.fn(),
}))

jest.mock('../../../../ui-components/AcmTable/AcmTable', () => ({
  compareStrings: jest.fn((a, b) => a.localeCompare(b)),
}))

import { useQuery } from '../../../../lib/useQuery'
import { listGroups, listUsers } from '../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { useSearchResultItemsQuery } from '../../../Search/search-sdk/search-sdk'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const mockUseSearchResultItemsQuery = useSearchResultItemsQuery as jest.MockedFunction<typeof useSearchResultItemsQuery>

describe('useRoleAssignmentData', () => {
  const mockNamespaces = [{ metadata: { name: 'my-namespace' } }, { metadata: { name: 'test-namespace' } }]

  const mockManagedClusterSets = [
    {
      metadata: { name: 'global' },
    },
    {
      metadata: { name: 'cluster-set-1' },
    },
  ]

  const mockManagedClusters = [
    {
      metadata: {
        name: 'cluster-1',
        labels: {
          'cluster.open-cluster-management.io/clusterset': 'cluster-set-1',
        },
      },
    },
    {
      metadata: {
        name: 'production-cluster',
        labels: {
          'cluster.open-cluster-management.io/clusterset': 'cluster-set-1',
        },
      },
    },
    {
      metadata: {
        name: 'dev-cluster',
        labels: {
          'cluster.open-cluster-management.io/clusterset': 'cluster-set-1',
        },
      },
    },
  ]

  const mockUsers = [{ metadata: { name: 'user1' } }, { metadata: { name: 'user2' } }]

  const mockGroups = [{ metadata: { name: 'group1' } }, { metadata: { name: 'group2' } }]

  const mockClusterRoles = {
    searchResult: [
      {
        items: [
          { name: 'admin', _uid: 'admin-uid' },
          { name: 'view', _uid: 'view-uid' },
        ],
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseQuery.mockImplementation((queryFn) => {
      if (queryFn === listUsers) {
        return {
          data: mockUsers,
          loading: false,
          error: undefined,
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          refresh: jest.fn(),
        }
      }
      if (queryFn === listGroups) {
        return {
          data: mockGroups,
          loading: false,
          error: undefined,
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          refresh: jest.fn(),
        }
      }
      return {
        data: undefined,
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      }
    })

    mockUseSearchResultItemsQuery.mockReturnValue({
      data: mockClusterRoles,
      loading: false,
      error: undefined,
      refetch: jest.fn(),
      reobserve: jest.fn(),
      networkStatus: 7,
      called: true,
      client: {} as any,
      observable: {} as any,
      previousData: undefined,
      variables: {},
      fetchMore: jest.fn(),
      subscribeToMore: jest.fn(),
      updateQuery: jest.fn(),
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
    })

    const mockNamespacesState = {} as any
    const mockManagedClusterSetsState = {} as any
    const mockManagedClustersState = {} as any

    mockUseSharedAtoms.mockReturnValue({
      namespacesState: mockNamespacesState,
      managedClusterSetsState: mockManagedClusterSetsState,
      managedClustersState: mockManagedClustersState,

      usePolicies: jest.fn(),
      useIsObservabilityInstalled: jest.fn(),
      useSavedSearchLimit: jest.fn(),
      useSearchResultLimit: jest.fn(),
    } as any)

    mockUseRecoilValue.mockImplementation((atom) => {
      if (atom === mockNamespacesState) return mockNamespaces
      if (atom === mockManagedClusterSetsState) return mockManagedClusterSets
      if (atom === mockManagedClustersState) return mockManagedClusters
      return []
    })
  })

  describe('Basic Functionality', () => {
    it('should return initial loading state', () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isLoading).toBe(false)
      expect(result.current.isUsersLoading).toBe(false)
      expect(result.current.isGroupsLoading).toBe(false)
      expect(result.current.isRolesLoading).toBe(false)
      expect(result.current.isClusterSetLoading).toBe(false)
    })

    it('should load and process users correctly', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        expect(result.current.roleAssignmentData.users).toEqual([
          { id: 'user1', value: 'user1' },
          { id: 'user2', value: 'user2' },
        ])
      })
    })

    it('should load and process groups correctly', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        expect(result.current.roleAssignmentData.groups).toEqual([
          { id: 'group1', value: 'group1' },
          { id: 'group2', value: 'group2' },
        ])
      })
    })

    it('should load and process roles correctly', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        expect(result.current.roleAssignmentData.roles).toEqual([
          { id: 'admin', value: 'admin' },
          { id: 'view', value: 'view' },
        ])
      })
    })

    it('should process cluster sets correctly', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        expect(result.current.roleAssignmentData.clusterSets).toEqual([
          {
            name: 'cluster-set-1',
            clusters: [
              {
                name: 'cluster-1',
                namespaces: ['my-namespace', 'test-namespace'],
              },
              {
                name: 'production-cluster',
                namespaces: ['my-namespace', 'test-namespace'],
              },
              {
                name: 'dev-cluster',
                namespaces: ['my-namespace', 'test-namespace'],
              },
            ],
          },
        ])
      })
    })
  })

  describe('Loading States', () => {
    it('should handle users loading state', () => {
      mockUseQuery.mockImplementation((queryFn) => {
        if (queryFn === listUsers) {
          return {
            data: undefined,
            loading: true,
            error: undefined,
            startPolling: jest.fn(),
            stopPolling: jest.fn(),
            refresh: jest.fn(),
          }
        }
        if (queryFn === listGroups) {
          return {
            data: mockGroups,
            loading: false,
            error: undefined,
            startPolling: jest.fn(),
            stopPolling: jest.fn(),
            refresh: jest.fn(),
          }
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          refresh: jest.fn(),
        }
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isUsersLoading).toBe(true)
      expect(result.current.isLoading).toBe(true)
    })

    it('should handle groups loading state', () => {
      mockUseQuery.mockImplementation((queryFn) => {
        if (queryFn === listUsers) {
          return {
            data: mockUsers,
            loading: false,
            error: undefined,
            startPolling: jest.fn(),
            stopPolling: jest.fn(),
            refresh: jest.fn(),
          }
        }
        if (queryFn === listGroups) {
          return {
            data: undefined,
            loading: true,
            error: undefined,
            startPolling: jest.fn(),
            stopPolling: jest.fn(),
            refresh: jest.fn(),
          }
        }
        return {
          data: undefined,
          loading: false,
          error: undefined,
          startPolling: jest.fn(),
          stopPolling: jest.fn(),
          refresh: jest.fn(),
        }
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isGroupsLoading).toBe(true)
      expect(result.current.isLoading).toBe(true)
    })

    it('should handle roles loading state', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
        reobserve: jest.fn(),
        networkStatus: 1,
        called: true,
        client: {} as any,
        observable: {} as any,
        previousData: undefined,
        variables: {},
        fetchMore: jest.fn(),
        subscribeToMore: jest.fn(),
        updateQuery: jest.fn(),
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isRolesLoading).toBe(true)
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Data Processing', () => {
    it('should filter out system namespaces', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        const clusterSets = result.current.roleAssignmentData.clusterSets
        clusterSets.forEach((clusterSet) => {
          clusterSet.clusters?.forEach((cluster) => {
            expect(cluster.namespaces).not.toContain('default')
            expect(cluster.namespaces).not.toContain('kube-system')
            expect(cluster.namespaces).toContain('my-namespace')
            expect(cluster.namespaces).toContain('test-namespace')
          })
        })
      })
    })

    it('should exclude global cluster set', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        const clusterSets = result.current.roleAssignmentData.clusterSets
        const globalClusterSet = clusterSets.find((cs) => cs.name === 'global')
        expect(globalClusterSet).toBeUndefined()
      })
    })

    it('should extract all cluster names from managed clusters', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        expect(result.current.roleAssignmentData.allClusterNames).toEqual([
          'cluster-1',
          'production-cluster',
          'dev-cluster',
        ])
      })
    })

    it('should handle empty data gracefully', async () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
        refresh: jest.fn(),
      })
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
        reobserve: jest.fn(),
        networkStatus: 7,
        called: true,
        client: {} as any,
        observable: {} as any,
        previousData: undefined,
        variables: {},
        fetchMore: jest.fn(),
        subscribeToMore: jest.fn(),
        updateQuery: jest.fn(),
        startPolling: jest.fn(),
        stopPolling: jest.fn(),
      })
      mockUseRecoilValue.mockReturnValue([])

      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        expect(result.current.roleAssignmentData.users).toEqual([])
        expect(result.current.roleAssignmentData.groups).toEqual([])
        expect(result.current.roleAssignmentData.roles).toEqual([])
        expect(result.current.roleAssignmentData.clusterSets).toEqual([])
        expect(result.current.roleAssignmentData.allClusterNames).toEqual([])
      })
    })
  })

  describe('Service Accounts', () => {
    it('should always return empty service accounts array', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        expect(result.current.roleAssignmentData.serviceAccounts).toEqual([])
      })
    })
  })

  describe('Integration', () => {
    it('should complete loading when all data is loaded', async () => {
      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isUsersLoading).toBe(false)
        expect(result.current.isGroupsLoading).toBe(false)
        expect(result.current.isRolesLoading).toBe(false)
        expect(result.current.isClusterSetLoading).toBe(false)
      })
    })
  })
})
