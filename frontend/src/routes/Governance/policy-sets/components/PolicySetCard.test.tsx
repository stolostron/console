/* Copyright Contributors to the Open Cluster Management project */
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { AcmDrawerContext } from '../../../../ui-components'
import { waitForText } from '../../../../lib/test-util'
import { Placement, PlacementBinding, PlacementRule, PolicySet } from '../../../../resources'
import PolicySetCard from './PolicySetCard'

const cardID = 'policyset-test-policy-set-with-1-placement'

const policySet: PolicySet = {
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  kind: 'PolicySet',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"policy.open-cluster-management.io/v1","kind":"PolicySet","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"spec":{"description":"Policy set with a single Placement and PlacementBinding.","policies":["policy-set-with-1-placement-policy-1","policy-set-with-1-placement-policy-2"]}}\n',
    },
    creationTimestamp: '2022-02-23T12:34:35Z',
    name: 'policy-set-with-1-placement',
    namespace: 'test',
    uid: '20761783-5b48-4f9c-b12c-d5a6b2fac4b5',
  },
  spec: {
    description: 'Policy set with a single Placement and PlacementBinding.',
    policies: ['policy-set-with-1-placement-policy-1', 'policy-set-with-1-placement-policy-2'],
  },
  status: {
    compliant: 'Compliant',
    placement: [{ placement: 'policy-set-with-1-placement', placementBinding: 'policy-set-with-1-placement' }],
    statusMessage: 'All policies are reporting status',
  },
}

const policySetPending: PolicySet = {
  apiVersion: 'policy.open-cluster-management.io/v1beta1',
  kind: 'PolicySet',
  metadata: {
    annotations: {
      'kubectl.kubernetes.io/last-applied-configuration':
        '{"apiVersion":"policy.open-cluster-management.io/v1","kind":"PolicySet","metadata":{"annotations":{},"name":"policy-set-with-1-placement","namespace":"test"},"spec":{"description":"Policy set with a single Placement and PlacementBinding.","policies":["policy-set-with-1-placement-policy-1","policy-set-with-1-placement-policy-2"]}}\n',
    },
    creationTimestamp: '2022-02-23T12:34:35Z',
    name: 'policy-set-with-1-placement',
    namespace: 'test',
    uid: '20761783-5b48-4f9c-b12c-d5a6b2fac4b5',
  },
  spec: {
    description: 'Policy set with a single Placement and PlacementBinding.',
    policies: ['policy-set-with-1-placement-policy-1', 'policy-set-with-1-placement-policy-2'],
  },
  status: {
    compliant: 'Pending',
    placement: [{ placement: 'policy-set-with-1-placement', placementBinding: 'policy-set-with-1-placement' }],
    statusMessage: 'Policies awaiting pending dependencies: policy-pending',
  },
}

export const mockPolicySets: PolicySet[] = []
export const mockPlacements: Placement[] = []
export const mockPlacementRules: PlacementRule[] = []
export const mockPlacementBindings: PlacementBinding[] = []

describe('Policy Set Card', () => {
  test('Should render Policy Set Card content correctly', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PolicySetCard
            policySet={policySet}
            selectedCardID={''}
            setSelectedCardID={() => {}}
            canEditPolicySet={true}
            canDeletePolicySet={true}
            cardIdActionMenuOpen={undefined}
            setCardIdActionMenuOpen={() => {}}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait card title - PolicySet name
    await waitForText('policy-set-with-1-placement')
    // wait card desc - PolicySet desc
    await waitForText('Policy set with a single Placement and PlacementBinding.')
    // wait card compliance status
    await waitForText('No violations')
    // wait status message
    await waitForText('All policies are reporting status')
  })
})

describe('Policy Set Card for Pending policy', () => {
  test('Should render Policy Set Card content correctly', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PolicySetCard
            policySet={policySetPending}
            selectedCardID={''}
            setSelectedCardID={() => {}}
            canEditPolicySet={true}
            canDeletePolicySet={true}
            cardIdActionMenuOpen={undefined}
            setCardIdActionMenuOpen={() => {}}
          />
        </MemoryRouter>
      </RecoilRoot>
    )

    // wait card title - PolicySet name
    await waitForText('policy-set-with-1-placement')
    // wait card desc - PolicySet desc
    await waitForText('Policy set with a single Placement and PlacementBinding.')
    // wait card compliance status
    await waitForText('Pending')
    // wait status message
    await waitForText('Policies awaiting pending dependencies: policy-pending')
  })
})

describe('Policy Set Card controlled dropdown and selection (ACM-30324)', () => {
  beforeEach(() => {
    // openDetails scrolls the card into view via getElementById + scrollIntoView (setTimeout 400ms)
    Element.prototype.scrollIntoView = jest.fn()
  })

  test('card shows selected state when selectedCardID matches card ID', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PolicySetCard
            policySet={policySet}
            selectedCardID={cardID}
            setSelectedCardID={() => {}}
            canEditPolicySet={true}
            canDeletePolicySet={true}
            cardIdActionMenuOpen={undefined}
            setCardIdActionMenuOpen={() => {}}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('policy-set-with-1-placement')
    const card = document.getElementById(cardID)
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('pf-m-current')
  })

  test('setSelectedCardID is called when clicking card title', async () => {
    const setSelectedCardID = jest.fn()
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PolicySetCard
            policySet={policySet}
            selectedCardID={''}
            setSelectedCardID={setSelectedCardID}
            canEditPolicySet={true}
            canDeletePolicySet={true}
            cardIdActionMenuOpen={undefined}
            setCardIdActionMenuOpen={() => {}}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('policy-set-with-1-placement')
    fireEvent.click(screen.getByRole('button', { name: 'policy-set-with-1-placement' }))
    expect(setSelectedCardID).toHaveBeenCalledWith(cardID)
  })

  test('setCardIdActionMenuOpen is called when opening action menu', async () => {
    const setCardIdActionMenuOpen = jest.fn()
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PolicySetCard
            policySet={policySet}
            selectedCardID={''}
            setSelectedCardID={() => {}}
            canEditPolicySet={true}
            canDeletePolicySet={true}
            cardIdActionMenuOpen={undefined}
            setCardIdActionMenuOpen={setCardIdActionMenuOpen}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('policy-set-with-1-placement')
    const card = document.getElementById(cardID)
    expect(card).toBeInTheDocument()
    const buttonsWithinCard = card!.querySelectorAll('button')
    const kebabButton =
      Array.from(buttonsWithinCard).find((b) => !b.textContent?.trim()) ??
      buttonsWithinCard[buttonsWithinCard.length - 1]
    fireEvent.click(kebabButton)
    expect(setCardIdActionMenuOpen).toHaveBeenCalledWith(cardID)
  })

  test('dropdown menu is open when cardIdActionMenuOpen matches card ID', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <PolicySetCard
            policySet={policySet}
            selectedCardID={''}
            setSelectedCardID={() => {}}
            canEditPolicySet={true}
            canDeletePolicySet={true}
            cardIdActionMenuOpen={cardID}
            setCardIdActionMenuOpen={() => {}}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('policy-set-with-1-placement')
    expect(screen.getByRole('menuitem', { name: 'View details' })).toBeInTheDocument()
  })
})

describe('Policy Set Card drawer behavior (onSelect vs onViewDetails)', () => {
  beforeEach(() => {
    // openDetails scrolls the card into view via getElementById + scrollIntoView (setTimeout 400ms)
    Element.prototype.scrollIntoView = jest.fn()
  })

  test('clicking card title opens the drawer', async () => {
    const setDrawerContext = jest.fn()
    render(
      <RecoilRoot>
        <MemoryRouter>
          <AcmDrawerContext.Provider value={{ drawerContext: undefined, setDrawerContext }}>
            <PolicySetCard
              policySet={policySet}
              selectedCardID={''}
              setSelectedCardID={() => {}}
              canEditPolicySet={true}
              canDeletePolicySet={true}
              cardIdActionMenuOpen={undefined}
              setCardIdActionMenuOpen={() => {}}
            />
          </AcmDrawerContext.Provider>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('policy-set-with-1-placement')
    fireEvent.click(screen.getByRole('button', { name: 'policy-set-with-1-placement' }))
    expect(setDrawerContext).toHaveBeenCalledWith(
      expect.objectContaining({
        isExpanded: true,
        isInline: true,
        isResizable: true,
      })
    )
    expect(setDrawerContext.mock.calls[0][0].panelContent).toBeDefined()
  })

  test('with drawer open (card selected), click actions then View details keeps drawer open', async () => {
    const setDrawerContext = jest.fn()
    const setSelectedCardID = jest.fn()
    render(
      <RecoilRoot>
        <MemoryRouter>
          <AcmDrawerContext.Provider value={{ drawerContext: undefined, setDrawerContext }}>
            <PolicySetCard
              policySet={policySet}
              selectedCardID={cardID}
              setSelectedCardID={setSelectedCardID}
              canEditPolicySet={true}
              canDeletePolicySet={true}
              cardIdActionMenuOpen={cardID}
              setCardIdActionMenuOpen={() => {}}
            />
          </AcmDrawerContext.Provider>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('policy-set-with-1-placement')
    expect(screen.getByRole('menuitem', { name: 'View details' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'View details' }))
    expect(setSelectedCardID).toHaveBeenCalledWith(cardID)
    expect(setDrawerContext).toHaveBeenCalledWith(
      expect.objectContaining({
        isExpanded: true,
        isInline: true,
        isResizable: true,
      })
    )
    expect(setDrawerContext.mock.calls[0][0].panelContent).toBeDefined()
  })
})
