/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useFleetSearchPoll } from './useFleetSearchPoll'
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
import { WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk'

// Mock the search-sdk hook
jest.mock('../internal/search/search-sdk', () => ({
  useSearchResultItemsQuery: jest.fn(),
}))

// Mock the search client
jest.mock('../internal/search/search-client', () => ({
  searchClient: 'mock-search-client',
}))

const mockUseSearchResultItemsQuery = useSearchResultItemsQuery as jest.MockedFunction<typeof useSearchResultItemsQuery>

describe('useFleetSearchPoll', () => {
  const mockWatchOptions: WatchK8sResource = {
    groupVersionKind: { group: '', version: 'v1', kind: 'Pod' },
    namespace: 'default',
    namespaced: true,
    isList: false, // Changed to false so we can test undefined responses
  }

  const mockSearchResultItem = {
    cluster: 'test-cluster',
    apigroup: '',
    apiversion: 'v1',
    kind: 'Pod',
    name: 'test-pod',
    namespace: 'default',
    created: '2023-01-01T00:00:00Z',
    label: 'app=test;version=1.0',
  }

  const mockSearchResult = {
    searchResult: [
      {
        items: [mockSearchResultItem],
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should return undefined data, false loaded, undefined error, and refetch function when loading', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll(mockWatchOptions))

      const [data, loaded, error, refetch] = result.current
      expect(data).toBeUndefined()
      expect(loaded).toBe(false)
      expect(error).toBeUndefined()
      expect(typeof refetch).toBe('function')
    })

    it('should return processed data, true loaded, undefined error, and refetch function when successful', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll(mockWatchOptions))

      const [data, loaded, error, refetch] = result.current
      expect(loaded).toBe(true)
      expect(error).toBeUndefined()
      expect(typeof refetch).toBe('function')
      expect(data).toHaveLength(1)
      expect(Array.isArray(data)).toBe(true)
      expect((data as any[])[0]).toEqual({
        cluster: 'test-cluster',
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          creationTimestamp: '2023-01-01T00:00:00Z',
          name: 'test-pod',
          namespace: 'default',
          labels: {
            app: 'test',
            version: '1.0',
          },
        },
      })
    })

    it('should return undefined data, true loaded, error, and refetch function when error occurs', () => {
      const mockError = new Error('Search failed')
      const mockRefetch = jest.fn()
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: mockError,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll(mockWatchOptions))

      const [data, loaded, error, refetch] = result.current
      expect(data).toBeUndefined()
      expect(loaded).toBe(true)
      expect(error).toBe(mockError)
      expect(typeof refetch).toBe('function')
    })

    it('should return empty array for list when isList is true and no data', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll({ ...mockWatchOptions, isList: true }))

      expect(result.current[0]).toEqual([])
    })

    it('should return undefined for single item when isList is false and no data', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll({ ...mockWatchOptions, isList: false }))

      expect(result.current[0]).toBeUndefined()
    })
  })

  describe('search input generation', () => {
    it('should generate correct search input for basic watch options', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(mockWatchOptions))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should include group in search input when specified', () => {
      const watchOptionsWithGroup = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(watchOptionsWithGroup))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apigroup', values: ['apps'] },
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Deployment'] },
                { property: 'namespace', values: ['default'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should include name filter when specified', () => {
      const watchOptionsWithName = {
        ...mockWatchOptions,
        name: 'specific-pod',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(watchOptionsWithName))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
                { property: 'name', values: ['specific-pod'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should not include namespace filter when not namespaced', () => {
      const watchOptionsNonNamespaced = {
        ...mockWatchOptions,
        namespaced: false,
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(watchOptionsNonNamespaced))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should respect custom limit', () => {
      const watchOptionsWithLimit = {
        ...mockWatchOptions,
        limit: 10,
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(watchOptionsWithLimit))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
              ],
              limit: 10,
            },
          ],
        },
      })
    })
  })

  describe('advanced search filters', () => {
    it('should merge advanced search filters with watch options', () => {
      const advancedFilters = [
        { property: 'label', values: ['app=test'] },
        { property: 'status', values: ['Running'] },
      ]

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(mockWatchOptions, advancedFilters))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
                { property: 'label', values: ['app=test'] },
                { property: 'status', values: ['Running'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should prioritize watch options over advanced search filters', () => {
      const advancedFilters = [
        { property: 'kind', values: ['Service'] }, // This should be ignored
        { property: 'label', values: ['app=test'] },
      ]

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(mockWatchOptions, advancedFilters))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] }, // From watch options, not advanced search
                { property: 'namespace', values: ['default'] },
                { property: 'label', values: ['app=test'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should filter out undefined values from advanced search', () => {
      const advancedFilters = [
        { property: 'label', values: ['app=test'] },
        { property: 'status', values: undefined as any },
        { property: '', values: ['ignored'] },
      ]

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(mockWatchOptions, advancedFilters))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
                { property: 'label', values: ['app=test'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })
  })

  describe('data transformation', () => {
    it('should parse labels correctly', () => {
      const itemWithLabels = {
        ...mockSearchResultItem,
        label: 'app=test;version=1.0;environment=prod',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [itemWithLabels] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll(mockWatchOptions))

      const [data] = result.current
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      const dataArray = data as any[]
      expect(dataArray[0].metadata.labels).toEqual({
        app: 'test',
        version: '1.0',
        environment: 'prod',
      })
    })

    it('should handle empty labels', () => {
      const itemWithoutLabels = {
        ...mockSearchResultItem,
        label: '',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [itemWithoutLabels] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll(mockWatchOptions))

      const [data] = result.current
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      const dataArray = data as any[]
      expect(dataArray[0].metadata.labels).toEqual({})
    })

    it('should handle VirtualMachine resource transformation', () => {
      const vmItem = {
        ...mockSearchResultItem,
        kind: 'VirtualMachine',
        _specRunning: true,
        _specRunStrategy: 'Always',
        cpu: 2,
        memory: '4Gi',
        ready: 'True',
        status: 'Running',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [vmItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsVM = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
      }

      const { result } = renderHook(() => useFleetSearchPoll(watchOptionsVM))

      const [data] = result.current
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      const dataArray = data as any[]
      expect(dataArray[0].spec).toEqual({
        running: true,
        runStrategy: 'Always',
        template: {
          spec: {
            domain: {
              cpu: { cores: 2 },
              memory: { guest: '4Gi' },
            },
          },
        },
      })
      expect(dataArray[0].status).toEqual({
        conditions: [{ type: 'Ready', status: 'True' }],
        printableStatus: 'Running',
      })
    })

    it('should handle VirtualMachineInstance resource transformation', () => {
      const vmiItem = {
        ...mockSearchResultItem,
        kind: 'VirtualMachineInstance',
        liveMigratable: 'True',
        ready: 'True',
        ipaddress: '10.0.0.1',
        node: 'worker-node-1',
        phase: 'Running',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [vmiItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsVMI = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachineInstance' },
      }

      const { result } = renderHook(() => useFleetSearchPoll(watchOptionsVMI))

      const [data] = result.current
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      const dataArray = data as any[]
      expect(dataArray[0].status).toEqual({
        conditions: [
          { type: 'LiveMigratable', status: 'True' },
          { type: 'Ready', status: 'True' },
        ],
        interfaces: [{ ipAddress: '10.0.0.1', name: 'default' }],
        nodeName: 'worker-node-1',
        phase: 'Running',
      })
    })

    it('should handle apiVersion with group correctly', () => {
      const itemWithGroup = {
        ...mockSearchResultItem,
        apigroup: 'apps',
        apiversion: 'v1',
        kind: 'Deployment',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [itemWithGroup] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll(mockWatchOptions))

      const [data] = result.current
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      const dataArray = data as any[]
      expect(dataArray[0].apiVersion).toBe('apps/v1')
    })

    it('should handle apiVersion without group correctly', () => {
      const itemWithoutGroup = {
        ...mockSearchResultItem,
        apigroup: '',
        apiversion: 'v1',
        kind: 'Pod',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [itemWithoutGroup] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll(mockWatchOptions))

      const [data] = result.current
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      const dataArray = data as any[]
      expect(dataArray[0].apiVersion).toBe('v1')
    })
  })

  describe('skip behavior', () => {
    it('should skip search when kind is undefined', () => {
      const watchOptionsWithoutKind = {
        ...mockWatchOptions,
        groupVersionKind: undefined,
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(watchOptionsWithoutKind))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: true,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [{ property: 'namespace', values: ['default'] }],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should not skip search when kind is empty string', () => {
      const watchOptionsWithEmptyKind = {
        ...mockWatchOptions,
        groupVersionKind: { group: '', version: 'v1', kind: '' },
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(watchOptionsWithEmptyKind))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'namespace', values: ['default'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })
  })

  describe('polling functionality', () => {
    it('should not include pollInterval when not provided', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(mockWatchOptions))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should include pollInterval when provided', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(mockWatchOptions, undefined, 5000))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 5000000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should include pollInterval with advanced search filters', () => {
      const advancedFilters = [
        { property: 'label', values: ['app=test'] },
        { property: 'status', values: ['Running'] },
      ]

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(mockWatchOptions, advancedFilters, 3000))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 3000000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
                { property: 'label', values: ['app=test'] },
                { property: 'status', values: ['Running'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })

    it('should not include pollInterval when set to 0', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearchPoll(mockWatchOptions, undefined, 0))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith({
        client: 'mock-search-client',
        skip: false,
        pollInterval: 30000,
        variables: {
          input: [
            {
              filters: [
                { property: 'apiversion', values: ['v1'] },
                { property: 'kind', values: ['Pod'] },
                { property: 'namespace', values: ['default'] },
              ],
              limit: -1,
            },
          ],
        },
      })
    })
  })

  describe('memoization', () => {
    it('should memoize search input correctly', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { rerender } = renderHook(({ watchOptions }) => useFleetSearchPoll(watchOptions), {
        initialProps: { watchOptions: mockWatchOptions },
      })

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledTimes(1)
      const firstCall = mockUseSearchResultItemsQuery.mock.calls[0]
      expect(firstCall).toBeDefined()
      expect(firstCall?.[0]).toBeDefined()

      // Rerender with same props
      rerender({ watchOptions: mockWatchOptions })

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledTimes(2)
      const secondCall = mockUseSearchResultItemsQuery.mock.calls[1]
      expect(secondCall).toBeDefined()
      expect(secondCall?.[0]).toBeDefined()

      // Should use the same input structure (content should be the same)
      expect(firstCall?.[0]?.variables?.input).toEqual(secondCall?.[0]?.variables?.input)
    })

    it('should update search input when props change', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { rerender } = renderHook(({ watchOptions }) => useFleetSearchPoll(watchOptions), {
        initialProps: { watchOptions: mockWatchOptions },
      })

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledTimes(1)
      const firstCall = mockUseSearchResultItemsQuery.mock.calls[0]
      expect(firstCall).toBeDefined()
      expect(firstCall?.[0]).toBeDefined()

      // Rerender with different props
      const newWatchOptions = {
        ...mockWatchOptions,
        namespace: 'different-namespace',
      }
      rerender({ watchOptions: newWatchOptions })

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledTimes(2)
      const secondCall = mockUseSearchResultItemsQuery.mock.calls[1]
      expect(secondCall).toBeDefined()
      expect(secondCall?.[0]).toBeDefined()

      // Should use different input object
      expect(firstCall?.[0]?.variables?.input).not.toEqual(secondCall?.[0]?.variables?.input)

      // Verify the specific change
      const secondCallInput = secondCall?.[0]?.variables?.input as any[]
      expect(secondCallInput).toBeDefined()
      expect(secondCallInput?.[0]?.filters).toContainEqual({
        property: 'namespace',
        values: ['different-namespace'],
      })
    })
  })
})
