/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { getFirstClassResourceRoute, useResourceRouteExtensions } from './fleetResourceHelpers'

// mock the dynamic plugin SDK
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}))

import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'
const mockUseResolvedExtensions = useResolvedExtensions as jest.MockedFunction<typeof useResolvedExtensions>

describe('fleetResourceHelpers', () => {
  describe('getFirstClassResourceRoute', () => {
    it('should return first-class route for ManagedCluster', () => {
      const result = getFirstClassResourceRoute('ManagedCluster', 'test-cluster')
      expect(result).toEqual({
        isFirstClass: true,
        path: '/multicloud/infrastructure/clusters/details/test-cluster/test-cluster/overview',
      })
    })

    it('should return first-class route for VirtualMachine when kubevirt flag is enabled', () => {
      const result = getFirstClassResourceRoute('VirtualMachine', 'test-vm')
      expect(result).toEqual({
        isFirstClass: false,
        path: null,
      })
    })

    it('should return first-class route for VirtualMachineInstance when kubevirt flag is enabled', () => {
      const result = getFirstClassResourceRoute('VirtualMachineInstance', 'test-vmi')
      expect(result).toEqual({
        isFirstClass: false,
        path: null,
      })
    })

    it('should return not first-class for VM when kubevirt flag is disabled', () => {
      const result = getFirstClassResourceRoute('VirtualMachine', 'test-vm')
      expect(result).toEqual({
        isFirstClass: false,
        path: null,
      })
    })

    it('should return not first-class for unknown resource types', () => {
      const result = getFirstClassResourceRoute('Pod', 'test-pod')
      expect(result).toEqual({
        isFirstClass: false,
        path: null,
      })
    })

    it('should return not first-class when required parameters are missing', () => {
      expect(getFirstClassResourceRoute(undefined, 'test-resource')).toEqual({
        isFirstClass: false,
        path: null,
      })
      expect(getFirstClassResourceRoute('VirtualMachine', undefined)).toEqual({
        isFirstClass: false,
        path: null,
      })
      expect(getFirstClassResourceRoute('ManagedCluster', '')).toEqual({
        isFirstClass: false,
        path: null,
      })
    })

    it('should return not first-class when kind is empty string', () => {
      expect(getFirstClassResourceRoute('', 'test-resource')).toEqual({
        isFirstClass: false,
        path: null,
      })
    })

    it('should return not first-class when name is empty string', () => {
      expect(getFirstClassResourceRoute('ManagedCluster', '')).toEqual({
        isFirstClass: false,
        path: null,
      })
    })
  })

  describe('useResourceRouteExtensions', () => {
    const mockResourceRoutes = [
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin-1',
        pluginName: 'Test Plugin 1',
        uid: 'test-uid-1',
        properties: {
          model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
          handler: ({ cluster, namespace, name }: { cluster?: string; namespace?: string; name: string }) => {
            if (cluster && namespace) {
              return `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`
            }
            return null
          },
        },
      },
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin-2',
        pluginName: 'Test Plugin 2',
        uid: 'test-uid-2',
        properties: {
          model: { group: 'kubevirt.io', kind: 'VirtualMachineInstance' }, // No version specified
          handler: ({ cluster, namespace, name }: { cluster?: string; namespace?: string; name: string }) => {
            if (cluster && namespace) {
              return `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`
            }
            return null
          },
        },
      },
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin-3',
        pluginName: 'Test Plugin 3',
        uid: 'test-uid-3',
        properties: {
          model: { group: 'example.io', kind: 'TestResource', version: 'v2' },
          handler: ({ name }: { name: string }) => `/custom/path/${name}`,
        },
      },
    ]

    it('should return resolved extensions and handler lookup function', () => {
      mockUseResolvedExtensions.mockReturnValue([mockResourceRoutes, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())
      expect(result.current.resourceRoutesResolved).toBe(true)
      expect(typeof result.current.getResourceRouteHandler).toBe('function')
    })

    it('should return null handler when extensions not resolved', () => {
      mockUseResolvedExtensions.mockReturnValue([[], false, []])

      const { result } = renderHook(() => useResourceRouteExtensions())
      expect(result.current.resourceRoutesResolved).toBe(false)

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should return null handler when no extensions available', () => {
      mockUseResolvedExtensions.mockReturnValue([[], true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())
      expect(result.current.resourceRoutesResolved).toBe(true)

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should find exact version match', () => {
      mockUseResolvedExtensions.mockReturnValue([mockResourceRoutes, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'VirtualMachine', cluster: 'test-cluster', namespace: 'default', name: 'test-vm' })
      expect(path).toBe('/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vm')
    })

    it('should fall back to version-agnostic match', () => {
      mockUseResolvedExtensions.mockReturnValue([mockResourceRoutes, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachineInstance', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({
        kind: 'VirtualMachineInstance',
        cluster: 'test-cluster',
        namespace: 'default',
        name: 'test-vmi',
      })
      expect(path).toBe('/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vmi')
    })

    it('should filter non-resource-route extensions', () => {
      // Mock useResolvedExtensions to only return the resource-route extensions
      // (the filtering happens inside useResolvedExtensions, not in our hook)
      mockUseResolvedExtensions.mockReturnValue([mockResourceRoutes, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      // We should not find handlers for non-resource-route extensions
      const handler = result.current.getResourceRouteHandler('other.io', 'OtherResource', 'v1')
      expect(handler).toBeNull()

      // But we should still be able to find handlers for valid resource-route extensions
      const validHandler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(validHandler).not.toBeNull()
    })

    it('should handle extensions with no matching group/kind', () => {
      mockUseResolvedExtensions.mockReturnValue([mockResourceRoutes, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('unknown.io', 'UnknownResource', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle extensions with undefined handler', () => {
      const extensionsWithUndefinedHandler = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin-4',
          pluginName: 'Test Plugin 4',
          uid: 'test-uid-4',
          properties: {
            model: { group: 'test.io', kind: 'TestResource', version: 'v1' },
            handler: undefined,
          },
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([extensionsWithUndefinedHandler, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('test.io', 'TestResource', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle empty group matching', () => {
      const routesWithEmptyGroup = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin-5',
          pluginName: 'Test Plugin 5',
          uid: 'test-uid-5',
          properties: {
            model: { group: '', kind: 'Pod', version: 'v1' },
            handler: ({ name }: { name: string }) => `/pods/${name}`,
          },
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([routesWithEmptyGroup, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('', 'Pod', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'Pod', name: 'test-pod' })
      expect(path).toBe('/pods/test-pod')
    })

    it('should handle undefined group matching', () => {
      const routesWithUndefinedGroup = [
        {
          type: 'acm.resource/route',
          pluginID: 'test-plugin-6',
          pluginName: 'Test Plugin 6',
          uid: 'test-uid-6',
          properties: {
            model: { kind: 'Pod', version: 'v1' },
            handler: ({ name }: { name: string }) => `/pods/${name}`,
          },
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([routesWithUndefinedGroup, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler(undefined, 'Pod', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'Pod', name: 'test-pod' })
      expect(path).toBe('/pods/test-pod')
    })
  })
})
