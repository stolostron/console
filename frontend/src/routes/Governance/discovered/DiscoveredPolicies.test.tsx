/* Copyright Contributors to the Open Cluster Management project */
import * as useFetchPolicies from './useFetchPolicies'
import DiscoveredPolicies, { getSourceFilter } from './DiscoveredPolicies'
import { fireEvent, render, screen } from '@testing-library/react'
import { waitForText } from '../../../lib/test-util'
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
              remediationAction: 'enforce',
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
              remediationAction: 'inform',
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

    await waitForText('Engine')
    await waitForText('Open Cluster Management')

    await waitForText('Kind')
    await waitForText('ConfigurationPolicy')

    await waitForText('Response action')
    await waitForText('inform/enforce')

    await waitForText('Severity')
    await waitForText('Critical')

    await waitForText('Source')
    await waitForText('p-name')

    // tooltip test
    fireEvent.mouseEnter(screen.getByText('p-name'))
    await waitForText('Namespace: p-ns')
    await waitForText('Name: p-name')
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
              remediationAction: 'enforce',
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
              remediationAction: 'inform',
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
    expect(JSON.stringify(getSourceFilter(data))).toBe(
      JSON.stringify([
        { label: 'Multiple', value: 'Multiple' },
        { label: 'parent-ns/parent-name', value: 'parent-ns/parent-name' },
        { label: 'parent-ns2/parent-name2', value: 'parent-ns2/parent-name2' },
        { label: 'Local', value: 'Local' },
        { label: 'Managed externally', value: 'Managed externally' },
      ])
    )
  })
})
