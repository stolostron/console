/* Copyright Contributors to the Open Cluster Management project */

import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { policyreportState } from '../../../../../atoms'
import { nockSearch } from '../../../../../lib/nock-util'
import { PluginContext } from '../../../../../lib/PluginContext'
import { PluginDataContext } from '../../../../../lib/PluginDataContext'
import { clickByText, waitForNotText, waitForText } from '../../../../../lib/test-util'
import { Cluster, ClusterStatus, PolicyReport } from '../../../../../resources'
import {
  mockSearchQueryArgoApps,
  mockSearchQueryOCPApplications,
  mockSearchResponseArgoApps1,
  mockSearchResponseOCPApplications,
} from '../../../../Applications/Application.sharedmocks'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { StatusSummaryCount } from './StatusSummaryCount'

const push = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // use actual for all non-hook parts
  useHistory: () => ({
    push,
  }),
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

const mockSearchQuery = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'compliant', values: ['!Compliant'] },
          { property: 'kind', values: ['Policy'] },
          { property: 'namespace', values: ['test-cluster'] },
          { property: 'cluster', values: ['local-cluster'] },
        ],
      },
    ],
  },
  query:
    'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n    related {\n      kind\n      count\n      __typename\n    }\n    __typename\n  }\n}\n',
}

const mockSearchResponse = {
  data: {
    searchResult: [
      {
        count: 1,
        related: [
          { kind: 'Cluster', count: 1, __typename: 'SearchRelatedResult' },
          { kind: 'ConfigurationPolicy', count: 1, __typename: 'SearchRelatedResult' },
          { kind: 'Policy', count: 1, __typename: 'SearchRelatedResult' },
        ],
        __typename: 'SearchResult',
      },
    ],
  },
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

describe('StatusSummaryCount', () => {
  beforeEach(() => {
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps1)
  })

  const Component = () => (
    <RecoilRoot initializeState={(snapshot) => snapshot.set(policyreportState, mockPolicyReports)}>
      <MemoryRouter>
        <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
          <StatusSummaryCount />
        </ClusterContext.Provider>
      </MemoryRouter>
    </RecoilRoot>
  )
  test('renders', async () => {
    render(<Component />)
    await act(async () => {
      await waitFor(() => expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0))
      await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
      await waitFor(() => expect(screen.getByTestId('summary-status')).toBeInTheDocument())

      // click Application
      await clickByText('1', 0)
      expect(push).toHaveBeenCalledTimes(1)
      expect(push.mock.calls[0][0]).toBe('/multicloud/applications?cluster=test-cluster')

      // click Policy violations
      await clickByText('1', 1)
      expect(push).toHaveBeenCalledTimes(2)
      expect(push.mock.calls[1][0]).toBe(
        '/multicloud/home/search?filters={"textsearch":"cluster:local-cluster%20kind:Policy%20namespace:test-cluster%20compliant:!Compliant"}'
      )

      await clickByText('Go to Policies')
      expect(push).toHaveBeenCalledTimes(3)
      expect(push.mock.calls[2][0]).toBe('/multicloud/governance/policies')

      await clickByText('6')

      await waitForText('Identified issues')
      await waitForText('0 Critical, 1 Important, 0 Moderate, 1 Low')
    })
  })
  test('renders without search', async () => {
    const search = nockSearch(mockSearchQuery, mockSearchResponse)
    render(
      <PluginContext.Provider value={{ isSearchAvailable: false, dataContext: PluginDataContext }}>
        <Component />
      </PluginContext.Provider>
    )
    await act(async () => {
      await waitFor(() => expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0))
      await waitFor(() => expect(search.isDone()).toBeTruthy())
      await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
      await waitFor(() => expect(screen.getByTestId('summary-status')).toBeInTheDocument())

      await waitForNotText('Go to Policies')

      await clickByText('6')

      await waitForText('Identified issues')
      await waitForText('0 Critical, 1 Important, 0 Moderate, 1 Low')
    })
  })
  test('renders without applications and governance', async () => {
    const search = nockSearch(mockSearchQuery, mockSearchResponse)
    render(
      <PluginContext.Provider
        value={{ isApplicationsAvailable: false, isGovernanceAvailable: false, dataContext: PluginDataContext }}
      >
        <Component />
      </PluginContext.Provider>
    )
    await act(async () => {
      await waitFor(() => expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0))
      await waitFor(() => expect(search.isDone()).toBeTruthy())
      await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
      await waitFor(() => expect(screen.getByTestId('summary-status')).toBeInTheDocument())

      await waitForNotText('Applications')

      await waitForNotText('Go to Policies')

      await clickByText('6')

      await waitForText('Identified issues')
      await waitForText('0 Critical, 1 Important, 0 Moderate, 1 Low')
    })
  })
})
