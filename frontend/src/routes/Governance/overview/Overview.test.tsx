/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { managedClustersState, policiesState } from '../../../atoms'
import { nockIgnoreApiPaths, nockPostRequest } from '../../../lib/nock-util'
import { waitForNock } from '../../../lib/test-util'
import {
  mockEmptyPolicy,
  mockManagedClusters,
  mockMultiManagedClusters,
  mockMultiPolicy,
  mockPendingPolicy,
  mockPolicy,
  mockPolicyNoStatus,
} from '../governance.sharedMocks'
import GovernanceOverview, { SecurityGroupViolations } from './Overview'
import { SecurityGroupPolicySummarySidebar } from './SecurityGroupPolicySummarySidebar'
import userEvent from '@testing-library/user-event'
import { defaultContext, PluginDataContext } from '../../../lib/PluginDataContext'
import { Policy, PolicyApiVersion, PolicyKind } from '../../../resources'

describe('Overview Page', () => {
  beforeEach(async () => nockIgnoreApiPaths())
  test('Should render empty Overview page with create policy button correctly', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    const { queryAllByText } = await render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, mockEmptyPolicy)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    await waitForNock(metricNock)
    expect(queryAllByText('Create policy').length).toBe(1)
  })

  test('Should render empty Overview page with manage policies button correctly', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    const { queryAllByText } = await render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, [mockPolicyNoStatus])
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )
    await waitForNock(metricNock)
    expect(queryAllByText('Manage policies').length).toBe(2)
  })

  test('Should render Overview page correctly', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, mockPolicy)
            snapshot.set(managedClustersState, mockManagedClusters)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    await waitForNock(metricNock)
    expect(screen.getByText(/[1-9]+ with no violations/i)).toBeTruthy()
  })

  test('Should render Overview page correctly with pending policies', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, mockPendingPolicy)
            snapshot.set(managedClustersState, mockManagedClusters)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    await waitForNock(metricNock)
    expect(screen.getByText(/[1-9]+ pending/i)).toBeTruthy()
  })

  test('Should render Overview page with lots of clusters', async () => {
    const metricNock = nockPostRequest('/metrics?governance', {})
    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    const { queryByText } = render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, mockMultiPolicy)
            snapshot.set(managedClustersState, mockMultiManagedClusters)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    await waitForNock(metricNock)
    userEvent.click(screen.getByText(/show 2 more/i))

    expect(queryByText(/show 2 more/i)).not.toBeInTheDocument()
    userEvent.click(screen.getByText(/show 4 more/i))
    expect(queryByText(/show 4 more/i)).not.toBeInTheDocument()
    userEvent.click(screen.getByText(/show 85 more/i))
    expect(queryByText(/show 85 more/i)).not.toBeInTheDocument()
  })

  test('Should aggregate Standards card by trimmed annotation value, not raw comma-split token', async () => {
    // Regression test: a standard listed anywhere but first in a comma-separated
    // policy.open-cluster-management.io/standards annotation must not produce a
    // separate row on the Standards card just because of the leading space left
    // behind by String.split(',').
    const policyWithStandardFirstInList: Policy = {
      apiVersion: PolicyApiVersion,
      kind: PolicyKind,
      metadata: {
        name: 'policy-standards-first',
        namespace: 'test',
        uid: 'standards-test-uid-1',
        annotations: {
          'policy.open-cluster-management.io/standards': 'NIST SP 800-53, PCI-DSS 4.0',
        },
      },
      spec: {
        disabled: false,
        'policy-templates': [],
        remediationAction: 'inform',
      },
      status: {
        compliant: 'Compliant',
      },
    }
    const policyWithStandardLastInList: Policy = {
      apiVersion: PolicyApiVersion,
      kind: PolicyKind,
      metadata: {
        name: 'policy-standards-last',
        namespace: 'test',
        uid: 'standards-test-uid-2',
        annotations: {
          'policy.open-cluster-management.io/standards': 'CIS OpenShift Benchmark, PCI-DSS 4.0, NIST SP 800-53',
        },
      },
      spec: {
        disabled: false,
        'policy-templates': [],
        remediationAction: 'inform',
      },
      status: {
        compliant: 'Compliant',
      },
    }

    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, [policyWithStandardFirstInList, policyWithStandardLastInList])
            snapshot.set(managedClustersState, mockManagedClusters)
          }}
        >
          <MemoryRouter>
            <GovernanceOverview />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    // Before the fix this rendered two separate rows/spans for the same logical
    // standard (one from the untrimmed " NIST SP 800-53" split token).
    expect(screen.getAllByText('NIST SP 800-53').length).toBe(1)
    expect(screen.getAllByText('PCI-DSS 4.0').length).toBe(1)
  })

  test('SecurityGroupPolicySummarySidebar should match policies by trimmed annotation value', async () => {
    // Regression test for the sidebar drill-down: a policy whose standard is not
    // the first item in its comma-separated annotation must still match the
    // clicked-on violation, which is keyed by the trimmed value.
    const policyWithStandardLastInList: Policy = {
      apiVersion: PolicyApiVersion,
      kind: PolicyKind,
      metadata: {
        name: 'policy-standards-last-sidebar',
        namespace: 'test',
        uid: 'standards-test-uid-3',
        annotations: {
          'policy.open-cluster-management.io/standards': 'CIS OpenShift Benchmark, PCI-DSS 4.0, NIST SP 800-53',
        },
      },
      spec: {
        disabled: false,
        'policy-templates': [],
        remediationAction: 'inform',
      },
      status: {
        compliant: 'Compliant',
      },
    }
    const violation: SecurityGroupViolations = {
      name: 'NIST SP 800-53',
      compliant: 1,
      noncompliant: 0,
      pending: 0,
    }

    const pluginData = {
      ...defaultContext,
      loadStarted: true,
      loadCompleted: true,
    }
    render(
      <PluginDataContext.Provider value={pluginData}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(policiesState, [policyWithStandardLastInList])
          }}
        >
          <MemoryRouter>
            <SecurityGroupPolicySummarySidebar violation={violation} secGroupName="standards" compliance="compliant" />
          </MemoryRouter>
        </RecoilRoot>
      </PluginDataContext.Provider>
    )

    // Before the fix, the sidebar's filter compared the untrimmed " NIST SP 800-53"
    // split token against violation.name ("NIST SP 800-53") and never matched,
    // so the policy would not appear in this list.
    expect(await screen.findByText('policy-standards-last-sidebar')).toBeInTheDocument()
  })
})
