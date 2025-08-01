/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import * as internal from '../internal/cachedFleetObservabilityInstalled'
import { useIsFleetObservabilityInstalled } from './useIsFleetObservabilityInstalled'
import { useIsFleetAvailable } from './useIsFleetAvailable'

jest.mock('../internal/cachedFleetObservabilityInstalled')

jest.mock('./useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(),
}))

const mockUseIsFleetAvailable = useIsFleetAvailable as jest.Mock

describe('testing useFleetObservabilityInstalled Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return cached hub cluster name if cache available', () => {
    void (internal.getCachedFleetObservabilityInstalled as jest.Mock).mockReturnValue(true)
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result } = renderHook(() => useIsFleetObservabilityInstalled())

    expect(result.current).toEqual([true, true, undefined])
  })

  it('should fetch hub cluster name if not cached', async () => {
    void (internal.getCachedFleetObservabilityInstalled as jest.Mock).mockReturnValue(undefined)
    const fetchMock = jest.spyOn(internal, 'fetchFleetObservabilityInstalled').mockResolvedValue(true)
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result, waitForNextUpdate } = renderHook(() => useIsFleetObservabilityInstalled())
    expect(result.current).toEqual([null, false, undefined])
    await waitForNextUpdate()
    expect(fetchMock).toHaveBeenCalled()
    expect(result.current).toEqual([true, true, undefined])
  })

  it('should return error if fleet is not available', async () => {
    void (internal.getCachedFleetObservabilityInstalled as jest.Mock).mockReturnValue(false)
    mockUseIsFleetAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useIsFleetObservabilityInstalled())
    expect(result.current).toEqual([
      null,
      false,
      'A version of RHACM that is compatible with the multicluster SDK is not available',
    ])
  })
})
