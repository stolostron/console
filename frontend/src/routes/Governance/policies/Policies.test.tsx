/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
  placementBindingsState,
  placementRulesState,
  placementsState,
  policiesState,
  policySetsState,
} from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { waitForText } from '../../../lib/test-util'
import { Placement, PlacementBinding, PlacementRule } from '../../../resources'
import PoliciesPage, { AddToPolicySetModal, DeletePolicyModal, PolicyTableItem } from './Policies'
import { mockPolicy, mockEmptyPolicy, mockPolicySets, mockPendingPolicy } from '../governance.sharedMocks'

describe('Policies Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('Should render empty Policies page correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockEmptyPolicy)
        }}
      >
        <MemoryRouter>
          <PoliciesPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText("You don't have any policies")
  })

  test('Should render Policies page correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy)
        }}
      >
        <MemoryRouter>
          <PoliciesPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText(mockPolicy[0].metadata.name!)

    // Sorting
    screen.getByRole('button', { name: 'Status' }).click()
    screen.getByRole('button', { name: 'Remediation' }).click()
    screen.getByRole('button', { name: 'Source' }).click()
    screen.getByRole('button', { name: 'Automation' }).click()
    screen.getByRole('button', { name: 'Name' }).click()

    // Verify annotation dropdown
    screen.getAllByRole('button', { name: /details/i })[0].click()
    await waitForText('Add')
    screen.getAllByRole('button', { name: /details/i })[1].click()
    await waitForText('Test policy description')
  })

  test('Should render Policies page correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPendingPolicy)
        }}
      >
        <MemoryRouter>
          <PoliciesPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText(mockPendingPolicy[0].metadata.name!)
  })

  test('Should have correct links to PolicySet & Policy detail results pages', async () => {
    const { container } = render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicy.slice(0, 2))
          snapshot.set(policySetsState, [mockPolicySets[0]])
        }}
      >
        <MemoryRouter>
          <PoliciesPage />
        </MemoryRouter>
      </RecoilRoot>
    )

    // Wait for page load
    await waitForText(mockPolicy[0].metadata.name!)
    // Verify the PolicySet column has loaded correctly and has the correct link to PolicySets page
    await waitForText(mockPolicySets[0].metadata.name!)
    await waitFor(() =>
      // need to use index [1] because the name column is also an "a" element
      expect(container.querySelectorAll('a')[1]).toHaveAttribute(
        'href',
        '/multicloud/governance/policy-sets?search%3D%7B%22name%22%3A%5B%22policy-set-with-1-placement%22%5D%2C%22namespace%22%3A%5B%22test%22%5D%7D'
      )
    )
    // Verify the Cluster violation column has the correct link to policy details page
    await waitFor(() =>
      // need to use index [1] because the name column is also an "a" element
      expect(container.querySelectorAll('a')[2]).toHaveAttribute(
        'href',
        '/multicloud/governance/policies/details/test/policy-set-with-1-placement-policy/results?sort=-1'
      )
    )
  })
})

describe('Add Policy to policy set', () => {
  test('should render AddToPolicySetModal', async () => {
    let isClosed = false
    const tableItem: PolicyTableItem = {
      policy: mockPolicy[2],
      source: 'Local',
    }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, [mockPolicy[2]])
          snapshot.set(policySetsState, [mockPolicySets[1]])
        }}
      >
        <MemoryRouter>
          <AddToPolicySetModal
            policyTableItems={[tableItem]}
            onClose={() => {
              isClosed = true
            }}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    screen.getByRole('button', { name: /select a policy set options menu/i }).click()
    screen.getByRole('option', { name: 'policy-set-with-1-placement' }).click()
    screen.getByRole('button', { name: 'Add' }).click()
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(isClosed).toBe(true)
  })
})

describe('Delete policy modal with shared placements and bindings', () => {
  test('should show two warnings', async () => {
    const tableItem: PolicyTableItem = {
      policy: {
        apiVersion: 'policy.open-cluster-management.io/v1',
        kind: 'Policy',
        metadata: {
          name: 'my-policy',
          namespace: 'test',
        },
        spec: {
          disabled: false,
        },
      },
      source: 'Local',
    }
    const placement: Placement = {
      apiVersion: 'cluster.open-cluster-management.io/v1alpha1',
      kind: 'Placement',
      metadata: {
        name: 'all-clusters',
        namespace: 'test',
      },
      spec: {},
    }
    const placementRule: PlacementRule = {
      apiVersion: 'apps.open-cluster-management.io/v1',
      kind: 'PlacementRule',
      metadata: {
        name: 'all-clusters-legacy',
        namespace: 'test',
      },
      spec: {},
    }
    const placementBinding1: PlacementBinding = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'PlacementBinding',
      metadata: {
        name: 'all-clusters-placement',
        namespace: 'test',
      },
      placementRef: {
        apiGroup: 'clusters.open-cluster-management.io',
        kind: 'Placement',
        name: 'all-clusters',
      },
      subjects: [
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'Policy',
          name: 'my-policy',
        },
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'Policy',
          name: 'an-unrelated-policy',
        },
      ],
    }
    const placementBinding2: PlacementBinding = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'PlacementBinding',
      metadata: {
        name: 'all-clusters-legacy-placement',
        namespace: 'test',
      },
      placementRef: {
        apiGroup: 'apps.open-cluster-management.io',
        kind: 'PlacementRule',
        name: 'all-clusters-legacy',
      },
      subjects: [
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'Policy',
          name: 'my-policy',
        },
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'Policy',
          name: 'an-unrelated-policy',
        },
      ],
    }
    const placementBinding3: PlacementBinding = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'PlacementBinding',
      metadata: {
        name: 'other-placement',
        namespace: 'test',
      },
      placementRef: {
        apiGroup: 'clusters.open-cluster-management.io',
        kind: 'Placement',
        name: 'all-clusters',
      },
      subjects: [
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'Policy',
          name: 'an-unrelated-policy2',
        },
      ],
    }
    const placementBinding4: PlacementBinding = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'PlacementBinding',
      metadata: {
        name: 'other-legacy-placement',
        namespace: 'test',
      },
      placementRef: {
        apiGroup: 'apps.open-cluster-management.io',
        kind: 'PlacementRule',
        name: 'all-clusters-legacy',
      },
      subjects: [
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'Policy',
          name: 'an-unrelated-policy2',
        },
      ],
    }
    const onClose = () => {}

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, [placement])
          snapshot.set(placementBindingsState, [
            placementBinding1,
            placementBinding2,
            placementBinding3,
            placementBinding4,
          ])
          snapshot.set(placementRulesState, [placementRule])
        }}
      >
        <DeletePolicyModal item={tableItem} onClose={onClose} />
      </RecoilRoot>
    )

    screen.getByRole('heading', { name: 'Warning alert: These PlacementBindings are in use elsewhere' })
    screen.getByText('all-clusters-placement, all-clusters-legacy-placement')
    screen.getByRole('heading', { name: 'Warning alert: These Placements/PlacementRules are in use elsewhere' })
    screen.getByText('all-clusters, all-clusters-legacy')
  })
})
