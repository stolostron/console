/* Copyright Contributors to the Open Cluster Management project */
import { act } from 'react-dom/test-utils'
import { renderHook } from '@testing-library/react-hooks'
import { useReadinessChecks } from './useReadinessChecks'

describe('useReadinessChecks', () => {
  describe('initial state', () => {
    it('should have all checks set to true initially', () => {
      const { result } = renderHook(() => useReadinessChecks())

      expect(result.current.networkCheckStatus).toBe(true)
      expect(result.current.storageCheckStatus).toBe(true)
      expect(result.current.computeCheckStatus).toBe(true)
      expect(result.current.versionCheckStatus).toBe(true)
      expect(result.current.resourceCheckStatus).toBe(true)
    })

    it('should be ready to migrate when all checks are true', () => {
      const { result } = renderHook(() => useReadinessChecks())

      expect(result.current.readyToMigrate).toBe(true)
    })

    it('should provide all setter functions', () => {
      const { result } = renderHook(() => useReadinessChecks())

      expect(typeof result.current.setters.setNetworkCheckStatus).toBe('function')
      expect(typeof result.current.setters.setStorageCheckStatus).toBe('function')
      expect(typeof result.current.setters.setComputeCheckStatus).toBe('function')
      expect(typeof result.current.setters.setVersionCheckStatus).toBe('function')
      expect(typeof result.current.setters.setResourceCheckStatus).toBe('function')
    })
  })

  describe('individual check status updates', () => {
    it('should update network check status', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setNetworkCheckStatus(false)
      })

      expect(result.current.networkCheckStatus).toBe(false)
      expect(result.current.readyToMigrate).toBe(false)
    })

    it('should update storage check status', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setStorageCheckStatus(false)
      })

      expect(result.current.storageCheckStatus).toBe(false)
      expect(result.current.readyToMigrate).toBe(false)
    })

    it('should update compute check status', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setComputeCheckStatus(false)
      })

      expect(result.current.computeCheckStatus).toBe(false)
      expect(result.current.readyToMigrate).toBe(false)
    })

    it('should update version check status', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setVersionCheckStatus(false)
      })

      expect(result.current.versionCheckStatus).toBe(false)
      expect(result.current.readyToMigrate).toBe(false)
    })

    it('should update resource check status', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setResourceCheckStatus(false)
      })

      expect(result.current.resourceCheckStatus).toBe(false)
      expect(result.current.readyToMigrate).toBe(false)
    })
  })

  describe('readyToMigrate computed value', () => {
    it('should be false when any single check fails', () => {
      const { result } = renderHook(() => useReadinessChecks())

      const setters = [
        result.current.setters.setNetworkCheckStatus,
        result.current.setters.setStorageCheckStatus,
        result.current.setters.setComputeCheckStatus,
        result.current.setters.setVersionCheckStatus,
        result.current.setters.setResourceCheckStatus,
      ]

      setters.forEach((setter) => {
        act(() => {
          setter(false)
        })

        expect(result.current.readyToMigrate).toBe(false)

        act(() => {
          setter(true)
        })
      })
    })

    it('should be false when multiple checks fail', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setNetworkCheckStatus(false)
        result.current.setters.setStorageCheckStatus(false)
      })

      expect(result.current.readyToMigrate).toBe(false)
    })

    it('should be false when all checks fail', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setNetworkCheckStatus(false)
        result.current.setters.setStorageCheckStatus(false)
        result.current.setters.setComputeCheckStatus(false)
        result.current.setters.setVersionCheckStatus(false)
        result.current.setters.setResourceCheckStatus(false)
      })

      expect(result.current.readyToMigrate).toBe(false)
    })

    it('should be true only when all checks pass', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setNetworkCheckStatus(false)
        result.current.setters.setStorageCheckStatus(false)
        result.current.setters.setComputeCheckStatus(false)
        result.current.setters.setVersionCheckStatus(false)
        result.current.setters.setResourceCheckStatus(false)
      })

      expect(result.current.readyToMigrate).toBe(false)

      act(() => {
        result.current.setters.setNetworkCheckStatus(true)
      })
      expect(result.current.readyToMigrate).toBe(false)

      act(() => {
        result.current.setters.setStorageCheckStatus(true)
      })
      expect(result.current.readyToMigrate).toBe(false)

      act(() => {
        result.current.setters.setComputeCheckStatus(true)
      })
      expect(result.current.readyToMigrate).toBe(false)

      act(() => {
        result.current.setters.setVersionCheckStatus(true)
      })
      expect(result.current.readyToMigrate).toBe(false)

      act(() => {
        result.current.setters.setResourceCheckStatus(true)
      })
      expect(result.current.readyToMigrate).toBe(true)
    })
  })

  describe('state transitions', () => {
    it('should handle rapid state changes correctly', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setNetworkCheckStatus(false)
        result.current.setters.setNetworkCheckStatus(true)
        result.current.setters.setStorageCheckStatus(false)
        result.current.setters.setStorageCheckStatus(true)
      })

      expect(result.current.networkCheckStatus).toBe(true)
      expect(result.current.storageCheckStatus).toBe(true)
      expect(result.current.readyToMigrate).toBe(true)
    })

    it('should maintain independent state for each check', () => {
      const { result } = renderHook(() => useReadinessChecks())

      act(() => {
        result.current.setters.setNetworkCheckStatus(false)
        result.current.setters.setComputeCheckStatus(false)
      })

      expect(result.current.networkCheckStatus).toBe(false)
      expect(result.current.storageCheckStatus).toBe(true)
      expect(result.current.computeCheckStatus).toBe(false)
      expect(result.current.versionCheckStatus).toBe(true)
      expect(result.current.resourceCheckStatus).toBe(true)
      expect(result.current.readyToMigrate).toBe(false)

      act(() => {
        result.current.setters.setNetworkCheckStatus(true)
      })

      expect(result.current.networkCheckStatus).toBe(true)
      expect(result.current.computeCheckStatus).toBe(false)
      expect(result.current.readyToMigrate).toBe(false)
    })
  })
})
