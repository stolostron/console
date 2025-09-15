/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useFleetSearchPoll } from './useFleetSearchPoll'
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
import { K8sResourceCommon, WatchK8sResource } from '@openshift-console/dynamic-plugin-sdk'

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

      const { result } = renderHook(() => useFleetSearchPoll<K8sResourceCommon[]>(mockWatchOptions))

      const [data, loaded, error, refetch] = result.current
      expect(loaded).toBe(true)
      expect(error).toBeUndefined()
      expect(typeof refetch).toBe('function')
      expect(data).toHaveLength(1)
      expect(data?.[0]).toEqual({
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

      const { result } = renderHook(() => useFleetSearchPoll<K8sResourceCommon[]>(mockWatchOptions))

      const [data] = result.current
      expect(data?.[0].metadata?.labels).toEqual({
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

      const { result } = renderHook(() => useFleetSearchPoll<K8sResourceCommon[]>(mockWatchOptions))

      const [data] = result.current
      expect(data?.[0].metadata?.labels).toEqual({})
    })

    it('should handle VirtualMachine resource transformation', () => {
      const vmItem = {
        ...mockSearchResultItem,
        kind: 'VirtualMachine',
        apigroup: 'kubevirt.io',
        cpu: '2',
        memory: '4Gi',
        ready: 'True',
        status: 'Running',
        flavor: 'test',
        osName: 'rhel',
        workload: 'app',
        runStrategy: 'Always',
        architecture: 'amd64',
        condition: 'Ready=True; AgentConnected=True',
        dataVolumeNames: 'test-volume1; test-volume2',
        pvcClaimNames: 'test-claim1; test-claim2',
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

      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsVM))

      const [data] = result.current
      expect(data?.[0].spec).toEqual({
        runStrategy: 'Always',
        template: {
          spec: {
            architecture: 'amd64',
            domain: {
              cpu: { cores: 2 },
              memory: { guest: '4Gi' },
            },
            volumes: [
              { dataVolume: { name: 'test-volume1' } },
              { dataVolume: { name: 'test-volume2' } },
              { persistentVolumeClaim: { claimName: 'test-claim1' } },
              { persistentVolumeClaim: { claimName: 'test-claim2' } },
            ],
          },
          metadata: {
            annotations: {
              'vm.kubevirt.io/flavor': 'test',
              'vm.kubevirt.io/os': 'rhel',
              'vm.kubevirt.io/workload': 'app',
            },
          },
        },
      })
      expect(data?.[0].status).toEqual({
        conditions: [
          { type: 'Ready', status: 'True' },
          { type: 'AgentConnected', status: 'True' },
        ],
        printableStatus: 'Running',
      })
    })
    it('should handle ClusterServiceVersion resource transformation', () => {
      const csvItem = {
        ...mockSearchResultItem,
        kind: 'ClusterServiceVersion',
        apigroup: 'operators.coreos.com',
        version: '1.0.0',
        display: 'Test',
        phase: 'Running',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [csvItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsCSV = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'operators.coreos.com', version: 'v1', kind: 'ClusterServiceVersion' },
      }
      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsCSV))

      const [data] = result.current
      expect(data?.[0].spec).toEqual({
        version: '1.0.0',
        displayName: 'Test',
      })
      expect(data?.[0].status).toEqual({
        phase: 'Running',
      })
    })

    it('should handle PersistentVolumeClaim resource transformation', () => {
      const pvcItem = {
        ...mockSearchResultItem,
        kind: 'PersistentVolumeClaim',
        requestedStorage: '1Gi',
        volumeMode: 'Filesystem',
        storageClassName: 'gp3-csi',
        capacity: '1Gi',
        status: 'Bound',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [pvcItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsPVC = {
        ...mockWatchOptions,
        groupVersionKind: { group: '', version: 'v1', kind: 'PersistentVolumeClaim' },
      }
      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsPVC))

      const [data] = result.current
      expect(data?.[0].spec).toEqual({
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
        volumeMode: 'Filesystem',
        storageClassName: 'gp3-csi',
      })
      expect(data?.[0].status).toEqual({
        phase: 'Bound',
        capacity: { storage: '1Gi' },
      })
    })

    it('should handle VirtualMachineInstance resource transformation', () => {
      const vmiItem = {
        ...mockSearchResultItem,
        kind: 'VirtualMachineInstance',
        apigroup: 'kubevirt.io',
        cpu: '4',
        cpuSockets: '2',
        cpuThreads: '2',
        memory: '8Gi',
        liveMigratable: 'True',
        ready: 'True',
        ipaddress: '10.0.0.1',
        node: 'worker-node-1',
        phase: 'Running',
        osVersion: 'rhel',
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

      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsVMI))

      const [data] = result.current
      expect(data?.[0].spec).toEqual({
        domain: {
          cpu: {
            cores: 4,
            sockets: 2,
            threads: 2,
          },
          memory: { guest: '8Gi' },
        },
      })
      expect(data?.[0].status).toEqual({
        conditions: [
          { type: 'LiveMigratable', status: 'True' },
          { type: 'Ready', status: 'True' },
        ],
        interfaces: [{ ipAddress: '10.0.0.1', name: 'default' }],
        nodeName: 'worker-node-1',
        phase: 'Running',
        guestOSInfo: { version: 'rhel' },
      })
    })

    it('should handle VirtualMachineInstanceMigration resource transformation', () => {
      const vmimItem = {
        ...mockSearchResultItem,
        kind: 'VirtualMachineInstanceMigration',
        apigroup: 'kubevirt.io',
        phase: 'Running',
        endTime: '2025-08-12T08:00:00Z',
        vmiName: 'testMigrate',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [vmimItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsVMIM = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachineInstanceMigration' },
      }
      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsVMIM))

      const [data] = result.current
      expect(data?.[0].status).toEqual({
        phase: 'Running',
        migrationState: { endTimestamp: '2025-08-12T08:00:00Z' },
      })
      expect(data?.[0].spec).toEqual({
        vmiName: 'testMigrate',
      })
    })

    it('should handle ClusterOperator resource transformation', () => {
      const clusterOperatorItem = {
        ...mockSearchResultItem,
        kind: 'ClusterOperator',
        apigroup: 'config.openshift.io',
        version: '1.0.0',
        available: 'True',
        progressing: 'False',
        degraded: 'False',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [clusterOperatorItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsClusterOperator = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'config.openshift.io', version: 'v1', kind: 'ClusterOperator' },
      }

      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsClusterOperator))

      const [data] = result.current
      expect(data?.[0].status?.versions).toEqual([{ name: 'operator', version: '1.0.0' }])
      expect(data?.[0].status?.conditions).toEqual([
        { type: 'Available', status: 'True' },
        { type: 'Progressing', status: 'False' },
        { type: 'Degraded', status: 'False' },
      ])
    })

    it('should handle DataVolume resource transformation', () => {
      const dataVolumeItem = {
        ...mockSearchResultItem,
        kind: 'DataVolume',
        apigroup: 'cdi.kubevirt.io',
        size: '10Gi',
        storageClassName: 'ssd',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [dataVolumeItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsDataVolume = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'cdi.kubevirt.io', version: 'v1beta1', kind: 'DataVolume' },
      }

      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsDataVolume))

      const [data] = result.current
      expect(data?.[0].spec?.storage?.resources?.requests?.storage).toBe('10Gi')
      expect(data?.[0].spec?.storage?.storageClassName).toBe('ssd')
    })

    it('should handle Namespace resource transformation', () => {
      const namespaceItem = {
        ...mockSearchResultItem,
        kind: 'Namespace',
        apigroup: '',
        status: 'Active',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [namespaceItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsNamespace = {
        ...mockWatchOptions,
        groupVersionKind: { group: '', version: 'v1', kind: 'Namespace' },
      }

      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsNamespace))

      const [data] = result.current
      expect(data?.[0].status?.phase).toBe('Active')
    })

    it('should handle Node resource transformation', () => {
      const nodeItem = {
        ...mockSearchResultItem,
        kind: 'Node',
        apigroup: '',
        ipAddress: '127.0.0.1',
        memoryAllocatable: '5Gi',
        memoryCapacity: '10Gi',
        condition: 'Ready=True; TestCondition=False',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [nodeItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsNode = {
        ...mockWatchOptions,
        groupVersionKind: { group: '', version: 'v1', kind: 'Node' },
      }

      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsNode))

      const [data] = result.current
      expect(data?.[0].status?.addresses).toEqual([{ type: 'InternalIP', address: '127.0.0.1' }])
      expect(data?.[0].status?.allocatable?.memory).toBe('5Gi')
      expect(data?.[0].status?.capacity?.memory).toBe('10Gi')
      expect(data?.[0].status?.conditions).toEqual([
        { type: 'Ready', status: 'True' },
        { type: 'TestCondition', status: 'False' },
      ])
    })

    it('should handle StorageClass resource transformation', () => {
      const storageClassItem = {
        ...mockSearchResultItem,
        kind: 'StorageClass',
        apigroup: 'storage.k8s.io',
        allowVolumeExpansion: true,
        provisioner: 'test',
        reclaimPolicy: 'test',
        volumeBindingMode: 'test',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [storageClassItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsStorageClass = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'storage.k8s.io', version: 'v1', kind: 'StorageClass' },
      }

      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsStorageClass))

      const [data] = result.current
      expect(data?.[0].allowVolumeExpansion).toBe(true)
      expect(data?.[0].provisioner).toBe('test')
      expect(data?.[0].reclaimPolicy).toBe('test')
      expect(data?.[0].volumeBindingMode).toBe('test')
    })

    it('should handle Subscription resource transformation', () => {
      const subscriptionItem = {
        ...mockSearchResultItem,
        kind: 'Subscription',
        apigroup: 'operators.coreos.com',
        source: 'testSource',
        package: 'testPackage',
        channel: 'testChannel',
        installplan: 'testInstall',
        phase: 'Succeeded',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [subscriptionItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const watchOptionsSubscription = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'operators.coreos.com', version: 'v1alpha1', kind: 'Subscription' },
      }

      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsSubscription))

      const [data] = result.current
      expect(data?.[0].spec?.source).toBe('testSource')
      expect(data?.[0].spec?.name).toBe('testPackage')
      expect(data?.[0].spec?.channel).toBe('testChannel')
      expect(data?.[0].status?.installedCSV).toBe('testInstall')
      expect(data?.[0].status?.state).toBe('Succeeded')
    })

    it('should handle VirtualMachineSnapshot resource transformation', () => {
      const virtualMachineSnapshotItem = {
        ...mockSearchResultItem,
        kind: 'VirtualMachineSnapshot',
        apigroup: 'snapshot.kubevirt.io',
        ready: 'True',
        phase: 'Succeeded',
        indications: 'test;indication',
        sourceKind: 'VirtualMachine',
        sourceName: 'test-vm',
        readyToUse: true,
      }
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [virtualMachineSnapshotItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      const watchOptionsVirtualMachineSnapshot = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'snapshot.kubevirt.io', version: 'v1alpha1', kind: 'VirtualMachineSnapshot' },
      }
      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsVirtualMachineSnapshot))
      const [data] = result.current
      expect(data?.[0].status?.conditions).toEqual([
        {
          type: 'Ready',
          status: 'True',
        },
      ])
      expect(data?.[0].status?.phase).toBe('Succeeded')
      expect(data?.[0].status?.indications).toEqual(['test', 'indication'])
      expect(data?.[0].spec?.source?.kind).toBe('VirtualMachine')
      expect(data?.[0].spec?.source?.name).toBe('test-vm')
      expect(data?.[0].status?.readyToUse).toBe(true)
    })

    it('should handle VirtualMachineRestore resource transformation', () => {
      const virtualMachineRestoreItem = {
        ...mockSearchResultItem,
        kind: 'VirtualMachineRestore',
        apigroup: 'snapshot.kubevirt.io',
        ready: 'True',
        restoreTime: '2025-08-12T08:00:00Z',
        complete: true,
        targetKind: 'VirtualMachine',
        targetName: 'test-vm',
      }
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [virtualMachineRestoreItem] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      const watchOptionsVirtualMachineRestore = {
        ...mockWatchOptions,
        groupVersionKind: { group: 'snapshot.kubevirt.io', version: 'v1alpha1', kind: 'VirtualMachineRestore' },
      }
      const { result } = renderHook(() => useFleetSearchPoll<any[]>(watchOptionsVirtualMachineRestore))
      const [data] = result.current
      expect(data?.[0].status?.conditions).toEqual([
        {
          type: 'Ready',
          status: 'True',
        },
      ])
      expect(data?.[0].status?.restoreTime).toBe('2025-08-12T08:00:00Z')
      expect(data?.[0].status?.complete).toBe(true)
      expect(data?.[0].spec?.target?.kind).toBe('VirtualMachine')
      expect(data?.[0].spec?.target?.name).toBe('test-vm')
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

      const { result } = renderHook(() => useFleetSearchPoll<K8sResourceCommon[]>(mockWatchOptions))

      const [data] = result.current
      expect(data?.[0].apiVersion).toBe('apps/v1')
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

    it('should process _uid field in "<cluster>/<uid>" format correctly', () => {
      const itemWithClusterUid = {
        ...mockSearchResultItem,
        _uid: 'test-cluster/abc-123-def-456',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [itemWithClusterUid] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll<K8sResourceCommon[]>(mockWatchOptions))

      const [data] = result.current
      expect(data?.[0].metadata?.uid).toBe('abc-123-def-456')
    })

    it('should process _uid field in "<uid>" format correctly', () => {
      const itemWithDirectUid = {
        ...mockSearchResultItem,
        _uid: 'xyz-789-ghi-012',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [itemWithDirectUid] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll<K8sResourceCommon[]>(mockWatchOptions))

      const [data] = result.current
      expect(data?.[0].metadata?.uid).toBe('xyz-789-ghi-012')
    })

    it('should handle undefined _uid field correctly', () => {
      const itemWithoutUid = {
        ...mockSearchResultItem,
        _uid: undefined,
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [itemWithoutUid] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll<K8sResourceCommon[]>(mockWatchOptions))

      const [data] = result.current
      expect(data?.[0].metadata?.uid).toBeUndefined()
    })

    it('should handle empty string _uid field correctly', () => {
      const itemWithEmptyUid = {
        ...mockSearchResultItem,
        _uid: '',
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: {
          searchResult: [{ items: [itemWithEmptyUid] }],
        },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearchPoll<K8sResourceCommon[]>(mockWatchOptions))

      const [data] = result.current
      expect(data?.[0].metadata?.uid).toBeUndefined()
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

      const { rerender } = renderHook(({ watchOptions }) => useFleetSearchPoll<K8sResourceCommon[]>(watchOptions), {
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

      const { rerender } = renderHook(({ watchOptions }) => useFleetSearchPoll<K8sResourceCommon[]>(watchOptions), {
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
