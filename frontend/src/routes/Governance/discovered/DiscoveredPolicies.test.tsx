/* Copyright Contributors to the Open Cluster Management project */
import * as useFetchPolicies from './useFetchPolicies'
import DiscoveredPolicies from './DiscoveredPolicies'
import { getSourceFilterOptions } from './ByCluster/common'
import { fireEvent, render, screen } from '@testing-library/react'
import { waitForText, waitForNotText } from '../../../lib/test-util'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { ApolloError } from '@apollo/client'

describe('useFetchPolicies custom hook', () => {
  test('Should render all cols for discovered policies', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: [
        {
          id: 'check-policy-reportsConfigurationPolicy',
          name: 'check-policy-reports',
          kind: 'ConfigurationPolicy',
          apigroup: 'policy.open-cluster-management.io',
          severity: 'critical',
          responseAction: 'inform/enforce',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'managed2',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: '',
              name: 'check-policy-reports',
              namespace: 'managed2',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'critical',
              disabled: false,
              _isExternal: true,
              source: { type: 'Managed externally', parentName: '', parentNs: '' },
              annotation: 'apps.open-cluster-management.io/hosting-subscription=cannotfind/cannotfind',
            },
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'managed2',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: '',
              name: 'check-policy-reports',
              namespace: 'managed2',
              compliant: 'NomCompliant',
              responseAction: 'inform',
              severity: 'critical',
              disabled: false,
              _isExternal: true,
              source: { type: 'Managed externally', parentName: '', parentNs: '' },
              annotation: 'apps.open-cluster-management.io/hosting-subscription=cannotfind/cannotfind',
            },
          ],
          source: {
            type: 'Policy',
            parentName: 'p-name',
            parentNs: 'p-ns',
          },
        },
        {
          id: 'ns-must-have-gkK8sRequiredLabelsconstraints.gatekeeper.sh',
          apigroup: 'constraints.gatekeeper.sh',
          name: 'ns-must-have-gk',
          kind: 'K8sRequiredLabels',
          severity: 'high',
          responseAction: 'dryrun',
          policies: [
            {
              _hubClusterResource: true,
              _isExternal: false,
              _uid: 'local-cluster/9843c09d-2ebb-4fe8-8397-49f11b3b55a9',
              annotation: 'policy.open-cluster-management.io/severity=high',
              apigroup: 'constraints.gatekeeper.sh',
              apiversion: 'v1beta1',
              cluster: 'local-cluster',
              label: '',
              created: '2024-09-13T13:05:13Z',
              kind: 'K8sRequiredLabels',
              kind_plural: 'k8srequiredlabels',
              name: 'ns-must-have-gk',
              totalViolations: 82,
              source: {
                type: 'Local',
                parentNs: '',
                parentName: '',
              },
              severity: 'high',
              responseAction: 'dryrun',
            },
          ],
          source: {
            type: 'Local',
            parentNs: '',
            parentName: '',
          },
        },
      ],
      err: undefined,
    })

    render(
      <MemoryRouter>
        <DiscoveredPolicies />
      </MemoryRouter>
    )

    await waitForText('Name')
    await waitForText('check-policy-reports')
    await waitForText('ns-must-have-gk')

    await waitForText('Engine')
    await waitForText('Open Cluster Management')
    await waitForText('Gatekeeper')

    await waitForText('Kind')
    await waitForText('ConfigurationPolicy')
    await waitForText('K8sRequiredLabels')

    await waitForText('Response action')
    await waitForText('inform/enforce')
    await waitForText('dryrun')

    await waitForText('Severity')
    await waitForText('Critical')
    await waitForText('High')

    await waitForText('Source')
    await waitForText('p-name')
    await waitForText('Local')

    // tooltip test
    fireEvent.mouseEnter(screen.getByText('p-name'))
    await waitForText('Namespace: p-ns')
    await waitForText('Name: p-name')

    // Test the kind filter
    await waitForText('Filter')
    screen.getByRole('button', { name: 'Options menu' }).click()
    screen.getByRole('checkbox', { name: 'Gatekeeper constraint 1' }).click()

    await waitForNotText('check-policy-reports')
    await waitForText('ns-must-have-gk')

    // Unset the filter so the state doesn't carry over
    screen.getByRole('checkbox', { name: 'Gatekeeper constraint 1' }).click()
  })

  test('Should render error page', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: undefined,
      err: { message: 'Error getting fetching data' } as ApolloError,
    })

    render(
      <MemoryRouter>
        <DiscoveredPolicies />
      </MemoryRouter>
    )

    await waitForText('Error getting fetching data')
  })

  test('Should render loading page', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: true,
      data: undefined,
      err: { message: 'Error getting fetching data' } as ApolloError,
    })

    render(
      <MemoryRouter>
        <DiscoveredPolicies />
      </MemoryRouter>
    )

    await waitForText('Loading')
    const errBox = screen.queryByText('Error getting fetching data')
    expect(errBox).not.toBeInTheDocument()
  })

  test('Should render severity with hyphen', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: [
        {
          id: 'check-policy-reportsConfigurationPolicy',
          name: 'check-policy-reports',
          kind: 'ConfigurationPolicy',
          apigroup: 'policy.open-cluster-management.io',
          severity: 'unknown',
          responseAction: 'inform/enforce',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'managed2',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: '',
              name: 'check-policy-reports',
              namespace: 'managed2',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: '',
              disabled: false,
              _isExternal: true,
              source: { type: 'Managed externally', parentName: '', parentNs: '' },
              annotation: 'apps.open-cluster-management.io/hosting-subscription=cannotfind/cannotfind',
            },
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'managed2',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: '',
              name: 'check-policy-reports',
              namespace: 'managed2',
              compliant: 'NomCompliant',
              responseAction: 'inform',
              severity: '',
              disabled: false,
              _isExternal: true,
              source: { type: 'Managed externally', parentName: '', parentNs: '' },
              annotation: 'apps.open-cluster-management.io/hosting-subscription=cannotfind/cannotfind',
            },
          ],
          source: {
            type: 'Multiple',
            parentName: '',
            parentNs: '',
          },
        },
      ],
      err: undefined,
    })

    const { baseElement } = render(
      <MemoryRouter>
        <DiscoveredPolicies />
      </MemoryRouter>
    )
    expect(baseElement.querySelector('td[data-label=Severity]')?.textContent).toBe('-')
  })

  test('Should get source filter list properly', () => {
    const data: useFetchPolicies.DiscoverdPolicyTableItem[] = [
      {
        id: 'check-policy-reportsConfigurationPolicy',
        apigroup: 'policy.open-cluster-management.io',
        name: 'check-policy-reports',
        kind: 'ConfigurationPolicy',
        severity: 'critical',
        responseAction: 'inform/enforce',
        policies: [],
        source: {
          type: 'Multiple',
          parentName: '',
          parentNs: '',
        },
      },
      {
        id: 'check-policy-reportsConfigurationPolicy',
        apigroup: 'policy.open-cluster-management.io',
        name: 'check-policy-reports',
        kind: 'ConfigurationPolicy',
        severity: 'critical',
        responseAction: 'inform/enforce',
        policies: [],
        source: {
          type: 'Policy',
          parentName: 'parent-name',
          parentNs: 'parent-ns',
        },
      },
      {
        id: 'check-policy-reportsConfigurationPolicy',
        apigroup: 'policy.open-cluster-management.io',
        name: 'check-policy-reports2',
        kind: 'ConfigurationPolicy2',
        severity: 'critical',
        responseAction: 'inform/enforce',
        policies: [],
        source: {
          type: 'Policy',
          parentName: 'parent-name',
          parentNs: 'parent-ns',
        },
      },
      {
        id: 'check-policy-reportsConfigurationPolicy',
        apigroup: 'policy.open-cluster-management.io',
        name: 'check-policy-reports2',
        kind: 'ConfigurationPolicy2',
        severity: 'critical',
        responseAction: 'inform/enforce',
        policies: [],
        source: {
          type: 'Policy',
          parentName: 'parent-name2',
          parentNs: 'parent-ns2',
        },
      },
      {
        id: 'check-policy-reportsConfigurationPolicy',
        apigroup: 'policy.open-cluster-management.io',
        name: 'check-policy-reports2',
        kind: 'ConfigurationPolicy2',
        severity: 'critical',
        responseAction: 'inform/enforce',
        policies: [],
        source: {
          type: 'Local',
          parentName: '',
          parentNs: '',
        },
      },
      {
        id: 'check-policy-reportsConfigurationPolicy',
        apigroup: 'policy.open-cluster-management.io',
        name: 'check-policy-reports2',
        kind: 'ConfigurationPolicy2',
        severity: 'critical',
        responseAction: 'inform/enforce',
        policies: [],
        source: {
          type: 'Managed externally',
          parentName: '',
          parentNs: '',
        },
      },
    ]
    expect(JSON.stringify(getSourceFilterOptions(data))).toBe(
      JSON.stringify([
        { label: 'Local', value: 'Local' },
        { label: 'Managed externally', value: 'Managed externally' },
        { label: 'Multiple', value: 'Multiple' },
        { label: 'Policy', value: 'Policy' },
      ])
    )
  })

  test('Should render ValidatingAdmissionPolicyBinding', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: [
        {
          id: 'machine-configuration-guards-bindingValidatingAdmissionPolicyBindingadmissionregistration.k8s.io',
          apigroup: 'admissionregistration.k8s.io',
          name: 'machine-configuration-guards-binding',
          kind: 'ValidatingAdmissionPolicyBinding',
          severity: 'unknown',
          responseAction: 'audit/deny',
          policies: [
            {
              _hubClusterResource: true,
              _ownedByGatekeeper: false,
              _uid: 'local-cluster/0',
              apigroup: 'admissionregistration.k8s.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2024-10-22T11:13:54Z',
              kind: 'ValidatingAdmissionPolicyBinding',
              kind_plural: 'validatingadmissionpolicybindings',
              name: 'machine-configuration-guards-binding',
              policyName: 'machine-configuration-guards',
              validationActions: 'audit; deny',
              severity: '',
              responseAction: 'audit/deny',
              source: { type: 'Local', parentNs: '', parentName: '' },
              annotation: '',
              label: '',
            },
          ],
          source: { type: 'Local', parentNs: '', parentName: '' },
        },
      ],
      err: undefined,
    })

    const { container } = render(
      <MemoryRouter>
        <DiscoveredPolicies />
      </MemoryRouter>
    )

    await waitForText('Name')
    await waitForText('machine-configuration-guards-binding')

    await waitForText('Engine')
    await waitForText('Kubernetes')

    await waitForText('Kind')
    await waitForText('ValidatingAdmissionPolicyBinding')

    await waitForText('Response action')
    await waitForText('audit/deny')

    await waitForText('Severity')
    expect(container.querySelector('td[data-label="Cluster violations"]')).toHaveTextContent('-')
    expect(container.querySelector('td[data-label="Severity"]')).toHaveTextContent('-')
    await waitForText('Source')
    await waitForText('Local')
  })

  test('Should render Kyverno Policy in multiple namespaces and ClusterPolicy', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: [
        {
          id: 'require-owner-labelsClusterPolicykyverno.io',
          apigroup: 'kyverno.io',
          name: 'require-owner-labels',
          kind: 'ClusterPolicy',
          severity: 'medium',
          responseAction: 'Audit',
          policies: [
            {
              _hubClusterResource: true,
              _isExternal: false,
              _uid: 'local-cluster/10716b79-0c21-4d0d-ae75-3a28a8501b58',
              annotation: '',
              apigroup: 'kyverno.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2024-11-04T15:19:46Z',
              kind: 'ClusterPolicy',
              kind_plural: 'clusterpolicies',
              label: '',
              name: 'require-owner-labels',
              severity: 'medium',
              validationFailureAction: 'Audit',
              source: {
                type: 'Local',
                parentNs: '',
                parentName: '',
              },
              responseAction: 'Audit',
              totalViolations: 625,
            },
          ],
          source: {
            type: 'Local',
            parentNs: '',
            parentName: '',
          },
        },
        {
          id: 'require-team-labelPolicykyverno.io',
          apigroup: 'kyverno.io',
          name: 'require-team-label',
          kind: 'Policy',
          severity: 'critical',
          responseAction: 'Audit',
          policies: [
            {
              _hubClusterResource: true,
              _isExternal: false,
              _uid: 'local-cluster/3575a113-174b-4ea0-b42e-004f48dd9080',
              apigroup: 'kyverno.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2024-11-04T15:19:37Z',
              kind: 'Policy',
              kind_plural: 'policies',
              name: 'require-team-label',
              namespace: 'open-cluster-management-agent-addon',
              severity: 'critical',
              validationFailureAction: 'Audit',
              source: {
                type: 'Local',
                parentNs: '',
                parentName: '',
              },
              responseAction: 'Audit',
              totalViolations: 178,
            },
            {
              _hubClusterResource: true,
              _isExternal: false,
              _uid: 'local-cluster/7bdb93f9-fb25-480b-a971-2b2b32d3f9c3',
              apigroup: 'kyverno.io',
              apiversion: 'v1',
              cluster: 'local-cluster',
              created: '2024-11-04T15:20:06Z',
              kind: 'Policy',
              kind_plural: 'policies',
              name: 'require-team-label',
              namespace: 'default',
              severity: 'critical',
              validationFailureAction: 'Audit',
              source: {
                type: 'Local',
                parentNs: '',
                parentName: '',
              },
              responseAction: 'Audit',
              totalViolations: 0,
            },
            {
              _hubClusterResource: false,
              _isExternal: false,
              _uid: 'managed-cluster1/91db93f9-fb25-480b-a971-2b2b32d3f9df',
              apigroup: 'kyverno.io',
              apiversion: 'v1',
              cluster: 'managed-cluster1',
              created: '2024-11-04T15:21:06Z',
              kind: 'Policy',
              kind_plural: 'policies',
              name: 'require-team-label',
              namespace: 'default',
              severity: 'critical',
              validationFailureAction: 'Audit',
              source: {
                type: 'Local',
                parentNs: '',
                parentName: '',
              },
              responseAction: 'Audit',
              totalViolations: 0,
            },
          ],
          source: {
            type: 'Local',
            parentNs: '',
            parentName: '',
          },
        },
      ],
      err: undefined,
    })

    render(
      <MemoryRouter>
        <DiscoveredPolicies />
      </MemoryRouter>
    )

    await waitForText('Name')
    expect(screen.getByRole('link', { name: 'require-owner-labels' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'require-team-label' })).toBeInTheDocument()

    await waitForText('Engine')
    await waitForText('Kyverno', true)

    await waitForText('Kind')
    await waitForText('Policy')
    await waitForText('ClusterPolicy')

    expect(
      screen.getByRole('row', {
        name: /require-owner-labels Kyverno ClusterPolicy Audit Medium 1 Local/,
      })
    ).toBeInTheDocument()

    // Validate filter
    await waitForText('Filter')

    screen.getByRole('button', { name: 'Options menu' }).click()
    screen.getByRole('checkbox', { name: 'Kyverno Policy 1' }).click()
    screen.getByRole('checkbox', { name: 'Kyverno ClusterPolicy 1' }).click()
  })
})
