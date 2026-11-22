/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { t } from 'i18next'
import { MemoryRouter } from 'react-router'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import { GitOpsClusterWizard } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterWizard'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import { ManagedClusterSetBindingKind, type ManagedClusterSetBinding } from '~/resources/managed-cluster-set-binding'
import { PlacementApiVersionBeta, PlacementKind, type Placement } from '~/resources/placement'
import {
  buildGitOpsClusterResources,
  collectMissingPermissions,
  GITOPS_BINDING_OWNER_ANNOTATION,
} from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'

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
    nockIgnoreApiPaths()
    nockIgnoreRBAC()
    jest.mocked(collectMissingPermissions).mockReset().mockResolvedValue([])
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
      apiVersion: PlacementApiVersionBeta,
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
