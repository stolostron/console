/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, within } from '@testing-library/react'
import { generatePath, MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../../../NavigationPath'
import { DiscoveredDetailsContext } from './DiscoveredPolicyDetailsPage'
import { waitForNotText, waitForText } from '../../../../lib/test-util'
import { RecoilRoot } from 'recoil'
import { channelsState, helmReleaseState, subscriptionsState } from '../../../../atoms'
import { ApolloError } from '@apollo/client'
import DiscoveredByCluster from './DiscoveredByCluster'
import { matchesSelectedLabels } from '../../utils/label-utils'

describe('DiscoveredByCluster', () => {
  test('Should render DiscoveredByCluster for ConfigurationPolicy', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
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
      err: undefined,
      policyKind: 'ConfigurationPolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }
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
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

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
    await waitForText('ConfigurationPolicy cluster violations', true)
  })
  test('Should render DiscoveredByCluster for CertificatePolicy', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: [
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
      policyKind: 'CertificatePolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }
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
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Response action')
    await waitForText('enforce')

    await waitForText('Violations', true)
    await waitForText('No violations')

    await waitForText('Severity')
    await waitForText('Low')

    await waitForText('Source')
    await waitForText('Managed externally', true)
    // Because of tooltip, this is presented multiple times
    await waitForText('CertificatePolicy cluster violations', true)
  })
  test('Should render DiscoveredByCluster for OperatorPolicy', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: [
        {
          id: 'check-policy-reportsOperatorPolicy',
          apigroup: 'policy.open-cluster-management.io',
          name: 'check-policy-reports',
          kind: 'OperatorPolicy',
          severity: 'high',
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
            {
              _hubClusterResource: true,
              _uid: 'local-cluster/36044810-6b61-4437-adbe-5456c5f47a95',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'managed3',
              created: '2024-08-15T14:01:52Z',
              kind: 'OperatorPolicy',
              kind_plural: 'operatorpolicies',
              label: 'policy.open-cluster-management.io/policy=default.cert-dd',
              name: 'check-policy-reports',
              compliant: 'Compliant',
              responseAction: 'inform',
              severity: 'high',
              disabled: false,
              _isExternal: true,
              deploymentAvailable: false,
              upgradeAvailable: false,
              annotation: 'apps.open-cluster-management.io/hosting-subscription=policies/demo-sub',
              source: { type: 'Managed externally', parentName: '', parentNs: '' },
            },
          ],
          source: { type: 'Managed externally', parentName: '', parentNs: '' },
        },
      ],
      err: undefined,
      policyKind: 'OperatorPolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }
    const { container } = render(
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
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Cluster')
    await waitForText('managed2')
    await waitForText('managed3')

    await waitForText('Response action')
    await waitForText('enforce')
    await waitForText('inform')

    await waitForText('Violations', true)

    // Test the donut charts
    expect(container.querySelector('#operatorpolicy-cluster-violations-chart-title')).toHaveTextContent(
      'OperatorPolicy cluster violations 1'
    )
    expect(container.querySelector('#deployments-unavailable-chart-title')).toHaveTextContent(
      'Deployments unavailable 1'
    )
    expect(container.querySelector('#update-availability-chart-title')).toHaveTextContent('Update availability 1')

    await waitForText('Severity')
    await waitForText('Low')
    await waitForText('High')

    await waitForText('Source')
    await waitForText('Managed externally', true)

    await waitForText('Deployment available')
    await waitForText('Update available')
    // Because of tooltip, this is presented multiple times
    await waitForText('OperatorPolicy cluster violations', true)

    // Test some filters
    await waitForText('Filter')
    screen.getByRole('button', { name: 'Filter' }).click()

    const deploymentAvailableFilter = screen.getByRole('heading', { name: 'Deployment available' }).parentElement!

    within(deploymentAvailableFilter).getByRole('checkbox', { name: 'yes 1' }).click()

    await waitForText('managed2')
    await waitForNotText('managed3')

    within(deploymentAvailableFilter).getByRole('checkbox', { name: 'yes 1' }).click()
    within(deploymentAvailableFilter).getByRole('checkbox', { name: 'no 1' }).click()

    await waitForText('managed3')
    await waitForNotText('managed2')

    within(deploymentAvailableFilter).getByRole('checkbox', { name: 'no 1' }).click()

    const upgradeAvailableFilter = screen.getByRole('heading', { name: 'Update available' }).parentElement!

    within(upgradeAvailableFilter).getByRole('checkbox', { name: 'yes 1' }).click()

    await waitForText('managed2')
    await waitForNotText('managed3')

    within(upgradeAvailableFilter).getByRole('checkbox', { name: 'yes 1' }).click()
    within(upgradeAvailableFilter).getByRole('checkbox', { name: 'no 1' }).click()

    await waitForText('managed3')
    await waitForNotText('managed2')

    within(upgradeAvailableFilter).getByRole('checkbox', { name: 'no 1' }).click()

    screen.getByRole('checkbox', { name: 'Managed externally 2' }).click()
    await waitForText('managed2')
    await waitForText('managed3')

    screen.getByRole('checkbox', { name: 'Managed externally 2' }).click()

    screen.getByRole('checkbox', { name: 'Low 1' }).click()

    await waitForText('managed2')
    await waitForNotText('managed3')

    screen.getByRole('checkbox', { name: 'Low 1' }).click()

    screen.getByRole('checkbox', { name: 'High 1' }).click()
    await waitForNotText('managed2')
    await waitForText('managed3')

    screen.getByRole('checkbox', { name: 'High 1' }).click()

    screen.getByRole('checkbox', { name: 'enforce 1' }).click()
    await waitForNotText('managed3')
    await waitForText('managed2')

    screen.getByRole('checkbox', { name: 'enforce 1' }).click()
    screen.getByRole('checkbox', { name: 'inform 1' }).click()

    await waitForNotText('managed2')
    await waitForText('managed3')

    // Unset the filter so the state doesn't carry over
    screen.getByRole('checkbox', { name: 'inform 1' }).click()
  })

  test('Should render DiscoveredByCluster for a Gatekeeper constraint', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: [
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
      policyKind: 'K8sRequiredLabels',
      apiGroup: 'constraints.gatekeeper.sh',
    }
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
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Response action')
    await waitForText('deny')
    await waitForText('warn')

    await waitForText('Violations', true)
    await waitForText('82')
    await waitForText('75')

    await waitForText('Severity')
    await waitForText('High')
    await waitForText('Critical')

    await waitForText('Source')
    await waitForText('Local', true)

    await waitForText('K8sRequiredLabels cluster violations', true)
    await waitForText('2 with violations')
  })

  test('Should render empty policy warning page for OperatorPolicy', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: undefined,
      err: undefined,
      policyKind: 'OperatorPolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }
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
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText(`You don't have any operator policies.`)
    await waitForText('There are no search results for operator policies.')
  })

  test('Should render empty policy warning page for ConfigurationPolicy', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: undefined,
      err: undefined,
      policyKind: 'ConfigurationPolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }
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
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText(`You don't have any configuration policies.`)
    await waitForText('There are no search results for configuration policies.')
  })

  test('Should render empty policy warning page for CertificatePolicy', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: undefined,
      err: undefined,
      policyKind: 'CertificatePolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }
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
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Header
    await waitForText(`You don't have any certificate policies.`)
    await waitForText('There are no search results for certificate policies.')
  })

  test('Should render loading page', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: true,
      relatedResources: [],
      policyItems: undefined,
      err: { message: 'Error getting fetching data' } as ApolloError,
      policyKind: 'CertificatePolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }
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
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Loading')
    const err = screen.queryByText('Error getting fetching data')
    expect(err).not.toBeInTheDocument()
  })

  test('Should render labels column with user-defined labels', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: [
        {
          id: 'test-policy-with-labelsConfigurationPolicy',
          apigroup: 'policy.open-cluster-management.io',
          name: 'test-policy-with-labels',
          kind: 'ConfigurationPolicy',
          severity: 'low',
          responseAction: 'enforce',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'cluster1/test-uid-1',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster1',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label:
                'env=prod; team=backend; cluster-name=cluster1; policy.open-cluster-management.io/cluster-name=cluster1',
              name: 'test-policy-with-labels',
              namespace: 'cluster1',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
            {
              _hubClusterResource: true,
              _uid: 'cluster2/test-uid-2',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster2',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: 'env=staging; team=frontend',
              name: 'test-policy-with-labels',
              namespace: 'cluster2',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
          ],
          source: { type: 'Local', parentName: '', parentNs: '' },
        },
      ],
      err: undefined,
      policyKind: 'ConfigurationPolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }

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
              policyName: 'test-policy-with-labels',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels column header exists
    await waitForText('Labels')

    // Labels are rendered in non-compact mode (inline) to avoid duplicate popover IDs
    // First cluster has 2 user-defined labels (env, team) - system labels filtered out
    await waitForText('env=prod')
    await waitForText('team=backend')

    // Verify system labels are NOT shown
    const clusterNameLabel = screen.queryByText(/cluster-name=cluster1/)
    const policyFrameworkLabel = screen.queryByText(/policy\.open-cluster-management\.io/)
    expect(clusterNameLabel).not.toBeInTheDocument()
    expect(policyFrameworkLabel).not.toBeInTheDocument()

    // Second cluster also has 2 user-defined labels displayed inline
    await waitForText('env=staging')
    await waitForText('team=frontend')
  })

  test('Should handle policies with no labels gracefully', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: [
        {
          id: 'test-policy-no-labelsConfigurationPolicy',
          apigroup: 'policy.open-cluster-management.io',
          name: 'test-policy-no-labels',
          kind: 'ConfigurationPolicy',
          severity: 'low',
          responseAction: 'enforce',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'cluster1/test-uid-1',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster1',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              name: 'test-policy-no-labels',
              namespace: 'cluster1',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
          ],
          source: { type: 'Local', parentName: '', parentNs: '' },
        },
      ],
      err: undefined,
      policyKind: 'ConfigurationPolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }

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
              policyName: 'test-policy-no-labels',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels column header exists even with no labels
    await waitForText('Labels')

    // Verify cluster name appears
    await waitForText('cluster1')

    // Verify no crash occurred (page renders)
    await waitForText('Response action')
    await waitForText('enforce')

    // Verify that the labels cell shows '-' when there are no user-defined labels
    // The table should not show "N labels" text which would indicate AcmLabels is being rendered
    const labelsText = screen.queryByText(/\d+ labels?/)
    expect(labelsText).not.toBeInTheDocument()

    // The '-' should be present in the table as the labels cell value
    const dashCells = screen.getAllByText('-')
    // There should be at least one dash for the empty labels cell
    expect(dashCells.length).toBeGreaterThan(0)
  })

  test('Should have label filter option available and filter rows correctly', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: [
        {
          id: 'test-policy-filter-labelsConfigurationPolicy',
          apigroup: 'policy.open-cluster-management.io',
          name: 'test-policy-filter-labels',
          kind: 'ConfigurationPolicy',
          severity: 'low',
          responseAction: 'enforce',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'cluster-prod/test-uid-1',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster-prod',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: 'env=prod; team=backend',
              name: 'test-policy-filter-labels',
              namespace: 'cluster-prod',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
            {
              _hubClusterResource: true,
              _uid: 'cluster-dev/test-uid-2',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster-dev',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: 'env=dev; team=frontend',
              name: 'test-policy-filter-labels',
              namespace: 'cluster-dev',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
            {
              _hubClusterResource: true,
              _uid: 'cluster-staging/test-uid-3',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster-staging',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: 'env=staging; team=backend',
              name: 'test-policy-filter-labels',
              namespace: 'cluster-staging',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
          ],
          source: { type: 'Local', parentName: '', parentNs: '' },
        },
      ],
      err: undefined,
      policyKind: 'ConfigurationPolicy',
      apiGroup: 'policy.open-cluster-management.io',
    }

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
              policyName: 'test-policy-filter-labels',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify all clusters are visible initially
    await waitForText('cluster-prod')
    await waitForText('cluster-dev')
    await waitForText('cluster-staging')

    // Verify Labels column header exists in the table
    await waitForText('Labels')

    // Open filter panel
    await waitForText('Filter')
    screen.getByRole('button', { name: 'Filter' }).click()

    // Get the Label filter section
    const labelFilterHeading = screen.getByRole('heading', { name: 'Label' })
    expect(labelFilterHeading).toBeInTheDocument()
    const labelFilter = labelFilterHeading.parentElement!

    // Apply env=prod filter - should show only cluster-prod
    within(labelFilter).getByRole('checkbox', { name: 'env = prod 1' }).click()
    await waitForText('cluster-prod')
    await waitForNotText('cluster-dev')
    await waitForNotText('cluster-staging')

    // Clear env=prod filter
    within(labelFilter).getByRole('checkbox', { name: 'env = prod 1' }).click()

    // Apply team=backend filter - should show cluster-prod and cluster-staging
    within(labelFilter).getByRole('checkbox', { name: 'team = backend 2' }).click()
    await waitForText('cluster-prod')
    await waitForText('cluster-staging')
    await waitForNotText('cluster-dev')

    // Clear team=backend filter
    within(labelFilter).getByRole('checkbox', { name: 'team = backend 2' }).click()
    await waitForText('cluster-dev')
  })

  test('Should correctly filter with combined equality and inequality label filters', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: [
        {
          id: 'test-policy-filter-combined',
          apigroup: 'policy.open-cluster-management.io',
          name: 'test-policy-filter-combined',
          kind: 'ConfigurationPolicy',
          severity: 'low',
          responseAction: 'enforce',
          policies: [
            {
              _hubClusterResource: true,
              _uid: 'cluster1/test-uid-1',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster-prod-backend',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: 'env=prod; team=backend',
              name: 'test-policy',
              namespace: 'cluster1',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
            {
              _hubClusterResource: true,
              _uid: 'cluster2/test-uid-2',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster-prod-frontend',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: 'env=prod; team=frontend',
              name: 'test-policy',
              namespace: 'cluster2',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
            {
              _hubClusterResource: true,
              _uid: 'cluster3/test-uid-3',
              apigroup: 'policy.open-cluster-management.io',
              apiversion: 'v1',
              cluster: 'cluster-dev-backend',
              created: '2024-08-15T14:01:52Z',
              kind: 'ConfigurationPolicy',
              kind_plural: 'configurationpolicies',
              label: 'env=dev; team=backend',
              name: 'test-policy',
              namespace: 'cluster3',
              compliant: 'Compliant',
              responseAction: 'enforce',
              severity: 'low',
              disabled: false,
              _isExternal: true,
              source: { type: 'Local', parentName: '', parentNs: '' },
            },
          ],
        },
      ],
      policyKind: 'ConfigurationPolicy',
      apiGroup: 'policy.open-cluster-management.io',
      err: undefined,
    }

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
              policyName: 'test-policy-filter-combined',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // All three clusters should be visible initially
    await waitForText('cluster-prod-backend')
    await waitForText('cluster-prod-frontend')
    await waitForText('cluster-dev-backend')

    // Test the filter logic programmatically using the shared predicate
    const policies = context.policyItems![0].policies

    // Scenario 1: Filter with env=prod AND !team=backend
    // Should show cluster-prod-frontend only (has env=prod but NOT team=backend)
    const filter1 = ['env=prod', '!team=backend']
    const result1 = policies.filter((policy) => matchesSelectedLabels(filter1, policy))

    expect(result1.length).toBe(1)
    expect(result1[0].cluster).toBe('cluster-prod-frontend')

    // Scenario 2: Filter with only !team=backend
    // Should show cluster-prod-frontend (not cluster-prod-backend or cluster-dev-backend)
    const filter2 = ['!team=backend']
    const result2 = policies.filter((policy) => matchesSelectedLabels(filter2, policy))

    expect(result2.length).toBe(1)
    expect(result2[0].cluster).toBe('cluster-prod-frontend')
  })

  test('Should render DiscoveredByCluster for Kyverno Policy in multiple namespaces', async () => {
    const context: DiscoveredDetailsContext = {
      isFetching: false,
      relatedResources: [],
      policyItems: [
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
              totalViolations: 176,
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
          ],
          source: {
            type: 'Local',
            parentNs: '',
            parentName: '',
          },
        },
      ],
      err: undefined,
      policyKind: 'Policy',
      apiGroup: 'kyverno.io',
    }
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
              kind: 'Policy',
              policyName: 'require-team-label',
              apiGroup: 'kyverno.io',
              apiVersion: 'v1',
            }),
          ]}
        >
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path={NavigationPath.discoveredByCluster} element={<DiscoveredByCluster />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(screen.getByText('1 with violations')).toBeInTheDocument()

    // Note: Labels column is now included in the table
    expect(
      screen.getByRole('row', {
        name: /local-cluster open-cluster-management-agent-addon .* Audit Critical 176 Local/,
      })
    ).toBeInTheDocument()

    expect(
      screen.getByRole('row', {
        name: /local-cluster default .* Audit Critical No violations Local/,
      })
    ).toBeInTheDocument()
  })
})
