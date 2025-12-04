/* Copyright Contributors to the Open Cluster Management project */

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sModels: jest.fn(),
  useK8sWatchResources: jest.fn(),
}))

jest.mock('./useIsFleetAvailable', () => ({
  useIsFleetAvailable: jest.fn(),
}))

jest.mock('./useHubClusterName', () => ({
  useHubClusterName: jest.fn(),
}))

jest.mock('../internal/fleetK8sWatchResource', () => {
  const actual = jest.requireActual('../internal/fleetK8sWatchResource')
  return {
    ...actual,
    startWatch: jest.fn(),
    stopWatch: jest.fn(),
  }
})

import { renderHook } from '@testing-library/react-hooks'
import { useK8sModels, useK8sWatchResources } from '@openshift-console/dynamic-plugin-sdk'
import { useIsFleetAvailable } from './useIsFleetAvailable'
import { useHubClusterName } from './useHubClusterName'
import { useFleetK8sWatchResources } from './useFleetK8sWatchResources'
import { startWatch, stopWatch, getRequestPathFromResource } from '../internal/fleetK8sWatchResource'
import { useFleetK8sWatchResourceStore } from '../internal/fleetK8sWatchResourceStore'

const mockUseK8sModels = useK8sModels as jest.MockedFunction<typeof useK8sModels>
const mockUseK8sWatchResources = useK8sWatchResources as jest.MockedFunction<typeof useK8sWatchResources>
const mockUseIsFleetAvailable = useIsFleetAvailable as jest.MockedFunction<typeof useIsFleetAvailable>
const mockUseHubClusterName = useHubClusterName as jest.MockedFunction<typeof useHubClusterName>
const mockStartWatch = startWatch as jest.MockedFunction<typeof startWatch>
const mockStopWatch = stopWatch as jest.MockedFunction<typeof stopWatch>

describe('useFleetK8sWatchResources', () => {
  const hubClusterName = 'hub-cluster'
  const remoteCluster1 = 'remote-cluster-1'
  const remoteCluster2 = 'remote-cluster-2'

  const podModel = {
    apiVersion: 'v1',
    kind: 'Pod',
    plural: 'pods',
    abbr: 'P',
    label: 'Pod',
    labelPlural: 'Pods',
  }

  const deploymentModel = {
    apiVersion: 'v1',
    apiGroup: 'apps',
    kind: 'Deployment',
    plural: 'deployments',
    abbr: 'D',
    label: 'Deployment',
    labelPlural: 'Deployments',
  }

  const models = {
    'core~v1~Pod': podModel,
    Pod: podModel,
    'apps~v1~Deployment': deploymentModel,
    Deployment: deploymentModel,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Clear the store cache between tests
    useFleetK8sWatchResourceStore.setState({ cache: {} })

    // Set up default mocks
    mockUseIsFleetAvailable.mockReturnValue(true)
    mockUseK8sModels.mockReturnValue([models, false])
    mockUseHubClusterName.mockReturnValue([hubClusterName, true, undefined])
    mockStartWatch.mockReturnValue(Promise.resolve())
  })

  describe('multiple remote resources', () => {
    it('should start watches for multiple remote resources', () => {
      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
          namespace: 'default',
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          cluster: remoteCluster2,
          namespace: 'default',
        },
      }

      renderHook(() => useFleetK8sWatchResources(initResources))

      // Should call startWatch for each resource
      expect(mockStartWatch).toHaveBeenCalledTimes(2)

      // Verify each watch was started with correct parameters (no callback parameter)
      expect(mockStartWatch).toHaveBeenCalledWith(initResources.pods, podModel, expect.stringContaining(remoteCluster1))

      expect(mockStartWatch).toHaveBeenCalledWith(
        initResources.deployments,
        deploymentModel,
        expect.stringContaining(remoteCluster2)
      )

      // Should not call useK8sWatchResources
      expect(mockUseK8sWatchResources).toHaveBeenCalledWith({})
    })

    it('should stop all watches on cleanup', () => {
      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          cluster: remoteCluster2,
        },
      }

      const { unmount } = renderHook(() => useFleetK8sWatchResources(initResources))

      expect(mockStartWatch).toHaveBeenCalledTimes(2)

      unmount()

      // Should call stopWatch for each resource
      expect(mockStopWatch).toHaveBeenCalledTimes(2)
      expect(mockStopWatch).toHaveBeenCalledWith(initResources.pods, podModel, expect.stringContaining(remoteCluster1))
      expect(mockStopWatch).toHaveBeenCalledWith(
        initResources.deployments,
        deploymentModel,
        expect.stringContaining(remoteCluster2)
      )
    })

    it('should return initial results for all resources', () => {
      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: false,
          cluster: remoteCluster2,
          name: 'my-deployment',
        },
      }

      const { result } = renderHook(() => useFleetK8sWatchResources(initResources))

      // Should return initial results for both resources
      expect(result.current).toEqual({
        pods: { data: [], loaded: false },
        deployments: { data: undefined, loaded: false },
      })
    })

    it('should update individual resources when watch callbacks are invoked', () => {
      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
          namespace: 'default',
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          cluster: remoteCluster2,
          namespace: 'default',
        },
      }

      const podsData = [{ metadata: { name: 'pod1' }, cluster: remoteCluster1 }]
      const deploymentsData = [{ metadata: { name: 'deploy1' }, cluster: remoteCluster2 }]

      const { result, rerender } = renderHook(() => useFleetK8sWatchResources(initResources))

      // Initially, data should be loading
      expect(result.current.pods).toEqual({ data: [], loaded: false })
      expect(result.current.deployments).toEqual({ data: [], loaded: false })

      // Simulate updates to pods through the store
      const store = useFleetK8sWatchResourceStore.getState()
      const podsPath = getRequestPathFromResource(
        initResources.pods,
        podModel,
        `/api/proxy/plugin/mce/console/multicloud/managedclusterproxy/${remoteCluster1}`
      )
      store.setResult(podsPath, podsData, true)
      rerender()

      expect(result.current.pods).toEqual({ data: podsData, loaded: true })
      expect(result.current.deployments).toEqual({ data: [], loaded: false })

      // Simulate updates to deployments through the store
      const deploymentsPath = getRequestPathFromResource(
        initResources.deployments,
        deploymentModel,
        `/api/proxy/plugin/mce/console/multicloud/managedclusterproxy/${remoteCluster2}`
      )
      store.setResult(deploymentsPath, deploymentsData, true)
      rerender()

      expect(result.current.pods).toEqual({ data: podsData, loaded: true })
      expect(result.current.deployments).toEqual({ data: deploymentsData, loaded: true })
    })

    it('should handle errors for individual resources', () => {
      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
          namespace: 'default',
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          cluster: remoteCluster2,
          namespace: 'default',
        },
      }

      const podsData = [{ metadata: { name: 'pod1' } }]
      const deploymentError = new Error('Deployment watch error')

      const { result, rerender } = renderHook(() => useFleetK8sWatchResources(initResources))

      // Simulate updates to pods with data through the store
      const store = useFleetK8sWatchResourceStore.getState()
      const podsPath = getRequestPathFromResource(
        initResources.pods,
        podModel,
        `/api/proxy/plugin/mce/console/multicloud/managedclusterproxy/${remoteCluster1}`
      )
      store.setResult(podsPath, podsData, true)
      rerender()

      // Simulate error for deployments through the store
      const deploymentsPath = getRequestPathFromResource(
        initResources.deployments,
        deploymentModel,
        `/api/proxy/plugin/mce/console/multicloud/managedclusterproxy/${remoteCluster2}`
      )
      store.setResult(deploymentsPath, [], true, deploymentError)
      rerender()

      expect(result.current.pods).toEqual({ data: podsData, loaded: true })
      expect(result.current.deployments).toEqual({ data: [], loaded: true, loadError: deploymentError })
    })
  })

  describe('mixed local and remote resources', () => {
    it('should use fleet mode for all resources when any resource is remote', () => {
      const initResources = {
        localPods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: hubClusterName,
        },
        remotePods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      const localData = {
        localPods: { data: [{ metadata: { name: 'local-pod' } }], loaded: true },
      }
      mockUseK8sWatchResources.mockReturnValue(localData as any)

      const { result } = renderHook(() => useFleetK8sWatchResources(initResources))

      // Should call startWatch for ALL resources when any is remote (uses fleet mode for everything)
      expect(mockStartWatch).toHaveBeenCalledTimes(2)
      expect(mockStartWatch).toHaveBeenCalledWith(
        initResources.localPods,
        podModel,
        '/api/kubernetes' // Hub cluster uses standard k8s API path
      )
      expect(mockStartWatch).toHaveBeenCalledWith(
        initResources.remotePods,
        podModel,
        expect.stringContaining(remoteCluster1)
      )

      // Should return fleet result (not local result) because at least one remote resource exists
      expect(result.current.localPods).toEqual({ data: [], loaded: false })
      expect(result.current.remotePods).toEqual({ data: [], loaded: false })
    })

    it('should use local K8s API for all resources when none are remote', () => {
      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: hubClusterName,
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          // No cluster specified - defaults to local
        },
      }

      const localData = {
        pods: { data: [{ metadata: { name: 'pod1' } }], loaded: true },
        deployments: { data: [{ metadata: { name: 'deploy1' } }], loaded: true },
      }
      mockUseK8sWatchResources.mockReturnValue(localData as any)

      const { result } = renderHook(() => useFleetK8sWatchResources(initResources))

      // Should not call startWatch
      expect(mockStartWatch).not.toHaveBeenCalled()

      // Should call useK8sWatchResources with the initResources as-is
      expect(mockUseK8sWatchResources).toHaveBeenCalledWith(initResources)

      // Should return local results
      expect(result.current).toEqual(localData)
    })
  })

  describe('empty and null resources', () => {
    it('should handle null resources', () => {
      mockUseK8sWatchResources.mockReturnValue({} as any)

      const { result } = renderHook(() => useFleetK8sWatchResources(null))

      expect(mockStartWatch).not.toHaveBeenCalled()
      expect(mockUseK8sWatchResources).toHaveBeenCalledWith({})
      expect(result.current).toEqual({})
    })

    it('should handle empty resources object', () => {
      mockUseK8sWatchResources.mockReturnValue({} as any)

      const { result } = renderHook(() => useFleetK8sWatchResources({}))

      expect(mockStartWatch).not.toHaveBeenCalled()
      expect(mockUseK8sWatchResources).toHaveBeenCalledWith({})
      expect(result.current).toEqual({})
    })
  })

  describe('waiting for hub cluster name', () => {
    it('should wait for hub cluster name before starting fleet watches', () => {
      mockUseHubClusterName.mockReturnValue([undefined, false, undefined])

      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      const { result } = renderHook(() => useFleetK8sWatchResources(initResources))

      // Should not call startWatch while waiting for hub cluster name
      expect(mockStartWatch).not.toHaveBeenCalled()

      // Should not call useK8sWatchResources either
      expect(mockUseK8sWatchResources).toHaveBeenCalledWith({})

      // Should return initial result
      expect(result.current.pods).toEqual({ data: [], loaded: false })
    })

    it('should start fleet watches after hub cluster name loads', () => {
      mockUseHubClusterName.mockReturnValue([undefined, false, undefined])

      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      const { rerender } = renderHook(() => useFleetK8sWatchResources(initResources))

      expect(mockStartWatch).not.toHaveBeenCalled()

      // Hub cluster name now loads
      mockUseHubClusterName.mockReturnValue([hubClusterName, true, undefined])
      rerender()

      expect(mockStartWatch).toHaveBeenCalledTimes(1)
    })
  })

  describe('model loading', () => {
    it('should wait for models to load before starting fleet watches', () => {
      mockUseK8sModels.mockReturnValue([models, true]) // modelsLoading = true

      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      renderHook(() => useFleetK8sWatchResources(initResources))

      // Should not call startWatch while models are loading
      expect(mockStartWatch).not.toHaveBeenCalled()
    })

    it('should start fleet watches after models load', () => {
      mockUseK8sModels.mockReturnValue([models, true]) // modelsLoading = true

      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      const { rerender } = renderHook(() => useFleetK8sWatchResources(initResources))

      expect(mockStartWatch).not.toHaveBeenCalled()

      // Models now loaded
      mockUseK8sModels.mockReturnValue([models, false])
      rerender()

      expect(mockStartWatch).toHaveBeenCalledTimes(1)
    })

    it('should get models by groupVersionKind reference', () => {
      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      renderHook(() => useFleetK8sWatchResources(initResources))

      // Should call startWatch with correct models
      expect(mockStartWatch).toHaveBeenCalledWith(initResources.pods, podModel, expect.any(String))

      expect(mockStartWatch).toHaveBeenCalledWith(initResources.deployments, deploymentModel, expect.any(String))
    })

    it('should handle kind string format', () => {
      const customModels = {
        ...models,
        'custom~v1~CustomResource': {
          apiVersion: 'v1',
          apiGroup: 'custom',
          kind: 'CustomResource',
          plural: 'customresources',
          abbr: 'CR',
          label: 'CustomResource',
          labelPlural: 'CustomResources',
        },
      }

      mockUseK8sModels.mockReturnValue([customModels, false])

      const initResources = {
        custom: {
          kind: 'custom~v1~CustomResource',
          isList: true,
          cluster: remoteCluster1,
        },
      }

      renderHook(() => useFleetK8sWatchResources(initResources))

      expect(mockStartWatch).toHaveBeenCalledWith(
        initResources.custom,
        customModels['custom~v1~CustomResource'],
        expect.any(String)
      )
    })
  })

  describe('resource changes', () => {
    it('should restart watches when resources change', () => {
      const initialResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
          namespace: 'default',
        },
      }

      const updatedResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
          namespace: 'kube-system', // Different namespace
        },
      }

      const { rerender } = renderHook(({ resources }) => useFleetK8sWatchResources(resources), {
        initialProps: { resources: initialResources },
      })

      expect(mockStartWatch).toHaveBeenCalledTimes(1)

      // Update resources
      rerender({ resources: updatedResources })

      // Should stop old watch and start new one
      expect(mockStopWatch).toHaveBeenCalledTimes(1)
      expect(mockStartWatch).toHaveBeenCalledTimes(2)
    })

    it('should add watches for new resources', () => {
      const initialResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      const updatedResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          cluster: remoteCluster2,
        },
      }

      const { rerender } = renderHook(({ resources }) => useFleetK8sWatchResources(resources), {
        initialProps: { resources: initialResources },
      })

      expect(mockStartWatch).toHaveBeenCalledTimes(1)

      // Add new resource
      rerender({ resources: updatedResources })

      // Should have started 2 new watches (restarts pods and adds deployments)
      expect(mockStartWatch).toHaveBeenCalledTimes(3)
    })

    it('should remove watches for deleted resources', () => {
      const initialResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          cluster: remoteCluster2,
        },
      }

      const updatedResources = {
        deployments: {
          groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
          isList: true,
          cluster: remoteCluster2,
        },
      }

      const { rerender } = renderHook(({ resources }: { resources: any }) => useFleetK8sWatchResources(resources), {
        initialProps: { resources: initialResources },
      })

      expect(mockStartWatch).toHaveBeenCalledTimes(2)
      mockStartWatch.mockClear()

      // Remove pods resource
      rerender({ resources: updatedResources as any })

      // Should stop all old watches and start only for deployments
      expect(mockStopWatch).toHaveBeenCalledTimes(2)
      expect(mockStartWatch).toHaveBeenCalledTimes(1)
    })
  })

  describe('deep comparison memoization', () => {
    it('should not restart watches for identical resources', () => {
      const initResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      const { rerender } = renderHook(() => useFleetK8sWatchResources(initResources))

      expect(mockStartWatch).toHaveBeenCalledTimes(1)

      // Rerender with same resources
      rerender()

      // Should not restart watches
      expect(mockStartWatch).toHaveBeenCalledTimes(1)
      expect(mockStopWatch).not.toHaveBeenCalled()
    })

    it('should not restart watches when receiving a new object with identical content', () => {
      const initialResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      // Create a new object with identical content
      const identicalResources = {
        pods: {
          groupVersionKind: { version: 'v1', kind: 'Pod' },
          isList: true,
          cluster: remoteCluster1,
        },
      }

      const { rerender } = renderHook(({ resources }) => useFleetK8sWatchResources(resources), {
        initialProps: { resources: initialResources },
      })

      expect(mockStartWatch).toHaveBeenCalledTimes(1)

      // Rerender with identical but different object reference
      rerender({ resources: identicalResources })

      // Should not restart watches due to deep comparison
      expect(mockStartWatch).toHaveBeenCalledTimes(1)
      expect(mockStopWatch).not.toHaveBeenCalled()
    })
  })
})
