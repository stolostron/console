/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import { GitOpsClusterWizard } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterWizard'

jest.mock('~/hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

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

  it('renders general step accessibly with agent checkbox', async () => {
    const { container } = render(
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
    await waitFor(() => expect(screen.getByText('Enable Argo CD Agent')).toBeInTheDocument())
    // Wizard mounts all steps; Placement array inputs reuse field ids (framework limitation)
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
})
