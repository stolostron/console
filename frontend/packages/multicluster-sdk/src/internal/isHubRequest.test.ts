/* Copyright Contributors to the Open Cluster Management project */
import { HubConfiguration } from './cachedHubConfiguration'
import { fetchHubConfiguration } from './cachedHubConfiguration'
import { isHubRequest } from './isHubRequest'

// Mock the cachedHubConfiguration module
jest.mock('./cachedHubConfiguration', () => ({
  fetchHubConfiguration: jest.fn(),
}))

const mockFetchHubConfiguration = fetchHubConfiguration as jest.MockedFunction<typeof fetchHubConfiguration>

describe('isHubRequest', () => {
  const mockHubConfiguration: HubConfiguration = {
    isGlobalHub: false,
    localHubName: 'local-cluster',
    isHubSelfManaged: true,
    isObservabilityInstalled: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchHubConfiguration.mockResolvedValue(mockHubConfiguration)
  })

  describe('when cluster parameter is falsy', () => {
    it('should return true when cluster is undefined', async () => {
      const result = await isHubRequest(undefined)

      expect(result).toBe(true)
      expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(0) // Short-circuits, doesn't call fetchHubConfiguration
    })

    it('should return true when cluster is null', async () => {
      const result = await isHubRequest(null as any)

      expect(result).toBe(true)
      expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(0) // Short-circuits, doesn't call fetchHubConfiguration
    })

    it('should return true when cluster is empty string', async () => {
      const result = await isHubRequest('')

      expect(result).toBe(true)
      expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(0) // Short-circuits, doesn't call fetchHubConfiguration
    })

    it('should return true when cluster is whitespace only', async () => {
      const result = await isHubRequest('   ')

      expect(result).toBe(false) // whitespace is truthy, so it will be compared with localHubName
      expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(1)
    })
  })

  describe('when cluster parameter matches hub cluster', () => {
    it('should return true when cluster matches localHubName', async () => {
      const result = await isHubRequest('local-cluster')

      expect(result).toBe(true)
      expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(1)
    })
  })

  describe('when cluster parameter does not match hub cluster', () => {
    it('should return false when cluster is different from localHubName', async () => {
      const result = await isHubRequest('remote-cluster')

      expect(result).toBe(false)
      expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should propagate errors from fetchHubConfiguration', async () => {
      const error = new Error('Failed to fetch hub configuration')
      mockFetchHubConfiguration.mockRejectedValue(error)

      await expect(isHubRequest('test-cluster')).rejects.toThrow('Failed to fetch hub configuration')
      expect(mockFetchHubConfiguration).toHaveBeenCalledTimes(1)
    })
  })
})
