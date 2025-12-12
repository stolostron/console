/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, generatePath, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { policiesState } from '../../../../../atoms'
import {
  waitForText,
  clickByText,
  clickByLabel,
  getCSVExportSpies,
  getCSVDownloadLink,
} from '../../../../../lib/test-util'
import { Policy } from '../../../../../resources'
import { PolicyDetailsHistory } from './PolicyDetailsHistory'
import { mockPendingPolicy } from '../../../governance.sharedMocks'
import { NavigationPath } from '../../../../../NavigationPath'
import * as PolicyTemplateDetailsPage from './PolicyTemplateDetailsPage'

const rootPolicy: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'policy-set-with-1-placement-policy',
    namespace: 'test',
  },
  spec: {
    disabled: false,
    'policy-templates': [
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: { name: 'policy-set-with-1-placement-policy-1' },
          spec: {
            namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
            remediationAction: 'inform',
            severity: 'low',
          },
        },
      },
    ],
    remediationAction: 'inform',
  },
  status: {
    compliant: 'Compliant',
    placement: [
      {
        placement: 'policy-set-with-1-placement',
        placementBinding: 'policy-set-with-1-placement',
        policySet: 'policy-set-with-1-placement',
      },
    ],
    status: [{ clustername: 'local-cluster', clusternamespace: 'local-cluster', compliant: 'Compliant' }],
  },
}

const policy0: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'test.policy-set-with-1-placement-policy',
    namespace: 'local-cluster',
    labels: {
      'policy.open-cluster-management.io/cluster-name': 'local-cluster',
      'policy.open-cluster-management.io/cluster-namespace': 'local-cluster',
      'policy.open-cluster-management.io/root-policy': 'test.policy-set-with-1-placement-policy',
    },
  },
  spec: {
    disabled: false,
    'policy-templates': [
      {
        objectDefinition: {
          apiVersion: 'policy.open-cluster-management.io/v1',
          kind: 'ConfigurationPolicy',
          metadata: { name: 'policy-set-with-1-placement-policy-1' },
          spec: {
            namespaceSelector: { exclude: ['kube-*'], include: ['default'] },
            remediationAction: 'inform',
            severity: 'low',
          },
        },
      },
    ],
    remediationAction: 'inform',
  },
  status: {
    compliant: 'Compliant',
    details: [
      {
        compliant: 'Compliant',
        history: [
          {
            eventName: 'test.policy-set-with-1-placement-policy.16d459c516462fbf',
            lastTimestamp: '2022-02-16T19:07:46Z',
            message:
              'Compliant; notification - namespaces [test] found as specified, therefore this Object template is compliant',
          },
        ],
        templateMeta: { creationTimestamp: null, name: 'policy-set-with-1-placement-policy-1' },
      },
    ],
  },
}

export const mockPolicy: Policy[] = [rootPolicy, policy0]

// Mock template context for discovered policies
const mockTemplateDetailsContext = (template: any) => {
  jest.spyOn(PolicyTemplateDetailsPage, 'useTemplateDetailsContext').mockReturnValue({
    clusterName: 'local-cluster',
    template,
    templateLoading: false,
    handleAuditViolation: jest.fn(),
  })
}

// Mock templates for discovered policies
const mockConfigurationPolicyTemplate = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'ConfigurationPolicy',
  metadata: {
    name: 'config-policy-test',
    namespace: 'local-cluster',
  },
  status: {
    compliant: 'NonCompliant',
    history: [
      {
        lastTimestamp: '2024-01-15T10:30:00Z',
        message: 'NonCompliant; configmaps [test-configmap] not found in namespace default',
      },
      {
        lastTimestamp: '2024-01-15T10:25:00Z',
        message: 'Compliant; configmaps [test-configmap] found as specified',
      },
    ],
  },
}

const mockOperatorPolicyTemplate = {
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  kind: 'OperatorPolicy',
  metadata: {
    name: 'operator-policy-test',
    namespace: 'local-cluster',
  },
  status: {
    compliant: 'Compliant',
    history: [
      {
        lastTimestamp: '2024-01-16T14:00:00Z',
        message: 'Compliant; the operator is installed and running',
      },
    ],
  },
}

const mockCertificatePolicyTemplate = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'CertificatePolicy',
  metadata: {
    name: 'cert-policy-test',
    namespace: 'local-cluster',
  },
  status: {
    compliant: 'Pending',
    history: [
      {
        lastTimestamp: '2024-01-17T09:15:00Z',
        message: 'Pending; waiting for certificate to be issued',
      },
    ],
  },
}

describe('Policy Details History content', () => {
  beforeEach(() => {
    // Mock the context with undefined template for parent policy tests
    // (parent policies use policiesState, not template from context)
    mockTemplateDetailsContext(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('Should render Policy Details History Page content correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.policyDetailsHistory, {
              namespace: 'test',
              name: 'policy-set-with-1-placement-policy',
              clusterName: 'local-cluster',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
              kind: 'Policy',
              templateName: 'policy-set-with-1-placement-policy-1',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.policyDetailsHistory} element={<PolicyDetailsHistory />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait template name load
    await waitForText('Template: policy-set-with-1-placement-policy-1')

    // wait for template table load
    await waitForText('No violations')
    await waitForText(
      'notification - namespaces [test] found as specified, therefore this Object template is compliant'
    )
  })

  test('Should render Policy Details History Page content correctly for pending policies', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPendingPolicy)
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.policyDetailsHistory, {
              namespace: 'test',
              name: 'policy-set-with-1-placement-policy',
              clusterName: 'local-cluster',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
              kind: 'Policy',
              templateName: 'policy-set-with-1-placement-policy-1',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.policyDetailsHistory} element={<PolicyDetailsHistory />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait template name load
    await waitForText('Template: policy-set-with-1-placement-policy-1')

    // wait for template table load
    await waitForText('Pending')
    await waitForText(
      'template-error; Dependencies were not satisfied: 1 dependencies are still pending (Policy default.policy-pod)'
    )
  })

  test('Should render history for discovered ConfigurationPolicy', async () => {
    mockTemplateDetailsContext(mockConfigurationPolicyTemplate)

    render(
      <RecoilRoot>
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredPolicyDetailsHistory, {
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
              kind: 'ConfigurationPolicy',
              templateName: 'config-policy-test',
              templateNamespace: 'local-cluster',
              clusterName: 'local-cluster',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredPolicyDetailsHistory} element={<PolicyDetailsHistory />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait template name load
    await waitForText('Template: config-policy-test')

    // wait for history entries - check for message content (avoids collision with column header "Violations")
    await waitForText('configmaps [test-configmap] not found in namespace default')
    await waitForText('configmaps [test-configmap] found as specified')
  })

  test('Should render history for discovered OperatorPolicy', async () => {
    mockTemplateDetailsContext(mockOperatorPolicyTemplate)

    render(
      <RecoilRoot>
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredPolicyDetailsHistory, {
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1beta1',
              kind: 'OperatorPolicy',
              templateName: 'operator-policy-test',
              templateNamespace: 'local-cluster',
              clusterName: 'local-cluster',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredPolicyDetailsHistory} element={<PolicyDetailsHistory />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait template name load
    await waitForText('Template: operator-policy-test')

    // wait for history entries
    await waitForText('No violations')
    await waitForText('the operator is installed and running')
  })

  test('Should render history for discovered CertificatePolicy', async () => {
    mockTemplateDetailsContext(mockCertificatePolicyTemplate)

    render(
      <RecoilRoot>
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredPolicyDetailsHistory, {
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1beta1',
              kind: 'CertificatePolicy',
              templateName: 'cert-policy-test',
              templateNamespace: 'local-cluster',
              clusterName: 'local-cluster',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredPolicyDetailsHistory} element={<PolicyDetailsHistory />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait template name load
    await waitForText('Template: cert-policy-test')

    // wait for history entries
    await waitForText('Pending')
    await waitForText('waiting for certificate to be issued')
  })

  test('Should render empty state when discovered policy has no history', async () => {
    const templateWithNoHistory = {
      ...mockConfigurationPolicyTemplate,
      status: {
        compliant: 'Compliant',
        history: [],
      },
    }
    mockTemplateDetailsContext(templateWithNoHistory)

    render(
      <RecoilRoot>
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.discoveredPolicyDetailsHistory, {
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
              kind: 'ConfigurationPolicy',
              templateName: 'config-policy-test',
              templateNamespace: 'local-cluster',
              clusterName: 'local-cluster',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.discoveredPolicyDetailsHistory} element={<PolicyDetailsHistory />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait template name load
    await waitForText('Template: config-policy-test')

    // should show empty state
    await waitForText('No history')
    await waitForText('There is no history for the policy template on this cluster.')
  })
})

describe('Export from policy details history table', () => {
  beforeEach(() => {
    mockTemplateDetailsContext(undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('export button should produce a file for download', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.policyDetailsHistory, {
              namespace: 'test',
              name: 'policy-set-with-1-placement-policy',
              clusterName: 'local-cluster',
              apiGroup: 'policy.open-cluster-management.io',
              apiVersion: 'v1',
              kind: 'Policy',
              templateName: 'policy-set-with-1-placement-policy-1',
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.policyDetailsHistory} element={<PolicyDetailsHistory />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait template name load
    await waitForText('Template: policy-set-with-1-placement-policy-1')

    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()

    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    await clickByLabel('export-search-result')
    await clickByText('Export all to CSV')

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Violations,Message,Last report\n' +
          '"No violations","notification - namespaces [test] found as specified, therefore this Object template is compliant","2022-02-16T19:07:46.000Z"',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(
      /^policy-set-with-1-placement-policy-test-local-cluster-policy-set-with-1-placement-policy-1-[\d]+\.csv$/
    )
  })
})
