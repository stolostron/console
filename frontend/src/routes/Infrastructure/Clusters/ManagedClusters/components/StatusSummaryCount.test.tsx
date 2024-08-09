/* Copyright Contributors to the Open Cluster Management project */

import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { policiesState, policyreportState } from '../../../../../atoms'
import { nockSearch } from '../../../../../lib/nock-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { PluginDataContext } from '../../../../../lib/PluginDataContext'
import { clickByText, waitForNotText, waitForText, ocpApi } from '../../../../../lib/test-util'
import { Cluster, ClusterStatus, Policy, PolicyReport } from '../../../../../resources'
import {
  mockSearchQueryArgoAppsStatusSummary,
  mockSearchQueryArgoAppsCount,
  mockSearchQueryArgoAppsStatusSummaryFilteredCount,
  mockSearchQueryOCPApplicationsStatusSummary,
  mockSearchQueryOCPApplicationsCount,
  mockSearchQueryOCPApplicationsStatusSummaryFilteredCount,
  mockSearchResponseArgoApps1,
  mockSearchResponseArgoAppsCount1,
  mockSearchResponseOCPApplications,
  mockSearchResponseOCPApplicationsCount,
} from '../../../../Applications/Application.sharedmocks'
import { StatusSummaryCount } from './StatusSummaryCount'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClusterDetailsContext } from '../ClusterDetails/ClusterDetails'

const queryClient = new QueryClient()

const push = jest.fn()
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'), // use actual for all non-hook parts
  useNavigate: () => push,
}))

const mockCluster: Cluster = {
  name: 'test-cluster',
  displayName: 'test-cluster',
  namespace: 'test-cluster',
  uid: 'test-cluster-uid',
  status: ClusterStatus.ready,
  distribution: {
    k8sVersion: '1.19',
    ocp: undefined,
    displayVersion: '1.19',
    isManagedOpenShift: false,
  },
  labels: undefined,
  nodes: {
    nodeList: [
      {
        capacity: { cpu: '4', memory: '16416940Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 'm4.xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
          'node-role.kubernetes.io/master': '',
          'node.kubernetes.io/instance-type': 'm4.xlarge',
        },
        name: 'ip-10-0-137-106.ec2.internal',
      },
      {
        capacity: { cpu: '8', memory: '32932196Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 'm4.2xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 'm4.2xlarge',
        },
        name: 'ip-10-0-138-153.ec2.internal',
      },
      {
        capacity: { cpu: '8', memory: '32931992Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 'm4.2xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 'm4.2xlarge',
        },
        name: 'ip-10-0-153-194.ec2.internal',
      },
      {
        capacity: { cpu: '4', memory: '16416932Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 'm4.xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
          'node-role.kubernetes.io/master': '',
          'node.kubernetes.io/instance-type': 'm4.xlarge',
        },
        name: 'ip-10-0-158-2.ec2.internal',
      },
      {
        capacity: { cpu: '8', memory: '32931984Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 'm4.2xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 'm4.2xlarge',
        },
        name: 'ip-10-0-160-159.ec2.internal',
      },
      {
        capacity: { cpu: '4', memory: '16416932Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 'm4.xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
          'node-role.kubernetes.io/master': '',
          'node.kubernetes.io/instance-type': 'm4.xlarge',
        },
        name: 'ip-10-0-170-150.ec2.internal',
      },
    ],
    ready: 6,
    unhealthy: 0,
    unknown: 0,
  },
  kubeApiServer: '',
  consoleURL: '',
  hasAutomationTemplate: false,
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    secrets: {
      installConfig: '',
    },
  },
  isHive: false,
  isManaged: true,
  isCurator: false,
  isHostedCluster: false,
  isSNOCluster: false,
  owner: {},
  kubeconfig: '',
  kubeadmin: '',
  isHypershift: false,
  isRegionalHubCluster: false,
}

const mockPolicyReports: PolicyReport[] = [
  {
    apiVersion: 'wgpolicyk8s.io/v1alpha2',
    kind: 'PolicyReport',
    metadata: {
      name: 'test-cluster',
      namespace: 'test-cluster',
      uid: 'uid.report.risk.1',
    },
    results: [
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'insights',
        properties: {
          created_at: '2021-03-02T21:26:04Z',
          total_risk: '1',
          component: 'rule.id.3',
        },
        message: 'policyreport testing risk 1',
        policy: 'policyreport testing risk 1 policy',
        result: 'policyreport testing risk 1 result',
      },
      {
        category: 'category,category1,category2',
        scored: false,
        source: 'insights',
        properties: {
          created_at: '2021-04-02T21:26:04Z',
          total_risk: '3',
          component: 'rule.id.3',
        },
        message: 'policyreport testing risk 3',
        policy: 'policyreport testing risk 3 policy',
        result: 'policyreport testing risk 3 result',
      },
    ],
  },
]

const mockPolicies: Policy[] = [
  {
    apiVersion: 'policy.open-cluster-management.io/v1',
    kind: 'Policy',
    metadata: {
      annotations: {
        'policy.open-cluster-management.io/categories': 'AC Access Control',
        'policy.open-cluster-management.io/controls': 'AC-3 Access Enforcement',
        'policy.open-cluster-management.io/standards': 'NIST SP 800-53',
      },
      creationTimestamp: '2023-04-10T17:55:02Z',
      name: 'policy-role',
      namespace: 'default',
      resourceVersion: '2122237',
      uid: '484f1ab1-ff2f-476c-9e63-7061af81a229',
    },
    spec: {
      disabled: false,
      'policy-templates': [
        {
          objectDefinition: {
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'ConfigurationPolicy',
            metadata: {
              name: 'policy-role-example',
            },
            spec: {
              namespaceSelector: {
                include: ['default'],
              },
              'object-templates': [
                {
                  complianceType: 'mustonlyhave',
                  objectDefinition: {
                    apiVersion: 'rbac.authorization.k8s.io/v1',
                    kind: 'Role',
                    metadata: {
                      name: 'sample-role',
                    },
                    rules: [
                      {
                        apiGroups: ['extensions', 'apps'],
                        resources: ['deployments'],
                        verbs: ['get', 'list', 'watch', 'delete', 'patch'],
                      },
                    ],
                  },
                },
              ],
              remediationAction: 'inform',
              severity: 'high',
            },
          },
        },
      ],
      remediationAction: 'inform',
    },
    status: {
      compliant: 'NonCompliant',
      placement: [
        {
          placementBinding: 'binding-policy-role',
          placementRule: 'placement-policy-role',
        },
      ],
      status: [
        {
          clustername: 'test-cluster',
          clusternamespace: 'test-cluster',
          compliant: 'NonCompliant',
        },
      ],
    },
  },
]

describe('StatusSummaryCount', () => {
  beforeEach(() => {
    nockSearch(mockSearchQueryOCPApplicationsStatusSummary, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsStatusSummaryFilteredCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsStatusSummary, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsStatusSummaryFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount1)
  })

  const Component = () => {
    const context: Partial<ClusterDetailsContext> = { cluster: mockCluster }
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicies)
          snapshot.set(policyreportState, mockPolicyReports)
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<StatusSummaryCount />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  }
  test('renders', async () => {
    render(<Component />)
    await act(async () => {
      await waitFor(() => expect(screen.getByTestId('summary-status')).toBeInTheDocument())

      // This wait pauses till summary data has been parsed
      await waitFor(() => expect(screen.getAllByText('1')).toHaveLength(2))

      // click Application
      await clickByText('1', 0)
      expect(push).toHaveBeenCalledTimes(1)
      expect(push.mock.calls[0][0]).toBe('/multicloud/applications?cluster=test-cluster')

      // click Policy violations
      await clickByText('1', 1)
      expect(push).toHaveBeenCalledTimes(2)
      expect(push.mock.calls[1][0]).toBe('/multicloud/governance/policies?violations=violations')

      await clickByText('6')

      await waitForText('Identified issues')
      await waitForText('0 Critical, 1 Important, 0 Moderate, 1 Low')
    })
  })
  test('renders without applications and governance', async () => {
    render(
      <PluginContext.Provider
        value={{ isApplicationsAvailable: false, isGovernanceAvailable: false, dataContext: PluginDataContext, ocpApi }}
      >
        <Component />
      </PluginContext.Provider>
    )
    await act(async () => {
      await waitFor(() => expect(screen.getByTestId('summary-status')).toBeInTheDocument())

      await waitForNotText('Applications')

      await waitForNotText('Policy violations')

      await clickByText('6')

      await waitForText('Identified issues')
      await waitForText('0 Critical, 1 Important, 0 Moderate, 1 Low')
    })
  })
})
