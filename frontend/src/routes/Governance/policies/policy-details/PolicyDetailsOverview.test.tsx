/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  placementBindingsState,
  placementDecisionsState,
  placementRulesState,
  placementsState,
  policiesState,
  policySetsState,
  settingsState,
} from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText } from '../../../../lib/test-util'
import PolicyDetailsOverview from './PolicyDetailsOverview'

import {
  mockPolicy,
  mockPlacementBindings,
  mockPlacementDecision,
  mockPlacements,
  mockPolicySets,
  mockPendingPolicy,
  policy2,
  policy3,
} from '../../governance.sharedMocks'
import { REMEDIATION_ACTION, Policy } from '../../../../resources'
import { PolicyDetailsContext } from './PolicyDetailsPage'

jest.mock('../../useGovernanceData', () => ({
  useGovernanceData: jest.fn().mockReturnValue({
    clusterRisks: {
      critical: 0,
      high: 0,
      medium: 0,
      low: 1,
      unknown: 0,
      synced: 0,
    },
  }),
}))

describe('Policy Details Results', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should render Policy Details Results Page content correctly', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(policiesState, [mockPolicy[1]])
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // verify decsription card items
    await waitForText('test')
    await waitForText('Enabled')
    await waitForText('inform')

    // verify placement field
    await waitForText('policy-set-with-1-placement')
    // verify cluster violations field with new format
    await waitForText(/No violations on \d+ cluster/)
  })

  test.each([
    [[policy2, policy2], REMEDIATION_ACTION.ENFORCE_OVERRIDDEN],
    [[policy2, policy3], REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN],
    [[policy3, policy2], REMEDIATION_ACTION.INFORM_ENFORCE_OVERRIDDEN],
    [[policy3, policy3], REMEDIATION_ACTION.INFORM],
  ])(
    'Should render Policy Details Results Page correctly for policy override',
    async (propagatedPolicies, expected) => {
      const context: PolicyDetailsContext = { policy: mockPolicy[0] }
      render(
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(placementsState, mockPlacements)
            snapshot.set(policySetsState, [mockPolicySets[0]])
            snapshot.set(placementBindingsState, mockPlacementBindings)
            snapshot.set(placementDecisionsState, mockPlacementDecision)
            snapshot.set(policiesState, propagatedPolicies)
            snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
          }}
        >
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<PolicyDetailsOverview />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </RecoilRoot>
      )

      // wait page load
      await waitForText(expected)
    }
  )

  test('Should render Policy Details Results Page correctly for policy with description', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[2] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy1')

    // verify decsription card items
    await waitForText('Test policy description')
  })

  test('Should render Policy Details Page content correctly for pending policy', async () => {
    const context: PolicyDetailsContext = { policy: mockPendingPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // verify pending status with new format
    await waitForText(/Pending on \d+ cluster/)
  })

  test('Should render Policy Details Page with placement table when feature flag is disabled', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(policiesState, [mockPolicy[1]])
          // Feature flag disabled - should show old UI with placement table
          snapshot.set(settingsState, { enhancedPlacement: 'disabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // verify old UI with placement table is rendered
    // Check for table column headers which are unique to the table
    const tableHeaders = container.querySelectorAll('th')
    const headerTexts = Array.from(tableHeaders).map((th) => th.textContent)
    expect(headerTexts).toContain('Name')
    expect(headerTexts).toContain('Kind')
    expect(headerTexts).toContain('Clusters')
    expect(headerTexts).toContain('Violations')
  })

  test('Should expand cluster violations when clicking "show more" button', async () => {
    const policyWithManyClusters: Policy = {
      ...mockPolicy[0],
      status: {
        compliant: 'NonCompliant',
        status: [
          { clustername: 'cluster1', clusternamespace: 'cluster1', compliant: 'NonCompliant' },
          { clustername: 'cluster2', clusternamespace: 'cluster2', compliant: 'NonCompliant' },
          { clustername: 'cluster3', clusternamespace: 'cluster3', compliant: 'NonCompliant' },
          { clustername: 'cluster4', clusternamespace: 'cluster4', compliant: 'NonCompliant' },
          { clustername: 'cluster5', clusternamespace: 'cluster5', compliant: 'NonCompliant' },
        ],
      },
    }
    const context: PolicyDetailsContext = { policy: policyWithManyClusters }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // Should initially show only first 3 clusters with "+2 more" button
    await waitForText(/Violations on \d+ clusters/)
    const showMoreButton = await screen.findByRole('button', { name: /2 more/ })
    expect(showMoreButton).toBeInTheDocument()

    // Click to expand
    await userEvent.click(showMoreButton)

    // Should now show all 5 clusters (initially visible ones should remain)
    await waitFor(() => {
      expect(screen.getByText('cluster1')).toBeInTheDocument()
      expect(screen.getByText('cluster2')).toBeInTheDocument()
      expect(screen.getByText('cluster3')).toBeInTheDocument()
      expect(screen.getByText('cluster4')).toBeInTheDocument()
      expect(screen.getByText('cluster5')).toBeInTheDocument()
    })
  })

  test('Should render multiple violation statuses correctly', async () => {
    const policyWithMixedStatus: Policy = {
      ...mockPolicy[0],
      status: {
        compliant: 'NonCompliant',
        status: [
          { clustername: 'compliant-cluster1', clusternamespace: 'compliant-cluster1', compliant: 'Compliant' },
          { clustername: 'compliant-cluster2', clusternamespace: 'compliant-cluster2', compliant: 'Compliant' },
          {
            clustername: 'noncompliant-cluster1',
            clusternamespace: 'noncompliant-cluster1',
            compliant: 'NonCompliant',
          },
          { clustername: 'pending-cluster1', clusternamespace: 'pending-cluster1', compliant: 'Pending' },
          { clustername: 'nostatus-cluster1', clusternamespace: 'nostatus-cluster1' },
        ],
      },
    }
    const context: PolicyDetailsContext = { policy: policyWithMixedStatus }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // Verify all status types are rendered
    await waitForText(/No violations on \d+ clusters/)
    await waitForText(/Violations on \d+ cluster/)
    await waitForText(/Pending on \d+ cluster/)
    await waitForText(/No status on \d+ cluster/)

    // Verify cluster names appear
    await waitForText('compliant-cluster1')
    await waitForText('noncompliant-cluster1')
    await waitForText('pending-cluster1')
    await waitForText('nostatus-cluster1')
  })

  test('Should show dash for PlacementRule-only policy when feature flag is enabled', async () => {
    const mockPlacementRule = {
      apiVersion: 'apps.open-cluster-management.io/v1' as const,
      kind: 'PlacementRule' as const,
      metadata: {
        name: 'test-placement-rule',
        namespace: 'test',
        uid: 'placementrule-uid',
      },
      spec: {
        clusterSelector: {
          matchExpressions: [],
        },
      },
      status: {
        decisions: [{ clusterName: 'cluster1', clusterNamespace: 'cluster1' }],
      },
    }
    const mockPlacementBindingForRule = {
      apiVersion: 'policy.open-cluster-management.io/v1' as const,
      kind: 'PlacementBinding' as const,
      metadata: { name: 'test-placement-rule-binding', namespace: 'test' },
      placementRef: {
        apiGroup: 'apps.open-cluster-management.io',
        kind: 'PlacementRule',
        name: 'test-placement-rule',
      },
      subjects: [
        { apiGroup: 'policy.open-cluster-management.io', kind: 'Policy', name: 'policy-set-with-1-placement-policy' },
      ],
    }
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, [])
          snapshot.set(placementRulesState, [mockPlacementRule])
          snapshot.set(policySetsState, [])
          snapshot.set(placementBindingsState, [mockPlacementBindingForRule])
          snapshot.set(placementDecisionsState, [])
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // PlacementLinkList only handles Placement kind, so PlacementRule-only should show '-'
    // The PlacementRule will still appear in the table when the feature flag is disabled
    expect(screen.queryByText('test-placement-rule')).not.toBeInTheDocument()
  })

  test('Should handle policy with no placements', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, [])
          snapshot.set(placementRulesState, [])
          snapshot.set(policySetsState, [])
          snapshot.set(placementBindingsState, [])
          snapshot.set(placementDecisionsState, [])
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // Verify Placement field exists
    await waitForText('Placement')

    // Look for the description list structure and verify no placement links exist
    const placementLinks = container.querySelectorAll('a[href*="kind=Placement"]')
    const placementRuleLinks = container.querySelectorAll('a[href*="kind=PlacementRule"]')
    expect(placementLinks.length).toBe(0)
    expect(placementRuleLinks.length).toBe(0)
  })

  test('Should handle policy with no cluster status', async () => {
    const policyWithNoStatus: Policy = {
      ...mockPolicy[0],
      status: {
        compliant: 'Compliant',
        status: [],
      },
    }
    const context: PolicyDetailsContext = { policy: policyWithNoStatus }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // Verify "No status" is shown
    await waitForText('No status')
  })

  test('Should render placement link with correct URL parameters', async () => {
    const context: PolicyDetailsContext = { policy: mockPolicy[0] }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, mockPlacements)
          snapshot.set(policySetsState, [mockPolicySets[0]])
          snapshot.set(placementBindingsState, mockPlacementBindings)
          snapshot.set(placementDecisionsState, mockPlacementDecision)
          snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<PolicyDetailsOverview />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait page load
    await waitForText('policy-set-with-1-placement-policy')

    // Find the placement link
    const placementLink = await screen.findByText('policy-set-with-1-placement')
    expect(placementLink).toHaveAttribute('href')

    // Verify link points to the placement details page
    const href = placementLink.getAttribute('href')
    expect(href).toBe('/multicloud/infrastructure/clusters/placements/details/test/policy-set-with-1-placement')
  })
})
