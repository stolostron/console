/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import * as internal from '../internal/cachedHubConfiguration'
import { useHubClusterName } from './useHubClusterName'
import { useIsFleetAvailable } from './useIsFleetAvailable'

jest.mock('../internal/cachedHubConfiguration')

jest.mock('../internal/cachedHubClusterName', () => ({
  getCachedHubClusterName: () => mockGetCachedHubClusterName(),
}))

const mockUseIsFleetAvailable = useIsFleetAvailable as jest.Mock
const hubConfiguration: internal.HubConfiguration = {
  localHubName: 'local-cluster',
  isHubSelfManaged: true,
  isGlobalHub: false,
  isObservabilityInstalled: false,
}

describe('useHubClusterName', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return cached hub cluster name if cache available', () => {
    void (internal.getCachedHubConfiguration as jest.Mock).mockReturnValue(hubConfiguration)
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result } = renderHook(() => useHubClusterName())

    expect(result.current).toEqual(['local-cluster', true, undefined])
  })

  it('should fetch hub cluster name if not cached', async () => {
    void (internal.getCachedHubConfiguration as jest.Mock).mockReturnValue(undefined)
    const fetchMock = jest.spyOn(internal, 'fetchHubConfiguration').mockResolvedValue(hubConfiguration)
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result, waitForNextUpdate } = renderHook(() => useHubClusterName())

    // Initially it should be loading
    expect(result.current).toEqual([undefined, false, undefined])

    // Wait for the async operation to complete
    await waitForNextUpdate()

    expect(result.current).toEqual(['local-cluster', true, undefined])
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })

  it('should return error if fleet is not available', async () => {
    void (internal.getCachedHubConfiguration as jest.Mock).mockReturnValue(hubConfiguration)
    mockUseIsFleetAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useHubClusterName())

    expect(result.current).toEqual(['local-cluster', true, undefined])
  })

  it('should fetch hub cluster name if not cached', async () => {
    void (internal.getCachedHubClusterName as jest.Mock).mockReturnValue(undefined)
    const fetchMock = jest.spyOn(internal, 'fetchHubClusterName').mockResolvedValue('local-cluster')
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result, waitForNextUpdate } = renderHook(() => useHubClusterName())
    expect(result.current).toEqual([undefined, false, undefined])
    await waitForNextUpdate()
    expect(fetchMock).toHaveBeenCalled()
    expect(result.current).toEqual(['local-cluster', true, undefined])
  })

  it('should return error if fleet is not available', async () => {
    void (internal.getCachedHubClusterName as jest.Mock).mockReturnValue('local-cluster')
    mockUseIsFleetAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useHubClusterName())
    expect(result.current).toEqual([
      undefined,
      false,
      'A version of RHACM that is compatible with the multicluster SDK is not available',
    ])
  })
})
