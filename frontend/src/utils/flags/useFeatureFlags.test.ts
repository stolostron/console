/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useQuery } from '../../lib/useQuery'
import { FEATURE_FLAGS } from './consts'
import useFeatureFlags from './useFeatureFlags'

jest.mock('../../lib/useQuery')

describe('useFeatureFlags', () => {
  const setFeatureFlagMock = jest.fn()
  const useQueryMock = useQuery as jest.Mock
  const mockStartPolling = jest.fn()
  const mockStopPolling = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    useQueryMock.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      startPolling: mockStartPolling,
      stopPolling: mockStopPolling,
    })
  })

  it('components undefined - no flags are set', () => {
    // Arrange
    useQueryMock.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      startPolling: mockStartPolling,
      stopPolling: mockStopPolling,
    })

    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(0)
  })

  it('no flags exist at multiclusterhub', () => {
    // Arrange
    useQueryMock.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
      startPolling: mockStartPolling,
      stopPolling: mockStopPolling,
    })

    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, false)
    )
  })

  it.each([[true], [false]])('all flags exist at multiclusterhub and enabled: %s', (enabled: boolean) => {
    // Arrange
    const components = Object.values(FEATURE_FLAGS).map((name) => ({ name, enabled }))
    useQueryMock.mockReturnValue({
      data: components,
      loading: false,
      error: undefined,
      startPolling: mockStartPolling,
      stopPolling: mockStopPolling,
    })

    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, enabled)
    )
  })

  it('starts polling with correct interval', () => {
    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert
    expect(mockStartPolling).toHaveBeenCalledWith(120000) // 120 seconds * 1000ms
  })

  it('stops polling on unmount', () => {
    // Act
    const { unmount } = renderHook(() => useFeatureFlags(setFeatureFlagMock))
    unmount()

    // Assert
    expect(mockStopPolling).toHaveBeenCalled()
  })

  it('logs warning on error', () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    const error = new Error('Test error')
    useQueryMock.mockReturnValue({
      data: undefined,
      loading: false,
      error,
      startPolling: mockStartPolling,
      stopPolling: mockStopPolling,
    })

    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch feature flags:', error)
    consoleSpy.mockRestore()
  })
})
