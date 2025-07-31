/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import { getRequest } from '../../resources/utils'
import { FEATURE_FLAGS } from './consts'
import useFeatureFlags from './useFeatureFlags'

jest.mock('../../resources/utils')

// Mock timers for polling tests
jest.useFakeTimers()

describe('useFeatureFlags', () => {
  const setFeatureFlagMock = jest.fn()
  const getRequestMock = getRequest as jest.Mock
  const abortMock = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  it.each([
    ['components undefined', undefined],
    ['no flags exist at multiclusterhub', []],
  ])('%s', async (_title: string, components: any[] | undefined) => {
    // Arrange
    getRequestMock.mockReturnValue({
      promise: Promise.resolve(components),
      abort: abortMock,
    })

    // Act
    const { unmount } = renderHook(() => useFeatureFlags(setFeatureFlagMock, 0)) // Disable polling for this test

    // Use act with async Promise.resolve() to ensure React state updates complete
    // The Promise.resolve() gives the event loop a chance to process the hook's async operations.
    await act(async () => {
      await Promise.resolve()
    })

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length + 1)
    expect(setFeatureFlagMock).toHaveBeenCalledWith('MULTICLUSTER_SDK_PROVIDER_1', true)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, false)
    )

    unmount()
  })

  it.each([[true], [false]])('all flags exist at multiclusterhub and enabled: %s', async (enabled: boolean) => {
    // Arrange
    getRequestMock.mockReturnValue({
      promise: Promise.resolve(Object.values(FEATURE_FLAGS).map((e) => ({ name: e, enabled }))),
      abort: abortMock,
    })

    // Act
    const { unmount } = renderHook(() => useFeatureFlags(setFeatureFlagMock, 0)) // Disable polling for this test

    // Wait for the promise to resolve
    await act(async () => {
      await Promise.resolve()
    })

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length + 1)
    expect(setFeatureFlagMock).toHaveBeenCalledWith('MULTICLUSTER_SDK_PROVIDER_1', true)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, enabled)
    )

    unmount()
  })

  it('should poll at specified intervals', async () => {
    // Arrange
    const pollingInterval = 5000
    getRequestMock.mockReturnValue({
      promise: Promise.resolve([]),
      abort: abortMock,
    })

    // Act
    const { unmount } = renderHook(() => useFeatureFlags(setFeatureFlagMock, pollingInterval))

    // Wait for initial call
    await act(async () => {
      await Promise.resolve()
    })

    expect(getRequestMock).toHaveBeenCalledTimes(1)

    // Use act when advancing fake timers that trigger React updates
    // WHY: jest.advanceTimersByTime() will cause the hook's polling timer to fire,
    // which triggers a new API call and state updates. Without act, React would warn
    // about state updates outside of act, and the updates might not be flushed
    // before the next assertion.
    act(() => {
      jest.advanceTimersByTime(pollingInterval)
    })

    // Wait for the second call
    await act(async () => {
      await Promise.resolve()
    })

    expect(getRequestMock).toHaveBeenCalledTimes(2)

    // repeat for third call
    act(() => {
      jest.advanceTimersByTime(pollingInterval)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(getRequestMock).toHaveBeenCalledTimes(3)

    unmount()
  })

  it('should abort previous requests when making new ones', async () => {
    // Arrange
    const pollingInterval = 1000
    getRequestMock.mockReturnValue({
      promise: Promise.resolve([]),
      abort: abortMock,
    })

    // Act
    const { unmount } = renderHook(() => useFeatureFlags(setFeatureFlagMock, pollingInterval))

    // Wait for initial call
    await act(async () => {
      await Promise.resolve()
    })

    // Fast-forward to trigger second call
    act(() => {
      jest.advanceTimersByTime(pollingInterval)
    })

    await act(async () => {
      await Promise.resolve()
    })

    // Assert that abort was called on the previous request
    expect(abortMock).toHaveBeenCalledTimes(1)

    unmount()
  })

  it('should clean up on unmount', async () => {
    // Arrange
    const pollingInterval = 1000
    getRequestMock.mockReturnValue({
      promise: Promise.resolve([]),
      abort: abortMock,
    })

    // Act
    const { unmount } = renderHook(() => useFeatureFlags(setFeatureFlagMock, pollingInterval))

    // Wait for initial call
    await act(async () => {
      await Promise.resolve()
    })

    // Unmount the hook
    unmount()

    // Assert that abort was called during cleanup
    expect(abortMock).toHaveBeenCalled()
  })

  it('should handle request errors gracefully', async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    getRequestMock.mockReturnValue({
      promise: Promise.reject(new Error('Network error')),
      abort: abortMock,
    })

    // Act
    const { unmount } = renderHook(() => useFeatureFlags(setFeatureFlagMock, 0))

    // Wait for the promise to reject
    await act(async () => {
      await Promise.resolve()
    })

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch feature flags:', expect.any(Error))
    expect(setFeatureFlagMock).toHaveBeenCalledWith('MULTICLUSTER_SDK_PROVIDER_1', true) // Should still set the required flag

    consoleSpy.mockRestore()
    unmount()
  })
})
