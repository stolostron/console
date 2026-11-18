/* Copyright Contributors to the Open Cluster Management project */

import { EditMode, Step } from '@patternfly-labs/react-form-wizard'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import type { IResource } from '~/resources'
import { GitOpsClusterKind, type GitOpsCluster } from '~/resources/gitops-cluster'
import type { ManagedClusterSetBinding } from '~/resources/managed-cluster-set-binding'
import { PlacementKind } from '~/resources/placement'
import { buildGitOpsClusterResources } from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'
import { GitOpsClusterDetailsStep } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterDetailsStep'
import { WizardPage } from '~/wizards/WizardPage'

jest.mock('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources', () => {
  const actual = jest.requireActual('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources')
  return {
    ...actual,
    collectMissingPermissions: jest.fn(async () => []),
    preferDraftManagedClusterSetBindings: jest.fn(actual.preferDraftManagedClusterSetBindings),
    buildGitOpsClusterResources: jest.fn(actual.buildGitOpsClusterResources),
  }
})

const {
  collectMissingPermissions,
  preferDraftManagedClusterSetBindings,
  buildGitOpsClusterResources: buildGitOpsClusterResourcesMock,
} = jest.requireMock('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources') as {
  collectMissingPermissions: jest.Mock
  preferDraftManagedClusterSetBindings: jest.Mock
  buildGitOpsClusterResources: jest.Mock
}

function renderDetailsStep(options?: {
  editMode?: EditMode
  resources?: IResource[]
  namespaces?: string[]
  existingBindings?: ManagedClusterSetBinding[]
  loadExistingAppProject?: () => Promise<IResource | undefined>
}) {
  const editMode = options?.editMode ?? EditMode.Create
  const namespaces = options?.namespaces ?? ['openshift-gitops']
  const defaultData =
    options?.resources ??
    buildGitOpsClusterResources({
      name: editMode === EditMode.Edit ? 'existing-goc' : '',
      namespace: namespaces[0] ?? '',
      agentEnabled: false,
      pushModelEnabled: false,
      includeBindings: false,
    })

  return render(
    <MemoryRouter>
      <WizardPage
        id="gitopscluster-details-step-test"
        title="GitOpsCluster Details"
        onSubmit={async () => undefined}
        onCancel={() => undefined}
        editMode={editMode}
        defaultData={defaultData}
      >
        <Step label="Details" id="details">
          <GitOpsClusterDetailsStep
            namespaces={namespaces}
            editMode={editMode}
            argoCDs={[
              {
                apiVersion: 'argoproj.io/v1beta1',
                kind: 'ArgoCD',
                metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops' },
              },
            ]}
            subscriptions={[]}
            policies={[]}
            existingBindings={options?.existingBindings}
            loadExistingAppProject={options?.loadExistingAppProject}
          />
        </Step>
      </WizardPage>
    </MemoryRouter>
  )
}

describe('GitOpsClusterDetailsStep', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    nockIgnoreRBAC()
    collectMissingPermissions.mockReset()
    collectMissingPermissions.mockResolvedValue([])
    preferDraftManagedClusterSetBindings.mockClear()
    buildGitOpsClusterResourcesMock.mockClear()
  })

  it('renders name, namespace, and pull model cards accessibly', async () => {
    const { container } = renderDetailsStep()

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Namespace')).toBeInTheDocument()
    expect(screen.getByText('Select Pull model configuration')).toBeInTheDocument()
    expect(screen.getByText('Argo CD Agent pull')).toBeInTheDocument()
    expect(screen.getByText('Argo CD ManifestWork pull')).toBeInTheDocument()
    expect(screen.getByText('Recommended')).toBeInTheDocument()
    expect(screen.queryByText('Enable Push model with Argo CD Agent')).not.toBeInTheDocument()

    expect(
      await axe(container, {
        rules: {
          'duplicate-id': { enabled: false },
          'duplicate-id-active': { enabled: false },
          'duplicate-id-aria': { enabled: false },
        },
      })
    ).toHaveNoViolations()
  })

  it('shows push model checkbox only when Argo CD Agent pull is selected', async () => {
    const user = userEvent.setup()
    renderDetailsStep()

    expect(screen.queryByText('Enable Push model with Argo CD Agent')).not.toBeInTheDocument()

    await user.click(screen.getByText('Argo CD Agent pull'))

    expect(await screen.findByText('Enable Push model with Argo CD Agent')).toBeInTheDocument()
  })

  it('keeps an existing Basic-mode addon configuration when opening and changing models', async () => {
    const user = userEvent.setup()
    const addon = { enabled: true, overrideExistingConfigs: true, argoCDAgent: { enabled: false, mode: 'managed' } }
    const resources = buildGitOpsClusterResources({
      name: 'existing-goc',
      namespace: 'openshift-gitops',
      agentEnabled: false,
    })
    const gitOpsCluster = resources.find((resource) => resource.kind === GitOpsClusterKind) as GitOpsCluster
    gitOpsCluster.spec = { ...gitOpsCluster.spec, gitopsAddon: addon }
    renderDetailsStep({ editMode: EditMode.Edit, resources })
    expect(screen.queryByText('Enable Push model with Argo CD Agent')).not.toBeInTheDocument()
    await waitFor(() => expect(buildGitOpsClusterResourcesMock).toHaveBeenCalled())
    const latestAddon = () => {
      const result = buildGitOpsClusterResourcesMock.mock.results.at(-1)?.value as {
        kind: string
        spec?: { gitopsAddon?: unknown }
      }[]
      return result.find((resource) => resource.kind === GitOpsClusterKind)?.spec?.gitopsAddon
    }
    expect(latestAddon()).toEqual(addon)
    await user.click(screen.getByText('Argo CD Agent pull'))
    expect(await screen.findByText('Enable Push model with Argo CD Agent')).toBeInTheDocument()
    await user.click(screen.getByText('Argo CD ManifestWork pull'))
    expect(screen.queryByText('Enable Push model with Argo CD Agent')).not.toBeInTheDocument()
    expect(latestAddon()).toEqual(addon)
  })

  it('debounces permission probes until name edits settle', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const { unmount } = renderDetailsStep()
    try {
      const name = screen.getByRole('textbox', { name: /^Name\b/ })
      await user.type(name, 'fle')
      expect(collectMissingPermissions).not.toHaveBeenCalled()
      await act(async () => {
        jest.advanceTimersByTime(200)
      })
      await user.type(name, 'et')
      await act(async () => {
        jest.advanceTimersByTime(100)
      })
      expect(collectMissingPermissions).not.toHaveBeenCalled()
      await act(async () => {
        jest.advanceTimersByTime(199)
      })
      expect(collectMissingPermissions).not.toHaveBeenCalled()
      await act(async () => {
        jest.advanceTimersByTime(1)
      })
      expect(collectMissingPermissions).toHaveBeenCalledTimes(1)
      expect(collectMissingPermissions).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ kind: GitOpsClusterKind, metadata: expect.objectContaining({ name: 'fleet' }) }),
        ])
      )
    } finally {
      unmount()
      jest.useRealTimers()
    }
  })

  it('hides permission results immediately when the checked resource identity changes', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    collectMissingPermissions.mockResolvedValueOnce([{ kind: GitOpsClusterKind, verb: 'create', name: 'old' }])
    const { unmount } = renderDetailsStep()
    try {
      await act(async () => {
        jest.advanceTimersByTime(300)
      })
      expect(
        screen.getByText('You do not have permission to create or update all required resources.')
      ).toBeInTheDocument()
      await user.type(screen.getByRole('textbox', { name: /^Name\b/ }), 'new')
      expect(
        screen.queryByText('You do not have permission to create or update all required resources.')
      ).not.toBeInTheDocument()
      await act(async () => {
        jest.advanceTimersByTime(300)
      })
      expect(collectMissingPermissions).toHaveBeenCalledTimes(2)
      expect(
        screen.queryByText('You do not have permission to create or update all required resources.')
      ).not.toBeInTheDocument()
    } finally {
      unmount()
      jest.useRealTimers()
    }
  })

  it('keeps ManifestWork selectable when an Agent AppProject lookup fails', async () => {
    const user = userEvent.setup()
    const loadExistingAppProject = jest.fn(async () => {
      throw new Error('Forbidden')
    })
    renderDetailsStep({ loadExistingAppProject })
    await user.click(screen.getByText('Argo CD Agent pull'))
    expect(await screen.findByText('Failed to load AppProject')).toBeInTheDocument()
    expect(screen.queryByText('Enable Push model with Argo CD Agent')).not.toBeInTheDocument()
    await user.click(screen.getByText('Argo CD ManifestWork pull'))
    expect(screen.queryByText('Failed to load AppProject')).not.toBeInTheDocument()
    expect(loadExistingAppProject).toHaveBeenCalledTimes(1)
  })

  it('navigates from review to the rendered pull model cards without adding a wrapper layout box', async () => {
    const user = userEvent.setup()
    const originalScroll = HTMLElement.prototype.scrollIntoView
    const scroll = jest.fn()
    HTMLElement.prototype.scrollIntoView = scroll
    const { unmount } = renderDetailsStep({ editMode: EditMode.Edit })
    try {
      await user.click(screen.getByRole('button', { name: 'Next' }))
      const term = await screen.findByText('Pull model configuration')
      await user.click(term)
      await waitFor(() => expect(scroll).toHaveBeenCalled())
      const target = scroll.mock.contexts[0] as HTMLElement
      expect(target).toContainElement(screen.getByText('Argo CD Agent pull'))
      expect(target).toContainElement(screen.getByText('Argo CD ManifestWork pull'))
      expect(target).not.toBe(document.getElementById('pull-model-configuration'))
      expect(document.getElementById('pull-model-configuration')).toHaveStyle({ display: 'contents' })
    } finally {
      unmount()
      HTMLElement.prototype.scrollIntoView = originalScroll
    }
  })

  it('disables name and namespace in edit mode', async () => {
    renderDetailsStep({
      editMode: EditMode.Edit,
      resources: buildGitOpsClusterResources({
        name: 'existing-goc',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        pushModelEnabled: false,
        includeBindings: false,
      }),
    })

    const nameInput = await screen.findByDisplayValue('existing-goc')
    expect(nameInput).toBeDisabled()

    const namespaceToggle = document.getElementById('namespace')?.querySelector('.pf-v6-c-menu-toggle')
    expect(namespaceToggle).toHaveClass('pf-m-disabled')
    expect(document.getElementById('namespace')?.querySelector('input')).toBeDisabled()
  })

  it('shows a permission alert when required permissions are missing', async () => {
    collectMissingPermissions.mockResolvedValue([
      {
        kind: 'GitOpsCluster',
        verb: 'create',
        namespace: 'openshift-gitops',
      },
    ])

    renderDetailsStep({
      resources: [
        {
          apiVersion: 'apps.open-cluster-management.io/v1beta1',
          kind: GitOpsClusterKind,
          metadata: { name: 'goc', namespace: 'openshift-gitops' },
        },
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: PlacementKind,
          metadata: { name: 'goc-placement', namespace: 'openshift-gitops' },
        },
      ],
    })

    await waitFor(() =>
      expect(
        screen.getByText('You do not have permission to create or update all required resources.')
      ).toBeInTheDocument()
    )
  })

  it('prefers draft ManagedClusterSetBindings over live ones when Agent rebuilds', async () => {
    const user = userEvent.setup()
    const draftBinding = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: {
        name: 'kike-cs',
        namespace: 'openshift-gitops',
        annotations: { 'wizard.edited': 'true' },
      },
      spec: { clusterSet: 'kike-cs' },
    } as ManagedClusterSetBinding
    const liveBinding = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: { name: 'kike-cs', namespace: 'openshift-gitops', uid: 'live-uid' },
      spec: { clusterSet: 'kike-cs' },
    } as ManagedClusterSetBinding

    const resources = buildGitOpsClusterResources({
      name: 'fleet',
      namespace: 'openshift-gitops',
      agentEnabled: false,
      pushModelEnabled: false,
      clusterSets: ['kike-cs'],
      existingBindings: [draftBinding],
      includeBindings: true,
    })

    renderDetailsStep({
      resources,
      existingBindings: [liveBinding],
    })

    await user.click(screen.getByText('Argo CD Agent pull'))

    await waitFor(() => {
      expect(preferDraftManagedClusterSetBindings).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'openshift-gitops',
          clusterSets: ['kike-cs'],
          draftBindings: expect.arrayContaining([
            expect.objectContaining({
              metadata: expect.objectContaining({
                name: 'kike-cs',
                annotations: { 'wizard.edited': 'true' },
              }),
            }),
          ]),
          liveBindings: [liveBinding],
        })
      )
    })

    await waitFor(() => {
      const rebuildCalls = buildGitOpsClusterResourcesMock.mock.calls.filter(
        ([options]: [{ agentEnabled?: boolean }]) => options?.agentEnabled === true
      )
      expect(rebuildCalls.length).toBeGreaterThan(0)
      const lastRebuild = rebuildCalls[rebuildCalls.length - 1][0] as {
        existingBindings: ManagedClusterSetBinding[]
      }
      expect(lastRebuild.existingBindings[0].metadata.annotations?.['wizard.edited']).toBe('true')
      expect(lastRebuild.existingBindings[0].metadata.uid).toBeUndefined()
    })
  })
})
