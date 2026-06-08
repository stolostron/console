/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { generatePath, MemoryRouter, Route, Routes } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
  namespacesState,
  managedClusterSetsState,
  managedClusterSetBindingsState,
  managedClustersState,
  placementsState,
} from '../../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { EditPlacement } from './EditPlacement'
import { AcmToastContext } from '../../../../../ui-components'
import { LostChangesContext } from '../../../../../components/LostChanges'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../../../../resources/namespace'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../../../../../resources/placement'
import { IResource } from '../../../../../resources'
import { noop } from 'lodash'

const mockReconcileResources = jest.fn()
jest.mock('../../../../../resources/utils', () => ({
  ...jest.requireActual('../../../../../resources/utils'),
  reconcileResources: (...args: unknown[]) => mockReconcileResources(...args),
}))

let mockOnSubmit: ((data: unknown) => Promise<unknown>) | undefined
let mockOnCancel: (() => void) | undefined
let mockWizardTitle: string | undefined
let mockWizardNamespaces: string[] | undefined
let mockWizardClusterSets: IResource[] | undefined
let mockWizardClusterSetBindings: unknown[] | undefined
let mockWizardClusters: IResource[] | undefined
let mockWizardBreadcrumb: { text: string; to?: string }[] | undefined
let mockWizardResources: IResource[] | undefined

jest.mock('./PlacementWizard', () => ({
  PlacementWizard: (props: any) => {
    mockOnSubmit = props.onSubmit
    mockOnCancel = props.onCancel
    mockWizardTitle = props.title
    mockWizardNamespaces = props.namespaces
    mockWizardClusterSets = props.clusterSets
    mockWizardClusterSetBindings = props.clusterSetBindings
    mockWizardClusters = props.clusters
    mockWizardBreadcrumb = props.breadcrumb
    mockWizardResources = props.resources
    return <div id="placement-wizard">{props.title}</div>
  },
}))

const mockNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name: 'test-ns' },
}

const mockPlacement: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: { name: 'my-placement', namespace: 'test-ns' },
  spec: {},
}

const mockClusterSet: IResource = {
  apiVersion: 'cluster.open-cluster-management.io/v1beta2',
  kind: 'ManagedClusterSet',
  metadata: { name: 'cluster-set-01' },
}

const mockClusterSetBinding = {
  apiVersion: 'cluster.open-cluster-management.io/v1beta2',
  kind: 'ManagedClusterSetBinding',
  metadata: { name: 'csb-01', namespace: 'test-ns' },
  spec: { clusterSet: 'cluster-set-01' },
} as IResource

const mockCluster: IResource = {
  apiVersion: 'cluster.open-cluster-management.io/v1',
  kind: 'ManagedCluster',
  metadata: { name: 'local-cluster' },
}

function createMockToastContext(addAlert = jest.fn()) {
  return {
    activeAlerts: [],
    alertInfos: [],
    addAlert,
    removeAlert: jest.fn(),
    removeVisibleAlert: jest.fn(),
    clearAlerts: jest.fn(),
    modifyAlert: jest.fn(),
  }
}

function createMockLostChangesContext(submitForm = jest.fn(), cancelForm = jest.fn()) {
  return {
    setDirty: noop as any,
    setNestedDirty: noop as any,
    submitForm,
    cancelForm,
    data: undefined,
    setData: noop as any,
  }
}

const editPlacementPath = generatePath(NavigationPath.editPlacement, {
  namespace: 'test-ns',
  name: 'my-placement',
})

function TestEditPlacementPage({
  existingPlacements = [mockPlacement],
  mockAddAlert = jest.fn(),
  mockSubmitForm = jest.fn(),
  mockCancelForm = jest.fn(),
  searchParams = '',
}: {
  existingPlacements?: Placement[]
  mockAddAlert?: jest.Mock
  mockSubmitForm?: jest.Mock
  mockCancelForm?: jest.Mock
  searchParams?: string
}) {
  const initialEntry = searchParams ? `${editPlacementPath}?${searchParams}` : editPlacementPath

  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(namespacesState, [mockNamespace])
        snapshot.set(managedClusterSetsState, [mockClusterSet] as any)
        snapshot.set(managedClusterSetBindingsState, [mockClusterSetBinding] as any)
        snapshot.set(managedClustersState, [mockCluster] as any)
        snapshot.set(placementsState, existingPlacements)
      }}
    >
      <AcmToastContext.Provider value={createMockToastContext(mockAddAlert)}>
        <LostChangesContext.Provider value={createMockLostChangesContext(mockSubmitForm, mockCancelForm)}>
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path={NavigationPath.editPlacement} element={<EditPlacement />} />
              <Route path={NavigationPath.placements} element={<div id="placements-page">Placements</div>} />
              <Route
                path={NavigationPath.placementDetails}
                element={<div id="placement-details-page">Placement Details</div>}
              />
            </Routes>
          </MemoryRouter>
        </LostChangesContext.Provider>
      </AcmToastContext.Provider>
    </RecoilRoot>
  )
}

describe('EditPlacement', () => {
  beforeEach(() => {
    mockReconcileResources.mockReset()
    mockOnSubmit = undefined
    mockOnCancel = undefined
    mockWizardResources = undefined
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders the wizard with "Edit placement" title when placement exists', () => {
    render(<TestEditPlacementPage />)
    expect(screen.getByTestId('placement-wizard')).toBeInTheDocument()
    expect(mockWizardTitle).toBe('Edit placement')
  })

  test('redirects to placements list when placement is not found', async () => {
    render(<TestEditPlacementPage existingPlacements={[]} />)
    await waitFor(() => {
      expect(screen.getByTestId('placements-page')).toBeInTheDocument()
    })
  })

  test('passes existing resources to the wizard', () => {
    render(<TestEditPlacementPage />)
    expect(mockWizardResources).toEqual([mockPlacement])
  })

  test('passes available namespaces, cluster sets, bindings, and clusters', () => {
    render(<TestEditPlacementPage />)
    expect(mockWizardNamespaces).toEqual(['test-ns'])
    expect(mockWizardClusterSets).toEqual([mockClusterSet])
    expect(mockWizardClusterSetBindings).toEqual([mockClusterSetBinding])
    expect(mockWizardClusters).toEqual([mockCluster])
  })

  test('passes breadcrumb with placement name', () => {
    render(<TestEditPlacementPage />)
    expect(mockWizardBreadcrumb).toEqual([
      { text: 'Placements', to: NavigationPath.placements },
      { text: 'my-placement' },
    ])
  })

  describe('cancel', () => {
    test('navigates to placements list when context=placements', async () => {
      const mockCancelForm = jest.fn()
      render(<TestEditPlacementPage mockCancelForm={mockCancelForm} searchParams="context=placements" />)

      expect(mockOnCancel).toBeDefined()
      mockOnCancel!()

      expect(mockCancelForm).toHaveBeenCalled()
      await waitFor(() => {
        expect(screen.getByTestId('placements-page')).toBeInTheDocument()
      })
    })

    test('navigates to placement details when no context param', async () => {
      const mockCancelForm = jest.fn()
      render(<TestEditPlacementPage mockCancelForm={mockCancelForm} />)

      expect(mockOnCancel).toBeDefined()
      mockOnCancel!()

      expect(mockCancelForm).toHaveBeenCalled()
      await waitFor(() => {
        expect(screen.getByTestId('placement-details-page')).toBeInTheDocument()
      })
    })
  })

  describe('submit', () => {
    test('calls reconcileResources with existing resources and shows success toast', async () => {
      const mockAddAlert = jest.fn()
      const mockSubmitForm = jest.fn()
      mockReconcileResources.mockResolvedValue(undefined)

      render(<TestEditPlacementPage mockAddAlert={mockAddAlert} mockSubmitForm={mockSubmitForm} />)

      expect(mockOnSubmit).toBeDefined()
      await mockOnSubmit!([
        {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'my-placement', namespace: 'test-ns' },
          spec: { numberOfClusters: 2 },
        },
      ])

      expect(mockReconcileResources).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            kind: PlacementKind,
            metadata: { name: 'my-placement', namespace: 'test-ns' },
          }),
        ],
        [mockPlacement]
      )

      await waitFor(() => {
        expect(mockAddAlert).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Placement updated',
            type: 'success',
            autoClose: true,
          })
        )
      })

      expect(mockSubmitForm).toHaveBeenCalled()
    })

    test('navigates to placement details on success without context param', async () => {
      mockReconcileResources.mockResolvedValue(undefined)

      render(<TestEditPlacementPage />)

      await mockOnSubmit!([mockPlacement])

      await waitFor(() => {
        expect(screen.getByTestId('placement-details-page')).toBeInTheDocument()
      })
    })

    test('navigates to placements list on success with context=placements', async () => {
      mockReconcileResources.mockResolvedValue(undefined)

      render(<TestEditPlacementPage searchParams="context=placements" />)

      await mockOnSubmit!([mockPlacement])

      await waitFor(() => {
        expect(screen.getByTestId('placements-page')).toBeInTheDocument()
      })
    })

    test('shows error toast on failure', async () => {
      const mockAddAlert = jest.fn()
      const error = new Error('Update failed')
      mockReconcileResources.mockRejectedValue(error)

      render(<TestEditPlacementPage mockAddAlert={mockAddAlert} />)

      await expect(mockOnSubmit!([mockPlacement])).rejects.toThrow('Update failed')

      expect(mockAddAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to update placement',
          message: 'Update failed',
          type: 'danger',
        })
      )
    })

    test('converts non-Error rejection to string in toast message', async () => {
      const mockAddAlert = jest.fn()
      mockReconcileResources.mockRejectedValue('something went wrong')

      render(<TestEditPlacementPage mockAddAlert={mockAddAlert} />)

      await expect(mockOnSubmit!([mockPlacement])).rejects.toBe('something went wrong')

      expect(mockAddAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Failed to update placement',
          message: 'something went wrong',
          type: 'danger',
        })
      )
    })
  })
})
