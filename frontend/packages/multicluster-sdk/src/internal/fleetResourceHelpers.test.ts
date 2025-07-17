/* Copyright Contributors to the Open Cluster Management project */
import { getFirstClassResourceRoute, getResourceRouteHandler } from './fleetResourceHelpers'

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

      // Call handler without required cluster/namespace - should return null
      const path = handler!({ kind: 'VirtualMachine', name: 'test-vm' })
      expect(path).toBeNull()
    })

    it('should work with handlers that dont require cluster/namespace', () => {
      const handler = getResourceRouteHandler(mockResourceRoutes, 'example.io', 'TestResource', 'v2')
      expect(handler).not.toBeNull()

      const path = handler!({ kind: 'TestResource', name: 'test-resource' })
      expect(path).toBe('/custom/path/test-resource')
    })
  })
})
