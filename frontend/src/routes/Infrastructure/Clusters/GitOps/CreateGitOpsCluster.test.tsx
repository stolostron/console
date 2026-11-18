/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { noop } from 'lodash'
import { MemoryRouter, Route, Routes } from 'react-router'
import {
  argoCDsState,
  managedClusterSetBindingsState,
  managedClusterSetsState,
  managedClustersState,
  namespacesState,
  policiesState,
  subscriptionOperatorsState,
} from '~/atoms'
import { LostChangesContext } from '~/components/LostChanges'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import { StateProvider } from '~/lib/state-provider'
import { NavigationPath } from '~/NavigationPath'
import type { IResource } from '~/resources'
import { NamespaceApiVersion, NamespaceKind, type Namespace } from '~/resources/namespace'
import type * as GitOpsResources from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'
import { CreateGitOpsCluster } from '~/routes/Infrastructure/Clusters/GitOps/CreateGitOpsCluster'
import { AcmToastContext } from '~/ui-components'

const mockCollectMissingPermissions = jest.fn<
  ReturnType<typeof GitOpsResources.collectMissingPermissions>,
  Parameters<typeof GitOpsResources.collectMissingPermissions>
>(async () => [])
const mockReconcileGitOpsWizardResources = jest.fn<
  ReturnType<typeof GitOpsResources.reconcileGitOpsWizardResources>,
  Parameters<typeof GitOpsResources.reconcileGitOpsWizardResources>
>(async () => ({ gitOpsCluster: 'created' }))

jest.mock('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources', () => {
  const actual = jest.requireActual('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources')
  return {
    ...actual,
    collectMissingPermissions: (...args: Parameters<typeof GitOpsResources.collectMissingPermissions>) =>
      mockCollectMissingPermissions(...args),
    reconcileGitOpsWizardResources: (...args: Parameters<typeof GitOpsResources.reconcileGitOpsWizardResources>) =>
      mockReconcileGitOpsWizardResources(...args),
  }
})

let mockOnSubmit: ((data: unknown) => Promise<unknown>) | undefined
let mockOnCancel: (() => void) | undefined
let mockWizardTitle: string | undefined

jest.mock('~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterWizard', () => ({
  GitOpsClusterWizard: (props: {
    title: string
    onSubmit: (data: unknown) => Promise<unknown>
    onCancel: () => void
  }) => {
    mockOnSubmit = props.onSubmit
    mockOnCancel = props.onCancel
    mockWizardTitle = props.title
    return <div id="gitopscluster-wizard">{props.title}</div>
  },
}))

jest.mock('~/hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

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
    setDirty: noop as never,
    setNestedDirty: noop as never,
    submitForm,
    cancelForm,
    data: undefined,
    setData: noop as never,
  }
}

const mockNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name: 'openshift-gitops' },
}

const mockArgoCD: IResource = {
  apiVersion: 'argoproj.io/v1beta1',
  kind: 'ArgoCD',
  metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops' },
}

function renderCreate(options?: { addAlert?: jest.Mock; submitForm?: jest.Mock; cancelForm?: jest.Mock }) {
  const addAlert = options?.addAlert ?? jest.fn()
  const submitForm = options?.submitForm ?? jest.fn()
  const cancelForm = options?.cancelForm ?? jest.fn()
  return {
    addAlert,
    submitForm,
    cancelForm,
    ...render(
      <StateProvider
        initializeStore={(store) => {
          store.set(namespacesState, [mockNamespace])
          store.set(argoCDsState, [mockArgoCD])
          store.set(managedClusterSetsState, [])
          store.set(managedClusterSetBindingsState, [])
          store.set(managedClustersState, [])
          store.set(subscriptionOperatorsState, [])
          store.set(policiesState, [])
        }}
      >
        <AcmToastContext.Provider value={createMockToastContext(addAlert)}>
          <LostChangesContext.Provider value={createMockLostChangesContext(submitForm, cancelForm)}>
            <MemoryRouter initialEntries={[NavigationPath.createGitOps]}>
              <Routes>
                <Route path={NavigationPath.createGitOps} element={<CreateGitOpsCluster />} />
                <Route path={NavigationPath.gitOps} element={<div id="gitops-page">GitOps</div>} />
              </Routes>
            </MemoryRouter>
          </LostChangesContext.Provider>
        </AcmToastContext.Provider>
      </StateProvider>
    ),
  }
}

describe('CreateGitOpsCluster', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    nockIgnoreRBAC()
    mockCollectMissingPermissions.mockReset()
    mockCollectMissingPermissions.mockResolvedValue([])
    mockReconcileGitOpsWizardResources.mockReset()
    mockReconcileGitOpsWizardResources.mockResolvedValue({ gitOpsCluster: 'created' })
    mockOnSubmit = undefined
    mockOnCancel = undefined
  })

  it('renders the wizard with create title', () => {
    renderCreate()
    expect(screen.getByTestId('gitopscluster-wizard')).toBeInTheDocument()
    expect(mockWizardTitle).toBe('Create GitOpsCluster')
  })

  it('navigates to GitOps on cancel', async () => {
    renderCreate()
    mockOnCancel?.()
    expect(await screen.findByTestId('gitops-page')).toBeInTheDocument()
  })

  it('submits resources after permission checks pass', async () => {
    const { addAlert, submitForm } = renderCreate()
    const resources = [
      {
        apiVersion: 'apps.open-cluster-management.io/v1beta1',
        kind: 'GitOpsCluster',
        metadata: { name: 'fleet', namespace: 'openshift-gitops' },
        spec: {
          placementRef: {
            kind: 'Placement',
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            name: 'fleet-placement',
          },
        },
        transformed: { pushModelEnabled: false },
      },
    ]

    await mockOnSubmit?.(resources)
    expect(mockCollectMissingPermissions).toHaveBeenCalled()
    expect(mockReconcileGitOpsWizardResources).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'Placement', metadata: expect.objectContaining({ name: 'fleet-placement' }) }),
        expect.objectContaining({ kind: 'GitOpsCluster', metadata: expect.objectContaining({ name: 'fleet' }) }),
      ])
    )
    expect(addAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'GitOpsCluster created',
        message: 'fleet was successfully created.',
      })
    )
    expect(submitForm).toHaveBeenCalled()
    expect(await screen.findByTestId('gitops-page')).toBeInTheDocument()
  })

  it('shows updated toast when GitOpsCluster already existed', async () => {
    mockReconcileGitOpsWizardResources.mockResolvedValueOnce({ gitOpsCluster: 'updated' })
    const { addAlert } = renderCreate()
    await mockOnSubmit?.([
      {
        apiVersion: 'apps.open-cluster-management.io/v1beta1',
        kind: 'GitOpsCluster',
        metadata: { name: 'fleet', namespace: 'openshift-gitops' },
        spec: {
          placementRef: {
            kind: 'Placement',
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            name: 'fleet-placement',
          },
        },
      },
    ])
    expect(addAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'GitOpsCluster updated',
        message: 'fleet was successfully updated.',
      })
    )
  })

  it('re-attaches a missing Placement before reconcile when only GitOpsCluster is submitted', async () => {
    renderCreate()
    await mockOnSubmit?.([
      {
        apiVersion: 'apps.open-cluster-management.io/v1beta1',
        kind: 'GitOpsCluster',
        metadata: { name: 'orphan', namespace: 'openshift-gitops' },
        spec: {
          placementRef: {
            kind: 'Placement',
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            name: 'orphan-placement',
          },
        },
      },
    ])
    expect(mockReconcileGitOpsWizardResources).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'Placement',
          metadata: expect.objectContaining({ name: 'orphan-placement', namespace: 'openshift-gitops' }),
        }),
        expect.objectContaining({ kind: 'GitOpsCluster', metadata: expect.objectContaining({ name: 'orphan' }) }),
      ])
    )
  })

  it('blocks submit when permissions are missing', async () => {
    mockCollectMissingPermissions.mockResolvedValue([{ kind: 'GitOpsCluster', verb: 'create' }])
    const { addAlert } = renderCreate()

    await expect(
      mockOnSubmit?.([
        {
          apiVersion: 'apps.open-cluster-management.io/v1beta1',
          kind: 'GitOpsCluster',
          metadata: { name: 'fleet', namespace: 'openshift-gitops' },
        },
      ])
    ).rejects.toThrow(/Missing permissions/)
    expect(mockReconcileGitOpsWizardResources).not.toHaveBeenCalled()
    expect(addAlert).toHaveBeenCalledWith(expect.objectContaining({ type: 'danger', title: 'Missing permissions' }))
  })

  it('surfaces reconcile failures', async () => {
    mockReconcileGitOpsWizardResources.mockRejectedValue({ reason: 'Conflict', message: 'already exists' })
    const { addAlert } = renderCreate()

    await expect(
      mockOnSubmit?.([
        {
          apiVersion: 'apps.open-cluster-management.io/v1beta1',
          kind: 'GitOpsCluster',
          metadata: { name: 'fleet', namespace: 'openshift-gitops' },
        },
      ])
    ).rejects.toEqual({ reason: 'Conflict', message: 'already exists' })
    await waitFor(() =>
      expect(addAlert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Failed to create GitOpsCluster' }))
    )
  })
})
