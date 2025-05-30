import { getRequest } from '../../resources/utils'
import { FEATURE_FLAGS } from './consts'
import useFeatureFlags from './useFeatureFlags'

jest.mock('../../resources/utils')

describe('useFeatureFlags', () => {
  const setFeatureFlagMock = jest.fn()
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('components undefined', async () => {
    // Arrange
    const getRequestMock = getRequest as jest.Mock
    getRequestMock.mockReturnValueOnce({
      promise: new Promise((resolve) => resolve(undefined)),
    })

    // Act
    await useFeatureFlags(setFeatureFlagMock)

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, false)
    )
  })

  it('all flags exist at multiclusterhub', async () => {
    // Arrange
    const getRequestMock = getRequest as jest.Mock
    getRequestMock.mockReturnValueOnce({
      promise: new Promise((resolve) => resolve(Object.values(FEATURE_FLAGS).map((e) => ({ name: e, enabled: true })))),
    })

    // Act
    await useFeatureFlags(setFeatureFlagMock)

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length)
  })

  it('no flags exist at multiclusterhub', async () => {
    // Arrange
    const getRequestMock = getRequest as jest.Mock
    getRequestMock.mockReturnValueOnce({
      promise: new Promise((resolve) => resolve([])),
    })

    // Act
    await useFeatureFlags(setFeatureFlagMock)

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, false)
    )
  })
})
