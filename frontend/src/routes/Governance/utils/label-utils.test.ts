/* Copyright Contributors to the Open Cluster Management project */

import { DiscoveredPolicyItem } from '../discovered/useFetchPolicies'
import {
  isUserDefinedPolicyLabel,
  parsePolicyItemLabels,
  getLabelFilterOptions,
  matchesSelectedLabels,
} from './label-utils'

describe('label-utils', () => {
  describe('isUserDefinedPolicyLabel', () => {
    test('should correctly identify user-defined vs system labels', () => {
      // User-defined labels
      expect(isUserDefinedPolicyLabel('env')).toBe(true)
      expect(isUserDefinedPolicyLabel('app.kubernetes.io/name')).toBe(true)

      // System labels
      expect(isUserDefinedPolicyLabel('cluster-name')).toBe(false)
      expect(isUserDefinedPolicyLabel('cluster-namespace')).toBe(false)
      expect(isUserDefinedPolicyLabel('policy.open-cluster-management.io/cluster-name')).toBe(false)
    })
  })

  describe('parsePolicyItemLabels', () => {
    const createMockItem = (label?: string): DiscoveredPolicyItem => ({
      _hubClusterResource: true,
      _uid: 'test-uid',
      apigroup: 'policy.open-cluster-management.io',
      apiversion: 'v1',
      cluster: 'test-cluster',
      created: '2024-08-15T14:01:52Z',
      kind: 'ConfigurationPolicy',
      kind_plural: 'configurationpolicies',
      label,
      name: 'test-policy',
      namespace: 'test-namespace',
      compliant: 'Compliant',
      responseAction: 'enforce',
      severity: 'low',
      disabled: false,
      _isExternal: true,
    })

    test('should parse and filter user-defined labels correctly', () => {
      // Basic parsing
      const item1 = createMockItem('env=prod; team=backend')
      expect(parsePolicyItemLabels(item1)).toEqual({ env: 'prod', team: 'backend' })

      // Filter out system labels
      const item2 = createMockItem('env=prod; cluster-name=local-cluster; policy.open-cluster-management.io/test=value')
      expect(parsePolicyItemLabels(item2)).toEqual({ env: 'prod' })

      // No labels
      const item3 = createMockItem()
      expect(parsePolicyItemLabels(item3)).toEqual({})
    })

    test('should handle edge cases in label parsing', () => {
      // Spaces around equals
      const item1 = createMockItem('env = prod ; team = backend')
      expect(parsePolicyItemLabels(item1)).toEqual({ env: 'prod', team: 'backend' })

      // Values containing equals sign
      const item2 = createMockItem('description=version=1.2.3')
      expect(parsePolicyItemLabels(item2)).toEqual({ description: 'version=1.2.3' })
    })
  })

  describe('getLabelFilterOptions', () => {
    const createMockPolicy = (label: string, uid: string = 'uid-1'): DiscoveredPolicyItem => ({
      _hubClusterResource: true,
      _uid: uid,
      apigroup: 'policy.open-cluster-management.io',
      apiversion: 'v1',
      cluster: 'cluster-1',
      created: '2024-08-15T14:01:52Z',
      kind: 'ConfigurationPolicy',
      kind_plural: 'configurationpolicies',
      label,
      name: 'test-policy',
      namespace: 'test-namespace',
      compliant: 'Compliant',
      responseAction: 'enforce',
      severity: 'low',
      disabled: false,
      _isExternal: true,
    })

    test('should return sorted unique label options and filter system labels', () => {
      const policies = [
        createMockPolicy('env=prod; team=backend', 'uid-1'),
        createMockPolicy('env=staging; team=frontend', 'uid-2'),
        createMockPolicy('env=prod', 'uid-3'), // Duplicate
        createMockPolicy('cluster-name=test; env=dev', 'uid-4'), // Has system label
      ]

      const result = getLabelFilterOptions(policies)

      expect(result).toEqual([
        { label: 'env=dev', value: 'env=dev' },
        { label: 'env=prod', value: 'env=prod' },
        { label: 'env=staging', value: 'env=staging' },
        { label: 'team=backend', value: 'team=backend' },
        { label: 'team=frontend', value: 'team=frontend' },
      ])

      // System labels should be filtered
      expect(result.find((opt) => opt.label.includes('cluster-name'))).toBeUndefined()
    })

    test('should handle empty or invalid input', () => {
      expect(getLabelFilterOptions([])).toEqual([])
      expect(getLabelFilterOptions(undefined as any)).toEqual([])
    })
  })

  describe('matchesSelectedLabels', () => {
    const createMockItem = (label: string): DiscoveredPolicyItem => ({
      _hubClusterResource: true,
      _uid: 'test-uid',
      apigroup: 'policy.open-cluster-management.io',
      apiversion: 'v1',
      cluster: 'test-cluster',
      created: '2024-08-15T14:01:52Z',
      kind: 'ConfigurationPolicy',
      kind_plural: 'configurationpolicies',
      label,
      name: 'test-policy',
      namespace: 'test-namespace',
      compliant: 'Compliant',
      responseAction: 'enforce',
      severity: 'low',
      disabled: false,
      _isExternal: true,
    })

    test('should handle equality filters correctly', () => {
      const item = createMockItem('env=prod; team=backend')

      // Matching equality
      expect(matchesSelectedLabels(['env=prod'], item)).toBe(true)

      // Non-matching equality
      expect(matchesSelectedLabels(['env=staging'], item)).toBe(false)

      // OR logic - at least one matches
      expect(matchesSelectedLabels(['env=prod', 'team=frontend'], item)).toBe(true)
    })

    test('should handle inequality filters correctly', () => {
      const item = createMockItem('env=prod; team=backend')

      // Has team=backend, so exclude
      expect(matchesSelectedLabels(['!team=backend'], item)).toBe(false)

      // Does not have team=frontend, so include
      expect(matchesSelectedLabels(['!team=frontend'], item)).toBe(true)

      // Multiple inequality - all must pass
      expect(matchesSelectedLabels(['!team=frontend', '!env=staging'], item)).toBe(true)
      expect(matchesSelectedLabels(['!team=backend', '!env=staging'], item)).toBe(false)
    })

    test('should handle combined equality and inequality filters', () => {
      const item1 = createMockItem('env=prod; team=backend')
      const item2 = createMockItem('env=prod; team=frontend')
      const item3 = createMockItem('env=dev; team=backend')

      // env=prod AND !team=backend
      const filters = ['env=prod', '!team=backend']
      expect(matchesSelectedLabels(filters, item1)).toBe(false) // has env=prod but also has team=backend
      expect(matchesSelectedLabels(filters, item2)).toBe(true) // has env=prod, not team=backend
      expect(matchesSelectedLabels(filters, item3)).toBe(false) // doesn't have env=prod
    })

    test('should handle edge cases', () => {
      // Empty filters
      expect(matchesSelectedLabels([], createMockItem('env=prod'))).toBe(true)

      // No labels on item
      const noLabelsItem = createMockItem('')
      expect(matchesSelectedLabels(['env=prod'], noLabelsItem)).toBe(false)
      expect(matchesSelectedLabels(['!env=prod'], noLabelsItem)).toBe(true)

      // System labels are filtered before matching
      const itemWithSystemLabels = createMockItem('env=prod; cluster-name=local-cluster')
      expect(matchesSelectedLabels(['env=prod'], itemWithSystemLabels)).toBe(true)
      expect(matchesSelectedLabels(['cluster-name=local-cluster'], itemWithSystemLabels)).toBe(false)

      // Values containing equals sign
      const item = createMockItem('description=version=1.2.3')
      expect(matchesSelectedLabels(['description=version=1.2.3'], item)).toBe(true)
      expect(matchesSelectedLabels(['description=version'], item)).toBe(false)
    })
  })
})
