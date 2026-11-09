/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import nock from 'nock'
import { generatePath, MemoryRouter } from 'react-router'
import { gitOpsClustersState, managedClusterSetBindingsState, placementsState } from '~/atoms'
import { nockDelete, nockIgnoreApiPaths, nockIgnoreRBAC, nockRBAC } from '~/lib/nock-util'
import { rbacDelete } from '~/lib/rbac-util'
import { StateProvider } from '~/lib/state-provider'
import { NavigationPath } from '~/NavigationPath'
import { PlacementApiVersionBeta, PlacementKind } from '~/resources/placement'
import {
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
} from '~/resources/managed-cluster-set-binding'
import type { GitOpsCluster } from '~/resources/gitops-cluster'
import { GitOpsClusterApiVersion, GitOpsClusterKind, GitopsClusterDefinition } from '~/resources/gitops-cluster'
import GitOps from '~/routes/Infrastructure/Clusters/GitOps/GitOps'

const resource: GitOpsCluster = {
  apiVersion: GitOpsClusterApiVersion,
  kind: GitOpsClusterKind,
  metadata: { name: 'fleet-gitops', namespace: 'openshift-gitops' },
  spec: {
    placementRef: { apiVersion: PlacementApiVersionBeta, kind: PlacementKind, name: 'fleet-placement' },
    gitopsAddon: { enabled: true, argoCDAgent: { enabled: true } },
  },
  status: {
    phase: 'successful',
    message: 'Added managed clusters [weekly weekly-managed] to gitops namespace openshift-gitops',
    conditions: [
      { type: 'ClustersRegistered', status: 'True', reason: 'Registered', message: 'Registered 2 clusters' },
    ],
  },
}

function renderGitOps(resources: GitOpsCluster[] = [resource], clusterSets: string[] = ['fleet']) {
  return render(
    <StateProvider
      initializeStore={(store) => {
        store.set(gitOpsClustersState, resources)
        store.set(placementsState, [
          {
            apiVersion: PlacementApiVersionBeta,
            kind: PlacementKind,
            metadata: { name: 'fleet-placement', namespace: 'openshift-gitops' },
            spec: { clusterSets },
          },
        ])
        store.set(managedClusterSetBindingsState, [
          {
            apiVersion: ManagedClusterSetBindingApiVersion,
            kind: ManagedClusterSetBindingKind,
            metadata: { name: 'actual-binding', namespace: 'openshift-gitops' },
            spec: { clusterSet: 'fleet' },
          },
          {
            apiVersion: ManagedClusterSetBindingApiVersion,
            kind: ManagedClusterSetBindingKind,
            metadata: { name: 'unrelated-binding', namespace: 'openshift-gitops' },
            spec: { clusterSet: 'other' },
          },
          {
            apiVersion: ManagedClusterSetBindingApiVersion,
            kind: ManagedClusterSetBindingKind,
            metadata: { name: 'other-namespace-binding', namespace: 'other' },
            spec: { clusterSet: 'fleet' },
          },
        ])
      }}
    >
      <MemoryRouter>
        <GitOps />
      </MemoryRouter>
    </StateProvider>
  )
}

async function openDelete() {
  await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
  await waitFor(() =>
    expect(screen.getByRole('menuitem', { name: 'Delete' })).not.toHaveAttribute('aria-disabled', 'true')
  )
  await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
  return screen.findByRole('dialog')
}

describe('GitOps', () => {
  beforeEach(() => nockIgnoreApiPaths())

  it('renders accessible overview cards, actual bindings and resource links', async () => {
    const { container } = renderGitOps()
    expect(screen.getByRole('heading', { name: 'fleet-gitops' })).toBeInTheDocument()
    expect(screen.getByText('Enabled')).toBeInTheDocument()
    expect(screen.getByText('Argo CD ManifestWork pull is disabled while Argo CD Agent is active.')).toBeInTheDocument()
    expect(screen.getByText('actual-binding')).toBeInTheDocument()
    expect(screen.queryByText('unrelated-binding')).not.toBeInTheDocument()
    expect(screen.queryByText('other-namespace-binding')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'fleet-placement' })).toHaveAttribute(
      'href',
      generatePath(NavigationPath.placementOverview, { namespace: 'openshift-gitops', name: 'fleet-placement' })
    )
    expect(screen.getByRole('link', { name: 'weekly-managed' })).toHaveAttribute(
      'href',
      generatePath(NavigationPath.clusterOverview, { namespace: 'weekly-managed', name: 'weekly-managed' })
    )
    expect(screen.queryByRole('term', { name: 'Status' })).not.toBeInTheDocument()
    expect(screen.queryByText(resource.status!.message!)).not.toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows disabled agent without claiming ManifestWork is configured', () => {
    renderGitOps([
      { ...resource, spec: { ...resource.spec, gitopsAddon: { enabled: true, argoCDAgent: { enabled: false } } } },
    ])
    expect(screen.getByText('Disabled')).toBeInTheDocument()
    expect(screen.getByText(/Argo CD Agent is disabled/)).toBeInTheDocument()
    expect(screen.queryByText(/ManifestWork/)).not.toBeInTheDocument()
  })

  it('handles an omitted addon and placement without inventing related resources', () => {
    renderGitOps([{ ...resource, spec: undefined, status: undefined }])
    expect(screen.getByText('Disabled')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText('actual-binding')).not.toBeInTheDocument()
    expect(screen.getAllByText('-')).toHaveLength(3)
  })

  it('includes all namespace bindings when the Placement does not restrict cluster sets', () => {
    renderGitOps([resource], [])
    expect(screen.getByText('actual-binding')).toBeInTheDocument()
    expect(screen.getByText('unrelated-binding')).toBeInTheDocument()
    expect(screen.queryByText('other-namespace-binding')).not.toBeInTheDocument()
  })

  it('shows an empty state with no create action', async () => {
    const { container } = renderGitOps([])
    expect(screen.getByRole('heading', { name: 'No GitOps configuration set up' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Create/ })).not.toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('displays the single resource without a search textbox', () => {
    renderGitOps()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'fleet-gitops' })).toBeInTheDocument()
  })

  it('warns about multiple resources and lets users explicitly select each resource', async () => {
    const second = { ...resource, metadata: { name: 'second-gitops', namespace: 'other' } }
    renderGitOps([resource, second])
    expect(screen.getByText(/Only one GitOpsCluster is supported/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'fleet-gitops' })).not.toBeInTheDocument()
    const selector = screen.getByRole('combobox', { name: 'GitOps configuration' })
    await userEvent.click(selector)
    await userEvent.click(await screen.findByRole('option', { name: 'openshift-gitops/fleet-gitops' }))
    expect(screen.getByRole('heading', { name: 'fleet-gitops' })).toBeInTheDocument()
    await userEvent.click(selector)
    await userEvent.click(await screen.findByRole('option', { name: 'other/second-gitops' }))
    expect(screen.getByRole('heading', { name: 'second-gitops' })).toBeInTheDocument()
    nockIgnoreRBAC()
    const request = nockDelete(second)
    const dialog = await openDelete()
    expect(within(dialog).getByText('Delete GitOps configuration second-gitops?')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(request.isDone()).toBe(true)
  })

  it('shows unavailable selected clusters rather than linking stale names after failure', () => {
    renderGitOps([
      {
        ...resource,
        status: {
          ...resource.status,
          phase: 'failed',
          conditions: [
            {
              type: 'ClustersRegistered',
              status: 'False',
              reason: 'PlacementNotFound',
              message: 'Placement unavailable',
            },
          ],
        },
      },
    ])
    expect(screen.queryByRole('term', { name: 'Status' })).not.toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'weekly' })).not.toBeInTheDocument()
  })

  it('does not link truncated cluster names or report an incomplete list as empty', () => {
    renderGitOps([{ ...resource, status: { phase: 'successful', message: 'Added managed clusters [week...' } }])
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'week' })).not.toBeInTheDocument()
    expect(screen.queryByText('None')).not.toBeInTheDocument()
  })

  it('cancels deletion without making a delete request', async () => {
    nockIgnoreRBAC()
    renderGitOps()
    const dialog = await openDelete()
    expect(await axe(dialog)).toHaveNoViolations()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'fleet-gitops' })).toBeInTheDocument()
  })

  it('deletes the selected namespaced resource after confirmation', async () => {
    nockIgnoreRBAC()
    const request = nockDelete(resource)
    renderGitOps()
    const dialog = await openDelete()
    expect(request.isDone()).toBe(false)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(request.isDone()).toBe(true)
  })

  it('keeps the confirmation open and displays deletion errors', async () => {
    nockIgnoreRBAC()
    const errorResponse = { apiVersion: 'v1', kind: 'Status', message: 'Delete forbidden' }
    const request = nockDelete(resource, errorResponse, 403)
    renderGitOps()
    const dialog = await openDelete()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText('Failed to delete GitOps configuration')).toBeInTheDocument()
    expect(screen.getByText('Delete forbidden')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(request.isDone()).toBe(true)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('disables delete when the resource-specific RBAC check denies permission', async () => {
    const request = nockRBAC(
      await rbacDelete(GitopsClusterDefinition, resource.metadata.namespace, resource.metadata.name),
      false
    )
    renderGitOps()
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await waitFor(() => expect(request.isDone()).toBe(true))
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveAttribute('aria-disabled', 'true')
    )
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    screen.getByRole('menuitem', { name: 'Delete' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(request.isDone()).toBe(true)
  })

  it('enables delete when the SSAR check throws a network error', async () => {
    const scope = nock(process.env.JEST_DEFAULT_HOST as string)
      .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews')
      .replyWithError('Network error')
    renderGitOps()
    await userEvent.click(screen.getByRole('button', { name: 'Actions' }))
    await waitFor(() => expect(scope.isDone()).toBe(true))
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Delete' })).not.toHaveAttribute('aria-disabled', 'true')
    )
    await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
