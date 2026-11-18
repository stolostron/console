/* Copyright Contributors to the Open Cluster Management project */

import { act, render, screen, waitFor } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { noop } from 'lodash'
import { MemoryRouter, Route, Routes } from 'react-router'
import {
  argoCDsState,
  gitOpsClustersState,
  managedClusterSetBindingsState,
  managedClusterSetsState,
  managedClustersState,
  namespacesState,
  placementsState,
  policiesState,
  subscriptionOperatorsState,
} from '~/atoms'
import { LostChangesContext } from '~/components/LostChanges'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import { StateProvider } from '~/lib/state-provider'
import { NavigationPath } from '~/NavigationPath'
import { defaultContext, PluginDataContext } from '~/lib/PluginDataContext'
import type { IResource } from '~/resources'
import { GitOpsClusterApiVersion, GitOpsClusterKind, type GitOpsCluster } from '~/resources/gitops-cluster'
import { NamespaceApiVersion, NamespaceKind, type Namespace } from '~/resources/namespace'
import { PlacementApiVersionBeta, PlacementKind } from '~/resources/placement'
import type * as GitOpsResources from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'
import { EditGitOpsCluster } from '~/routes/Infrastructure/Clusters/GitOps/EditGitOpsCluster'
import { AcmToastContext } from '~/ui-components'
import { getResource, ResourceError, ResourceErrorCode } from '~/resources/utils'

jest.mock('~/resources/utils/resource-request', () => ({
  ...jest.requireActual('~/resources/utils/resource-request'),
  getResource: jest.fn(),
}))

const mockGetResource = getResource as jest.Mock

const mockCollectMissingPermissions = jest.fn<
  ReturnType<typeof GitOpsResources.collectMissingPermissions>,
  Parameters<typeof GitOpsResources.collectMissingPermissions>
>(async () => [])
const mockReconcileGitOpsWizardResources = jest.fn<
  ReturnType<typeof GitOpsResources.reconcileGitOpsWizardResources>,
  Parameters<typeof GitOpsResources.reconcileGitOpsWizardResources>
>(async () => ({ gitOpsCluster: 'updated' }))

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
let mockWizardResources: IResource[] | undefined

jest.mock('~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterWizard', () => ({
  GitOpsClusterWizard: (props: {
    title: string
    resources?: IResource[]
    onSubmit: (data: unknown) => Promise<unknown>
    onCancel: () => void
  }) => {
    mockOnSubmit = props.onSubmit
    mockOnCancel = props.onCancel
    mockWizardResources = props.resources
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

const mockGitOpsCluster: GitOpsCluster = {
  apiVersion: GitOpsClusterApiVersion,
  kind: GitOpsClusterKind,
  metadata: { name: 'fleet', namespace: 'openshift-gitops', uid: 'goc-uid', resourceVersion: '10' },
  spec: {
    argoServer: { argoNamespace: 'openshift-gitops' },
    placementRef: { kind: PlacementKind, apiVersion: PlacementApiVersionBeta, name: 'fleet-placement' },
    gitopsAddon: { enabled: true, argoCDAgent: { enabled: true, mode: 'managed' } },
  },
}

const mockPlacement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: { name: 'fleet-placement', namespace: 'openshift-gitops', uid: 'placement-uid' },
  spec: { clusterSets: ['default'] },
}

function renderEdit(options?: {
  gitOpsClusters?: GitOpsCluster[]
  addAlert?: jest.Mock
  submitForm?: jest.Mock
  cancelForm?: jest.Mock
  loaded?: boolean
  placements?: (typeof mockPlacement)[]
}) {
  const addAlert = options?.addAlert ?? jest.fn()
  const submitForm = options?.submitForm ?? jest.fn()
  const cancelForm = options?.cancelForm ?? jest.fn()
  let completeLoading: (() => void) | undefined
  function DataLoadProvider({ children }: { children: ReactNode }) {
    const [loaded, setLoaded] = useState(options?.loaded ?? true)
    completeLoading = () => setLoaded(true)
    return (
      <PluginDataContext.Provider value={{ ...defaultContext, loadCompleted: loaded }}>
        {children}
      </PluginDataContext.Provider>
    )
  }
  return {
    addAlert,
    submitForm,
    cancelForm,
    completeLoading: () => completeLoading?.(),
    ...render(
      <DataLoadProvider>
        <StateProvider
          initializeStore={(store) => {
            store.set(namespacesState, [
              {
                apiVersion: NamespaceApiVersion,
                kind: NamespaceKind,
                metadata: { name: 'openshift-gitops' },
              } satisfies Namespace,
            ])
            store.set(argoCDsState, [
              {
                apiVersion: 'argoproj.io/v1beta1',
                kind: 'ArgoCD',
                metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops', uid: 'argo-uid' },
                spec: { controller: { enabled: true } },
              } as IResource,
            ])
            store.set(gitOpsClustersState, options?.gitOpsClusters ?? [mockGitOpsCluster])
            store.set(placementsState, (options?.placements ?? [mockPlacement]) as never)
            store.set(managedClusterSetsState, [])
            store.set(managedClusterSetBindingsState, [])
            store.set(managedClustersState, [])
            store.set(subscriptionOperatorsState, [])
            store.set(policiesState, [])
          }}
        >
          <AcmToastContext.Provider value={createMockToastContext(addAlert)}>
            <LostChangesContext.Provider value={createMockLostChangesContext(submitForm, cancelForm)}>
              <MemoryRouter initialEntries={['/multicloud/infrastructure/clusters/gitops/edit/openshift-gitops/fleet']}>
                <Routes>
                  <Route path={NavigationPath.editGitOps} element={<EditGitOpsCluster />} />
                  <Route path={NavigationPath.gitOps} element={<div id="gitops-page">GitOps</div>} />
                </Routes>
              </MemoryRouter>
            </LostChangesContext.Provider>
          </AcmToastContext.Provider>
        </StateProvider>
      </DataLoadProvider>
    ),
  }
}

describe('EditGitOpsCluster', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    nockIgnoreRBAC()
    mockCollectMissingPermissions.mockReset()
    mockCollectMissingPermissions.mockResolvedValue([])
    mockReconcileGitOpsWizardResources.mockReset()
    mockReconcileGitOpsWizardResources.mockResolvedValue({ gitOpsCluster: 'updated' })
    mockOnSubmit = undefined
    mockOnCancel = undefined
    mockWizardResources = undefined
    mockGetResource.mockReset()
    mockGetResource.mockImplementation(() => ({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.NotFound)),
      abort: jest.fn(),
    }))
  })

  it('loads existing resources into the wizard', async () => {
    renderEdit()
    expect(await screen.findByTestId('gitopscluster-wizard')).toHaveTextContent('Edit GitOpsCluster')
    await waitFor(() => expect(mockWizardResources?.length).toBeGreaterThan(0))
    expect(mockWizardResources?.some((resource) => resource.kind === GitOpsClusterKind)).toBe(true)
  })

  it('redirects to GitOps when the resource is missing', async () => {
    renderEdit({ gitOpsClusters: [] })
    expect(await screen.findByTestId('gitops-page')).toBeInTheDocument()
  })

  it('submits with previous owned resources for reconcile', async () => {
    const { addAlert, submitForm } = renderEdit()
    await screen.findByTestId('gitopscluster-wizard')
    await waitFor(() => expect(mockOnSubmit).toBeDefined())

    const resources = mockWizardResources ?? []
    await mockOnSubmit?.(resources)

    expect(mockReconcileGitOpsWizardResources).toHaveBeenCalledWith(
      expect.any(Array),
      expect.arrayContaining([expect.objectContaining({ kind: GitOpsClusterKind })]),
      expect.objectContaining({ baseline: expect.any(Array), placements: expect.any(Array) })
    )
    expect(addAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        title: 'GitOpsCluster updated',
        message: expect.stringMatching(/was successfully updated/),
      })
    )
    expect(submitForm).toHaveBeenCalled()
  })

  it('blocks submit when permissions are missing', async () => {
    mockCollectMissingPermissions.mockResolvedValue([{ kind: GitOpsClusterKind, verb: 'patch' }])
    const { addAlert } = renderEdit()
    await screen.findByTestId('gitopscluster-wizard')
    await waitFor(() => expect(mockOnSubmit).toBeDefined())

    await expect(mockOnSubmit?.(mockWizardResources ?? [])).rejects.toThrow(/Missing permissions/)
    expect(mockReconcileGitOpsWizardResources).not.toHaveBeenCalled()
    expect(addAlert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Missing permissions' }))
  })

  it('navigates to GitOps on cancel', async () => {
    renderEdit()
    await screen.findByTestId('gitopscluster-wizard')
    mockOnCancel?.()
    expect(await screen.findByTestId('gitops-page')).toBeInTheDocument()
  })

  it('waits for the Placement snapshot to complete before freezing the edit baseline', async () => {
    const { completeLoading } = renderEdit({ loaded: false })
    expect(screen.queryByTestId('gitopscluster-wizard')).not.toBeInTheDocument()
    expect(mockGetResource).not.toHaveBeenCalled()
    await act(async () => completeLoading())
    await screen.findByTestId('gitopscluster-wizard')
    expect(mockWizardResources?.find((resource) => resource.kind === PlacementKind)?.metadata?.uid).toBe(
      'placement-uid'
    )
  })

  it('rebuilds a missing Placement with its retained reference name after loading', async () => {
    const goc = {
      ...mockGitOpsCluster,
      spec: {
        ...mockGitOpsCluster.spec,
        placementRef: { ...mockGitOpsCluster.spec!.placementRef!, name: 'custom-targets' },
      },
    }
    renderEdit({ placements: [], gitOpsClusters: [goc] })
    await screen.findByTestId('gitopscluster-wizard')
    expect(mockWizardResources?.find((resource) => resource.kind === PlacementKind)?.metadata?.name).toBe(
      'custom-targets'
    )
  })

  it('preserves the live default AppProject restrictions in the edit draft', async () => {
    const project = {
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'AppProject',
      metadata: { name: 'default', namespace: 'openshift-gitops', uid: 'project-uid' },
      spec: { sourceRepos: ['https://example.com/allowed.git'] },
    }
    mockGetResource.mockReturnValue({ promise: Promise.resolve(project), abort: jest.fn() })
    renderEdit()
    await screen.findByTestId('gitopscluster-wizard')
    expect(mockWizardResources?.find((resource) => resource.kind === 'AppProject')).toEqual(project)
  })

  it('does not offer an editable draft if loading the existing AppProject is forbidden', async () => {
    mockGetResource.mockImplementation(() => ({
      promise: Promise.reject(new ResourceError(ResourceErrorCode.Forbidden)),
      abort: jest.fn(),
    }))
    renderEdit()
    expect(await screen.findByText('Failed to load GitOpsCluster')).toBeInTheDocument()
    expect(screen.queryByTestId('gitopscluster-wizard')).not.toBeInTheDocument()
    expect(mockReconcileGitOpsWizardResources).not.toHaveBeenCalled()
  })

  it('checks removed-resource delete permissions before any reconciliation', async () => {
    renderEdit()
    await screen.findByTestId('gitopscluster-wizard')
    const oldPlacement = mockWizardResources!.find((resource) => resource.kind === PlacementKind)!
    const desired = mockWizardResources!.map((resource) =>
      resource.kind === PlacementKind
        ? { ...resource, metadata: { ...resource.metadata, name: 'renamed-placement' } }
        : resource
    )
    mockCollectMissingPermissions.mockResolvedValueOnce([{ kind: PlacementKind, verb: 'delete' }])
    await expect(mockOnSubmit?.(desired)).rejects.toThrow(/Missing permissions/)
    expect(mockCollectMissingPermissions).toHaveBeenLastCalledWith(expect.any(Array), [
      expect.objectContaining({ metadata: oldPlacement.metadata }),
    ])
    expect(mockReconcileGitOpsWizardResources).not.toHaveBeenCalled()
  })
})
