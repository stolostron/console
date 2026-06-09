/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
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
import CreatePlacementPage, { CreatePlacement } from './CreatePlacement'
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
  metadata: { name: 'test-placement', namespace: 'test-ns' },
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

function TestCreatePlacementPage({
  existingPlacements = [],
  mockAddAlert = jest.fn(),
  mockSubmitForm = jest.fn(),
  mockCancelForm = jest.fn(),
}: {
  existingPlacements?: Placement[]
  mockAddAlert?: jest.Mock
  mockSubmitForm?: jest.Mock
  mockCancelForm?: jest.Mock
}) {
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
          <MemoryRouter initialEntries={[NavigationPath.createPlacement]}>
            <Routes>
              <Route path={NavigationPath.createPlacement} element={<CreatePlacement />} />
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

describe('CreatePlacement', () => {
  beforeEach(() => {
    mockReconcileResources.mockReset()
    mockOnSubmit = undefined
    mockOnCancel = undefined
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders the placement wizard with correct title', () => {
    render(<TestCreatePlacementPage />)
    expect(screen.getByTestId('placement-wizard')).toBeInTheDocument()
    expect(mockWizardTitle).toBe('Create placement')
  })

  test('passes available namespaces to the wizard', () => {
    render(<TestCreatePlacementPage />)
    expect(mockWizardNamespaces).toEqual(['test-ns'])
  })

  test('passes cluster sets, bindings, and clusters to the wizard', () => {
    render(<TestCreatePlacementPage />)
    expect(mockWizardClusterSets).toEqual([mockClusterSet])
    expect(mockWizardClusterSetBindings).toEqual([mockClusterSetBinding])
    expect(mockWizardClusters).toEqual([mockCluster])
  })

  test('passes breadcrumb with link to placements list', () => {
    render(<TestCreatePlacementPage />)
    expect(mockWizardBreadcrumb).toEqual([
      { text: 'Placements', to: NavigationPath.placements },
      { text: 'Create placement' },
    ])
  })

  test('navigates to placements page on cancel', async () => {
    const mockCancelForm = jest.fn()
    render(<TestCreatePlacementPage mockCancelForm={mockCancelForm} />)

    expect(mockOnCancel).toBeDefined()
    mockOnCancel!()

    expect(mockCancelForm).toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.getByTestId('placements-page')).toBeInTheDocument()
    })
  })

  test('calls reconcileResources on submit and navigates on success', async () => {
    const mockAddAlert = jest.fn()
    const mockSubmitForm = jest.fn()
    mockReconcileResources.mockResolvedValue(undefined)

    render(
      <TestCreatePlacementPage
        existingPlacements={[mockPlacement]}
        mockAddAlert={mockAddAlert}
        mockSubmitForm={mockSubmitForm}
      />
    )

    expect(mockOnSubmit).toBeDefined()
    await mockOnSubmit!([
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: { name: 'test-placement', namespace: 'test-ns' },
        spec: {},
      },
    ])

    expect(mockReconcileResources).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          kind: PlacementKind,
          metadata: { name: 'test-placement', namespace: 'test-ns' },
        }),
      ],
      []
    )

    await waitFor(() => {
      expect(mockAddAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Placement created',
          type: 'success',
          autoClose: true,
        })
      )
    })

    await waitFor(() => {
      expect(mockSubmitForm).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByTestId('placement-details-page')).toBeInTheDocument()
    })
  })

  test('shows error toast on submit failure', async () => {
    const mockAddAlert = jest.fn()
    const mockCancelForm = jest.fn()
    const error = { reason: 'Conflict', message: 'Resource already exists' }
    mockReconcileResources.mockRejectedValue(error)

    render(<TestCreatePlacementPage mockAddAlert={mockAddAlert} mockCancelForm={mockCancelForm} />)

    expect(mockOnSubmit).toBeDefined()
    await expect(mockOnSubmit!([mockPlacement])).rejects.toEqual(error)

    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Failed to create Placement',
        type: 'danger',
        autoClose: true,
      })
    )

    expect(mockCancelForm).toHaveBeenCalled()
  })

  test('does not navigate until placement appears in state', async () => {
    const mockAddAlert = jest.fn()
    mockReconcileResources.mockResolvedValue(undefined)

    render(<TestCreatePlacementPage existingPlacements={[]} mockAddAlert={mockAddAlert} />)

    expect(mockOnSubmit).toBeDefined()
    await mockOnSubmit!([mockPlacement])

    expect(mockReconcileResources).toHaveBeenCalled()
    expect(mockAddAlert).not.toHaveBeenCalled()
    expect(screen.getByTestId('placement-wizard')).toBeInTheDocument()
  })
})

describe('CreatePlacementPage', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders CreatePlacement component', () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(namespacesState, [mockNamespace])
          snapshot.set(managedClusterSetsState, [mockClusterSet] as any)
          snapshot.set(managedClusterSetBindingsState, [mockClusterSetBinding] as any)
          snapshot.set(managedClustersState, [mockCluster] as any)
          snapshot.set(placementsState, [])
        }}
      >
        <AcmToastContext.Provider value={createMockToastContext()}>
          <LostChangesContext.Provider value={createMockLostChangesContext()}>
            <MemoryRouter initialEntries={[NavigationPath.createPlacement]}>
              <Routes>
                <Route path={NavigationPath.createPlacement} element={<CreatePlacementPage />} />
              </Routes>
            </MemoryRouter>
          </LostChangesContext.Provider>
        </AcmToastContext.Provider>
      </RecoilRoot>
    )

    expect(screen.getByTestId('placement-wizard')).toBeInTheDocument()
  })
})
