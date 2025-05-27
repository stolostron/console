/* Copyright Contributors to the Open Cluster Management project */
import { render, waitFor, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  placementBindingsState,
  placementRulesState,
  placementsState,
  policiesState,
  policyAutomationState,
  policySetsState,
} from '../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { getCSVDownloadLink, getCSVExportSpies, waitForText } from '../../../lib/test-util'
import { Placement, PlacementBinding, PlacementRule } from '../../../resources'
import PoliciesPage, { AddToPolicySetModal, DeletePolicyModal, PolicyTableItem } from './Policies'
import {
  mockPolicy,
  mockEmptyPolicy,
  mockPolicySets,
  mockPendingPolicy,
  mockPolicyBinding,
  mockPolicyAutomation,
  mockOrderPolicy,
} from '../governance.sharedMocks'

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

    await waitForText("You don't have any policies.")
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
    screen.getByRole('button', { name: 'Cluster violations' }).click()
    screen.getByRole('button', { name: 'Namespace' }).click()
    screen.getByRole('button', { name: 'Name' }).click()

    // Verify annotation dropdown
    screen.getAllByRole('button', { name: /details/i })[0].click()
    await waitForText('Add')
    screen.getAllByRole('button', { name: /details/i })[1].click()
    await waitForText('Test policy description')
  })

  test('Should render Policies page correctly with Default selected Columns', async () => {
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
    await waitForText('Name')
    await waitForText('Namespace')
    await waitForText('Remediation')
    await waitForText('Cluster violations')
    await waitForText('Source')
    await waitForText('Policy set')
    expect(screen.queryByRole('columnheader', { name: /Status/ })).not.toBeInTheDocument()
    // This is dot dot dot action button
    await screen.getAllByRole('button', { name: 'Actions' })

    // Add a non-default column
    screen.getByRole('button', { name: /columns-management/i }).click()
    await waitForText('Manage columns')
    screen.getByTestId('checkbox-status').click()
    screen.getByRole('button', { name: /save/i }).click()

    expect(screen.getByRole('columnheader', { name: /Status/ })).toBeInTheDocument()

    screen.getByRole('button', { name: /columns-management/i }).click()
    await waitForText('Manage columns')
    screen.getByRole('button', { name: /restore defaults/i }).click()
    // Verify that the Status column was unchecked.
    expect(screen.getByTestId('checkbox-status')).not.toBeChecked()
    screen.getByRole('button', { name: /save/i }).click()

    // Verify that the Status column is no longer present
    expect(screen.queryByRole('columnheader', { name: /Status/ })).not.toBeInTheDocument()
  })

  test('Should sort Policy automation correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockOrderPolicy)
          snapshot.set(policyAutomationState, [mockPolicyAutomation])
        }}
      >
        <MemoryRouter>
          <PoliciesPage />
        </MemoryRouter>
      </RecoilRoot>
    )
    // Add the automation column
    screen.getByRole('button', { name: /columns-management/i }).click()
    await waitForText('Manage columns')
    screen.getByTestId('checkbox-automation').click()
    screen.getByRole('button', { name: /save/i }).click()
    expect(screen.getByRole('columnheader', { name: /Automation/i })).toBeInTheDocument()
    screen.getByRole('button', { name: 'Automation' }).click()

    expect(screen.getByRole('columnheader', { name: /Automation/i })).toHaveAttribute('aria-sort', 'ascending')

    // 'policy-set-with-1-placement-policy'
    const automationName = screen.getByRole('button', {
      name: mockPolicyAutomation.metadata.name,
    })
    const configure = screen.getByRole('link', {
      name: /configure/i,
    })

    // 'configure' comes before 'automationName'
    expect(configure.compareDocumentPosition(automationName)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  test('Should sort Policy status correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockOrderPolicy)
          snapshot.set(policyAutomationState, [mockPolicyAutomation])
        }}
      >
        <MemoryRouter>
          <PoliciesPage />
        </MemoryRouter>
      </RecoilRoot>
    )
    // Add the status column
    screen.getByRole('button', { name: /columns-management/i }).click()
    await waitForText('Manage columns')
    screen.getByTestId('checkbox-status').click()
    screen.getByRole('button', { name: /save/i }).click()
    expect(screen.getByRole('columnheader', { name: /Status/i })).toBeInTheDocument()
    screen.getByRole('button', { name: /Status/i }).click()

    expect(screen.getByRole('columnheader', { name: /Status/i })).toHaveAttribute('aria-sort', 'ascending')

    const enabled = screen.getByText('Enabled')
    const disabled = screen.getByText('Disabled')

    // 'disabled' comes before 'enabled'
    expect(disabled.compareDocumentPosition(enabled)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  test('Should sort Policy source correctly', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockOrderPolicy)
          snapshot.set(policyAutomationState, [mockPolicyAutomation])
        }}
      >
        <MemoryRouter>
          <PoliciesPage />
        </MemoryRouter>
      </RecoilRoot>
    )
    expect(screen.getByRole('columnheader', { name: /Source/i })).toBeInTheDocument()
    screen.getByRole('button', { name: /Source/i }).click()

    expect(screen.getByRole('columnheader', { name: /Source/i })).toHaveAttribute('aria-sort', 'ascending')

    const local = screen.getByText('Local')
    const me = screen.getByText('Managed externally')

    // 'Local' comes before 'Managed externally'
    expect(local.compareDocumentPosition(me)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
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
    // Verify the Cluster violations column has the correct link to policy details page
    await waitFor(() =>
      // need to use index [1] because the name column is also an "a" element
      expect(container.querySelectorAll('a')[2]).toHaveAttribute(
        'href',
        '/multicloud/governance/policies/details/test/policy-set-with-1-placement-policy/results?sort=-1'
      )
    )
  })

  test('should show enforce filter without (overridden)', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policiesState, mockPolicyBinding)
        }}
      >
        <MemoryRouter>
          <PoliciesPage />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('enforce (overridden)')
    await waitForText('Filter')
    screen.getByRole('button', { name: 'Options menu' }).click()
    await waitForText('Enforce')
    const enforceDiv = screen.getByText('Enforce').closest('div')
    within(enforceDiv!).getByText('1')
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
    screen
      .getByRole('combobox', {
        name: 'Select a policy set',
      })
      .click()
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
describe('Export from policy table', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('export button should produce a file for download', async () => {
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
    window.URL.createObjectURL = jest.fn()
    window.URL.revokeObjectURL = jest.fn()

    const { blobConstructorSpy, createElementSpy } = getCSVExportSpies()

    screen.getByLabelText('export-search-result').click()
    screen.getByText('Export all to CSV').click()

    expect(blobConstructorSpy).toHaveBeenCalledWith(
      [
        'Name,Namespace,Status,Remediation,Policy set,Cluster violations,Source,Automation,Created,Description,Standards,Controls,Categories\n' +
          '"policy-set-with-1-placement-policy","test","Enabled","inform","-","no violations: 1 cluster, violations: 0 clusters, pending: 0 clusters, unknown: 0 clusters","Local","-",-,"-","NIST SP 800-53","CM-2 Baseline Configuration","CM Configuration Management"\n' +
          '"policy1","test","Enabled","inform","-","-","Local","-",-,"Test policy description","NIST SP 800-53","CM-2 Baseline Configuration","CM Configuration Management"',
      ],
      { type: 'text/csv' }
    )
    expect(getCSVDownloadLink(createElementSpy)?.value.download).toMatch(/^rhacmallpolicies-[\d]+\.csv$/)
  })
})
