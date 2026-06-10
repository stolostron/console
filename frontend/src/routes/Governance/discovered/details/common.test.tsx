/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { DiscoveredPolicyItem } from '../useFetchPolicies'
import {
  convertYesNoCell,
  getResponseActionFilter,
  getTotalViolationsCompliance,
  DiscoveredViolationsCard,
  policyViolationSummary,
} from './common'
import { waitForText } from '../../../../lib/test-util'
import i18next from 'i18next'
import { MemoryRouter } from 'react-router'

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

describe('policyViolationSummary with policies.kyverno.io types', () => {
  test('should count violations for new ValidatingPolicy type via totalViolations', () => {
    const mockData: DiscoveredPolicyItem[] = [
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/aaa',
        apigroup: 'policies.kyverno.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2026-06-01T10:00:00Z',
        kind: 'ValidatingPolicy',
        kind_plural: 'validatingpolicies',
        name: 'check-team-label',
        responseAction: 'Audit',
        severity: 'low',
        disabled: false,
        totalViolations: 3,
      },
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/bbb',
        apigroup: 'policies.kyverno.io',
        apiversion: 'v1',
        cluster: 'managed1',
        created: '2026-06-01T10:00:00Z',
        kind: 'ValidatingPolicy',
        kind_plural: 'validatingpolicies',
        name: 'deny-privileged',
        responseAction: 'Deny',
        severity: 'critical',
        disabled: false,
        totalViolations: 0,
      },
    ]

    const summary = policyViolationSummary(mockData)
    expect(summary.noncompliant).toBe(1)
    expect(summary.compliant).toBe(1)
    expect(summary.pending).toBe(0)
    expect(summary.unknown).toBe(0)
  })

  test('should deduplicate NamespacedValidatingPolicy by cluster:name', () => {
    const mockData: DiscoveredPolicyItem[] = [
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/ccc',
        apigroup: 'policies.kyverno.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2026-06-01T10:00:00Z',
        kind: 'NamespacedValidatingPolicy',
        kind_plural: 'namespacedvalidatingpolicies',
        name: 'require-limits',
        namespace: 'default',
        responseAction: 'Audit',
        severity: 'medium',
        disabled: false,
        totalViolations: 1,
      },
      {
        _hubClusterResource: true,
        _uid: 'local-cluster/ddd',
        apigroup: 'policies.kyverno.io',
        apiversion: 'v1',
        cluster: 'local-cluster',
        created: '2026-06-01T10:00:00Z',
        kind: 'NamespacedValidatingPolicy',
        kind_plural: 'namespacedvalidatingpolicies',
        name: 'require-limits',
        namespace: 'kube-system',
        responseAction: 'Audit',
        severity: 'medium',
        disabled: false,
        totalViolations: 0,
      },
    ]

    const summary = policyViolationSummary(mockData)
    expect(summary.noncompliant).toBe(1)
    expect(summary.compliant).toBe(0)
    expect(summary.pending).toBe(0)
    expect(summary.unknown).toBe(0)
  })
})

describe('getResponseActionFilter with Kyverno Deny', () => {
  test('should include Kyverno Deny option', () => {
    const t = i18next.t.bind(i18next)
    const filter = getResponseActionFilter(t)
    const denyOption = filter.options.find((o: any) => o.value === 'Deny')
    expect(denyOption).toBeDefined()
    expect(denyOption?.label).toBe('Kyverno Deny')
  })

  test('should match policies.kyverno.io items with Deny filter', () => {
    const t = i18next.t.bind(i18next)
    const filter = getResponseActionFilter(t)
    const item = {
      apigroup: 'policies.kyverno.io',
      responseAction: 'Deny',
    } as any

    expect(filter.tableFilterFn(['Deny'], item)).toBe(true)
    expect(filter.tableFilterFn(['Audit'], item)).toBe(false)
  })

  test('should match kyverno.io items with Audit filter', () => {
    const t = i18next.t.bind(i18next)
    const filter = getResponseActionFilter(t)
    const item = {
      apigroup: 'kyverno.io',
      responseAction: 'Audit',
    } as any

    expect(filter.tableFilterFn(['Audit'], item)).toBe(true)
    expect(filter.tableFilterFn(['Deny'], item)).toBe(false)
  })
})

// Note: Label utility functions (isUserDefinedPolicyLabel, parsePolicyItemLabels, getLabelFilterOptions, matchesSelectedLabels)
// are tested in src/routes/Governance/utils/label-utils.test.ts
