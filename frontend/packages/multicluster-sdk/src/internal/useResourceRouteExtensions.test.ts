/* Copyright Contributors to the Open Cluster Management project */
import { useResourceRouteExtensions } from './useResourceRouteExtensions'
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk'

// mock the useResolvedExtensions hook
jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}))

const mockUseResolvedExtensions = useResolvedExtensions as jest.MockedFunction<typeof useResolvedExtensions>

describe('useResourceRouteExtensions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return resolved state and handler function', () => {
    const mockExtensions = [
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin',
        pluginName: 'Test Plugin',
        uid: 'test-uid',
        properties: {
          model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
          handler: jest.fn(),
        },
      },
    ]

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

    const { resourceRoutesResolved, findResourceRouteHandler } = useResourceRouteExtensions()

    expect(resourceRoutesResolved).toBe(true)
    expect(typeof findResourceRouteHandler).toBe('function')
  })

  it('should return null handler when extensions not resolved', () => {
    mockUseResolvedExtensions.mockReturnValue([[], false, []])

    const { findResourceRouteHandler } = useResourceRouteExtensions()

    const handler = findResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBeNull()
  })

  it('should return null handler when no extensions available', () => {
    mockUseResolvedExtensions.mockReturnValue([[], true, []])

    const { findResourceRouteHandler } = useResourceRouteExtensions()

    const handler = findResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBeNull()
  })

  it('should find exact version match', () => {
    const mockHandler = jest.fn()
    const mockExtensions = [
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin',
        pluginName: 'Test Plugin',
        uid: 'test-uid',
        properties: {
          model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
          handler: mockHandler,
        },
      },
    ]

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

    const { findResourceRouteHandler } = useResourceRouteExtensions()

    const handler = findResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBe(mockHandler)
  })

  it('should fallback to version-agnostic match when exact version not found', () => {
    const mockHandler = jest.fn()
    const mockExtensions = [
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin',
        pluginName: 'Test Plugin',
        uid: 'test-uid',
        properties: {
          model: { group: 'kubevirt.io', kind: 'VirtualMachine' }, // no version
          handler: mockHandler,
        },
      },
    ]

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

    const { findResourceRouteHandler } = useResourceRouteExtensions()

    const handler = findResourceRouteHandler('kubevirt.io', 'VirtualMachine', 'v1')
    expect(handler).toBe(mockHandler)
  })

  it('should return null when no match found', () => {
    const mockExtensions = [
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin',
        pluginName: 'Test Plugin',
        uid: 'test-uid',
        properties: {
          model: { group: 'kubevirt.io', kind: 'VirtualMachine', version: 'v1' },
          handler: jest.fn(),
        },
      },
    ]

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

    const { findResourceRouteHandler } = useResourceRouteExtensions()

    const handler = findResourceRouteHandler('different.io', 'DifferentResource', 'v1')
    expect(handler).toBeNull()
  })

  it('should handle undefined group parameter', () => {
    const mockHandler = jest.fn()
    const mockExtensions = [
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin',
        pluginName: 'Test Plugin',
        uid: 'test-uid',
        properties: {
          model: { kind: 'VirtualMachine', version: 'v1' }, // no group
          handler: mockHandler,
        },
      },
    ]

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

    const { findResourceRouteHandler } = useResourceRouteExtensions()

    const handler = findResourceRouteHandler(undefined, 'VirtualMachine', 'v1')
    expect(handler).toBe(mockHandler)
  })

  it('should handle undefined version parameter', () => {
    const mockHandler = jest.fn()
    const mockExtensions = [
      {
        type: 'acm.resource/route',
        pluginID: 'test-plugin',
        pluginName: 'Test Plugin',
        uid: 'test-uid',
        properties: {
          model: { group: 'kubevirt.io', kind: 'VirtualMachine' }, // no version
          handler: mockHandler,
        },
      },
    ]

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true, []])

    const { findResourceRouteHandler } = useResourceRouteExtensions()

    const handler = findResourceRouteHandler('kubevirt.io', 'VirtualMachine', undefined)
    expect(handler).toBe(mockHandler)
  })
})
