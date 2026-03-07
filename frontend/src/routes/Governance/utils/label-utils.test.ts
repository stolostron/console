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
    test('should return true for user-defined labels', () => {
      expect(isUserDefinedPolicyLabel('env')).toBe(true)
      expect(isUserDefinedPolicyLabel('team')).toBe(true)
      expect(isUserDefinedPolicyLabel('app')).toBe(true)
      expect(isUserDefinedPolicyLabel('app.kubernetes.io/name')).toBe(true)
      expect(isUserDefinedPolicyLabel('custom.domain/label')).toBe(true)
    })

    test('should return false for cluster-name', () => {
      expect(isUserDefinedPolicyLabel('cluster-name')).toBe(false)
    })

    test('should return false for cluster-namespace', () => {
      expect(isUserDefinedPolicyLabel('cluster-namespace')).toBe(false)
    })

    test('should return false for policy.open-cluster-management.io/* labels', () => {
      expect(isUserDefinedPolicyLabel('policy.open-cluster-management.io/cluster-name')).toBe(false)
      expect(isUserDefinedPolicyLabel('policy.open-cluster-management.io/cluster-namespace')).toBe(false)
      expect(isUserDefinedPolicyLabel('policy.open-cluster-management.io/policy')).toBe(false)
      expect(isUserDefinedPolicyLabel('policy.open-cluster-management.io/categories')).toBe(false)
    })
  })

  describe('parsePolicyItemLabels', () => {
    test('should parse user-defined labels correctly', () => {
      const mockItem: DiscoveredPolicyItem = {
        _hubClusterResource: true,
        _uid: 'test-uid',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'test-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label: 'env=prod; team=backend; app=myapp',
        name: 'test-policy',
        namespace: 'test-namespace',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
      }

      const result = parsePolicyItemLabels(mockItem)

      expect(result).toEqual({
        env: 'prod',
        team: 'backend',
        app: 'myapp',
      })
    })

    test('should filter out system labels', () => {
      const mockItem: DiscoveredPolicyItem = {
        _hubClusterResource: true,
        _uid: 'test-uid',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'test-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label:
          'env=prod; cluster-name=local-cluster; cluster-namespace=local-cluster; policy.open-cluster-management.io/cluster-name=local-cluster',
        name: 'test-policy',
        namespace: 'test-namespace',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
      }

      const result = parsePolicyItemLabels(mockItem)

      // Only env=prod should be returned, system labels filtered
      expect(result).toEqual({
        env: 'prod',
      })
      expect(result['cluster-name']).toBeUndefined()
      expect(result['cluster-namespace']).toBeUndefined()
      expect(result['policy.open-cluster-management.io/cluster-name']).toBeUndefined()
    })

    test('should handle policy with no labels', () => {
      const mockItem: DiscoveredPolicyItem = {
        _hubClusterResource: true,
        _uid: 'test-uid',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'test-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        name: 'test-policy',
        namespace: 'test-namespace',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
      }

      const result = parsePolicyItemLabels(mockItem)

      expect(result).toEqual({})
    })

    test('should handle policy with only system labels', () => {
      const mockItem: DiscoveredPolicyItem = {
        _hubClusterResource: true,
        _uid: 'test-uid',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'test-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label: 'cluster-name=local-cluster; cluster-namespace=local-cluster',
        name: 'test-policy',
        namespace: 'test-namespace',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
      }

      const result = parsePolicyItemLabels(mockItem)

      // Should return empty object as all labels are system labels
      expect(result).toEqual({})
    })

    test('should handle labels with spaces around equals sign', () => {
      const mockItem: DiscoveredPolicyItem = {
        _hubClusterResource: true,
        _uid: 'test-uid',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'test-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label: 'env = prod ; team = backend',
        name: 'test-policy',
        namespace: 'test-namespace',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
      }

      const result = parsePolicyItemLabels(mockItem)

      // Should trim spaces
      expect(result).toEqual({
        env: 'prod',
        team: 'backend',
      })
    })

    test('should handle special characters in label values', () => {
      const mockItem: DiscoveredPolicyItem = {
        _hubClusterResource: true,
        _uid: 'test-uid',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'test-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label: 'app.kubernetes.io/name=my-app; app.kubernetes.io/version=1.0.0',
        name: 'test-policy',
        namespace: 'test-namespace',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
      }

      const result = parsePolicyItemLabels(mockItem)

      expect(result).toEqual({
        'app.kubernetes.io/name': 'my-app',
        'app.kubernetes.io/version': '1.0.0',
      })
    })

    test('should handle label values containing equals sign', () => {
      const mockItem: DiscoveredPolicyItem = {
        _hubClusterResource: true,
        _uid: 'test-uid',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'test-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label: 'description=version=1.2.3; formula=a=b+c',
        name: 'test-policy',
        namespace: 'test-namespace',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
      }

      const result = parsePolicyItemLabels(mockItem)

      // Values should preserve everything after the first '='
      expect(result).toEqual({
        description: 'version=1.2.3',
        formula: 'a=b+c',
      })
    })
  })

  describe('getLabelFilterOptions', () => {
    test('should return sorted unique label options', () => {
      const mockPolicies: DiscoveredPolicyItem[] = [
        {
          _hubClusterResource: true,
          _uid: 'uid-1',
          apigroup: 'policy.open-cluster-management.io',
          apiversion: 'v1',
          cluster: 'cluster-1',
          created: '2024-08-15T14:01:52Z',
          kind: 'ConfigurationPolicy',
          kind_plural: 'configurationpolicies',
          label: 'env=prod; team=backend',
          name: 'test-policy',
          namespace: 'test-namespace',
          compliant: 'Compliant',
          responseAction: 'enforce',
          severity: 'low',
          disabled: false,
          _isExternal: true,
        },
        {
          _hubClusterResource: true,
          _uid: 'uid-2',
          apigroup: 'policy.open-cluster-management.io',
          apiversion: 'v1',
          cluster: 'cluster-2',
          created: '2024-08-15T14:01:52Z',
          kind: 'ConfigurationPolicy',
          kind_plural: 'configurationpolicies',
          label: 'env=staging; team=frontend',
          name: 'test-policy',
          namespace: 'test-namespace',
          compliant: 'Compliant',
          responseAction: 'enforce',
          severity: 'low',
          disabled: false,
          _isExternal: true,
        },
      ]

      const result = getLabelFilterOptions(mockPolicies)

      expect(result).toEqual([
        { label: 'env=prod', value: 'env=prod' },
        { label: 'env=staging', value: 'env=staging' },
        { label: 'team=backend', value: 'team=backend' },
        { label: 'team=frontend', value: 'team=frontend' },
      ])
    })

    test('should deduplicate label options', () => {
      const mockPolicies: DiscoveredPolicyItem[] = [
        {
          _hubClusterResource: true,
          _uid: 'uid-1',
          apigroup: 'policy.open-cluster-management.io',
          apiversion: 'v1',
          cluster: 'cluster-1',
          created: '2024-08-15T14:01:52Z',
          kind: 'ConfigurationPolicy',
          kind_plural: 'configurationpolicies',
          label: 'env=prod',
          name: 'test-policy',
          namespace: 'test-namespace',
          compliant: 'Compliant',
          responseAction: 'enforce',
          severity: 'low',
          disabled: false,
          _isExternal: true,
        },
        {
          _hubClusterResource: true,
          _uid: 'uid-2',
          apigroup: 'policy.open-cluster-management.io',
          apiversion: 'v1',
          cluster: 'cluster-2',
          created: '2024-08-15T14:01:52Z',
          kind: 'ConfigurationPolicy',
          kind_plural: 'configurationpolicies',
          label: 'env=prod',
          name: 'test-policy',
          namespace: 'test-namespace',
          compliant: 'Compliant',
          responseAction: 'enforce',
          severity: 'low',
          disabled: false,
          _isExternal: true,
        },
      ]

      const result = getLabelFilterOptions(mockPolicies)

      // Should only have one entry for env=prod
      expect(result).toEqual([{ label: 'env=prod', value: 'env=prod' }])
      expect(result.length).toBe(1)
    })

    test('should filter out system labels from options', () => {
      const mockPolicies: DiscoveredPolicyItem[] = [
        {
          _hubClusterResource: true,
          _uid: 'uid-1',
          apigroup: 'policy.open-cluster-management.io',
          apiversion: 'v1',
          cluster: 'cluster-1',
          created: '2024-08-15T14:01:52Z',
          kind: 'ConfigurationPolicy',
          kind_plural: 'configurationpolicies',
          label: 'env=prod; cluster-name=local-cluster; policy.open-cluster-management.io/cluster-name=local-cluster',
          name: 'test-policy',
          namespace: 'test-namespace',
          compliant: 'Compliant',
          responseAction: 'enforce',
          severity: 'low',
          disabled: false,
          _isExternal: true,
        },
      ]

      const result = getLabelFilterOptions(mockPolicies)

      // Only user-defined labels should appear
      expect(result).toEqual([{ label: 'env=prod', value: 'env=prod' }])
      expect(result.find((opt) => opt.label.includes('cluster-name'))).toBeUndefined()
    })

    test('should return empty array for policies with no labels', () => {
      const mockPolicies: DiscoveredPolicyItem[] = [
        {
          _hubClusterResource: true,
          _uid: 'uid-1',
          apigroup: 'policy.open-cluster-management.io',
          apiversion: 'v1',
          cluster: 'cluster-1',
          created: '2024-08-15T14:01:52Z',
          kind: 'ConfigurationPolicy',
          kind_plural: 'configurationpolicies',
          name: 'test-policy',
          namespace: 'test-namespace',
          compliant: 'Compliant',
          responseAction: 'enforce',
          severity: 'low',
          disabled: false,
          _isExternal: true,
        },
      ]

      const result = getLabelFilterOptions(mockPolicies)

      expect(result).toEqual([])
    })

    test('should return empty array for undefined policies', () => {
      const result = getLabelFilterOptions(undefined as any)

      expect(result).toEqual([])
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

    test('should match when equality filter matches', () => {
      const item = createMockItem('env=prod; team=backend')
      expect(matchesSelectedLabels(['env=prod'], item)).toBe(true)
      expect(matchesSelectedLabels(['team=backend'], item)).toBe(true)
    })

    test('should not match when equality filter does not match', () => {
      const item = createMockItem('env=prod; team=backend')
      expect(matchesSelectedLabels(['env=staging'], item)).toBe(false)
      expect(matchesSelectedLabels(['team=frontend'], item)).toBe(false)
    })

    test('should match when at least one equality filter matches (OR logic)', () => {
      const item = createMockItem('env=prod; team=backend')
      // Has env=prod, so should match even though team is not frontend
      expect(matchesSelectedLabels(['env=prod', 'team=frontend'], item)).toBe(true)
    })

    test('should exclude when inequality filter matches', () => {
      const item = createMockItem('env=prod; team=backend')
      // Has team=backend, so !team=backend should exclude it
      expect(matchesSelectedLabels(['!team=backend'], item)).toBe(false)
    })

    test('should include when inequality filter does not match', () => {
      const item = createMockItem('env=prod; team=backend')
      // Does not have team=frontend, so !team=frontend should include it
      expect(matchesSelectedLabels(['!team=frontend'], item)).toBe(true)
    })

    test('should handle combined equality and inequality filters', () => {
      const item1 = createMockItem('env=prod; team=backend')
      const item2 = createMockItem('env=prod; team=frontend')
      const item3 = createMockItem('env=dev; team=backend')

      // Filter: env=prod AND !team=backend
      const filters = ['env=prod', '!team=backend']

      // item1: has env=prod but also has team=backend (excluded by negation)
      expect(matchesSelectedLabels(filters, item1)).toBe(false)

      // item2: has env=prod and does NOT have team=backend (included)
      expect(matchesSelectedLabels(filters, item2)).toBe(true)

      // item3: does not have env=prod (excluded by equality)
      expect(matchesSelectedLabels(filters, item3)).toBe(false)
    })

    test('should match all items when only inequality filters are used and none match', () => {
      const item1 = createMockItem('env=prod; team=backend')
      const item2 = createMockItem('env=staging; team=frontend')

      // Neither item has team=qa, so both should be included
      expect(matchesSelectedLabels(['!team=qa'], item1)).toBe(true)
      expect(matchesSelectedLabels(['!team=qa'], item2)).toBe(true)
    })

    test('should handle multiple inequality filters (AND logic)', () => {
      const item = createMockItem('env=prod; team=backend')

      // Item has team=backend, so should be excluded
      expect(matchesSelectedLabels(['!team=backend', '!env=staging'], item)).toBe(false)

      // Item does not have team=frontend or env=staging, so should be included
      expect(matchesSelectedLabels(['!team=frontend', '!env=staging'], item)).toBe(true)
    })

    test('should handle items with no labels', () => {
      const item = createMockItem('')

      // No labels means no equality match
      expect(matchesSelectedLabels(['env=prod'], item)).toBe(false)

      // No labels means inequality filters all pass
      expect(matchesSelectedLabels(['!env=prod'], item)).toBe(true)
    })

    test('should filter out system labels before matching', () => {
      const item = createMockItem('env=prod; cluster-name=local-cluster; policy.open-cluster-management.io/test=value')

      // System labels should be ignored, only env=prod is user-defined
      expect(matchesSelectedLabels(['env=prod'], item)).toBe(true)

      // cluster-name is a system label, so it's filtered out and won't match
      expect(matchesSelectedLabels(['cluster-name=local-cluster'], item)).toBe(false)
    })

    test('should handle empty filter array', () => {
      const item = createMockItem('env=prod; team=backend')

      // Empty filters means no equality filters, so should return true
      expect(matchesSelectedLabels([], item)).toBe(true)
    })

    test('should handle labels with spaces in values', () => {
      const item = createMockItem('env = prod ; team = backend')

      // parsePolicyItemLabels trims spaces, so this should work
      expect(matchesSelectedLabels(['env=prod'], item)).toBe(true)
      expect(matchesSelectedLabels(['team=backend'], item)).toBe(true)
    })

    test('should handle label values containing equals sign', () => {
      const item = createMockItem('description=version=1.2.3; formula=a=b+c')

      // Values should preserve everything after the first '='
      expect(matchesSelectedLabels(['description=version=1.2.3'], item)).toBe(true)
      expect(matchesSelectedLabels(['formula=a=b+c'], item)).toBe(true)

      // Should not match if the full value doesn't match
      expect(matchesSelectedLabels(['description=version'], item)).toBe(false)
      expect(matchesSelectedLabels(['description=version=1.2'], item)).toBe(false)

      // Inequality filters should also work
      expect(matchesSelectedLabels(['!description=version=1.2.3'], item)).toBe(false)
      expect(matchesSelectedLabels(['!description=other=value'], item)).toBe(true)
    })
  })
})
