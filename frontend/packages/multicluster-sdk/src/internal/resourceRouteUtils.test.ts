/* Copyright Contributors to the Open Cluster Management project */
import { findResourceRouteHandler } from './resourceRouteUtils'

describe('findResourceRouteHandler', () => {
  const mockAcmExtensions = {
    resourceRoutes: [
      {
        model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
        handler: jest
          .fn()
          .mockReturnValue('/k8s/cluster/test-cluster/ns/default/kubevirt.io~v1~VirtualMachine/test-vm'),
      },
      {
        model: { group: 'kubevirt.io', kind: 'VirtualMachineInstance', version: 'v1' },
        handler: jest
          .fn()
          .mockReturnValue('/k8s/cluster/test-cluster/ns/default/kubevirt.io~v1~VirtualMachineInstance/test-vmi'),
      },
      {
        model: { group: 'kubevirt.io', kind: 'VirtualMachine' }, // version-agnostic
        handler: jest.fn().mockReturnValue('/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vm'),
      },
    ],
  }

  it('should find exact version match', () => {
    const handler = findResourceRouteHandler(mockAcmExtensions, 'kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBeDefined()
    expect(handler).toBe(mockAcmExtensions.resourceRoutes[0].handler)
  })

  it('should find version-agnostic match when exact version not found', () => {
    const handler = findResourceRouteHandler(mockAcmExtensions, 'kubevirt.io', 'VirtualMachine', 'v1alpha1')
    expect(handler).toBeDefined()
    expect(handler).toBe(mockAcmExtensions.resourceRoutes[2].handler)
  })

  it('should return undefined when no match found', () => {
    const handler = findResourceRouteHandler(mockAcmExtensions, 'unknown.io', 'UnknownResource', 'v1')
    expect(handler).toBeUndefined()
  })

  it('should handle undefined acmExtensions', () => {
    const handler = findResourceRouteHandler(undefined, 'kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBeUndefined()
  })

  it('should handle empty resourceRoutes', () => {
    const handler = findResourceRouteHandler({ resourceRoutes: [] }, 'kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBeUndefined()
  })

  it('should handle undefined group', () => {
    const handler = findResourceRouteHandler(mockAcmExtensions, undefined, 'VirtualMachine', 'v1')
    expect(handler).toBeUndefined()
  })

  it('should handle undefined version', () => {
    const handler = findResourceRouteHandler(mockAcmExtensions, 'kubevirt.io', 'VirtualMachine')
    expect(handler).toBeDefined()
    expect(handler).toBe(mockAcmExtensions.resourceRoutes[2].handler)
  })
})
