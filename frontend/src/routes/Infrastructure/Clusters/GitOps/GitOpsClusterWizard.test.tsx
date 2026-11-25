/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { t } from 'i18next'
import { axe } from 'jest-axe'
import { useState } from 'react'
import { MemoryRouter } from 'react-router'
import type { SyncEditorProps } from '~/components/SyncEditor/SyncEditor'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import { GitOpsClusterWizard } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterWizard'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import { ManagedClusterSetBindingKind, type ManagedClusterSetBinding } from '~/resources/managed-cluster-set-binding'
import { PlacementApiVersion, PlacementKind, type Placement } from '~/resources/placement'
import { WizardSyncEditor } from '~/routes/Infrastructure/Clusters/GitOps/CreateGitOpsCluster'
import type { GitOpsClusterWizardProps } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterWizard'
import { AcmModal } from '~/ui-components'
import {
  buildGitOpsClusterResources,
  collectMissingPermissions,
  GITOPS_BINDING_OWNER_ANNOTATION,
} from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'

jest.mock('~/components/SyncEditor/SyncEditor', () => ({
  SyncEditor: ({ editorTitle, resources, onEditorChange }: SyncEditorProps) => (
    <textarea
      aria-label={editorTitle}
      value={JSON.stringify(resources)}
      onChange={(event) => {
        if (event.target.value) onEditorChange?.({ resources: JSON.parse(event.target.value) })
      }}
    />
  ),
}))

jest.mock('~/hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('~/wizards/Placement/usePlacementDebug', () => {
  const actual = jest.requireActual('~/wizards/Placement/usePlacementDebug')
  return {
    ...actual,
    usePlacementDebug: jest.fn(() => ({
      matched: [],
      notMatched: [],
      totalClusters: 0,
      matchedCount: undefined,
      loading: false,
      error: undefined,
    })),
  }
})

jest.mock('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources', () => {
  const actual = jest.requireActual('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources')
  return {
    ...actual,
    collectMissingPermissions: jest.fn(async () => []),
  }
})

describe('GitOpsClusterWizard', () => {
  beforeEach(() => {
    localStorage.removeItem('yaml')
    nockIgnoreApiPaths()
    nockIgnoreRBAC()
    jest.mocked(collectMissingPermissions).mockReset().mockResolvedValue([])
  })

  afterEach(() => localStorage.removeItem('yaml'))

  const yamlWizardProps: GitOpsClusterWizardProps = {
    title: 'Create GitOpsCluster',
    namespaces: ['openshift-gitops'],
    clusterSets: [],
    clusterSetBindings: [],
    clusters: [],
    argoCDs: [],
    subscriptions: [],
    policies: [],
    yamlEditor: () => <WizardSyncEditor />,
    onSubmit: async () => undefined,
    onCancel: () => undefined,
  }

  function ModalWizard() {
    const [target, setTarget] = useState<HTMLDivElement | null>(null)
    return (
      <MemoryRouter>
        <AcmModal
          title="Create GitOps configuration"
          aria-label="Create GitOps configuration"
          help={<div ref={setTarget} />}
          isOpen
        >
          <GitOpsClusterWizard {...yamlWizardProps} isModal yamlSwitchTarget={target} />
        </AcmModal>
      </MemoryRouter>
    )
  }

  it('keeps the form and editor synchronized when toggling popup YAML', async () => {
    const user = userEvent.setup()
    render(<ModalWizard />)
    await user.click(screen.getByRole('switch', { name: 'YAML' }))
    const name = screen.getByRole('textbox', { name: 'Name' })
    await user.type(name, 'form-draft')

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('form-draft')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible()
    expect(screen.getByRole('textbox', { name: 'GitOpsCluster YAML' })).toHaveProperty(
      'value',
      expect.stringContaining('form-draft')
    )

    const editor = screen.getByRole('textbox', { name: 'GitOpsCluster YAML' }) as HTMLTextAreaElement
    expect(editor).toBeVisible()
    const resources = JSON.parse(editor.value)
    resources.find((resource: { kind: string }) => resource.kind === GitOpsClusterKind).metadata.name = 'yaml-draft'
    await user.click(editor)
    await user.keyboard('{Control>}a{/Control}')
    await user.paste(JSON.stringify(resources))
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('yaml-draft')

    await user.click(screen.getByRole('switch', { name: 'YAML' }))
    expect(screen.queryByRole('textbox', { name: 'GitOpsCluster YAML' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('yaml-draft')
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible()
    await user.click(screen.getByRole('switch', { name: 'YAML' }))
    expect(screen.getByRole('textbox', { name: 'GitOpsCluster YAML' })).toHaveProperty(
      'value',
      expect.stringContaining('yaml-draft')
    )
    await user.click(screen.getByRole('switch', { name: 'YAML' }))
    expect(screen.queryByRole('textbox', { name: 'GitOpsCluster YAML' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('yaml-draft')
  })

  it.each(['true', 'false'])('keeps modal YAML session-only with persisted preference %s', async (preference) => {
    localStorage.setItem('yaml', preference)
    const user = userEvent.setup()
    const { unmount } = render(<ModalWizard />)
    const toggle = screen.getByRole('switch', { name: 'YAML' })
    expect(toggle).not.toBeChecked()
    expect(screen.queryByRole('textbox', { name: 'GitOpsCluster YAML' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('banner')).getByRole('switch', { name: 'YAML' })).toBe(toggle)

    await user.click(toggle)
    const editor = await screen.findByRole('textbox', { name: 'GitOpsCluster YAML' })
    const resources = JSON.parse((editor as HTMLTextAreaElement).value)
    resources.find((resource: { kind: string }) => resource.kind === GitOpsClusterKind).metadata.name = 'yaml-draft'
    await user.click(editor)
    await user.keyboard('{Control>}a{/Control}')
    await user.paste(JSON.stringify(resources))
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('yaml-draft')
    await user.click(toggle)
    expect(screen.queryByRole('textbox', { name: 'GitOpsCluster YAML' })).not.toBeInTheDocument()
    await user.click(toggle)
    const reopenedEditor = (await screen.findByRole('textbox', { name: 'GitOpsCluster YAML' })) as HTMLTextAreaElement
    expect(JSON.parse(reopenedEditor.value)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: GitOpsClusterKind, metadata: expect.objectContaining({ name: 'yaml-draft' }) }),
      ])
    )
    expect(localStorage.getItem('yaml')).toBe(preference)
    expect(await axe(screen.getByRole('banner'))).toHaveNoViolations()

    unmount()
    render(<ModalWizard />)
    expect(screen.getByRole('switch', { name: 'YAML' })).not.toBeChecked()
    expect(screen.queryByRole('textbox', { name: 'GitOpsCluster YAML' })).not.toBeInTheDocument()
  })

  it.each(['true', 'false'])('reads and updates the full-page YAML preference %s', async (preference) => {
    localStorage.setItem('yaml', preference)
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <GitOpsClusterWizard {...yamlWizardProps} />
      </MemoryRouter>
    )
    const toggle = screen.getByRole('switch', { name: 'YAML' })
    expect(toggle).toHaveProperty('checked', preference === 'true')
    const panel = container.querySelector('.pf-v6-c-drawer__panel') as HTMLElement
    expect(panel.style.getPropertyValue('--pf-v6-c-drawer__panel--md--FlexBasis')).toBe('600px')
    expect(container.querySelector('.pf-m-panel-bottom')).not.toBeInTheDocument()
    expect(Boolean(screen.queryByRole('textbox', { name: 'GitOpsCluster YAML' }))).toBe(preference === 'true')
    await user.click(toggle)
    expect(localStorage.getItem('yaml')).toBe(String(preference !== 'true'))
    expect(await axe(container.querySelector('#page-header')!)).toHaveNoViolations()
  })

  it('renders the wizard with Details and Target clusters steps', async () => {
    render(
      <MemoryRouter>
        <GitOpsClusterWizard
          title="Create GitOpsCluster"
          namespaces={['openshift-gitops']}
          clusterSets={[]}
          clusterSetBindings={[]}
          clusters={[]}
          argoCDs={[
            {
              apiVersion: 'argoproj.io/v1beta1',
              kind: 'ArgoCD',
              metadata: { name: 'openshift-gitops', namespace: 'openshift-gitops' },
            },
          ]}
          subscriptions={[]}
          policies={[]}
          onSubmit={async () => undefined}
          onCancel={() => undefined}
        />
      </MemoryRouter>
    )

    expect(screen.getByText('Create GitOpsCluster')).toBeInTheDocument()
    expect(screen.getAllByText('Details').length).toBeGreaterThan(0)
    expect(screen.getByText('Argo CD Agent pull')).toBeInTheDocument()
    expect(screen.getByText('Argo CD ManifestWork pull')).toBeInTheDocument()
    expect(await screen.findByText('The hub cluster cannot be included in this Placement.')).toBeInTheDocument()
    expect(screen.getAllByText('Target clusters').length).toBeGreaterThan(0)
  })

  it('reviews deleted Placements and owned bindings and updates the alert when another Placement retains a binding', async () => {
    const previousPlacement: Placement = {
      apiVersion: PlacementApiVersion,
      kind: PlacementKind,
      metadata: { name: 'old-targets', namespace: 'openshift-gitops', uid: 'placement-uid' },
      spec: { clusterSets: ['old-set'] },
    }
    const binding: ManagedClusterSetBinding = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: ManagedClusterSetBindingKind,
      metadata: {
        name: 'old-set',
        namespace: 'openshift-gitops',
        annotations: { [GITOPS_BINDING_OWNER_ANNOTATION]: 'fleet' },
      },
      spec: { clusterSet: 'old-set' },
    }
    const baseline = buildGitOpsClusterResources(
      { name: 'fleet', namespace: 'openshift-gitops', agentEnabled: false, existingPlacement: previousPlacement },
      t
    )
    const previousOwned = [
      ...baseline.filter((resource) => resource.kind === GitOpsClusterKind),
      previousPlacement,
      binding,
    ]
    const desired = buildGitOpsClusterResources(
      {
        name: 'fleet',
        namespace: 'openshift-gitops',
        agentEnabled: false,
        clusterSets: ['new-set'],
        existingPlacement: {
          ...previousPlacement,
          metadata: { ...previousPlacement.metadata, name: 'new-targets' },
        },
      },
      t
    )
    jest.mocked(collectMissingPermissions).mockImplementation(async (_resources, removed = []) =>
      removed.map((resource) => ({
        kind: resource.kind!,
        verb: 'delete',
        namespace: resource.metadata?.namespace,
        name: resource.metadata?.name,
      }))
    )
    const wizard = (placements: Placement[]) => (
      <MemoryRouter>
        <GitOpsClusterWizard
          title="Edit GitOpsCluster"
          namespaces={['openshift-gitops']}
          clusterSets={[]}
          clusterSetBindings={[]}
          clusters={[]}
          argoCDs={[]}
          subscriptions={[]}
          policies={[]}
          resources={desired}
          previousOwned={previousOwned}
          placements={placements}
          onSubmit={async () => undefined}
          onCancel={() => undefined}
        />
      </MemoryRouter>
    )
    const { rerender } = render(wizard([previousPlacement]))
    expect(await screen.findByText('delete Placement (openshift-gitops/old-targets)')).toBeInTheDocument()
    expect(screen.getByText('delete ManagedClusterSetBinding (openshift-gitops/old-set)')).toBeInTheDocument()
    expect(collectMissingPermissions).toHaveBeenLastCalledWith(expect.any(Array), [previousPlacement, binding])

    const otherPlacement = {
      ...previousPlacement,
      metadata: { ...previousPlacement.metadata, name: 'other-targets', uid: 'other-uid' },
    }
    rerender(wizard([previousPlacement, otherPlacement]))
    // A changed removal set invalidates old results even when desired resource identities stay the same.
    expect(screen.queryByText('delete ManagedClusterSetBinding (openshift-gitops/old-set)')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(collectMissingPermissions).toHaveBeenLastCalledWith(expect.any(Array), [previousPlacement])
    )
    expect(await screen.findByText('delete Placement (openshift-gitops/old-targets)')).toBeInTheDocument()
    expect(screen.queryByText('delete ManagedClusterSetBinding (openshift-gitops/old-set)')).not.toBeInTheDocument()
  })
})
