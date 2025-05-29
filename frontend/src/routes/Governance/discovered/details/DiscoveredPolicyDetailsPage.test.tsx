/* Copyright Contributors to the Open Cluster Management project */
import * as useFetchPolicies from '../useFetchPolicies'
import { render, screen } from '@testing-library/react'
import { generatePath, MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { DiscoveredPolicyDetailsPage } from './DiscoveredPolicyDetailsPage'
import { waitForText } from '../../../../lib/test-util'
import { RecoilRoot } from 'recoil'
import { channelsState, helmReleaseState, subscriptionsState } from '../../../../atoms'
import { ApolloError } from '@apollo/client'

describe('DiscoveredPolicyDetailsPage', () => {
  test('Should render the heading and tabs', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      policyItems: [
        {
          id: 'check-policy-reportsConfigurationPolicy',
          apigroup: 'policy.open-cluster-management.io',
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
              cluster: 'managed1',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: '',
              name: 'check-policy-reports',
              namespace: 'managed1',
              compliant: 'Compliant',
              responseAction: 'inform',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Managed externally', parentName: '', parentNs: '' },
              annotation: 'apps.open-cluster-management.io/hosting-subscription=cannotfind/cannotfind',
            },
          ],
          source: { type: 'Multiple', parentName: '', parentNs: '' },
        },
      ],
      relatedResources: [],
      err: undefined,
      labelData: undefined,
    })

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(channelsState, [])
          snapshot.set(helmReleaseState, [])
          snapshot.set(subscriptionsState, [])
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredByCluster, {
              kind: 'ConfigurationPolicy',
              policyName: 'check-policy-reports',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredPolicyDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Discovered policies')
    await waitForText('check-policy-reports', true)
    await waitForText('Open Cluster Management')
    await waitForText('Clusters')
    await waitForText('Related resources')
  })

  test('Should render error page', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      policyItems: undefined,
      relatedResources: undefined,
      err: { message: 'Error getting fetching data' } as ApolloError,
      labelData: undefined,
    })
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(channelsState, [])
          snapshot.set(helmReleaseState, [])
          snapshot.set(subscriptionsState, [])
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredByCluster, {
              kind: 'CertificatePolicy',
              policyName: 'check-policy-reports',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredPolicyDetailsPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Back to discovered policies')
    const withViolations = screen.queryByText('with violations')
    expect(withViolations).not.toBeInTheDocument()
  })
})
