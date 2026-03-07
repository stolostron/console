/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { DiscoveredPolicyItem } from '../useFetchPolicies'
import {
  convertYesNoCell,
  getTotalViolationsCompliance,
  DiscoveredViolationsCard,
  policyViolationSummary,
} from './common'
import { isUserDefinedPolicyLabel, parsePolicyItemLabels, getLabelFilterOptions } from '../../utils/label-utils'
import { waitForText } from '../../../../lib/test-util'
import i18next from 'i18next'
import { MemoryRouter } from 'react-router-dom-v5-compat'

describe('ByCluster common component test', () => {
  test('Compliant should be 2 and others should be 0', async () => {
    const mockData: DiscoveredPolicyItem[] = [
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label:
          'cluster-name=local-cluster; cluster-namespace=local-cluster; policy.open-cluster-management.io/cluster-name=local-cluster; policy.open-cluster-management.io/cluster-namespace=local-cluster',
        name: 'policy-pod',
        namespace: 'local-cluster',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
        annotation: 'apps.open-cluster-management.io/hosting-subscription=policies/demo-sub',
      },
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'managed4',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label: 'policy.open-cluster-management.io/policy=default.dd',
        name: 'policy-pod',
        namespace: 'managed4',
        compliant: 'Compliant',
        responseAction: 'inform',
        severity: 'low',
        disabled: false,
        _isExternal: true,
        annotation: 'apps.open-cluster-management.io/hosting-subscription=policies/demo-sub',
      },
    ]

    render(
      <MemoryRouter>
        <DiscoveredViolationsCard
          policyKind="ConfigurationPolicy"
          policyViolationSummary={policyViolationSummary(mockData)}
        />
      </MemoryRouter>
    )

    await waitForText('2 with no violations')
    await waitForText('0 pending')
    await waitForText('0 with violations')
  })

  test('Compliant, NonCompliant, and Pending should each have 1', async () => {
    const mockData: DiscoveredPolicyItem[] = [
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label:
          'cluster-name=local-cluster; cluster-namespace=local-cluster; policy.open-cluster-management.io/cluster-name=local-cluster; policy.open-cluster-management.io/cluster-namespace=local-cluster',
        name: 'policy-pod',
        namespace: 'local-cluster',
        compliant: 'Compliant',
        responseAction: 'enforce',
        severity: 'low',
        disabled: false,
        _isExternal: true,
        annotation: 'apps.open-cluster-management.io/hosting-subscription=policies/demo-sub',
      },
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'managed4',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label: 'policy.open-cluster-management.io/policy=default.dd',
        name: 'policy-pod',
        namespace: 'managed4',
        compliant: 'NonCompliant',
        responseAction: 'inform',
        severity: 'low',
        disabled: false,
        _isExternal: true,
        annotation: 'apps.open-cluster-management.io/hosting-subscription=policies/demo-sub',
      },
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
        apigroup: 'policy.open-cluster-management.io',
        apiversion: 'v1',
        cluster: 'managed5',
        created: '2024-08-15T14:01:52Z',
        kind: 'ConfigurationPolicy',
        kind_plural: 'configurationpolicies',
        label: 'policy.open-cluster-management.io/policy=default.dd',
        name: 'policy-pod',
        namespace: 'managed5',
        compliant: 'Pending',
        responseAction: 'inform',
        severity: 'low',
        disabled: false,
        _isExternal: true,
        annotation: 'apps.open-cluster-management.io/hosting-subscription=policies/demo-sub',
      },
    ]

    render(
      <MemoryRouter>
        <DiscoveredViolationsCard
          policyKind="ConfigurationPolicy"
          policyViolationSummary={policyViolationSummary(mockData)}
        />
      </MemoryRouter>
    )

    await waitForText('1 with no violations')
    await waitForText('1 pending')
    await waitForText('1 with violations')
  })

  test('convertYesNoCell should work properly', () => {
    const t = i18next.t.bind(i18next)

    expect(convertYesNoCell('false', t)).toBe('no')
    expect(convertYesNoCell(false, t)).toBe('no')
    expect(convertYesNoCell(true, t)).toBe('yes')
    expect(convertYesNoCell(undefined, t)).toBe('-')
  })
})

describe('getTotalViolationsCompliance', () => {
  test('getTotalViolationsCompliance should work properly', () => {
    expect(getTotalViolationsCompliance(0)).toEqual('compliant')
    expect(getTotalViolationsCompliance(1)).toEqual('noncompliant')
    expect(getTotalViolationsCompliance(undefined)).toEqual('-')
  })
})

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
