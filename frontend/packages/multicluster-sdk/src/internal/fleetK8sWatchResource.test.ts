/* Copyright Contributors to the Open Cluster Management project */

import { handleWebsocketEvent } from './fleetK8sWatchResource'
import { useFleetK8sWatchResourceStore } from './fleetK8sWatchResourceStore'
import type { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'

// Mock console methods
const originalConsoleWarn = console.warn
const mockConsoleWarn = jest.fn()

beforeEach(() => {
  console.warn = mockConsoleWarn
  mockConsoleWarn.mockClear()
  useFleetK8sWatchResourceStore.getState().clearAll()
})

afterEach(() => {
  console.warn = originalConsoleWarn
  useFleetK8sWatchResourceStore.getState().clearAll()
})

describe('handleWebsocketEvent', () => {
  const mockRequestPath = 'test-request-path'
  const mockCluster = 'test-cluster'

  it('should handle WebSocket events for single resources', () => {
    const mockPod: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'test-pod', uid: 'test-uid' },
    }

    const event = {
      data: JSON.stringify({
        type: 'ADDED',
        object: mockPod,
      }),
    }

    handleWebsocketEvent(event, mockRequestPath, false, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    const cachedData = store.getResource(mockRequestPath)

    expect(cachedData?.data).toEqual({
      cluster: mockCluster,
      ...mockPod,
    })
    expect(cachedData?.loaded).toBe(true)
  })

  it('should handle WebSocket events for list resources', () => {
    const mockPod1: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'pod-1', uid: 'uid-1' },
    }

    const mockPod2: K8sResourceCommon = {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'pod-2', uid: 'uid-2' },
    }

    // Setup initial list
    const store = useFleetK8sWatchResourceStore.getState()
    store.setResource(mockRequestPath, [{ cluster: mockCluster, ...mockPod1 }], true)

    // Add second pod
    const addEvent = {
      data: JSON.stringify({
        type: 'ADDED',
        object: mockPod2,
      }),
    }

    handleWebsocketEvent(addEvent, mockRequestPath, true, mockCluster)

    let cachedData = store.getResource<K8sResourceCommon[]>(mockRequestPath)
    expect(cachedData?.data).toHaveLength(2)
    expect(cachedData?.data).toContainEqual({ cluster: mockCluster, ...mockPod2 })

    // Delete first pod
    const deleteEvent = {
      data: JSON.stringify({
        type: 'DELETED',
        object: mockPod1,
      }),
    }

    handleWebsocketEvent(deleteEvent, mockRequestPath, true, mockCluster)

    cachedData = store.getResource<K8sResourceCommon[]>(mockRequestPath)
    expect(cachedData?.data).toHaveLength(1)
    expect(cachedData?.data[0]).toEqual({ cluster: mockCluster, ...mockPod2 })
  })

  it('should handle invalid events gracefully', () => {
    // Test undefined event
    handleWebsocketEvent(undefined, mockRequestPath, false, mockCluster)
    expect(mockConsoleWarn).toHaveBeenCalledWith('Received undefined event', undefined)

    // Test event without object
    const eventWithoutObject = {
      data: JSON.stringify({ type: 'ADDED' }),
    }

    handleWebsocketEvent(eventWithoutObject, mockRequestPath, false, mockCluster)

    const store = useFleetK8sWatchResourceStore.getState()
    expect(store.getResource(mockRequestPath)).toBeUndefined()
  })
})
