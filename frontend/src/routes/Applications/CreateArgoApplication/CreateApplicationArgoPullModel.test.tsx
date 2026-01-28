/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
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
} from '../../../atoms'
import {
  nockArgoGitBranches,
  nockArgoGitPathSha,
  nockArgoGitPathTree,
  nockCreate,
  nockGet,
  nockIgnoreApiPaths,
  nockIgnoreOperatorCheck,
  nockList,
} from '../../../lib/nock-util'
import { clickByRole, clickByText, typeByRole, typeByTestId, waitForNocks, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
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
} from '../../../resources'
import { gitOpsOperators } from '../Application.sharedmocks'
import { CreateApplicationArgoPullModel } from './CreateApplicationArgoPullModel'
import { EditArgoApplicationSet } from './EditArgoApplicationSet'

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
          namespace: 'gitops-ns',
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
          namespace: 'gitops-ns',
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
    numberOfClusters: 1,
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
                key: 'name',
                operator: 'NotIn',
                values: ['local-cluster'],
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
    numberOfClusters: 1,
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
                key: 'name',
                operator: 'NotIn',
                values: ['local-cluster'],
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

jest.mock('react-router-dom-v5-compat', () => {
  const originalModule = jest.requireActual('react-router-dom-v5-compat')
  return {
    __esModule: true,
    ...originalModule,
    useParams: () => {
      return { name: argoAppSetGit?.metadata.name, namespace: argoAppSetGit?.metadata.namespace }
    },
  }
})

describe('Create Argo Application Set', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })
  const AddApplicationSet = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(placementsState, [mockPlacement])
          snapshot.set(gitOpsClustersState, [gitOpsCluster])
          snapshot.set(channelsState, [channelGit, channelHelm])
          snapshot.set(namespacesState, [namespace])
          snapshot.set(secretsState, [])
          snapshot.set(managedClusterSetsState, [clusterSet])
          snapshot.set(managedClusterSetBindingsState, [clusterSetBinding])
          snapshot.set(subscriptionOperatorsState, gitOpsOperators)
          snapshot.set(managedClustersState, [hubCluster])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createApplicationArgoPullModel]}>
          <Routes>
            <Route path={NavigationPath.createApplicationArgoPullModel} element={<CreateApplicationArgoPullModel />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  test('can create Argo Application Set with Git', async () => {
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
    render(<AddApplicationSet />)
    await waitForNocks(initialNocks)

    // General
    await typeByTestId('name', argoAppSetGit!.metadata!.name!)
    await clickByRole('combobox', { name: 'Select the Argo server' })
    await clickByText(gitOpsCluster!.spec!.argoServer!.argoNamespace)
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
    const createGitAppSetNocks = [nockCreate(argoAppSetGit), nockCreate(placementGit)]
    await clickByText('Submit')
    await waitForNocks(createGitAppSetNocks)
  })

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

  test('can render Edit Argo Application Page', async () => {
    nockList(
      {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'applicationsets',
      },
      [argoAppSetGit]
    )
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.editApplicationArgo]}>
          <Routes>
            <Route path={NavigationPath.editApplicationArgo} element={<EditArgoApplicationSet />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    await new Promise((resolve) => setTimeout(resolve, 500))
    await waitForText('Edit application set - Pull model')
  })
})
