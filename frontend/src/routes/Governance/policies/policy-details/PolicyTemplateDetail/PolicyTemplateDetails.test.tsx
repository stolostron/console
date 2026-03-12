/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { PolicyTemplateDetails } from './PolicyTemplateDetails'
import { TemplateDetailsContext } from './PolicyTemplateDetailsPage'
import { waitForText } from '../../../../../lib/test-util'

// Mock the search SDK hooks
jest.mock('../../../../Search/search-sdk/search-sdk', () => ({
  useSearchResultItemsLazyQuery: jest.fn(() => [
    jest.fn(), // The lazy query function
    { loading: false, error: undefined, data: undefined }, // Query result
  ]),
  useSearchResultRelatedItemsLazyQuery: jest.fn(() => [
    jest.fn(),
    { loading: false, error: undefined, data: undefined },
  ]),
}))

describe('PolicyTemplateDetails - Labels', () => {
  const mockHandleAuditViolation = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('Should display labels field when template has user-defined labels', async () => {
    const mockTemplate = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'ConfigurationPolicy',
      metadata: {
        name: 'test-policy',
        namespace: 'test-namespace',
        labels: {
          env: 'prod',
          team: 'backend',
          app: 'myapp',
          // System labels that should be filtered
          'cluster-name': 'local-cluster',
          'cluster-namespace': 'test-namespace',
          'policy.open-cluster-management.io/cluster-name': 'local-cluster',
        },
      },
      spec: {},
    }

    const context: TemplateDetailsContext = {
      clusterName: 'test-cluster',
      template: mockTemplate,
      templateLoading: false,
      handleAuditViolation: mockHandleAuditViolation,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="/" element={<PolicyTemplateDetails />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels field header
    await waitForText('Labels')

    // Verify user-defined labels are displayed
    await waitForText('env=prod')
    await waitForText('team=backend')
    await waitForText('app=myapp')

    // Verify system labels are NOT displayed
    const clusterNameLabel = screen.queryByText('cluster-name=local-cluster')
    const clusterNamespaceLabel = screen.queryByText('cluster-namespace=test-namespace')
    const policyFrameworkLabel = screen.queryByText(/policy\.open-cluster-management\.io/)

    expect(clusterNameLabel).not.toBeInTheDocument()
    expect(clusterNamespaceLabel).not.toBeInTheDocument()
    expect(policyFrameworkLabel).not.toBeInTheDocument()
  })

  test('Should display labels field with dash when template has no user-defined labels', async () => {
    const mockTemplate = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'ConfigurationPolicy',
      metadata: {
        name: 'test-policy',
        namespace: 'test-namespace',
        // No labels at all
      },
      spec: {},
    }

    const context: TemplateDetailsContext = {
      clusterName: 'test-cluster',
      template: mockTemplate,
      templateLoading: false,
      handleAuditViolation: mockHandleAuditViolation,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="/" element={<PolicyTemplateDetails />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels field is present
    await waitForText('Labels')

    // Verify it shows a dash since there are no user-defined labels
    const descriptionList = screen.getByText('Labels').closest('dl')
    expect(descriptionList).toHaveTextContent('-')
  })

  test('Should display labels field with dash when template has only system labels', async () => {
    const mockTemplate = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'ConfigurationPolicy',
      metadata: {
        name: 'test-policy',
        namespace: 'test-namespace',
        labels: {
          // Only system labels
          'cluster-name': 'local-cluster',
          'cluster-namespace': 'test-namespace',
          'policy.open-cluster-management.io/cluster-name': 'local-cluster',
          'policy.open-cluster-management.io/cluster-namespace': 'test-namespace',
        },
      },
      spec: {},
    }

    const context: TemplateDetailsContext = {
      clusterName: 'test-cluster',
      template: mockTemplate,
      templateLoading: false,
      handleAuditViolation: mockHandleAuditViolation,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="/" element={<PolicyTemplateDetails />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels field is present
    await waitForText('Labels')

    // Verify it shows a dash since all labels were filtered out
    const descriptionList = screen.getByText('Labels').closest('dl')
    expect(descriptionList).toHaveTextContent('-')
  })

  test('Should handle template with mixed user and system labels', async () => {
    const mockTemplate = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'ConfigurationPolicy',
      metadata: {
        name: 'test-policy',
        namespace: 'test-namespace',
        labels: {
          // User-defined labels
          environment: 'production',
          tier: 'frontend',
          // System labels (should be filtered)
          'cluster-name': 'local-cluster',
          'policy.open-cluster-management.io/severity': 'high',
        },
      },
      spec: {},
    }

    const context: TemplateDetailsContext = {
      clusterName: 'test-cluster',
      template: mockTemplate,
      templateLoading: false,
      handleAuditViolation: mockHandleAuditViolation,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="/" element={<PolicyTemplateDetails />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels field exists
    await waitForText('Labels')

    // Verify only user-defined labels are shown
    await waitForText('environment=production')
    await waitForText('tier=frontend')

    // Verify system labels are NOT shown
    const clusterNameLabel = screen.queryByText('cluster-name=local-cluster')
    const severityLabel = screen.queryByText(/policy\.open-cluster-management\.io/)
    expect(clusterNameLabel).not.toBeInTheDocument()
    expect(severityLabel).not.toBeInTheDocument()
  })

  test('Should handle Kubernetes-style labels with dots and slashes', async () => {
    const mockTemplate = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'ConfigurationPolicy',
      metadata: {
        name: 'test-policy',
        namespace: 'test-namespace',
        labels: {
          'app.kubernetes.io/name': 'my-app',
          'app.kubernetes.io/version': '1.0.0',
          'app.kubernetes.io/component': 'backend',
        },
      },
      spec: {},
    }

    const context: TemplateDetailsContext = {
      clusterName: 'test-cluster',
      template: mockTemplate,
      templateLoading: false,
      handleAuditViolation: mockHandleAuditViolation,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="/" element={<PolicyTemplateDetails />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels field exists
    await waitForText('Labels')

    // Verify Kubernetes-style labels are displayed correctly
    await waitForText('app.kubernetes.io/name=my-app')
    await waitForText('app.kubernetes.io/version=1.0.0')
    await waitForText('app.kubernetes.io/component=backend')
  })

  test('Should not crash when template is undefined', async () => {
    const context: TemplateDetailsContext = {
      clusterName: 'test-cluster',
      template: undefined,
      templateLoading: false,
      handleAuditViolation: mockHandleAuditViolation,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="/" element={<PolicyTemplateDetails />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Should render without crashing
    // Basic fields should still appear
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    // Labels field should be present even when template is undefined
    await waitForText('Labels')

    // Should show a dash since template is undefined
    const descriptionList = screen.getByText('Labels').closest('dl')
    expect(descriptionList).toHaveTextContent('-')
  })

  test('Should display labels for Gatekeeper constraint', async () => {
    const mockTemplate = {
      apiVersion: 'constraints.gatekeeper.sh/v1beta1',
      kind: 'K8sRequiredLabels',
      metadata: {
        name: 'ns-must-have-labels',
        labels: {
          severity: 'high',
          owner: 'platform-team',
        },
      },
      spec: {
        match: {
          kinds: [
            {
              apiGroups: [''],
              kinds: ['Namespace'],
            },
          ],
        },
      },
    }

    const context: TemplateDetailsContext = {
      clusterName: 'test-cluster',
      template: mockTemplate,
      templateLoading: false,
      handleAuditViolation: mockHandleAuditViolation,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="/" element={<PolicyTemplateDetails />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels field exists
    await waitForText('Labels')

    // Verify labels are displayed
    await waitForText('severity=high')
    await waitForText('owner=platform-team')
  })

  test('Should display labels for Kyverno policy', async () => {
    const mockTemplate = {
      apiVersion: 'kyverno.io/v1',
      kind: 'ClusterPolicy',
      metadata: {
        name: 'require-labels',
        labels: {
          'kyverno.io/policy-category': 'Best Practices',
          team: 'security',
        },
      },
      spec: {
        validationFailureAction: 'Audit',
        background: true,
        rules: [],
      },
    }

    const context: TemplateDetailsContext = {
      clusterName: 'test-cluster',
      template: mockTemplate,
      templateLoading: false,
      handleAuditViolation: mockHandleAuditViolation,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="/" element={<PolicyTemplateDetails />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // Verify Labels field exists
    await waitForText('Labels')

    // Verify labels are displayed
    await waitForText('kyverno.io/policy-category=Best Practices')
    await waitForText('team=security')
  })
})
