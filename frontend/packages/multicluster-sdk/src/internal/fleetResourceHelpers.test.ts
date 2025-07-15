/* Copyright Contributors to the Open Cluster Management project */
import { getFirstClassResourceRoute } from './fleetResourceHelpers'

describe('fleetResourceHelpers', () => {
  describe('getFirstClassResourceRoute', () => {
    it('should return first-class route for ManagedCluster', () => {
      const result = getFirstClassResourceRoute('ManagedCluster', 'hub', undefined, 'test-cluster', false)
      expect(result).toEqual({
        isFirstClass: true,
        path: '/multicloud/infrastructure/clusters/details/test-cluster/test-cluster/overview',
      })
    })

    it('should return first-class route for VirtualMachine when kubevirt flag is enabled', () => {
      const result = getFirstClassResourceRoute('VirtualMachine', 'test-cluster', 'default', 'test-vm', true)
      expect(result).toEqual({
        isFirstClass: true,
        path: '/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vm',
      })
    })

    it('should return first-class route for VirtualMachineInstance when kubevirt flag is enabled', () => {
      const result = getFirstClassResourceRoute('VirtualMachineInstance', 'test-cluster', 'default', 'test-vmi', true)
      expect(result).toEqual({
        isFirstClass: true,
        path: '/multicloud/infrastructure/virtualmachines/test-cluster/default/test-vmi',
      })
    })

    it('should return not first-class for VM when kubevirt flag is disabled', () => {
      const result = getFirstClassResourceRoute('VirtualMachine', 'test-cluster', 'default', 'test-vm', false)
      expect(result).toEqual({ isFirstClass: false, path: null })
    })

    it('should return not first-class for VM when cluster is missing', () => {
      const result = getFirstClassResourceRoute('VirtualMachine', undefined, 'default', 'test-vm', true)
      expect(result).toEqual({ isFirstClass: false, path: null })
    })

    it('should return not first-class for VM when namespace is missing', () => {
      const result = getFirstClassResourceRoute('VirtualMachine', 'test-cluster', undefined, 'test-vm', true)
      expect(result).toEqual({ isFirstClass: false, path: null })
    })

    it('should return not first-class for non-first-class resources', () => {
      expect(getFirstClassResourceRoute('Pod', 'cluster', 'default', 'test-pod', false)).toEqual({
        isFirstClass: false,
        path: null,
      })
      expect(getFirstClassResourceRoute('Service', 'cluster', 'default', 'test-service', false)).toEqual({
        isFirstClass: false,
        path: null,
      })
      expect(getFirstClassResourceRoute('Deployment', 'cluster', 'default', 'test-deployment', false)).toEqual({
        isFirstClass: false,
        path: null,
      })
    })

    it('should return not first-class for undefined or empty kind', () => {
      expect(getFirstClassResourceRoute(undefined, 'cluster', 'default', 'test-resource', false)).toEqual({
        isFirstClass: false,
        path: null,
      })
      expect(getFirstClassResourceRoute('', 'cluster', 'default', 'test-resource', false)).toEqual({
        isFirstClass: false,
        path: null,
      })
    })

    it('should return not first-class when name is missing', () => {
      expect(getFirstClassResourceRoute('ManagedCluster', 'hub', undefined, undefined, false)).toEqual({
        isFirstClass: false,
        path: null,
      })
      expect(getFirstClassResourceRoute('ManagedCluster', 'hub', undefined, '', false)).toEqual({
        isFirstClass: false,
        path: null,
      })
    })
  })
})
