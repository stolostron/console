/* Copyright Contributors to the Open Cluster Management project */
import { ResolvedExtension } from '@openshift-console/dynamic-plugin-sdk'
import { findResourceRouteHandler } from '../utils/resourceRouteUtils'
import { ResourceRoute } from '../extensions/resource'

describe('findResourceRouteHandler', () => {
  const mockExtensions: ResolvedExtension<ResourceRoute>[] = [
    {
      type: 'acm.resource/route',
      pluginID: 'test-plugin',
      pluginName: 'Test Plugin',
      uid: 'test-uid-1',
      properties: {
        model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
        handler: jest
          .fn()
          .mockReturnValue('/k8s/cluster/test-cluster/ns/default/kubevirt.io~v1~VirtualMachine/test-vm'),
      },
    },
    {
      type: 'acm.resource/route',
      pluginID: 'test-plugin',
      pluginName: 'Test Plugin',
      uid: 'test-uid-2',
      properties: {
        model: { group: 'kubevirt.io', kind: 'VirtualMachineInstance', version: 'v1' },
        handler: jest
          .fn()
          .mockReturnValue('/k8s/cluster/test-cluster/ns/default/kubevirt.io~v1~VirtualMachineInstance/test-vmi'),
      },
    },
    {
      type: 'acm.resource/route',
      pluginID: 'test-plugin',
      pluginName: 'Test Plugin',
      uid: 'test-uid-3',
      properties: {
        model: { group: 'kubevirt.io', kind: 'VirtualMachine' }, // version-agnostic
        handler: jest.fn().mockReturnValue('/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vm'),
      },
    },
  ]

  it('should find exact version match', () => {
    const handler = findResourceRouteHandler(mockExtensions, 'kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBeDefined()
    expect(handler).toBe(mockExtensions[0].properties.handler)
  })

  it('should find version-agnostic match when exact version not found', () => {
    const handler = findResourceRouteHandler(mockExtensions, 'kubevirt.io', 'VirtualMachine', 'v1alpha1')
    expect(handler).toBeDefined()
    expect(handler).toBe(mockExtensions[2].properties.handler)
  })

  it('should return null when no match found', () => {
    const handler = findResourceRouteHandler(mockExtensions, 'unknown.io', 'UnknownResource', 'v1')
    expect(handler).toBeNull()
  })

  it('should handle undefined extensions', () => {
    const handler = findResourceRouteHandler(undefined, 'kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBeNull()
  })

  it('should handle empty extensions array', () => {
    const handler = findResourceRouteHandler([], 'kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBeNull()
  })

  it('should handle undefined group', () => {
    const handler = findResourceRouteHandler(mockExtensions, undefined, 'VirtualMachine', 'v1')
    expect(handler).toBeNull()
  })

  it('should handle undefined version', () => {
    const handler = findResourceRouteHandler(mockExtensions, 'kubevirt.io', 'VirtualMachine')
    expect(handler).toBeDefined()
    expect(handler).toBe(mockExtensions[2].properties.handler)
  })
})
