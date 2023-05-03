/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
  policiesState,
  namespacesState,
  managedClustersState,
  placementsState,
  placementRulesState,
  managedClusterSetBindingsState,
  managedClusterSetsState,
} from '../../../atoms'
import { nockCreate, nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByText, waitForNocks, waitForNotText, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicy } from './CreatePolicy'
import {
  mockClusterSet,
  mockClusterSetBinding,
  mockManagedClusters,
  mockNamespaces,
  mockPlacementBindings,
  mockPlacementRules,
  mockPlacements,
  mockPolicy,
} from '../governance.sharedMocks'
import { IResource, Placement, PlacementBinding } from '../../../resources'
import userEvent from '@testing-library/user-event'

function TestCreatePolicyPage(props: { initialResources?: IResource[] }) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(policiesState, mockPolicy)
        snapshot.set(namespacesState, mockNamespaces)
        snapshot.set(managedClustersState, mockManagedClusters)
        snapshot.set(placementsState, mockPlacements)
        snapshot.set(placementRulesState, mockPlacementRules)
        snapshot.set(managedClusterSetsState, [mockClusterSet])
        snapshot.set(managedClusterSetBindingsState, [mockClusterSetBinding])
      }}
    >
      <MemoryRouter initialEntries={[`${NavigationPath.createPolicy}`]}>
        <Route path={NavigationPath.createPolicy}>
          <CreatePolicy initialResources={props.initialResources} />
        </Route>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Create Policy Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('can create policy', async () => {
    // create form
    const { container } = render(<TestCreatePolicyPage />)

    await new Promise((resolve) => setTimeout(resolve, 500))

    // step 1 -- name, description, and namespace
    userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'policy1')
    userEvent.type(screen.getByRole('textbox', { name: 'Description' }), 'Test policy description')
    screen.getByText('Select namespace').click()
    userEvent.type(screen.getByRole('searchbox'), 'test')
    screen.getByRole('option', { name: 'test' }).click()
    screen.getByRole('button', { name: 'Next' }).click()

    // step 2 -- policy templates

    await waitForText('Templates')
    screen.getByRole('button', { name: 'Add policy template' }).click()
    screen.getByText('Namespace must exist').click()
    const configNameInput = screen.getByRole('textbox', { name: /name name/i })
    userEvent.type(configNameInput, '{selectall}test-policy-namespace')
    screen.getByRole('radio', { name: 'Delete If Created' }).click()
    userEvent.type(container.querySelector('#objectdefinition-spec-object-templates input')!, 'test')
    screen.getByRole('button', { name: 'Next' }).click()

    // step 3 -- placement

    await waitForText('How do you want to select clusters?')
    // check existing placements
    screen.getByRole('button', { name: 'Existing placement' }).click()
    screen.getByRole('button', { name: /options menu/i }).click()
    // Verify that the existing placement can be selected
    screen.getByRole('option', { name: /policy-set-with-1-placement/i }).click()
    expect(screen.getByRole('button', { name: /options menu/i }).textContent).toEqual('policy-set-with-1-placement')

    // new placement
    screen.getByRole('button', { name: 'New placement' }).click()
    screen.getByRole('button', { name: /action/i }).click()
    screen.getByText(/select the label/i).click()
    screen.getByRole('option', { name: /cloud/i }).click()
    screen.getByText(/select the values/i).click()
    screen.getByRole('checkbox', { name: /amazon/i }).click()
    screen.getByRole('button', { name: 'Next' }).click()

    // step 4 -- Policy annotations

    screen.getByRole('button', { name: 'Next' }).click()

    // step 5 -- Review and Submit

    expect(screen.getByRole('heading', { name: /details/i })).toBeInTheDocument()

    const policyNock = [
      nockCreate(mockPolicy[2], undefined, 201, { dryRun: 'All' }), // DRY RUN
      nockCreate(mockPolicy[2]),
    ]

    const mockPlacement: Placement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: {
        name: 'policy1-placement',
        namespace: 'test',
      },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  {
                    key: 'cloud',
                    operator: 'In',
                    values: ['Amazon'],
                  },
                ],
              },
            },
          },
        ],
      },
    }

    const placementNock = [
      nockCreate(mockPlacement, undefined, 201, { dryRun: 'All' }), // DRY RUN
      nockCreate(mockPlacement),
    ]

    const mockPlacementBinding: PlacementBinding = {
      apiVersion: 'policy.open-cluster-management.io/v1',
      kind: 'PlacementBinding',
      metadata: {
        name: 'policy1-placement',
        namespace: 'test',
      },
      placementRef: {
        apiGroup: 'cluster.open-cluster-management.io',
        kind: 'Placement',
        name: 'policy1-placement',
      },
      subjects: [
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'Policy',
          name: 'policy1',
        },
      ],
    }

    const placementBindingNock = [
      nockCreate(mockPlacementBinding, undefined, 201, { dryRun: 'All' }), // DRY RUN
      nockCreate(mockPlacementBinding),
    ]

    screen.getByRole('button', { name: 'Submit' }).click()
    await waitForNocks(policyNock)
    await waitForNocks(placementNock)
    await waitForNocks(placementBindingNock)
  })

  test('can switch to existing placement in PlacementRule mode', async () => {
    // The PlacementBinding points to a PlacementRule to activate PlacementRule mode
    render(<TestCreatePolicyPage initialResources={[mockPolicy[2], mockPlacementBindings[0]]} />)

    await new Promise((resolve) => setTimeout(resolve, 500))
    screen.getByRole('button', { name: 'Next' }).click()
    screen.getByRole('button', { name: 'Next' }).click()

    await waitForText('How do you want to select clusters?')
    screen.getByText(/placementrule resource is deprecated and will not receive updates or fixes./i)
    screen.getByRole('button', { name: 'Existing placement' }).click()
    screen.getByText(/select the placement rule/i)
    screen.getByText(/placementrule resource is deprecated and will not receive updates or fixes./i)
  })

  test('can cancel create policy', async () => {
    render(<TestCreatePolicyPage />)
    await waitForText('Create policy', true)
    await clickByText('Cancel')
    await waitForNotText('Cancel')
  })

  test('can edit name even if initial resource has a uid', async () => {
    render(
      <TestCreatePolicyPage
        initialResources={[
          {
            apiVersion: 'policy.open-cluster-management.io/v1',
            kind: 'Policy',
            metadata: {
              name: 'foobar',
              namespace: 'default',
              uid: '9f7de1f1-b46f-47df-8ef4-0930aecc5902',
            },
          },
        ]}
      />
    )

    await new Promise((resolve) => setTimeout(resolve, 500))

    expect(screen.getByRole('textbox', { name: 'Name' })).not.toHaveAttribute('readonly')
    userEvent.type(screen.getByRole('textbox', { name: 'Name' }), '{selectall}policy2')
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveAttribute('value', 'policy2')
  })
})
