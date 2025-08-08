/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useQuery } from '../../lib/useQuery'
import { FEATURE_FLAGS } from './consts'
import useFeatureFlags from './useFeatureFlags'

// Mock the useQuery hook instead of lower-level utilities
jest.mock('../../lib/useQuery')

describe('useFeatureFlags', () => {
  const setFeatureFlagMock = jest.fn()
  const useQueryMock = useQuery as jest.MockedFunction<typeof useQuery>
  const startPollingMock = jest.fn()
  const stopPollingMock = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
    // Default mock implementation
    useQueryMock.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
      startPolling: startPollingMock,
      stopPolling: stopPollingMock,
      refresh: jest.fn(),
    })
  })

  it.each([
    ['components undefined', undefined],
    ['no flags exist at multiclusterhub', []],
  ])('%s', (_title: string, components: any[] | undefined) => {
    // Arrange - Mock useQuery to return the test data
    useQueryMock.mockReturnValue({
      data: components || [],
      loading: false,
      error: undefined,
      startPolling: startPollingMock,
      stopPolling: stopPollingMock,
      refresh: jest.fn(),
    })

    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert - Should set REQUIRED_PROVIDER_FLAG + all feature flags to false
    expect(setFeatureFlagMock).toHaveBeenCalledWith('MULTICLUSTER_SDK_PROVIDER_1', true)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, false)
    )
  })

  it.each([[true], [false]])('all flags exist at multiclusterhub and enabled: %s', (enabled: boolean) => {
    // Arrange - Mock useQuery to return components with the specified enabled state
    const mockComponents = Object.values(FEATURE_FLAGS).map((componentName) => ({
      name: componentName,
      enabled,
    }))

    useQueryMock.mockReturnValue({
      data: mockComponents,
      loading: false,
      error: undefined,
      startPolling: startPollingMock,
      stopPolling: stopPollingMock,
      refresh: jest.fn(),
    })

    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert - Should set REQUIRED_PROVIDER_FLAG + all feature flags to the enabled state
    expect(setFeatureFlagMock).toHaveBeenCalledWith('MULTICLUSTER_SDK_PROVIDER_1', true)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, enabled)
    )
  })

  it('should start polling', () => {
    // Arrange
    useQueryMock.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
      startPolling: startPollingMock,
      stopPolling: stopPollingMock,
      refresh: jest.fn(),
    })

    // Act
    const { unmount } = renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert - Should start polling with 120 second interval (120000 milliseconds)
    expect(startPollingMock).toHaveBeenCalledWith(120000)

    // Cleanup should call stopPolling
    unmount()
    expect(stopPollingMock).toHaveBeenCalled()
  })

  it('should handle errors gracefully', () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    const testError = new Error('Network error')

    useQueryMock.mockReturnValue({
      data: [],
      loading: false,
      error: testError,
      startPolling: startPollingMock,
      stopPolling: stopPollingMock,
      refresh: jest.fn(),
    })

    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert
    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch feature flags:', testError)
    expect(setFeatureFlagMock).toHaveBeenCalledWith('MULTICLUSTER_SDK_PROVIDER_1', true) // Should still set required flag

    consoleSpy.mockRestore()
  })

  it('should not process flags while loading', () => {
    // Arrange
    useQueryMock.mockReturnValue({
      data: Object.values(FEATURE_FLAGS).map((name) => ({ name, enabled: true })),
      loading: true, // Still loading
      error: undefined,
      startPolling: startPollingMock,
      stopPolling: stopPollingMock,
      refresh: jest.fn(),
    })

    // Act
    renderHook(() => useFeatureFlags(setFeatureFlagMock))

    // Assert - Should only set the required provider flag, not the feature flags while loading
    expect(setFeatureFlagMock).toHaveBeenCalledWith('MULTICLUSTER_SDK_PROVIDER_1', true)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).not.toHaveBeenCalledWith(featureFlag, expect.anything())
    )
  })
})
