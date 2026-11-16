/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import { GitOpsClusterWizard } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterWizard'

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
  })

  it('renders the wizard with General and Placement steps', async () => {
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
    expect(screen.getByText('Enable Argo CD Agent')).toBeInTheDocument()
    expect(await screen.findByText('The hub cluster cannot be included in this Placement.')).toBeInTheDocument()
  })
})
