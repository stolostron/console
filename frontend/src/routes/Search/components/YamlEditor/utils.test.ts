/* Copyright Contributors to the Open Cluster Management project */

import * as resourceRequest from '../../../../resources/utils'
import { fleetResourceRequest } from '../../../../resources/utils/fleet-resource-request'
import { onReload, onSave, registerAutoFold } from './utils'

jest.mock('monaco-editor', () => ({
  Range: class Range {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  },
}))
jest.mock('../../../../resources/utils')
jest.mock('../../../../resources/utils/fleet-resource-request')

const mockedGetBackendUrl = resourceRequest.getBackendUrl as jest.MockedFunction<typeof resourceRequest.getBackendUrl>
const mockedGetRequest = resourceRequest.getRequest as jest.MockedFunction<typeof resourceRequest.getRequest>
const mockedGetResource = resourceRequest.getResource as jest.MockedFunction<typeof resourceRequest.getResource>
const mockedPutRequest = resourceRequest.putRequest as jest.MockedFunction<typeof resourceRequest.putRequest>
const mockedReplaceResource = resourceRequest.replaceResource as jest.MockedFunction<
  typeof resourceRequest.replaceResource
>
const mockedFleetResourceRequest = fleetResourceRequest as jest.MockedFunction<typeof fleetResourceRequest>

describe('YamlEditor utils', () => {
  const mockSetResourceYaml = jest.fn()
  const mockSetUpdateError = jest.fn()
  const mockSetStale = jest.fn()
  const mockSetUpdateSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockedGetBackendUrl.mockReturnValue('https://backend')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('registerAutoFold', () => {
    it('registers content change listener and runs initial tryFolding', () => {
      const onDidChangeContent = jest.fn()
      const mockModel = {
        getValue: () =>
          'apiVersion: v1\n' +
          'kind: Pod\n' +
          'metadata:\n' +
          '  name: test\n' +
          "  namespace: 'testing'\n" +
          '  managedFields:\n' +
          '    - manager: Mozilla\n' +
          '    apiVersion: v1\n\n' +
          '',
        onDidChangeContent,
        getPositionAt: () => ({ lineNumber: 1 }),
      }
      const mockEditor = {
        getModel: () => mockModel,
        getAction: () => ({ run: () => Promise.resolve() }),
        setSelection: jest.fn(),
        getScrollTop: () => 0,
        setScrollTop: jest.fn(),
      }

      expect(() => registerAutoFold(mockEditor as any)).not.toThrow()
      expect(onDidChangeContent).toHaveBeenCalledWith(expect.any(Function))

      jest.runAllTimers()
    })
  })

  describe('onReload', () => {
    it('uses getRequest for VirtualMachine when fine-grained RBAC is enabled', async () => {
      const mockResource = {
        apiVersion: 'kubevirt.io/v1',
        kind: 'VirtualMachine',
        metadata: { name: 'vm1', namespace: 'default' },
      }
      mockedGetRequest.mockReturnValue({
        promise: Promise.resolve(mockResource),
      } as any)

      onReload(
        'cluster1',
        'VirtualMachine',
        'kubevirt.io/v1',
        'vm1',
        'default',
        false,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetStale,
        true,
        { current: false }
      )

      await Promise.resolve()

      expect(mockedGetBackendUrl).toHaveBeenCalled()
      expect(mockedGetRequest).toHaveBeenCalledWith('https://backend/virtualmachines/get/cluster1/vm1/default')
      await Promise.resolve()
      expect(mockSetResourceYaml).toHaveBeenCalled()
      expect(mockSetStale).toHaveBeenCalledWith(false)
      expect(mockSetUpdateError).not.toHaveBeenCalled()
    })

    it('calls setUpdateError when getRequest fails for VirtualMachine', async () => {
      const err = new Error('Network error')
      mockedGetRequest.mockReturnValue({
        promise: Promise.reject(err),
      } as any)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      onReload(
        'cluster1',
        'VirtualMachine',
        'kubevirt.io/v1',
        'vm1',
        'default',
        false,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetStale,
        true,
        { current: false }
      )

      await Promise.resolve().then(() => Promise.resolve())

      expect(mockSetUpdateError).toHaveBeenCalledWith(expect.stringContaining('Network error'))
      expect(mockSetResourceYaml).not.toHaveBeenCalled()
    })

    it('uses getResource for hub cluster resources', async () => {
      const mockResource = { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'pod1', namespace: 'default' } }
      mockedGetResource.mockReturnValue({
        promise: Promise.resolve(mockResource),
      } as any)

      onReload(
        'local-cluster',
        'Pod',
        'v1',
        'pod1',
        'default',
        true,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetStale,
        false,
        { current: false }
      )

      await Promise.resolve()

      expect(mockedGetResource).toHaveBeenCalledWith({
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: { namespace: 'default', name: 'pod1' },
      })
      await Promise.resolve()
      expect(mockSetResourceYaml).toHaveBeenCalled()
      expect(mockSetStale).toHaveBeenCalledWith(false)
    })

    it('calls setUpdateError when getResource fails', async () => {
      mockedGetResource.mockReturnValue({
        promise: Promise.reject(new Error('Not found')),
      } as any)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      onReload(
        'local-cluster',
        'Pod',
        'v1',
        'pod1',
        'default',
        true,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetStale,
        false,
        { current: false }
      )

      await Promise.resolve().then(() => Promise.resolve())

      expect(mockSetUpdateError).toHaveBeenCalledWith(expect.stringContaining('Not found'))
    })

    it('uses fleetResourceRequest for managed cluster resources', async () => {
      const mockResource = { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'pod1', namespace: 'default' } }
      mockedFleetResourceRequest.mockResolvedValue(mockResource as any)

      onReload(
        'managed1',
        'Pod',
        'v1',
        'pod1',
        'default',
        false,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetStale,
        false,
        { current: false }
      )

      await Promise.resolve()

      expect(mockedFleetResourceRequest).toHaveBeenCalledWith('GET', 'managed1', {
        apiVersion: 'v1',
        kind: 'Pod',
        name: 'pod1',
        namespace: 'default',
      })
      await Promise.resolve()
      expect(mockSetResourceYaml).toHaveBeenCalled()
      expect(mockSetStale).toHaveBeenCalledWith(false)
    })

    it('calls setUpdateError when fleetResourceRequest returns errorMessage', async () => {
      mockedFleetResourceRequest.mockResolvedValue({ errorMessage: 'Forbidden' })

      onReload(
        'managed1',
        'Pod',
        'v1',
        'pod1',
        'default',
        false,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetStale,
        false,
        { current: false }
      )

      await Promise.resolve()

      expect(mockSetUpdateError).toHaveBeenCalledWith('Error getting new resource YAML: Forbidden')
      expect(mockSetResourceYaml).not.toHaveBeenCalled()
    })
  })

  describe('onSave', () => {
    const resourceYaml = 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: pod1\n  namespace: default'

    it('uses putRequest for VirtualMachine when fine-grained RBAC is enabled', async () => {
      mockedPutRequest.mockReturnValue({ promise: Promise.resolve() } as any)

      onSave(
        'cluster1',
        'VirtualMachine',
        'kubevirt.io/v1',
        'vm1',
        'default',
        resourceYaml,
        false,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetUpdateSuccess,
        mockSetStale,
        true,
        { current: false }
      )

      await Promise.resolve()

      expect(mockedPutRequest).toHaveBeenCalledWith(
        'https://backend/virtualmachines/update',
        expect.objectContaining({
          managedCluster: 'cluster1',
          vmName: 'vm1',
          vmNamespace: 'default',
        })
      )
      await Promise.resolve()
      expect(mockSetUpdateSuccess).toHaveBeenCalledWith(true)
    })

    it('calls setUpdateError when putRequest fails for VirtualMachine', async () => {
      mockedPutRequest.mockReturnValue({ promise: Promise.reject(new Error('Conflict')) } as any)
      jest.spyOn(console, 'error').mockImplementation(() => {})

      onSave(
        'cluster1',
        'VirtualMachine',
        'kubevirt.io/v1',
        'vm1',
        'default',
        resourceYaml,
        false,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetUpdateSuccess,
        mockSetStale,
        true,
        { current: false }
      )

      await Promise.resolve().then(() => Promise.resolve())

      expect(mockSetUpdateError).toHaveBeenCalledWith('Conflict')
    })

    it('uses replaceResource and onReload for hub cluster resources', async () => {
      const mockResource = { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'pod1', namespace: 'default' } }
      mockedReplaceResource.mockReturnValue({ promise: Promise.resolve(mockResource) } as any)
      mockedGetResource.mockReturnValue({ promise: Promise.resolve(mockResource) } as any)

      onSave(
        'local-cluster',
        'Pod',
        'v1',
        'pod1',
        'default',
        resourceYaml,
        true,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetUpdateSuccess,
        mockSetStale,
        false,
        { current: false }
      )

      await Promise.resolve().then(() => Promise.resolve())

      expect(mockedReplaceResource).toHaveBeenCalled()
      expect(mockSetUpdateSuccess).toHaveBeenCalledWith(true)
    })

    it('uses fleetResourceRequest PUT for managed cluster resources', async () => {
      const mockResource = { apiVersion: 'v1', kind: 'Pod', metadata: { name: 'pod1', namespace: 'default' } }
      mockedFleetResourceRequest.mockResolvedValue(mockResource as any)

      onSave(
        'managed1',
        'Pod',
        'v1',
        'pod1',
        'default',
        resourceYaml,
        false,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetUpdateSuccess,
        mockSetStale,
        false,
        { current: false }
      )

      await Promise.resolve()

      expect(mockedFleetResourceRequest).toHaveBeenCalledWith(
        'PUT',
        'managed1',
        { apiVersion: 'v1', kind: 'Pod', name: 'pod1', namespace: 'default' },
        expect.any(Object)
      )
      await Promise.resolve()
      expect(mockSetUpdateSuccess).toHaveBeenCalledWith(true)
    })

    it('calls setUpdateError when fleetResourceRequest PUT returns errorMessage', async () => {
      mockedFleetResourceRequest.mockResolvedValue({ errorMessage: 'Conflict' })

      onSave(
        'managed1',
        'Pod',
        'v1',
        'pod1',
        'default',
        resourceYaml,
        false,
        mockSetResourceYaml,
        mockSetUpdateError,
        mockSetUpdateSuccess,
        mockSetStale,
        false,
        { current: false }
      )

      await Promise.resolve()

      expect(mockSetUpdateError).toHaveBeenCalledWith('Conflict')
    })
  })
})
