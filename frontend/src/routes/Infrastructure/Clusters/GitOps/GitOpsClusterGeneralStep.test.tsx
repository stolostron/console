/* Copyright Contributors to the Open Cluster Management project */

import { EditMode, Step } from '@patternfly-labs/react-form-wizard'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '~/lib/nock-util'
import { GitOpsClusterKind } from '~/resources/gitops-cluster'
import { PlacementKind } from '~/resources/placement'
import { buildGitOpsClusterResources } from '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'
import { GitOpsClusterGeneralStep } from '~/routes/Infrastructure/Clusters/GitOps/GitOpsClusterGeneralStep'
import { WizardPage } from '~/wizards/WizardPage'

jest.mock('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources', () => {
  const actual = jest.requireActual('~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources')
  return {
    ...actual,
    collectMissingPermissions: jest.fn(async () => []),
  }
})

const { collectMissingPermissions } = jest.requireMock(
  '~/routes/Infrastructure/Clusters/GitOps/gitOpsClusterResources'
) as {
  collectMissingPermissions: jest.Mock
}

function renderGeneralStep(options?: {
  editMode?: EditMode
  resources?: ReturnType<typeof buildGitOpsClusterResources>
  namespaces?: string[]
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
        id="gitopscluster-general-step-test"
        title="GitOpsCluster General"
        onSubmit={async () => undefined}
        onCancel={() => undefined}
        editMode={editMode}
        defaultData={defaultData}
      >
        <Step label="General" id="general">
          <GitOpsClusterGeneralStep
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
          />
        </Step>
      </WizardPage>
    </MemoryRouter>
  )
}

describe('GitOpsClusterGeneralStep', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    nockIgnoreRBAC()
    collectMissingPermissions.mockReset()
    collectMissingPermissions.mockResolvedValue([])
  })

  it('renders name, namespace, and agent checkbox accessibly', async () => {
    const { container } = renderGeneralStep()

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Namespace')).toBeInTheDocument()
    expect(screen.getByText('Enable Argo CD Agent')).toBeInTheDocument()
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

  it('shows push model checkbox only when Argo CD Agent is enabled', async () => {
    const user = userEvent.setup()
    renderGeneralStep()

    expect(screen.queryByText('Enable Push model with Argo CD Agent')).not.toBeInTheDocument()

    await user.click(screen.getByText('Enable Argo CD Agent'))

    expect(await screen.findByText('Enable Push model with Argo CD Agent')).toBeInTheDocument()
  })

  it('disables name and namespace in edit mode', async () => {
    renderGeneralStep({
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
  })

  it('shows a permission alert when required permissions are missing', async () => {
    collectMissingPermissions.mockResolvedValue([
      {
        kind: 'GitOpsCluster',
        verb: 'create',
        namespace: 'openshift-gitops',
      },
    ])

    renderGeneralStep({
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
})
