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

jest.mock('../../../../utils/useClusterNamespaceMap', () => ({
  useClusterNamespaceMap: jest.fn(),
}))

jest.mock('../../../../ui-components/AcmTable/AcmTable', () => ({
  compareStrings: jest.fn((a, b) => a.localeCompare(b)),
}))

import { useQuery } from '../../../../lib/useQuery'
import { listGroups, listUsers } from '../../../../resources'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { useSearchResultItemsQuery } from '../../../Search/search-sdk/search-sdk'
import { useClusterNamespaceMap } from '../../../../utils/useClusterNamespaceMap'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>
const mockUseClusterNamespaceMap = useClusterNamespaceMap as jest.MockedFunction<typeof useClusterNamespaceMap>
const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const mockUseSearchResultItemsQuery = useSearchResultItemsQuery as jest.MockedFunction<typeof useSearchResultItemsQuery>

describe('useRoleAssignmentData', () => {
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

  const defaultClusterNamespaceMap: Record<string, string[]> = {
    'cluster-1': ['my-namespace', 'test-namespace'],
    'production-cluster': ['my-namespace', 'test-namespace'],
    'dev-cluster': ['my-namespace', 'test-namespace'],
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseClusterNamespaceMap.mockReturnValue({
      clusterNamespaceMap: defaultClusterNamespaceMap,
      isLoading: false,
    })

    mockUseQuery.mockImplementation((queryFn) => {
      if (queryFn === listUsers) {
        return { data: mockUsers, loading: false } as any
      }
      if (queryFn === listGroups) {
        return { data: mockGroups, loading: false } as any
      }
      return { data: undefined, loading: false } as any
    })

    mockUseSearchResultItemsQuery.mockReturnValue({ data: mockClusterRoles, loading: false } as any)

    const mockManagedClusterSetsState = {} as any
    const mockManagedClustersState = {} as any

    mockUseSharedAtoms.mockReturnValue({
      managedClusterSetsState: mockManagedClusterSetsState,
      managedClustersState: mockManagedClustersState,

      usePolicies: jest.fn(),
      useIsObservabilityInstalled: jest.fn(),
      useSavedSearchLimit: jest.fn(),
      useSearchResultLimit: jest.fn(),
    } as any)

    mockUseRecoilValue.mockImplementation((atom) => {
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
          return { data: undefined, loading: true } as any
        }
        if (queryFn === listGroups) {
          return { data: mockGroups, loading: false } as any
        }
        return { data: undefined, loading: false } as any
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isUsersLoading).toBe(true)
      expect(result.current.isLoading).toBe(true)
    })

    it('should still be loading when roles are loaded but namespaces are still loading', () => {
      mockUseClusterNamespaceMap.mockReturnValue({
        clusterNamespaceMap: {},
        isLoading: true,
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isLoading).toBe(true)
    })

    it('should show loading is complete when namespaces and roles are done loading', () => {
      mockUseClusterNamespaceMap.mockReturnValue({
        clusterNamespaceMap: defaultClusterNamespaceMap,
        isLoading: false,
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isLoading).toBe(false)
    })

    it('should handle groups loading state', () => {
      mockUseQuery.mockImplementation((queryFn) => {
        if (queryFn === listUsers) {
          return { data: mockUsers, loading: false } as any
        }
        if (queryFn === listGroups) {
          return { data: undefined, loading: true } as any
        }
        return { data: undefined, loading: false } as any
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isGroupsLoading).toBe(true)
      expect(result.current.isLoading).toBe(true)
    })

    it('should handle roles loading state', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({ data: undefined, loading: true } as any)

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isRolesLoading).toBe(true)
      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('Data Processing', () => {
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
      mockUseQuery.mockReturnValue({ data: undefined, loading: false } as any)
      mockUseSearchResultItemsQuery.mockReturnValue({ data: undefined, loading: false } as any)
      mockUseClusterNamespaceMap.mockReturnValue({ clusterNamespaceMap: {}, isLoading: false })
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

  describe('System Namespace Filtering', () => {
    it('should use cluster namespace map without system namespaces (filtering is in useClusterNamespaceMap)', async () => {
      mockUseClusterNamespaceMap.mockReturnValue({
        clusterNamespaceMap: {
          'cluster-1': ['user-app', 'my-openshift-app', 'kubernetes-dashboard', 'my-cluster-app'],
        },
        isLoading: false,
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        const cluster = result.current.roleAssignmentData.clusterSets[0]?.clusters?.[0]

        expect(cluster?.namespaces).toEqual(['user-app', 'my-openshift-app', 'kubernetes-dashboard', 'my-cluster-app'])
      })
    })
  })

  describe('Cluster Namespace Mapping Logic', () => {
    it('should correctly map namespaces to their respective clusters from useClusterNamespaceMap', async () => {
      const mockManagedClustersState = {} as any
      const mockManagedClusterSetsState = {} as any

      mockUseClusterNamespaceMap.mockReturnValue({
        clusterNamespaceMap: {
          'cluster-1': ['app-frontend', 'app-backend'],
          'cluster-2': ['app-frontend', 'monitoring'],
          'cluster-3': ['data-processing'],
        },
        isLoading: false,
      })

      const mockMultiClusters = [
        ...mockManagedClusters,
        {
          metadata: {
            name: 'cluster-2',
            labels: {
              'cluster.open-cluster-management.io/clusterset': 'cluster-set-1',
            },
          },
        },
        {
          metadata: {
            name: 'cluster-3',
            labels: {
              'cluster.open-cluster-management.io/clusterset': 'cluster-set-1',
            },
          },
        },
      ]

      mockUseSharedAtoms.mockReturnValue({
        managedClusterSetsState: mockManagedClusterSetsState,
        managedClustersState: mockManagedClustersState,
        usePolicies: jest.fn(),
        useIsObservabilityInstalled: jest.fn(),
        useSavedSearchLimit: jest.fn(),
        useSearchResultLimit: jest.fn(),
      } as any)

      mockUseRecoilValue.mockImplementation((atom) => {
        if (atom === mockManagedClustersState) return mockMultiClusters
        if (atom === mockManagedClusterSetsState) return mockManagedClusterSets
        return []
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      await waitFor(() => {
        const clusterSet = result.current.roleAssignmentData.clusterSets[0]
        const cluster1 = clusterSet?.clusters?.find((c) => c.name === 'cluster-1')
        const cluster2 = clusterSet?.clusters?.find((c) => c.name === 'cluster-2')
        const cluster3 = clusterSet?.clusters?.find((c) => c.name === 'cluster-3')

        expect(cluster1?.namespaces).toEqual(['app-frontend', 'app-backend'])
        expect(cluster2?.namespaces).toEqual(['app-frontend', 'monitoring'])
        expect(cluster3?.namespaces).toEqual(['data-processing'])
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
