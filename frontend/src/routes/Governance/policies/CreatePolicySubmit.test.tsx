/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot, useSetRecoilState } from 'recoil'
import {
  policiesState,
  namespacesState,
  managedClustersState,
  placementsState,
  placementRulesState,
  managedClusterSetBindingsState,
  managedClusterSetsState,
} from '../../../atoms'
import { LostChangesContext } from '../../../components/LostChanges'
import { NavigationPath } from '../../../NavigationPath'
import { IResource, Policy } from '../../../resources'
import { AcmToastContext } from '../../../ui-components'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { CreatePolicy } from './CreatePolicy'
import {
  mockClusterSet,
  mockClusterSetBinding,
  mockManagedClusters,
  mockNamespaces,
  mockPlacements,
  mockPlacementRules,
  mockPolicy,
} from '../governance.sharedMocks'
import { ResourceError, ResourceErrorCode } from '../../../resources/utils/resource-request'

const mockReconcileResources = jest.fn()
jest.mock('../../../resources/utils', () => ({
  ...jest.requireActual('../../../resources/utils'),
  reconcileResources: (...args: unknown[]) => mockReconcileResources(...args),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
}))

const mockNewPolicy: Policy = {
  apiVersion: 'policy.open-cluster-management.io/v1',
  kind: 'Policy',
  metadata: {
    name: 'test-policy',
    namespace: 'default',
  },
  spec: {
    disabled: false,
    'policy-templates': [],
    remediationAction: 'inform',
  },
} as Policy

const mockPolicyInList: Policy = { ...mockNewPolicy }

jest.mock('../../../wizards/Governance/Policy/PolicyWizard', () => ({
  PolicyWizard: ({ onSubmit, onCancel }: { onSubmit: (data: IResource[]) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onSubmit([mockNewPolicy])} type="button">
        Submit
      </button>
      <button onClick={onCancel} type="button">
        Cancel
      </button>
    </div>
  ),
}))

function PolicyStateUpdater({
  policyToAdd,
  buttonLabel = 'Add policy to list',
}: {
  policyToAdd: Policy
  buttonLabel?: string
}) {
  const setPolicies = useSetRecoilState(policiesState)
  return (
    <button
      type="button"
      onClick={() =>
        setPolicies((prev: Policy[]) =>
          prev.some((p) => p.metadata?.name === policyToAdd.metadata?.name) ? prev : [...prev, policyToAdd]
        )
      }
    >
      {buttonLabel}
    </button>
  )
}

function TestCreatePolicyPage({
  initialPolicies = [],
  mockToast,
  mockLostChanges,
}: {
  initialPolicies?: Policy[]
  mockToast: { addAlert: jest.Mock }
  mockLostChanges: { cancelForm: jest.Mock; submitForm: jest.Mock }
}) {
  const toastContextValue = {
    activeAlerts: [],
    alertInfos: [],
    addAlert: mockToast.addAlert,
    removeAlert: jest.fn(),
    removeVisibleAlert: jest.fn(),
    clearAlerts: jest.fn(),
  }
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(policiesState, initialPolicies)
        snapshot.set(namespacesState, mockNamespaces)
        snapshot.set(managedClustersState, mockManagedClusters)
        snapshot.set(placementsState, mockPlacements)
        snapshot.set(placementRulesState, mockPlacementRules)
        snapshot.set(managedClusterSetsState, [mockClusterSet])
        snapshot.set(managedClusterSetBindingsState, [mockClusterSetBinding])
      }}
    >
      <AcmToastContext.Provider value={toastContextValue}>
        <LostChangesContext.Provider
          value={{
            setDirty: jest.fn(),
            setNestedDirty: jest.fn(),
            submitForm: mockLostChanges.submitForm,
            cancelForm: mockLostChanges.cancelForm,
            data: undefined,
            setData: jest.fn(),
          }}
        >
          <MemoryRouter initialEntries={[NavigationPath.createPolicy]}>
            <Routes>
              <Route
                path={NavigationPath.createPolicy}
                element={
                  <>
                    <PolicyStateUpdater policyToAdd={mockPolicyInList} />
                    <CreatePolicy />
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        </LostChangesContext.Provider>
      </AcmToastContext.Provider>
    </RecoilRoot>
  )
}

describe('CreatePolicy onSubmit', () => {
  const mockAddAlert = jest.fn()
  const mockCancelForm = jest.fn()
  const mockSubmitForm = jest.fn()

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    jest.clearAllMocks()
  })

  describe('when onSubmit succeeds', () => {
    it('shows success alert and navigates to policy details when the new resource appears in usePolicies', async () => {
      mockReconcileResources.mockResolvedValue(undefined)

      const mockToast = { addAlert: mockAddAlert }
      const mockLostChanges = { cancelForm: mockCancelForm, submitForm: mockSubmitForm }

      render(<TestCreatePolicyPage initialPolicies={[]} mockToast={mockToast} mockLostChanges={mockLostChanges} />)

      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add policy to list' })).toBeInTheDocument()

      await act(async () => {
        screen.getByRole('button', { name: 'Submit' }).click()
      })

      expect(mockReconcileResources).toHaveBeenCalledWith([mockNewPolicy], [])

      await act(async () => {
        screen.getByRole('button', { name: 'Add policy to list' }).click()
      })

      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Policy created',
        message: 'test-policy was successfully created.',
        type: 'success',
        autoClose: true,
      })
      expect(mockNavigate).toHaveBeenCalledWith('/multicloud/governance/policies/details/default/test-policy')
      expect(mockSubmitForm).toHaveBeenCalled()
      expect(mockCancelForm).not.toHaveBeenCalled()
    })
  })

  describe('when onSubmit fails', () => {
    it('calls cancelForm and shows error alert', async () => {
      const error = new ResourceError(ResourceErrorCode.InternalServerError, 'Server error', 'InternalServerError')
      mockReconcileResources.mockRejectedValue(error)

      const mockToast = { addAlert: mockAddAlert }
      const mockLostChanges = { cancelForm: mockCancelForm, submitForm: mockSubmitForm }

      render(
        <TestCreatePolicyPage initialPolicies={mockPolicy} mockToast={mockToast} mockLostChanges={mockLostChanges} />
      )

      await act(async () => {
        screen.getByRole('button', { name: 'Submit' }).click()
      })

      await act(async () => {
        await Promise.resolve()
      })

      expect(mockCancelForm).toHaveBeenCalled()
      expect(mockAddAlert).toHaveBeenCalledWith({
        title: 'Failed to create Policy',
        message: 'Reason: InternalServerError. Error: Server error.',
        type: 'danger',
        autoClose: true,
      })
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(mockSubmitForm).not.toHaveBeenCalled()
    })
  })
})
