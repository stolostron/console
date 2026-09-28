/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { RecoilRoot } from 'recoil'
import { managedClustersState, namespacesState, policiesState, policySetsState } from '../../../atoms'
import { nockIgnoreRBAC, nockCreate, nockIgnoreApiPaths, nockIgnorePlacementDebug } from '../../../lib/nock-util'
import { clickElement, waitForNocks, waitForText, typeElement } from '~/lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { CreatePolicySet } from './CreatePolicySet'
import { mockPolicySets, mockPolicy, mockNamespaces, mockManagedClusters } from '../governance.sharedMocks'
import { Placement, PlacementBinding } from '../../../resources'

function TestCreatePolicySet() {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(policySetsState, mockPolicySets)
        snapshot.set(namespacesState, [mockNamespaces[0]])
        snapshot.set(managedClustersState, mockManagedClusters)
        snapshot.set(policiesState, mockPolicy)
      }}
    >
      <MemoryRouter initialEntries={[`${NavigationPath.createPolicySet}`]}>
        <Routes>
          <Route path={NavigationPath.createPolicySet} element={<CreatePolicySet />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('Create Policy Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnorePlacementDebug()
  })

  test('can create policy set', async () => {
    // create form
    render(<TestCreatePolicySet />)

    // step 1 -- name and namespace
    await typeElement(screen.getByRole('textbox', { name: /name/i }), mockPolicySets[1].metadata.name)
    await typeElement(screen.getByPlaceholderText('Select the namespace'), 'test')
    await clickElement(screen.getByRole('option', { name: 'test' }))
    await clickElement(screen.getByRole('button', { name: 'Next' }))
    // step 2 -- select policies
    await clickElement(screen.getByRole('checkbox', { name: /select row 0/i }))
    await clickElement(screen.getByRole('button', { name: 'Next' }))
    // step 3 -- placement

    await waitForText('How do you want to select clusters?')
    await clickElement(screen.getByRole('button', { name: 'New placement' }))
    await clickElement(screen.getAllByRole('button', { name: /action/i })[0])
    await clickElement(screen.getByPlaceholderText(/select the label/i))
    await clickElement(screen.getByRole('option', { name: /cloud/i }))
    await clickElement(screen.getByPlaceholderText(/select the values/i))
    await clickElement(screen.getByRole('option', { name: /amazon/i }))
    await clickElement(screen.getByRole('button', { name: 'Next' }))
    // step 4 -- Review
    const policySetNock = [
      nockCreate(mockPolicySets[2], undefined, 201, { dryRun: 'All' }), // DRY RUN
      nockCreate(mockPolicySets[2]),
    ]

    const mockPlacement: Placement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: {
        name: 'policy-set-with-1-placement-placement',
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
        tolerations: [
          {
            key: 'cluster.open-cluster-management.io/unreachable',
            operator: 'Exists',
          },
          {
            key: 'cluster.open-cluster-management.io/unavailable',
            operator: 'Exists',
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
        name: 'policy-set-with-1-placement-placement',
        namespace: 'test',
      },
      placementRef: {
        apiGroup: 'cluster.open-cluster-management.io',
        kind: 'Placement',
        name: 'policy-set-with-1-placement-placement',
      },
      subjects: [
        {
          apiGroup: 'policy.open-cluster-management.io',
          kind: 'PolicySet',
          name: 'policy-set-with-1-placement',
        },
      ],
    }

    const placementBindingNock = [
      nockCreate(mockPlacementBinding, undefined, 201, { dryRun: 'All' }), // DRY RUN
      nockCreate(mockPlacementBinding),
    ]

    await clickElement(screen.getByRole('button', { name: 'Submit' }))
    await waitForNocks(policySetNock)
    await waitForNocks(placementNock)
    await waitForNocks(placementBindingNock)
  })
})
