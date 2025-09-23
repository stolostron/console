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

  const mockAllNamespaces = {
    searchResult: [
      {
        items: [
          { cluster: 'cluster-1', name: 'my-namespace' },
          { cluster: 'cluster-1', name: 'test-namespace' },
          { cluster: 'cluster-1', name: 'kube-system' },
          { cluster: 'cluster-1', name: 'openshift-operators' },
          { cluster: 'cluster-1', name: 'open-cluster-management-hub' },
        ],
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseQuery.mockImplementation((queryFn) => {
      if (queryFn === listUsers) {
        return { data: mockUsers, loading: false } as any
      }
      if (queryFn === listGroups) {
        return { data: mockGroups, loading: false } as any
      }
      return { data: undefined, loading: false } as any
    })

    mockUseSearchResultItemsQuery.mockImplementation((options) => {
      const input = options?.variables?.input as any[]
      const isNamespacesQuery = input?.[0]?.filters?.some(
        (filter: any) => filter.property === 'kind' && filter.values?.includes('Namespace')
      )

      if (isNamespacesQuery) {
        return { data: mockAllNamespaces, loading: false } as any
      }

      return { data: mockClusterRoles, loading: false } as any
    })

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
      mockUseSearchResultItemsQuery.mockImplementation((options) => {
        const input = options?.variables?.input as any[]
        const isNamespacesQuery = input?.[0]?.filters?.some(
          (filter: any) => filter.property === 'kind' && filter.values?.includes('Namespace')
        )

        if (isNamespacesQuery) {
          return { data: undefined, loading: true } as any
        }

        return { data: mockClusterRoles, loading: false } as any
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      expect(result.current.isLoading).toBe(true)
    })

    it('should show loading is complete when namespaces and roles are done loading', () => {
      mockUseSearchResultItemsQuery.mockImplementation((options) => {
        const input = options?.variables?.input as any[]
        const isNamespacesQuery = input?.[0]?.filters?.some(
          (filter: any) => filter.property === 'kind' && filter.values?.includes('Namespace')
        )

        if (isNamespacesQuery) {
          return { data: mockAllNamespaces, loading: false } as any
        }

        return { data: mockClusterRoles, loading: false } as any
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
    it('should filter out all system namespace patterns', () => {
      const mockAllNamespaces = {
        searchResult: [
          {
            items: [
              { cluster: 'cluster-1', name: 'user-app' },
              { cluster: 'cluster-1', name: 'my-openshift-app' },
              { cluster: 'cluster-1', name: 'kubernetes-dashboard' },
              { cluster: 'cluster-1', name: 'my-cluster-app' },

              { cluster: 'cluster-1', name: 'kube-system' },
              { cluster: 'cluster-1', name: 'kube-public' },
              { cluster: 'cluster-1', name: 'kube-node-lease' },
              { cluster: 'cluster-1', name: 'openshift-operators' },
              { cluster: 'cluster-1', name: 'openshift-monitoring' },
              { cluster: 'cluster-1', name: 'openshift-config' },
              { cluster: 'cluster-1', name: 'open-cluster-management' },
              { cluster: 'cluster-1', name: 'open-cluster-management-hub' },
              { cluster: 'cluster-1', name: 'open-cluster-management-agent' },
            ],
          },
        ],
      }

      mockUseSearchResultItemsQuery.mockImplementation((options) => {
        const input = options?.variables?.input as any[]
        const isNamespacesQuery = input?.[0]?.filters?.some(
          (filter: any) => filter.property === 'kind' && filter.values?.includes('Namespace')
        )

        if (isNamespacesQuery) {
          return { data: mockAllNamespaces, loading: false } as any
        }
        return { data: mockClusterRoles, loading: false } as any
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      waitFor(() => {
        const cluster = result.current.roleAssignmentData.clusterSets[0]?.clusters?.[0]

        // User namespaces should be included
        expect(cluster?.namespaces).toContain('user-app')
        expect(cluster?.namespaces).toContain('my-openshift-app')
        expect(cluster?.namespaces).toContain('kubernetes-dashboard')
        expect(cluster?.namespaces).toContain('my-cluster-app')

        // All system namespace patterns should be filtered out
        expect(cluster?.namespaces).not.toContain('kube-system')
        expect(cluster?.namespaces).not.toContain('kube-public')
        expect(cluster?.namespaces).not.toContain('kube-node-lease')
        expect(cluster?.namespaces).not.toContain('openshift-operators')
        expect(cluster?.namespaces).not.toContain('openshift-monitoring')
        expect(cluster?.namespaces).not.toContain('openshift-config')
        expect(cluster?.namespaces).not.toContain('open-cluster-management')
        expect(cluster?.namespaces).not.toContain('open-cluster-management-hub')
        expect(cluster?.namespaces).not.toContain('open-cluster-management-agent')
      })
    })
  })

  describe('Cluster Namespace Mapping Logic', () => {
    it('should correctly map namespaces to their respective clusters', () => {
      const mockAllNamespacesMultiCluster = {
        searchResult: [
          {
            items: [
              { cluster: 'cluster-1', name: 'app-frontend' },
              { cluster: 'cluster-1', name: 'app-backend' },
              { cluster: 'cluster-2', name: 'app-frontend' },
              { cluster: 'cluster-2', name: 'monitoring' },
              { cluster: 'cluster-3', name: 'data-processing' },
            ],
          },
        ],
      }

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

      mockUseSearchResultItemsQuery.mockImplementation((options) => {
        const input = options?.variables?.input as any[]
        const isNamespacesQuery = input?.[0]?.filters?.some(
          (filter: any) => filter.property === 'kind' && filter.values?.includes('Namespace')
        )

        if (isNamespacesQuery) {
          return { data: mockAllNamespacesMultiCluster, loading: false } as any
        }

        return { data: mockClusterRoles, loading: false } as any
      })

      const mockManagedClustersState = {} as any
      mockUseRecoilValue.mockImplementation((atom) => {
        if (atom === mockManagedClustersState) return mockMultiClusters
        return mockManagedClusterSets
      })

      const { result } = renderHook(() => useRoleAssignmentData())

      waitFor(() => {
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
