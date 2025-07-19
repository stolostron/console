/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useFleetK8sAPIPath, getFleetK8sAPIPath } from './useFleetK8sAPIPath'
import { useHubClusterName } from './useHubClusterName'

// Mock dependencies
jest.mock('./useHubClusterName')
jest.mock('../internal/constants', () => ({
  BASE_K8S_API_PATH: '/api/kubernetes',
  MANAGED_CLUSTER_API_PATH: 'api/clusters',
  LOCAL_CLUSTER_LABEL: 'local-cluster',
  NO_MULTICLUSTER: 'NO_MULTICLUSTER',
}))

jest.mock('./apiRequests', () => ({
  k8sListItems: jest.fn(),
  getBackendUrl: () => 'http://localhost:9000',
}))

const mockUseHubClusterName = useHubClusterName as jest.MockedFunction<typeof useHubClusterName>

describe('useFleetK8sAPIPath', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return base path when no cluster is provided', () => {
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])

    const { result } = renderHook(() => useFleetK8sAPIPath())

    expect(result.current).toEqual(['/api/kubernetes', true, undefined])
  })

  it('should return base path when cluster equals hub cluster', () => {
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])

    const { result } = renderHook(() => useFleetK8sAPIPath('hub-cluster'))

    expect(result.current).toEqual(['/api/kubernetes', true, undefined])
  })

  it('should return managed cluster path when cluster differs from hub cluster', () => {
    mockUseHubClusterName.mockReturnValue(['hub-cluster', true, undefined])

    const { result } = renderHook(() => useFleetK8sAPIPath('managed-cluster-1'))

    expect(result.current).toEqual(['http://localhost:9000/api/clusters/managed-cluster-1', true, undefined])
  })

  it('should return undefined when not loaded', () => {
    mockUseHubClusterName.mockReturnValue([undefined, false, undefined])

    const { result } = renderHook(() => useFleetK8sAPIPath('managed-cluster-1'))

    expect(result.current).toEqual([undefined, false, undefined])
  })

  it('should return managed cluster path when there is an error getting hub cluster name', () => {
    mockUseHubClusterName.mockReturnValue([undefined, true, new Error('Test error')])

    const { result } = renderHook(() => useFleetK8sAPIPath('managed-cluster-1'))

    expect(result.current).toEqual([
      'http://localhost:9000/api/clusters/managed-cluster-1',
      true,
      new Error('Test error'),
    ])
  })

  it('should return managed cluster path when hub cluster name is NO_MULTICLUSTER', () => {
    mockUseHubClusterName.mockReturnValue(['NO_MULTICLUSTER', true, undefined])

    const { result } = renderHook(() => useFleetK8sAPIPath('managed-cluster-1'))

    expect(result.current).toEqual(['http://localhost:9000/api/clusters/managed-cluster-1', true, undefined])
  })
})

describe('getFleetK8sAPIPath', () => {
  const { k8sListItems } = jest.requireMock('./apiRequests')
  const mockK8sListItems = k8sListItems as jest.MockedFunction<typeof k8sListItems>

  beforeEach(() => {
    jest.clearAllMocks()
    // Clear the cached hub cluster name between tests
    jest.resetModules()
  })

  it('should return base path when no cluster is provided', async () => {
    const result = await getFleetK8sAPIPath()
    expect(result).toBe('/api/kubernetes')
  })

  it('should return managed cluster path when cluster is provided and hub cluster is found', async () => {
    mockK8sListItems.mockResolvedValue([
      {
        metadata: {
          name: 'hub-cluster',
        },
      },
    ])

    const result = await getFleetK8sAPIPath('managed-cluster-1')
    expect(result).toBe('http://localhost:9000/api/clusters/managed-cluster-1')
  })

  it('should return managed cluster path when ManagedCluster CRD is not available (404 error)', async () => {
    mockK8sListItems.mockRejectedValue({ code: 404 })

    const result = await getFleetK8sAPIPath('managed-cluster-1')
    expect(result).toBe('http://localhost:9000/api/clusters/managed-cluster-1')
  })

  it('should return managed cluster path when other errors occur', async () => {
    mockK8sListItems.mockRejectedValue(new Error('Network error'))

    const result = await getFleetK8sAPIPath('managed-cluster-1')
    expect(result).toBe('http://localhost:9000/api/clusters/managed-cluster-1')
  })

  it('should return managed cluster path when hub cluster is not found', async () => {
    mockK8sListItems.mockResolvedValue([])

    const result = await getFleetK8sAPIPath('managed-cluster-1')
    expect(result).toBe('http://localhost:9000/api/clusters/managed-cluster-1')
  })
})
