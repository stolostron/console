/* Copyright Contributors to the Open Cluster Management project */
import { act } from 'react-dom/test-utils'
import { renderHook } from '@testing-library/react-hooks'
import { useMigrationFormState } from './useMigrationFormState'

describe('useMigrationFormState', () => {
  describe('initial state', () => {
    it('should have correct default values for source cluster and namespace', () => {
      const { result } = renderHook(() => useMigrationFormState())

      expect(result.current.srcCluster).toBe('')
      expect(result.current.srcNs).toBe('')
    })

    it('should have correct default values for destination cluster and namespace', () => {
      const { result } = renderHook(() => useMigrationFormState())

      expect(result.current.dstCluster).toBe('')
      expect(result.current.dstNamespace).toBe('')
    })

    it('should have correct default values for network settings', () => {
      const { result } = renderHook(() => useMigrationFormState())

      expect(result.current.srcNetwork).toBe('network1')
      expect(result.current.dstNetwork).toBe('')
    })

    it('should have correct default values for storage settings', () => {
      const { result } = renderHook(() => useMigrationFormState())

      expect(result.current.srcStorage).toBe('')
      expect(result.current.dstStorage).toBe('')
    })

    it('should have correct default values for compute settings', () => {
      const { result } = renderHook(() => useMigrationFormState())

      expect(result.current.srcCompute).toBe('')
      expect(result.current.dstCompute).toBe('')
    })

    it('should have correct default values for storage metrics', () => {
      const { result } = renderHook(() => useMigrationFormState())

      expect(result.current.storageUsed).toBe(111)
      expect(result.current.storageReserved).toBe(6)
      expect(result.current.storageTotal).toBe(238)
    })

    it('should have correct default values for UI state', () => {
      const { result } = renderHook(() => useMigrationFormState())

      expect(result.current.openDstCluster).toBe(false)
      expect(result.current.openDstNamespace).toBe(false)
    })

    it('should provide all setter functions', () => {
      const { result } = renderHook(() => useMigrationFormState())

      expect(typeof result.current.setDstCluster).toBe('function')
      expect(typeof result.current.setDstNamespace).toBe('function')
      expect(typeof result.current.setSrcNetwork).toBe('function')
      expect(typeof result.current.setDstNetwork).toBe('function')
      expect(typeof result.current.setSrcStorage).toBe('function')
      expect(typeof result.current.setDstStorage).toBe('function')
      expect(typeof result.current.setSrcCompute).toBe('function')
      expect(typeof result.current.setDstCompute).toBe('function')
      expect(typeof result.current.setOpenDstCluster).toBe('function')
      expect(typeof result.current.setOpenDstNamespace).toBe('function')
      expect(typeof result.current.setStorageUsed).toBe('function')
      expect(typeof result.current.setStorageReserved).toBe('function')
      expect(typeof result.current.setStorageTotal).toBe('function')
    })
  })

  describe('destination cluster and namespace updates', () => {
    it('should update destination cluster', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setDstCluster('new-cluster')
      })

      expect(result.current.dstCluster).toBe('new-cluster')
    })

    it('should update destination namespace', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setDstNamespace('new-namespace')
      })

      expect(result.current.dstNamespace).toBe('new-namespace')
    })
  })

  describe('network settings updates', () => {
    it('should update source network', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setSrcNetwork('network2')
      })

      expect(result.current.srcNetwork).toBe('network2')
    })

    it('should update destination network', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setDstNetwork('dst-network')
      })

      expect(result.current.dstNetwork).toBe('dst-network')
    })
  })

  describe('storage settings updates', () => {
    it('should update source storage', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setSrcStorage('src-storage')
      })

      expect(result.current.srcStorage).toBe('src-storage')
    })

    it('should update destination storage', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setDstStorage('dst-storage')
      })

      expect(result.current.dstStorage).toBe('dst-storage')
    })
  })

  describe('compute settings updates', () => {
    it('should update source compute', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setSrcCompute('src-compute')
      })

      expect(result.current.srcCompute).toBe('src-compute')
    })

    it('should update destination compute', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setDstCompute('dst-compute')
      })

      expect(result.current.dstCompute).toBe('dst-compute')
    })
  })

  describe('storage metrics updates', () => {
    it('should update storage used', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setStorageUsed(200)
      })

      expect(result.current.storageUsed).toBe(200)
    })

    it('should update storage reserved', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setStorageReserved(10)
      })

      expect(result.current.storageReserved).toBe(10)
    })

    it('should update storage total', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setStorageTotal(500)
      })

      expect(result.current.storageTotal).toBe(500)
    })
  })

  describe('UI state updates', () => {
    it('should update destination cluster dropdown open state', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setOpenDstCluster(true)
      })

      expect(result.current.openDstCluster).toBe(true)

      act(() => {
        result.current.setOpenDstCluster(false)
      })

      expect(result.current.openDstCluster).toBe(false)
    })

    it('should update destination namespace dropdown open state', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setOpenDstNamespace(true)
      })

      expect(result.current.openDstNamespace).toBe(true)

      act(() => {
        result.current.setOpenDstNamespace(false)
      })

      expect(result.current.openDstNamespace).toBe(false)
    })
  })

  describe('state independence', () => {
    it('should maintain independent state for all properties', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setDstCluster('test-cluster')
        result.current.setDstNamespace('test-namespace')
        result.current.setSrcNetwork('test-src-network')
        result.current.setDstNetwork('test-dst-network')
        result.current.setSrcStorage('test-src-storage')
        result.current.setDstStorage('test-dst-storage')
        result.current.setSrcCompute('test-src-compute')
        result.current.setDstCompute('test-dst-compute')
        result.current.setStorageUsed(300)
        result.current.setStorageReserved(20)
        result.current.setStorageTotal(600)
        result.current.setOpenDstCluster(true)
        result.current.setOpenDstNamespace(true)
      })

      expect(result.current.dstCluster).toBe('test-cluster')
      expect(result.current.dstNamespace).toBe('test-namespace')
      expect(result.current.srcNetwork).toBe('test-src-network')
      expect(result.current.dstNetwork).toBe('test-dst-network')
      expect(result.current.srcStorage).toBe('test-src-storage')
      expect(result.current.dstStorage).toBe('test-dst-storage')
      expect(result.current.srcCompute).toBe('test-src-compute')
      expect(result.current.dstCompute).toBe('test-dst-compute')
      expect(result.current.storageUsed).toBe(300)
      expect(result.current.storageReserved).toBe(20)
      expect(result.current.storageTotal).toBe(600)
      expect(result.current.openDstCluster).toBe(true)
      expect(result.current.openDstNamespace).toBe(true)

      expect(result.current.srcCluster).toBe('')
      expect(result.current.srcNs).toBe('')
    })

    it('should handle partial updates without affecting other state', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setDstCluster('partial-update-cluster')
        result.current.setStorageUsed(150)
      })

      expect(result.current.dstCluster).toBe('partial-update-cluster')
      expect(result.current.storageUsed).toBe(150)

      expect(result.current.dstNamespace).toBe('')
      expect(result.current.srcNetwork).toBe('network1')
      expect(result.current.dstNetwork).toBe('')
      expect(result.current.storageReserved).toBe(6)
      expect(result.current.storageTotal).toBe(238)
      expect(result.current.openDstCluster).toBe(false)
      expect(result.current.openDstNamespace).toBe(false)
    })
  })

  describe('state transitions', () => {
    it('should handle rapid state changes correctly', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setDstCluster('cluster1')
        result.current.setDstCluster('cluster2')
        result.current.setDstCluster('cluster3')
        result.current.setStorageUsed(100)
        result.current.setStorageUsed(200)
        result.current.setStorageUsed(300)
      })

      expect(result.current.dstCluster).toBe('cluster3')
      expect(result.current.storageUsed).toBe(300)
    })

    it('should handle boolean toggles correctly', () => {
      const { result } = renderHook(() => useMigrationFormState())

      act(() => {
        result.current.setOpenDstCluster(true)
        result.current.setOpenDstNamespace(true)
      })

      expect(result.current.openDstCluster).toBe(true)
      expect(result.current.openDstNamespace).toBe(true)

      act(() => {
        result.current.setOpenDstCluster(false)
      })

      expect(result.current.openDstCluster).toBe(false)
      expect(result.current.openDstNamespace).toBe(true)
    })
  })
})
