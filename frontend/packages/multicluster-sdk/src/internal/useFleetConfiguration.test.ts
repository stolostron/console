/* Copyright Contributors to the Open Cluster Management project */

import { renderHook } from '@testing-library/react-hooks'
import { waitFor } from '@testing-library/react'
import {
  useFleetConfiguration,
  FleetConfiguration,
  resetFleetConfigurationInitialization,
} from './useFleetConfiguration'
import { consoleFetchJSON } from '@openshift-console/dynamic-plugin-sdk'
import { getBackendUrl } from '../api'
import { HUB_API_FAILED_ERROR } from './constants'

// Mock the dependencies
jest.mock('@openshift-console/dynamic-plugin-sdk')
jest.mock('../api')

jest.mock('../api/useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(() => [true, true, null] as any),
}))

const mockConsoleFetchJSON = consoleFetchJSON as jest.MockedFunction<typeof consoleFetchJSON>
const mockGetBackendUrl = getBackendUrl as jest.MockedFunction<typeof getBackendUrl>

// Mock fleet configuration data
const mockFleetConfiguration: FleetConfiguration = {
  isGlobalHub: true,
  localHubName: 'test-hub',
  isHubSelfManaged: false,
  isObservabilityInstalled: true,
}

describe('useFleetConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset module state between tests
    jest.resetModules()
    resetFleetConfigurationInitialization()
    mockGetBackendUrl.mockReturnValue('http://test-backend')
  })

  afterEach(() => {
    // Clean up any lingering state
    jest.restoreAllMocks()
  })

  describe('useFleetConfiguration hook', () => {
    it('should initialize with null configuration, not loaded, and no error', () => {
      const { result } = renderHook(() => useFleetConfiguration())
      const [fleetConfiguration, loaded, error] = result.current

      expect(fleetConfiguration).toBeNull()
      expect(loaded).toBe(false)
      expect(error).toBeNull()
    })

    it('should fetch and return fleet configuration successfully', async () => {
      mockConsoleFetchJSON.mockResolvedValueOnce(mockFleetConfiguration)

      const { result } = renderHook(() => useFleetConfiguration())

      // Wait for the async operation to complete
      await waitFor(() => {
        const [, loaded] = result.current
        expect(loaded).toBe(true)
      })

      const [fleetConfiguration, loaded, error] = result.current
      expect(fleetConfiguration).toEqual(mockFleetConfiguration)
      expect(loaded).toBe(true)
      expect(error).toBeNull()
      expect(mockConsoleFetchJSON).toHaveBeenCalledWith('http://test-backend/hub', 'GET')
    })

    it('should handle fetch errors gracefully', async () => {
      const mockError = new Error('Network error')
      mockConsoleFetchJSON.mockRejectedValueOnce(mockError)

      const { result } = renderHook(() => useFleetConfiguration())
      await waitFor(() => expect(result.current[1]).toBeTruthy())

      const [fleetConfiguration, loaded, error] = result.current
      expect(fleetConfiguration).toBeNull()
      expect(loaded).toBe(true)
      expect(error).toEqual(mockError)
    })

    it('should handle null response from API', async () => {
      mockConsoleFetchJSON.mockResolvedValueOnce(null)

      const { result } = renderHook(() => useFleetConfiguration())
      await waitFor(() => expect(result.current[1]).toBeTruthy())
      const [, , error] = result.current
      expect(error).toEqual(new Error(HUB_API_FAILED_ERROR))
    })

    it('should not re-fetch on subsequent hook calls after successful initialization', async () => {
      mockConsoleFetchJSON.mockResolvedValueOnce(mockFleetConfiguration)

      // First hook call
      const { result: result1 } = renderHook(() => useFleetConfiguration())
      await waitFor(() => expect(result1.current[1]).toBeTruthy())

      // Second hook call
      const { result: result2 } = renderHook(() => useFleetConfiguration())
      await waitFor(() => {
        const [, loaded] = result2.current
        expect(loaded).toBe(true)
      })

      const [fleetConfiguration1] = result1.current
      const [fleetConfiguration2] = result2.current

      // Both should have the same data
      expect(fleetConfiguration1).toEqual(mockFleetConfiguration)
      expect(fleetConfiguration2).toEqual(mockFleetConfiguration)

      // API should only be called once
      expect(mockConsoleFetchJSON).toHaveBeenCalledTimes(1)
    })

    it('should allow retry after error', async () => {
      // First call fails
      mockConsoleFetchJSON.mockRejectedValueOnce(new Error('Network error'))

      const { result: result1 } = renderHook(() => useFleetConfiguration())
      await waitFor(() => {
        const [, loaded] = result1.current
        expect(loaded).toBe(true)
      })

      // Second call succeeds
      mockConsoleFetchJSON.mockResolvedValueOnce(mockFleetConfiguration)

      const { result: result2 } = renderHook(() => useFleetConfiguration())
      await waitFor(() => {
        const [, loaded] = result2.current
        expect(loaded).toBe(true)
      })

      const [, , error1] = result1.current
      const [fleetConfiguration2, , error2] = result2.current

      expect(error1).toBeDefined()
      expect(fleetConfiguration2).toEqual(mockFleetConfiguration)
      expect(error2).toBeNull()
      expect(mockConsoleFetchJSON).toHaveBeenCalledTimes(2)
    })
  })
})
