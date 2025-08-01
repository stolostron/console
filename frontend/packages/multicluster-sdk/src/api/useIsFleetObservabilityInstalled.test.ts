/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import * as internal from '../internal/cachedHubConfiguration'
import { useIsFleetObservabilityInstalled } from './useIsFleetObservabilityInstalled'
import { useIsFleetAvailable } from './useIsFleetAvailable'

jest.mock('../internal/cachedHubConfiguration')

jest.mock('./useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(),
}))

const mockUseIsFleetAvailable = useIsFleetAvailable as jest.Mock
const observabilityInstalled: internal.HubConfiguration = {
  localHubName: 'hub',
  isHubSelfManaged: true,
  isGlobalHub: false,
  isObservabilityInstalled: true,
}
const noObservability: internal.HubConfiguration = {
  localHubName: 'hub',
  isHubSelfManaged: true,
  isGlobalHub: false,
  isObservabilityInstalled: false,
}

describe('useFleetObservabilityInstalled', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return cached observability status if cache available', async () => {
    void (internal.getCachedHubConfiguration as jest.Mock).mockReturnValue(observabilityInstalled)
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result } = renderHook(() => useIsFleetObservabilityInstalled())

    expect(result.current).toEqual([true, true, undefined])
  })

  it('should fetch observability status if not cached', async () => {
    void (internal.getCachedHubConfiguration as jest.Mock).mockReturnValue(undefined)
    const fetchMock = jest.spyOn(internal, 'fetchHubConfiguration').mockResolvedValue(observabilityInstalled)
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result, waitForNextUpdate } = renderHook(() => useIsFleetObservabilityInstalled())
    expect(result.current).toEqual([undefined, false, undefined])
    await waitForNextUpdate()
    expect(fetchMock).toHaveBeenCalled()
    expect(result.current).toEqual([true, true, undefined])
  })

  it('should return error if fleet is not available', async () => {
    void (internal.getCachedHubConfiguration as jest.Mock).mockReturnValue(noObservability)
    mockUseIsFleetAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useIsFleetObservabilityInstalled())
    expect(result.current).toEqual([
      undefined,
      false,
      'A version of RHACM that is compatible with the multicluster SDK is not available',
    ])
  })
})
