/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import * as internal from '../internal/cachedFleetConfiguration'
import { useHubClusterName } from './useHubClusterName'
import { useIsFleetAvailable } from './useIsFleetAvailable'

jest.mock('../internal/cachedHubClusterName')

jest.mock('./useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(),
}))

const mockUseIsFleetAvailable = useIsFleetAvailable as jest.Mock

describe('testing useHubClusterName Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return cached hub cluster name if cache available', () => {
    void (internal.getCachedHubClusterName as jest.Mock).mockReturnValue('local-cluster')
    mockUseIsFleetAvailable.mockReturnValue(true)
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
