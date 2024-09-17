/* Copyright Contributors to the Open Cluster Management project */
import * as useFetchPolicies from '../useFetchPolicies'
import { render, screen } from '@testing-library/react'
import { generatePath, MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import DiscoveredByClusterPage from './DiscoveredByClusterPage'
import { waitForText } from '../../../../lib/test-util'
import { RecoilRoot } from 'recoil'
import { channelsState, helmReleaseState, subscriptionsState } from '../../../../atoms'
import { ApolloError } from '@apollo/client'

describe('DiscoveredByClusterPage', () => {
  test('Should render DiscoveredByCluster for ConfigurationPolicy', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: [
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
      err: undefined,
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
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText('Discovered policies')

    await waitForText('check-policy-reports', true)
    await waitForText('Open Cluster Management')

    await waitForText('Response action')
    await waitForText('enforce')
    await waitForText('inform')

    await waitForText('Violations', true)
    await waitForText('No violations', true)

    await waitForText('Severity')
    await waitForText('Critical')

    await waitForText('Source')
    await waitForText('Managed externally', true)
    // Because of tooltip, this is presented multiple times
    await waitForText('ConfigurationPolicy violations', true)
  })
  test('Should render DiscoveredByCluster for CertificatePolicy', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: [
        {
          id: 'check-policy-reportsCertificatePolicy',
          apigroup: 'policy.open-cluster-management.io',
          name: 'check-policy-reports',
          kind: 'CertificatePolicy',
          severity: 'low',
          responseAction: 'enforce',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'managed2',
              created: '2024-08-15T14:01:52Z',
              kind: 'CertificatePolicy',
              kind_plural: 'certificatepolicies',
              label: 'policy.open-cluster-management.io/policy=default.cert-dd',
              name: 'check-policy-reports',
              namespace: 'local-cluster',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              annotation: 'apps.open-cluster-management.io/hosting-subscription=policies/demo-sub',
              source: { type: 'Managed externally', parentName: '', parentNs: '' },
            },
          ],
          source: { type: 'Managed externally', parentName: '', parentNs: '' },
        },
      ],
      err: undefined,
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
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText('Discovered policies')

    await waitForText('check-policy-reports', true)
    await waitForText('Open Cluster Management')

    await waitForText('Response action')
    await waitForText('enforce')

    await waitForText('Violations', true)
    await waitForText('No violations')

    await waitForText('Severity')
    await waitForText('Low')

    await waitForText('Source')
    await waitForText('Managed externally', true)
    // Because of tooltip, this is presented multiple times
    await waitForText('CertificatePolicy violations', true)
  })
  test('Should render DiscoveredByCluster for OperatorPolicy', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: [
        {
          id: 'check-policy-reportsOperatorPolicy',
          apigroup: 'policy.open-cluster-management.io',
          name: 'check-policy-reports',
          kind: 'OperatorPolicy',
          severity: 'low',
          responseAction: 'enforce',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'managed2',
              created: '2024-08-15T14:01:52Z',
              kind: 'OperatorPolicy',
              kind_plural: 'operatorpolicies',
              label: 'policy.open-cluster-management.io/policy=default.cert-dd',
              name: 'check-policy-reports',
              namespace: 'local-cluster',
              compliant: 'NonCompliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              deploymentAvailable: true,
              upgradeAvailable: true,
              annotation: 'apps.open-cluster-management.io/hosting-subscription=policies/demo-sub',
              source: { type: 'Managed externally', parentName: '', parentNs: '' },
            },
          ],
          source: { type: 'Managed externally', parentName: '', parentNs: '' },
        },
      ],
      err: undefined,
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
              kind: 'OperatorPolicy',
              policyName: 'check-policy-reports',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText('Discovered policies')

    await waitForText('check-policy-reports', true)
    await waitForText('Open Cluster Management')

    await waitForText('Response action')
    await waitForText('enforce')

    await waitForText('Violations', true)

    await waitForText('Severity')
    await waitForText('Low')

    await waitForText('Source')
    await waitForText('Managed externally')

    await waitForText('Deployment available')
    await waitForText('Upgrade available')
    // Because of tooltip, this is presented multiple times
    await waitForText('OperatorPolicy violations', true)
  })

  test('Should render DiscoveredByCluster for a Gatekeeper constraint', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: [
        {
          id: 'ns-must-have-gk_K8sRequiredLabels_',
          apigroup: 'constraints.gatekeeper.sh',
          name: 'ns-must-have-gk',
          kind: 'K8sRequiredLabels',
          severity: 'critical',
          responseAction: 'deny/warn',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
              apigroup: 'constraints.gatekeeper.sh',
              apiversion: 'v1beta1',
              cluster: 'local-cluster',
              created: '2024-08-15T14:01:52Z',
              kind: 'K8sRequiredLabels',
              kind_plural: 'k8srequiredlabels',
              label: '',
              name: 'ns-must-have-gk',
              totalViolations: 82,
              responseAction: 'warn',
              severity: 'critical',
              _isExternal: false,
              annotation: 'policy.open-cluster-management.io/severity=critical',
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
            {
              _hubClusterResource: true,
              _uid: 'cluster1/45044810-6b61-4437-adbe-5456c5f47a81',
              apigroup: 'constraints.gatekeeper.sh',
              apiversion: 'v1beta1',
              cluster: 'cluster1',
              created: '2024-08-13T11:01:32Z',
              kind: 'K8sRequiredLabels',
              kind_plural: 'k8srequiredlabels',
              label: '',
              name: 'ns-must-have-gk',
              totalViolations: 75,
              responseAction: 'deny',
              severity: 'high',
              _isExternal: false,
              annotation: 'policy.open-cluster-management.io/severity=high',
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
          ],
          source: { type: 'Local', parentName: '', parentNs: '' },
        },
      ],
      err: undefined,
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
              kind: 'K8sRequiredLabels',
              policyName: 'ns-must-have-gk',
              apiGroup: 'constraints.gatekeeper.sh',
              apiVersion: 'v1beta1',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText('Discovered policies')

    await waitForText('ns-must-have-gk', true)
    await waitForText('Gatekeeper', true)

    await waitForText('Response action')
    await waitForText('deny')
    await waitForText('warn')

    await waitForText('Violations', true)

    expect(screen.getByRole('cell', { name: /82 Violations/ })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /75 Violations/ })).toBeInTheDocument()

    await waitForText('Severity')
    await waitForText('High')
    await waitForText('Critical')

    await waitForText('Source')
    await waitForText('Local', true)

    await waitForText('K8sRequiredLabels violations', true)
    await waitForText('2 with violations')
  })

  test('Should render empty policy warning page for OperatorPolicy', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: undefined,
      err: undefined,
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
              kind: 'OperatorPolicy',
              policyName: 'check-policy-reports',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText(`You don't have any operator policies.`)
    await waitForText('There are no search results for operator policies.')
  })

  test('Should render empty policy warning page for ConfigurationPolicy', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: undefined,
      err: undefined,
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
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText(`You don't have any configuration policies.`)
    await waitForText('There are no search results for configuration policies.')
  })

  test('Should render empty policy warning page for CertificatePolicy', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: undefined,
      err: undefined,
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
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText(`You don't have any certificate policies.`)
    await waitForText('There are no search results for certificate policies.')
  })

  test('Should render error page', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: false,
      data: undefined,
      err: { message: 'Error getting fetching data' } as ApolloError,
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
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Error getting fetching data')
    const withViolations = screen.queryByText('with violations')
    expect(withViolations).not.toBeInTheDocument()
  })

  test('Should render loading page', async () => {
    jest.spyOn(useFetchPolicies, 'useFetchPolicies').mockReturnValue({
      isFetching: true,
      data: undefined,
      err: { message: 'Error getting fetching data' } as ApolloError,
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
            <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Loading')
    const err = screen.queryByText('Error getting fetching data')
    expect(err).not.toBeInTheDocument()
  })
})
