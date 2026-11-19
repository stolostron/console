/* Copyright Contributors to the Open Cluster Management project */
import { act, render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { cloneDeep, set } from 'lodash'
import YAML from 'yaml'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { defaultContext, PluginDataContext } from '~/lib/PluginDataContext'
import {
  channelsState,
  gitOpsClustersState,
  managedClusterSetBindingsState,
  managedClusterSetsState,
  managedClustersState,
  namespacesState,
  placementsState,
  secretsState,
  subscriptionOperatorsState,
} from '~/atoms'
import {
  nockArgoGitBranches,
  nockArgoGitPathSha,
  nockArgoGitPathTree,
  nockCreate,
  nockGet,
  nockIgnoreApiPaths,
  nockIgnoreOperatorCheck,
  nockIgnorePlacementDebug,
  nockList,
} from '~/lib/nock-util'
import {
  clickByRole,
  clickByText,
  createClusterVersionMock,
  typeByRole,
  typeByTestId,
  waitForNocks,
  waitForText,
} from '~/lib/test-util'

const mockUseClusterVersion = createClusterVersionMock()
jest.mock('~/hooks/use-cluster-version', () => ({
  useClusterVersion: () => mockUseClusterVersion(),
}))
import { NavigationPath } from '~/NavigationPath'
import {
  ApplicationSet,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  Channel,
  ChannelApiVersion,
  ChannelKind,
  GitOpsCluster,
  GitOpsClusterApiVersion,
  GitOpsClusterKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  ManagedClusterSet,
  ManagedClusterSetApiVersion,
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
  ManagedClusterSetKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  Placement,
  PlacementApiVersionBeta,
  PlacementKind,
  Secret,
  SecretApiVersion,
  SecretKind,
} from '~/resources'
import { gitOpsOperators } from '~/routes/Applications/Application.sharedmocks'
import { CreatePullApplicationSet } from './CreatePullApplicationSet'
import { EditApplicationSetPage } from './EditApplicationSetPage'
import { APPLICATION_SET_GITOPS_MODEL_ANNOTATION } from '~/resources/application-set'

const gitOpsCluster: GitOpsCluster = {
  apiVersion: GitOpsClusterApiVersion,
  kind: GitOpsClusterKind,
  metadata: {
    name: 'argo-server-1',
    namespace: 'argo-server-1',
  },
  spec: {
    argoServer: {
      argoNamespace: 'argo-server-1',
    },
    placementRef: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      name: 'mock-placement',
    },
  },
}

const channelGit: Channel = {
  apiVersion: ChannelApiVersion,
  kind: ChannelKind,
  metadata: {
    name: 'channel-01',
    namespace: 'application-01',
  },
  spec: {
    pathname: 'https://github.com/stolostron/application-lifecycle-samples',
    type: 'Git',
    // secretRef: {
    //     name: 'secret-01',
    // },
  },
}

const channelHelm: Channel = {
  apiVersion: ChannelApiVersion,
  kind: ChannelKind,
  metadata: {
    name: 'channel-01',
    namespace: 'channels',
  },
  spec: {
    pathname: 'http://multiclusterhub-repo.open-cluster-management.svc.cluster.local:3000/charts',
    type: 'HelmRepo',
    // secretRef: {
    //     name: 'secret-01',
    // },
  },
}

const clusterSet: ManagedClusterSet = {
  apiVersion: ManagedClusterSetApiVersion,
  kind: ManagedClusterSetKind,
  metadata: {
    name: 'cluster-set-01',
    namespace: 'argo-server-1',
  },
  spec: {
    clusterSet: 'cluster-set-01',
  },
}

const clusterSetBinding: ManagedClusterSetBinding = {
  apiVersion: ManagedClusterSetBindingApiVersion,
  kind: ManagedClusterSetBindingKind,
  metadata: {
    name: 'cluster-set-binding-01',
    namespace: 'argo-server-1',
  },
  spec: {
    clusterSet: 'cluster-set-01',
  },
}

const namespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: 'default',
  },
}

const gitSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'secret-01',
    namespace: 'application-01',
  },
  stringData: {},
}

const argoAppSetGit: ApplicationSet = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationSetKind,
  metadata: {
    name: 'application-01',
    namespace: 'argo-server-1',
  },
  spec: {
    syncPolicy: {
      preserveResourcesOnDeletion: false,
    },
    generators: [
      {
        clusterDecisionResource: {
          configMapRef: 'acm-placement',
          labelSelector: {
            matchLabels: {
              'cluster.open-cluster-management.io/placement': 'application-01-placement',
            },
          },
          requeueAfterSeconds: 180,
        },
      },
    ],
    template: {
      metadata: {
        annotations: {
          'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}',
          'apps.open-cluster-management.io/ocm-managed-cluster-app-namespace': 'openshift-gitops',
          'argocd.argoproj.io/skip-reconcile': 'true',
        },
        name: 'application-01-{{name}}',
        labels: {
          'velero.io/exclude-from-backup': 'true',
          'apps.open-cluster-management.io/pull-to-ocm-managed-cluster': 'true',
        },
      },
      spec: {
        project: 'default',
        sources: [
          {
            repositoryType: 'git',
            repoURL: channelGit.spec.pathname,
            targetRevision: 'branch-01',
            path: 'application-test',
          },
        ],
        destination: {
          namespace: 'application-01gitops-ns',
          server: '{{server}}',
        },
        syncPolicy: {
          automated: { enabled: true, selfHeal: true, prune: true },
          syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
        },
      },
    },
  },
}

const chartName = 'multicluster-test-chart'

const argoAppSetHelm: ApplicationSet = {
  apiVersion: ApplicationSetApiVersion,
  kind: ApplicationSetKind,
  metadata: {
    name: 'helm-application-01',
    namespace: 'argo-server-1',
  },
  spec: {
    syncPolicy: {
      preserveResourcesOnDeletion: false,
    },
    generators: [
      {
        clusterDecisionResource: {
          configMapRef: 'acm-placement',
          labelSelector: {
            matchLabels: {
              'cluster.open-cluster-management.io/placement': 'helm-application-01-placement',
            },
          },
          requeueAfterSeconds: 180,
        },
      },
    ],

    template: {
      metadata: {
        annotations: {
          'apps.open-cluster-management.io/ocm-managed-cluster': '{{name}}',
          'apps.open-cluster-management.io/ocm-managed-cluster-app-namespace': 'openshift-gitops',
          'argocd.argoproj.io/skip-reconcile': 'true',
        },
        name: 'helm-application-01-{{name}}',
        labels: {
          'velero.io/exclude-from-backup': 'true',
          'apps.open-cluster-management.io/pull-to-ocm-managed-cluster': 'true',
        },
      },
      spec: {
        project: 'default',
        sources: [
          {
            repositoryType: 'helm',
            repoURL: channelHelm.spec.pathname,
            chart: chartName,
            targetRevision: 'v1',
          },
        ],
        destination: {
          namespace: 'helm-application-01gitops-ns',
          server: '{{server}}',
        },
        syncPolicy: {
          automated: { enabled: true, selfHeal: true, prune: true },
          syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
        },
      },
    },
  },
}

const mockPlacement: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: 'mock-placement',
    namespace: gitOpsCluster.metadata.namespace,
  },
  spec: {
    clusterSets: ['cluster-set-01'],
  },
}

const placementGit: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: `${argoAppSetGit.metadata.name}-placement`,
    namespace: gitOpsCluster.metadata.namespace,
  },
  spec: {
    tolerations: [
      {
        key: 'cluster.open-cluster-management.io/unreachable',
        operator: 'Exists',
      },
      {
        key: 'cluster.open-cluster-management.io/unavailable',
        operator: 'Exists',
      },
    ],
    predicates: [
      {
        requiredClusterSelector: {
          labelSelector: {
            matchExpressions: [
              {
                key: 'local-cluster',
                operator: 'NotIn',
                values: ['true'],
              },
            ],
          },
        },
      },
    ],
    clusterSets: [clusterSetBinding.spec.clusterSet],
  },
}

const placementHelm: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: `${argoAppSetHelm.metadata.name}-placement`,
    namespace: gitOpsCluster.metadata.namespace,
  },
  spec: {
    tolerations: [
      {
        key: 'cluster.open-cluster-management.io/unreachable',
        operator: 'Exists',
      },
      {
        key: 'cluster.open-cluster-management.io/unavailable',
        operator: 'Exists',
      },
    ],
    predicates: [
      {
        requiredClusterSelector: {
          labelSelector: {
            matchExpressions: [
              {
                key: 'local-cluster',
                operator: 'NotIn',
                values: ['true'],
              },
            ],
          },
        },
      },
    ],
    clusterSets: [clusterSetBinding.spec.clusterSet],
  },
}

const hubCluster: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'local-cluster',
    namespace: 'local-cluster',
    labels: {
      'local-cluster': 'true',
    },
  },
}

jest.mock('react-router', () => {
  const originalModule = jest.requireActual('react-router')
  return {
    __esModule: true,
    ...originalModule,
    useParams: () => {
      return { name: argoAppSetGit?.metadata.name, namespace: argoAppSetGit?.metadata.namespace }
    },
  }
})

const gitOpsClusterAgentEnabled: GitOpsCluster = {
  ...gitOpsCluster,
  metadata: {
    name: 'argo-server-agent',
    namespace: 'argo-server-agent',
  },
  spec: {
    ...gitOpsCluster.spec,
    gitopsAddon: {
      enabled: true,
      argoCDAgent: {
        enabled: true,
      },
    },
  },
}

describe('Create Argo Application Set', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
    nockIgnorePlacementDebug()
  })
  const AddApplicationSet = ({ agentMode = false }: { agentMode?: boolean }) => {
    return (
      <StateProvider
        initializeStore={(store) => {
          store.set(placementsState, [mockPlacement])
          store.set(gitOpsClustersState, [
            {
              ...gitOpsCluster,
              spec: { ...gitOpsCluster.spec, gitopsAddon: { enabled: agentMode, argoCDAgent: { enabled: agentMode } } },
            },
          ])
          store.set(channelsState, [channelGit, channelHelm])
          store.set(namespacesState, [namespace])
          store.set(secretsState, [])
          store.set(managedClusterSetsState, [clusterSet])
          store.set(managedClusterSetBindingsState, [clusterSetBinding])
          store.set(subscriptionOperatorsState, gitOpsOperators)
          store.set(managedClustersState, [hubCluster])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createApplicationArgoPullModel]}>
          <Routes>
            <Route path={NavigationPath.createApplicationArgoPullModel} element={<CreatePullApplicationSet />} />
          </Routes>
        </MemoryRouter>
      </StateProvider>
    )
  }

  test.each([false, true])(
    'waits for resource loading before guarding the direct Pull URL; GitOpsCluster arrives: %s',
    async (gitOpsClusterArrives) => {
      let loadGitOpsCluster = () => {}
      const renderRoute = (loadCompleted: boolean) => (
        <PluginDataContext.Provider value={{ ...defaultContext, loadCompleted }}>
          <StateProvider
            initializeStore={(store) => {
              store.set(subscriptionOperatorsState, gitOpsOperators)
              loadGitOpsCluster = () => store.set(gitOpsClustersState, [gitOpsCluster])
            }}
          >
            <MemoryRouter initialEntries={[NavigationPath.createApplicationArgoPullModel]}>
              <Routes>
                <Route path={NavigationPath.createApplicationArgoPullModel} element={<CreatePullApplicationSet />} />
                <Route path={NavigationPath.applications} element={<h1>Applications landing</h1>} />
              </Routes>
            </MemoryRouter>
          </StateProvider>
        </PluginDataContext.Provider>
      )

      const { container, rerender } = render(renderRoute(false))
      expect(screen.getByRole('heading', { name: 'Loading' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Applications landing' })).not.toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Create application set - Pull model' })).not.toBeInTheDocument()
      expect(await axe(container)).toHaveNoViolations()

      if (gitOpsClusterArrives) {
        nockList({ apiVersion: ApplicationSetApiVersion, kind: ApplicationSetKind }, [])
        act(loadGitOpsCluster)
      }
      rerender(renderRoute(true))

      const expectedHeading = gitOpsClusterArrives ? 'Create application set - Pull model' : 'Applications landing'
      expect(await screen.findByRole('heading', { name: expectedHeading, level: 1 })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' }) !== null).toBe(gitOpsClusterArrives)
    }
  )

  test('shows ManifestWork pull model badge when agent mode is disabled', async () => {
    nockList(
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'applicationsets',
      },
      [argoAppSetGit]
    )
    render(<AddApplicationSet />)
    await waitForText('GitOps model: ManifestWork pull')
  })

  test('shows Agent pull model badge when agent mode is enabled', async () => {
    nockList(
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'applicationsets',
      },
      [argoAppSetGit]
    )
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(placementsState, [mockPlacement])
          store.set(gitOpsClustersState, [gitOpsClusterAgentEnabled])
          store.set(channelsState, [channelGit, channelHelm])
          store.set(namespacesState, [namespace])
          store.set(secretsState, [])
          store.set(managedClusterSetsState, [clusterSet])
          store.set(managedClusterSetBindingsState, [clusterSetBinding])
          store.set(subscriptionOperatorsState, gitOpsOperators)
          store.set(managedClustersState, [hubCluster])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createApplicationArgoPullModel]}>
          <Routes>
            <Route path={NavigationPath.createApplicationArgoPullModel} element={<CreatePullApplicationSet />} />
          </Routes>
        </MemoryRouter>
      </StateProvider>
    )
    await waitForText('GitOps model: Argo CD Agent pull')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create application set - Agent pull model')
    await clickByRole('switch', { name: 'YAML' })
    const editor = screen.getByRole('textbox', { name: 'monaco' })
    await waitFor(() => expect(editor).not.toHaveValue(''))
    const applicationSet = YAML.parseAllDocuments((editor as HTMLTextAreaElement).value)
      .map((document) => document.toJSON())
      .find((resource) => resource.kind === ApplicationSetKind)
    expect(applicationSet.metadata.annotations).toEqual({ [APPLICATION_SET_GITOPS_MODEL_ANNOTATION]: 'agent' })
    expect(applicationSet.spec.template.metadata).not.toHaveProperty('annotations')
    expect(applicationSet.spec.template.metadata.labels).toEqual({ 'velero.io/exclude-from-backup': 'true' })
    await clickByRole('switch', { name: 'YAML' })
  })

  test.each([{ agentMode: false }, { agentMode: true }])(
    'creates a Git pull ApplicationSet with Agent mode $agentMode',
    async ({ agentMode }) => {
      const initialNocks = [
        nockGet(gitSecret),
        nockList(
          {
            apiVersion: 'argoproj.io/v1alpha1',
            kind: 'applicationsets',
          },
          [argoAppSetGit]
        ),
      ]
      render(<AddApplicationSet agentMode={agentMode} />)
      await waitForNocks(initialNocks)

      // General
      await typeByTestId('name', argoAppSetGit!.metadata!.name!)
      expect(screen.getByRole('combobox', { name: 'Select the Argo server' })).toHaveProperty('disabled', agentMode)
      const namespaceInput = screen.queryByRole<HTMLInputElement>('textbox', { name: /^Namespace\b/i })
      expect(namespaceInput?.disabled).toBe(agentMode ? true : undefined)
      expect(namespaceInput?.value).toBe(agentMode ? gitOpsCluster.spec!.argoServer!.argoNamespace : undefined)
      if (!agentMode) {
        await clickByRole('combobox', { name: 'Select the Argo server' })
        await clickByText(gitOpsCluster!.spec!.argoServer!.argoNamespace)
      }
      await clickByText('Next')

      // Generators - skip with default
      await clickByText('Next')

      // Repository
      await clickByText('Git')
      await clickByRole('combobox', { name: /Enter or select a Git URL/i })

      const appBranchNocks = [nockArgoGitBranches(channelGit.spec.pathname, { branchList: [{ name: 'branch-01' }] })]
      await clickByText(channelGit.spec.pathname)
      await waitForNocks(appBranchNocks)

      await clickByRole('combobox', { name: /enter or select a tracking revision/i })
      const pathNocks = [
        nockArgoGitPathSha(channelGit.spec.pathname, 'branch-01', { commit: { sha: '01' } }),
        nockArgoGitPathTree(channelGit.spec.pathname, { tree: [{ path: 'application-test', type: 'tree' }] }),
      ]
      await clickByRole('option', { name: /branch-01/i })
      await waitForNocks(pathNocks)

      await clickByRole('combobox', { name: 'Enter or select a repository path' })
      await clickByRole('option', { name: /application-test/i })

      await typeByRole('gitops-ns', 'textbox')
      await clickByText('Next')

      // Sync policy
      await clickByText('Next')

      // Placement
      await clickByRole('combobox', { name: /select the cluster sets/i })
      await clickByText(clusterSetBinding.spec.clusterSet)
      await clickByText('Next')

      // Review
      const expectedApplicationSet: ApplicationSet = JSON.parse(JSON.stringify(argoAppSetGit))
      if (agentMode) {
        expectedApplicationSet.metadata.annotations = { 'apps.open-cluster-management.io/gitops-model': 'agent' }
        delete expectedApplicationSet.spec.template!.metadata!.annotations
        delete expectedApplicationSet.spec.template!.metadata!.labels![
          'apps.open-cluster-management.io/pull-to-ocm-managed-cluster'
        ]
        expectedApplicationSet.spec.template!.spec!.destination = {
          name: '{{name}}',
          namespace: argoAppSetGit.spec.template!.spec!.destination!.namespace,
        }
      }
      const createGitAppSetNocks = [nockCreate(expectedApplicationSet), nockCreate(placementGit)]
      await clickByText('Submit')
      await waitForNocks(createGitAppSetNocks)
    }
  )

  test('can create an Application Set with Helm', async () => {
    nockList(
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'applicationsets',
      },
      [argoAppSetGit]
    )
    render(<AddApplicationSet />)

    // appset name
    await typeByTestId('name', argoAppSetHelm!.metadata!.name!)

    // select argoServer
    await clickByRole('combobox', { name: 'Select the Argo server' })
    await clickByText(gitOpsCluster!.spec!.argoServer!.argoNamespace)

    // next - Generators
    await clickByText('Next')

    // Generators - skip with default
    await clickByText('Next')

    // repository type
    await clickByText('Helm')

    // channel
    await clickByRole('combobox', { name: 'Enter or select a Helm URL' })
    await clickByText(channelHelm.spec.pathname)
    // // nock.recorder.rec()

    await typeByRole(chartName, 'textbox', undefined, 0)
    await typeByRole('v1', 'textbox', undefined, 1)

    // remote namespace
    await typeByRole('gitops-ns', 'textbox', undefined, 2)
    await clickByText('Next')

    // sync policy
    await clickByText('Next')

    // placement
    await clickByRole('combobox', { name: 'Select the cluster sets' })
    await clickByText(clusterSetBinding.spec.clusterSet)

    // submit
    const createHelmAppSetNocks = [nockCreate(argoAppSetHelm), nockCreate(placementHelm)]
    await clickByText('Next')
    await clickByText('Submit')

    await waitForNocks(createHelmAppSetNocks)
  })

  test.each([false, true])(
    'opens the Pull edit wizard for Agent mode %s without global GitOps configuration',
    async (agent) => {
      const resource = cloneDeep(argoAppSetGit)
      if (agent) {
        resource.metadata.annotations = { [APPLICATION_SET_GITOPS_MODEL_ANNOTATION]: 'agent' }
        set(resource, 'spec.template.metadata.annotations', {})
        set(resource, 'spec.template.spec.destination', { name: '{{name}}', namespace: 'guestbook' })
      }
      const applicationSetNock = nockList(
        {
          apiVersion: 'argoproj.io/v1alpha1',
          kind: 'applicationsets',
        },
        [resource]
      )
      render(
        <StateProvider>
          <MemoryRouter initialEntries={[NavigationPath.editApplicationArgo]}>
            <Routes>
              <Route path={NavigationPath.editApplicationArgo} element={<EditApplicationSetPage />} />
            </Routes>
          </MemoryRouter>
        </StateProvider>
      )

      await waitForNocks([applicationSetNock])
      await waitForText(agent ? 'Edit application set - Agent pull model' : 'Edit application set - Pull model')
    }
  )
})
