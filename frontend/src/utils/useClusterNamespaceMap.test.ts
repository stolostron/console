/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { useClusterNamespaceMap } from './useClusterNamespaceMap'
import { useSearchResultItemsQuery } from '../routes/Search/search-sdk/search-sdk'

jest.mock('../routes/Search/search-sdk/search-sdk', () => ({
  useSearchResultItemsQuery: jest.fn(),
}))

const mockUseSearchResultItemsQuery = useSearchResultItemsQuery as jest.MockedFunction<typeof useSearchResultItemsQuery>

describe('useClusterNamespaceMap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty map and loading true when query is loading', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({})
    expect(result.current.isLoading).toBe(true)
  })

  it('should return empty map when query has no items', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: { searchResult: [{ items: [] }] },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({})
    expect(result.current.isLoading).toBe(false)
  })

  it('should return empty map when searchResult is undefined', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({})
    expect(result.current.isLoading).toBe(false)
  })

  it('should build cluster to namespaces map from items', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [
              { cluster: 'cluster-1', name: 'my-namespace' },
              { cluster: 'cluster-1', name: 'test-namespace' },
              { cluster: 'cluster-2', name: 'app-ns' },
            ],
          },
        ],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({
      'cluster-1': ['my-namespace', 'test-namespace'],
      'cluster-2': ['app-ns'],
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('should filter out namespaces starting with kube', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [
              { cluster: 'cluster-1', name: 'user-ns' },
              { cluster: 'cluster-1', name: 'kube-system' },
              { cluster: 'cluster-1', name: 'kube-public' },
            ],
          },
        ],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({
      'cluster-1': ['user-ns'],
    })
  })

  it('should filter out namespaces starting with openshift', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [
              { cluster: 'cluster-1', name: 'user-ns' },
              { cluster: 'cluster-1', name: 'openshift-operators' },
              { cluster: 'cluster-1', name: 'openshift-monitoring' },
            ],
          },
        ],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({
      'cluster-1': ['user-ns'],
    })
  })

  it('should filter out namespaces starting with open-cluster-management', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [
              { cluster: 'cluster-1', name: 'user-ns' },
              { cluster: 'cluster-1', name: 'open-cluster-management' },
              { cluster: 'cluster-1', name: 'open-cluster-management-hub' },
            ],
          },
        ],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({
      'cluster-1': ['user-ns'],
    })
  })

  it('should skip items with empty or undefined namespace name', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [
              { cluster: 'cluster-1', name: 'valid-ns' },
              { cluster: 'cluster-1', name: '' },
              { cluster: 'cluster-2', name: undefined },
            ],
          },
        ],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({
      'cluster-1': ['valid-ns'],
    })
  })

  it('should use empty array when items is missing and fallback does not apply', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [{}],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useClusterNamespaceMap())

    expect(result.current.clusterNamespaceMap).toEqual({})
  })

  it('should call useSearchResultItemsQuery with Namespace filter and limit -1', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: { searchResult: [{ items: [] }] },
      loading: false,
      error: undefined,
    } as any)

    renderHook(() => useClusterNamespaceMap())

    expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: [
            {
              keywords: [],
              filters: [{ property: 'kind', values: ['Namespace'] }],
              limit: -1,
            },
          ],
        },
      })
    )
  })
})
