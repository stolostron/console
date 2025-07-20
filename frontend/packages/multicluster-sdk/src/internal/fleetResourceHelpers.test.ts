/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import {
  getFirstClassResourceRoute,
  getResourceRouteHandler,
  findResourceRouteHandler,
  useResourceRouteExtensions,
} from './fleetResourceHelpers'

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

  describe('getResourceRouteHandler', () => {
    const mockResourceRoutes = [
      {
        model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
        handler: ({ cluster, namespace, name }: { cluster?: string; namespace?: string; name: string }) => {
          if (cluster && namespace) {
            return `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`
          }
          return null
        },
      },
      {
        model: { group: 'kubevirt.io', kind: 'VirtualMachineInstance' }, // No version specified
        handler: ({ cluster, namespace, name }: { cluster?: string; namespace?: string; name: string }) => {
          if (cluster && namespace) {
            return `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`
          }
          return null
        },
      },
      {
        model: { group: 'example.io', kind: 'TestResource', version: 'v2' },
        handler: ({ name }: { name: string }) => `/custom/path/${name}`,
      },
    ]

    it('should find exact match including version', () => {
      const handler = getResourceRouteHandler(mockResourceRoutes, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'VirtualMachine', cluster: 'test-cluster', namespace: 'default', name: 'test-vm' })
      expect(path).toBe('/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vm')
    })

    it('should fall back to version-agnostic match when no exact version match', () => {
      const handler = getResourceRouteHandler(mockResourceRoutes, 'kubevirt.io', 'VirtualMachineInstance', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({
        kind: 'VirtualMachineInstance',
        cluster: 'test-cluster',
        namespace: 'default',
        name: 'test-vmi',
      })
      expect(path).toBe('/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vmi')
    })

    it('should prefer exact version match over version-agnostic match', () => {
      const routesWithDuplicate = [
        ...mockResourceRoutes,
        {
          model: { group: 'kubevirt.io', kind: 'VirtualMachine' }, // No version
          handler: () => '/should-not-be-used',
        },
      ]

      const handler = getResourceRouteHandler(routesWithDuplicate, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'VirtualMachine', cluster: 'test-cluster', namespace: 'default', name: 'test-vm' })
      expect(path).toBe('/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vm')
    })

    it('should return null when no matching extension found', () => {
      const handler = getResourceRouteHandler(mockResourceRoutes, 'unknown.io', 'UnknownResource', 'v1')
      expect(handler).toBeNull()
    })

    it('should return null when resourceRoutes array is empty', () => {
      const handler = getResourceRouteHandler([], 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should return null when resourceRoutes is undefined', () => {
      const handler = getResourceRouteHandler(undefined as any, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle handler that returns null', () => {
      const handler = getResourceRouteHandler(mockResourceRoutes, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).not.toBeNull()

      // call handler without required cluster/namespace - should return null
      const path = handler!({ kind: 'VirtualMachine', name: 'test-vm' })
      expect(path).toBeNull()
    })

    it('should work with handlers that dont require cluster/namespace', () => {
      const handler = getResourceRouteHandler(mockResourceRoutes, 'example.io', 'TestResource', 'v2')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'TestResource', name: 'test-resource' })
      expect(path).toBe('/custom/path/test-resource')
    })

    it('should handle null resourceRoutes gracefully', () => {
      const handler = getResourceRouteHandler(null as any, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle empty group', () => {
      const routesWithEmptyGroup = [
        {
          model: { group: '', kind: 'Pod', version: 'v1' },
          handler: ({ name }: { name: string }) => `/pods/${name}`,
        },
      ]

      const handler = getResourceRouteHandler(routesWithEmptyGroup, '', 'Pod', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'Pod', name: 'test-pod' })
      expect(path).toBe('/pods/test-pod')
    })

    it('should handle undefined group', () => {
      const routesWithUndefinedGroup = [
        {
          model: { kind: 'Pod', version: 'v1' },
          handler: ({ name }: { name: string }) => `/pods/${name}`,
        },
      ]

      const handler = getResourceRouteHandler(routesWithUndefinedGroup, undefined, 'Pod', 'v1')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'Pod', name: 'test-pod' })
      expect(path).toBe('/pods/test-pod')
    })
  })

  describe('findResourceRouteHandler', () => {
    const mockAcmExtensions = {
      resourceRoutes: [
        {
          model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
          handler: ({ cluster, namespace, name }: { cluster?: string; namespace?: string; name: string }) => {
            if (cluster && namespace) {
              return `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`
            }
            return null
          },
        },
        {
          model: { group: 'kubevirt.io', kind: 'VirtualMachineInstance' }, // No version specified
          handler: ({ cluster, namespace, name }: { cluster?: string; namespace?: string; name: string }) => {
            if (cluster && namespace) {
              return `/multicloud/infrastructure/virtualmachines/${cluster}/${namespace}/${name}`
            }
            return null
          },
        },
        {
          model: { group: 'example.io', kind: 'TestResource', version: 'v2' },
          handler: ({ name }: { name: string }) => `/custom/path/${name}`,
        },
      ],
    }

    it('should find exact match including version', () => {
      const handler = findResourceRouteHandler(mockAcmExtensions, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).not.toBeNull()
      expect(typeof handler).toBe('function')
    })

    it('should fall back to version-agnostic match when no exact version match', () => {
      const handler = findResourceRouteHandler(mockAcmExtensions, 'kubevirt.io', 'VirtualMachineInstance', 'v1')
      expect(handler).not.toBeNull()
      expect(typeof handler).toBe('function')
    })

    it('should prefer exact version match over version-agnostic match', () => {
      const extensionsWithDuplicate = {
        resourceRoutes: [
          ...mockAcmExtensions.resourceRoutes,
          {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine' }, // No version
            handler: () => '/should-not-be-used',
          },
        ],
      }

      const handler = findResourceRouteHandler(extensionsWithDuplicate, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).not.toBeNull()
      // the handler should be the one with version v1, not the version-agnostic one
      expect(handler).toBe(mockAcmExtensions.resourceRoutes[0].handler)
    })

    it('should return null when no matching extension found', () => {
      const handler = findResourceRouteHandler(mockAcmExtensions, 'unknown.io', 'UnknownResource', 'v1')
      expect(handler).toBeNull()
    })

    it('should return null when acmExtensions is undefined', () => {
      const handler = findResourceRouteHandler(undefined, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should return null when resourceRoutes is undefined', () => {
      const handler = findResourceRouteHandler({}, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should return null when resourceRoutes is empty', () => {
      const handler = findResourceRouteHandler({ resourceRoutes: [] }, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle extensions with no resourceRoutes property', () => {
      const handler = findResourceRouteHandler({} as any, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle null acmExtensions', () => {
      const handler = findResourceRouteHandler(null as any, 'kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle empty group', () => {
      const extensionsWithEmptyGroup = {
        resourceRoutes: [
          {
            model: { group: '', kind: 'Pod', version: 'v1' },
            handler: ({ name }: { name: string }) => `/pods/${name}`,
          },
        ],
      }

      const handler = findResourceRouteHandler(extensionsWithEmptyGroup, '', 'Pod', 'v1')
      expect(handler).not.toBeNull()
      expect(typeof handler).toBe('function')
    })

    it('should handle undefined group', () => {
      const extensionsWithUndefinedGroup = {
        resourceRoutes: [
          {
            model: { kind: 'Pod', version: 'v1' },
            handler: ({ name }: { name: string }) => `/pods/${name}`,
          },
        ],
      }

      const handler = findResourceRouteHandler(extensionsWithUndefinedGroup, undefined, 'Pod', 'v1')
      expect(handler).not.toBeNull()
      expect(typeof handler).toBe('function')
    })

    it('should handle missing version in search', () => {
      // when version is undefined, it should find the VirtualMachineInstance extension which has no version
      const handler = findResourceRouteHandler(mockAcmExtensions, 'kubevirt.io', 'VirtualMachineInstance', undefined)
      expect(handler).not.toBeNull()
    })
  })

  describe('useResourceRouteExtensions', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return resolved extensions and handler lookup function', () => {
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: jest.fn(),
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-1',
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

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
      const mockHandler = jest.fn()
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-1',
        },
        {
          type: 'acm.resource/route',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine' }, // No version
            handler: jest.fn(),
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-2',
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBe(mockHandler)
    })

    it('should fall back to version-agnostic match', () => {
      const mockHandler = jest.fn()
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine' }, // No version
            handler: mockHandler,
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-1',
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBe(mockHandler)
    })

    it('should filter non-resource-route extensions', () => {
      const mockHandler = jest.fn()
      const mockExtensions = [
        {
          type: 'other.extension/type',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: jest.fn(),
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-1',
        },
        {
          type: 'acm.resource/route',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: mockHandler,
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-2',
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).not.toBeNull()
      expect(typeof handler).toBe('function')
      // should only find the acm.resource/route extension, not the other type
    })

    it('should handle extensions with no matching group/kind', () => {
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          properties: {
            model: { group: 'other.io', kind: 'OtherResource', version: 'v1' },
            handler: jest.fn(),
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-1',
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle extensions with undefined handler', () => {
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          properties: {
            model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
            handler: undefined,
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-1',
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
      expect(handler).toBeNull()
    })

    it('should handle empty group matching', () => {
      const mockHandler = jest.fn()
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          properties: {
            model: { group: '', kind: 'Pod', version: 'v1' },
            handler: mockHandler,
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-1',
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler('', 'Pod', 'v1')
      expect(handler).toBe(mockHandler)
    })

    it('should handle undefined group matching', () => {
      const mockHandler = jest.fn()
      const mockExtensions = [
        {
          type: 'acm.resource/route',
          properties: {
            model: { kind: 'Pod', version: 'v1' },
            handler: mockHandler,
          },
          pluginID: 'test-plugin',
          pluginName: 'Test Plugin',
          uid: 'test-uid-1',
        },
      ]

      mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

      const { result } = renderHook(() => useResourceRouteExtensions())

      const handler = result.current.getResourceRouteHandler(undefined, 'Pod', 'v1')
      expect(handler).toBe(mockHandler)
    })
  })
})
