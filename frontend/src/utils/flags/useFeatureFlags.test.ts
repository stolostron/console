import { getRequest } from '../../resources/utils'
import { FEATURE_FLAGS } from './consts'
import useFeatureFlags from './useFeatureFlags'

jest.mock('../../resources/utils')

describe('useFeatureFlags', () => {
  const setFeatureFlagMock = jest.fn()
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it.each([
    ['components undefined', undefined],
    ['no flags exist at multiclusterhub', []],
  ])('%s', async (_title: string, components: any[] | undefined) => {
    // Arrange
    const getRequestMock = getRequest as jest.Mock
    getRequestMock.mockReturnValueOnce({
      promise: new Promise((resolve) => resolve(components)),
    })

    // Act
    await useFeatureFlags(setFeatureFlagMock)

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, false)
    )
  })

  it.each([[true], [false]])('all flags exist at multiclusterhub and enabled: %s', async (enabled: boolean) => {
    // Arrange
    const getRequestMock = getRequest as jest.Mock
    getRequestMock.mockReturnValueOnce({
      promise: new Promise((resolve) => resolve(Object.values(FEATURE_FLAGS).map((e) => ({ name: e, enabled })))),
    })

    // Act
    await useFeatureFlags(setFeatureFlagMock)

    // Assert
    expect(setFeatureFlagMock).toHaveBeenCalledTimes(Object.entries(FEATURE_FLAGS).length)
    Object.keys(FEATURE_FLAGS).forEach((featureFlag) =>
      expect(setFeatureFlagMock).toHaveBeenCalledWith(featureFlag, enabled)
    )
  })
})
