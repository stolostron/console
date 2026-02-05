/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { argoCDsState, managedClusterSetsState, namespacesState, subscriptionOperatorsState } from '../../atoms'
import {
  nockArgoGitBranches,
  nockArgoGitPathSha,
  nockArgoGitPathTree,
  nockIgnoreApiPaths,
  nockIgnoreOperatorCheck,
} from '../../lib/nock-util'
import { clickByRole, clickByText, typeByRole, waitForNocks, waitForText } from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import {
  GitOpsClusterApiVersion,
  GitOpsClusterKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
} from '../../resources'
import { gitOpsOperators, mockArgoCD, mockClusterSets } from '../../routes/Applications/Application.sharedmocks'
import { ArgoWizard, ArgoWizardProps } from './ArgoWizard'

const mockCreateclustersetcallback = jest.fn()
const mockGetgitchannelbranches = jest.fn().mockImplementation(async () => {
  return ['main']
})
const mockGetgitchannelpaths = jest.fn().mockImplementation(() => {
  return ['ansible']
})
const mockGetwizardsynceditor = jest.fn()
const mockOncancel = jest.fn()
const mockOnsubmit = jest.fn()

const mockNamespaces: Namespace[] = ['openshift-gitops'].map((name) => ({
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name },
}))

function TestArgoWizard() {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(subscriptionOperatorsState, gitOpsOperators)
        snapshot.set(managedClusterSetsState, mockClusterSets)
        snapshot.set(argoCDsState, [mockArgoCD])
        snapshot.set(namespacesState, mockNamespaces)
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.createApplicationArgo]}>
        <Routes>
          <Route path={NavigationPath.createApplicationArgo} element={<ArgoWizard {...props} />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

function TestArgoWizardPullModel() {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(subscriptionOperatorsState, gitOpsOperators)
        snapshot.set(managedClusterSetsState, mockClusterSets)
        snapshot.set(argoCDsState, [mockArgoCD])
        snapshot.set(namespacesState, mockNamespaces)
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.createApplicationArgo]}>
        <Routes>
          <Route path={NavigationPath.createApplicationArgo} element={<ArgoWizard {...props} isPullModel={true} />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

function TestArgoWizardWithGitGeneratorAppSets(testProps: Partial<ArgoWizardProps> = {}) {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(subscriptionOperatorsState, gitOpsOperators)
        snapshot.set(managedClusterSetsState, mockClusterSets)
        snapshot.set(argoCDsState, [mockArgoCD])
        snapshot.set(namespacesState, mockNamespaces)
      }}
    >
      <MemoryRouter initialEntries={[NavigationPath.createApplicationArgo]}>
        <Routes>
          <Route path={NavigationPath.createApplicationArgo} element={<ArgoWizard {...props} {...testProps} />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ArgoWizard tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should have danger alert', async () => {
    nockIgnoreOperatorCheck(true)
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={[NavigationPath.createApplicationArgo]}>
          <Routes>
            <Route path={NavigationPath.createApplicationArgo} element={<ArgoWizard {...props} />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('OpenShift GitOps Operator is required to create ApplicationSets.')
    await waitForText('Install the operator')
  })

  //=====================================================================
  //                      GIT
  //=====================================================================
  test('create git', async () => {
    nockIgnoreApiPaths()
    const url = 'https://github.com/fxiang1/app-samples'

    render(<TestArgoWizard />)

    //=====================================================================
    //                      general page
    //=====================================================================
    userEvent.type(
      screen.getByRole('textbox', {
        name: /name/i,
      }),
      'testapp'
    )
    await clickByRole('combobox', { name: 'Select the Argo server' })
    await clickByRole('option', { name: /http:\/\/argoserver\.com/i })
    await clickByText('Next')

    //=====================================================================
    //                      generators page
    //=====================================================================
    // Click on the generator to expand it
    await clickByText('Cluster Decision Resource Generator')
    await clickByRole('combobox', { name: 'Select the requeue time' })
    await clickByRole('option', { name: /120/i })
    await clickByText('Next')

    //=====================================================================
    //                      repository page
    //=====================================================================
    await clickByText('Git')
    await typeByRole(url, 'combobox', { name: /Enter or select a Git URL/i })

    const appBranchNocks = [nockArgoGitBranches(url, { branchList: [{ name: 'main' }] })]
    userEvent.click(
      screen.getByRole('option', {
        name: /https:\/\/github\.com\/fxiang1\/app-samples/i,
      })
    )

    await waitForNocks(appBranchNocks)
    await clickByRole('combobox', { name: /enter or select a tracking revision/i })
    const pathNocks = [
      nockArgoGitPathSha(url, 'main', { commit: { sha: '01' } }),
      nockArgoGitPathTree(url, { tree: [{ path: 'application-test', type: 'tree' }] }),
    ]

    await clickByRole('option', { name: /main/i })
    await waitForNocks(pathNocks)

    await typeByRole('ansible', 'combobox', { name: /enter or select a repository path/i })
    await clickByRole('option', {
      name: /ansible/i,
    })

    await typeByRole('default', 'textbox')

    await clickByText('Next')

    //=====================================================================
    //                      sync page
    //=====================================================================
    await clickByRole('checkbox', {
      name: /delete resources that are no longer defined in the source repository at the end of a sync operation/i,
    })
    await clickByRole('checkbox', {
      name: /only synchronize out-of-sync resources/i,
    })
    await clickByRole('checkbox', {
      name: /allow applications to have empty resources/i,
    })
    await clickByRole('checkbox', {
      name: /replace resources instead of applying changes from the source repository/i,
    })
    await clickByRole('checkbox', {
      name: /prune propagation policy/i,
    })
    await clickByRole('checkbox', {
      name: /automatically create namespace if it does not exist/i,
    })
    await clickByRole('checkbox', {
      name: /disable kubectl validation/i,
    })
    await clickByText('Next')

    //=====================================================================
    //                      placement page
    //=====================================================================
    await clickByText('New placement')
    await clickByRole('button', { name: 'Action' })
    await clickByRole('combobox', { name: 'Select the label' })
    await clickByRole('option', { name: /cloud/i })

    await clickByRole('combobox', {
      name: /select the operator/i,
    })
    await clickByRole('option', { name: /does not equal any of/i })

    await clickByRole('combobox', {
      name: /select the values/i,
    })
    await clickByRole('option', { name: /amazon/i })
    await clickByText('Next')

    //=====================================================================
    //                      review page
    //=====================================================================
    await clickByRole('button', { name: 'Submit' })
    expect(mockOnsubmit).toHaveBeenCalledWith(submittedGit)
  })

  test('various auto sync options', async () => {
    nockIgnoreApiPaths()
    const url = 'https://github.com/fxiang1/app-samples'

    render(<TestArgoWizard />)

    //=====================================================================
    //                      general page
    //=====================================================================
    userEvent.type(
      screen.getByRole('textbox', {
        name: /name/i,
      }),
      'testapp'
    )
    await clickByRole('combobox', { name: 'Select the Argo server' })
    await clickByRole('option', { name: /http:\/\/argoserver\.com/i })
    await clickByText('Next')

    //=====================================================================
    //                      generators page
    //=====================================================================
    // Click on the generator to expand it
    await clickByText('Cluster Decision Resource Generator')
    await clickByRole('combobox', { name: 'Select the requeue time' })
    await clickByRole('option', { name: /120/i })
    await clickByText('Next')

    //=====================================================================
    //                      repository page
    //=====================================================================
    await clickByText('Git')
    await typeByRole(url, 'combobox', { name: /Enter or select a Git URL/i })

    const appBranchNocks = [nockArgoGitBranches(url, { branchList: [{ name: 'main' }] })]
    userEvent.click(
      screen.getByRole('option', {
        name: /https:\/\/github\.com\/fxiang1\/app-samples/i,
      })
    )

    await waitForNocks(appBranchNocks)
    await clickByRole('combobox', { name: /enter or select a tracking revision/i })
    const pathNocks = [
      nockArgoGitPathSha(url, 'main', { commit: { sha: '01' } }),
      nockArgoGitPathTree(url, { tree: [{ path: 'application-test', type: 'tree' }] }),
    ]

    await clickByRole('option', { name: /main/i })
    await waitForNocks(pathNocks)

    await typeByRole('ansible', 'combobox', { name: /enter or select a repository path/i })
    await clickByRole('option', {
      name: /ansible/i,
    })

    await typeByRole('default', 'textbox')

    await clickByText('Next')

    //=====================================================================
    //                      sync page
    //=====================================================================
    const pruneCheckbox = screen.getByRole('checkbox', {
      name: /delete resources that are no longer defined in the source repository$/i,
    })
    await waitFor(() => expect(pruneCheckbox).toBeChecked())
    await clickByRole('checkbox', {
      name: /delete resources that are no longer defined in the source repository$/i,
    })
    await waitFor(() => expect(pruneCheckbox).not.toBeChecked())
    await clickByRole('checkbox', {
      name: /delete resources that are no longer defined in the source repository$/i,
    })
    await waitFor(() => expect(pruneCheckbox).toBeChecked())

    const selfHealCheckbox = screen.getByRole('checkbox', {
      name: /automatically sync when cluster state changes/i,
    })
    await clickByRole('checkbox', { name: /automatically sync when cluster state changes/i })
    await waitFor(() => expect(selfHealCheckbox).not.toBeChecked())

    await clickByRole('checkbox', { name: /automatically sync when cluster state changes/i })
    await waitFor(() => expect(selfHealCheckbox).toBeChecked())

    await clickByText('Next')

    //=====================================================================
    //                      placement page
    //=====================================================================
    await clickByText('New placement')
    await clickByRole('button', { name: 'Action' })
    await clickByRole('combobox', { name: 'Select the label' })
    await clickByRole('option', { name: /cloud/i })

    await clickByRole('combobox', {
      name: /select the operator/i,
    })
    await clickByRole('option', { name: /does not equal any of/i })

    await clickByRole('combobox', {
      name: /select the values/i,
    })
    await clickByRole('option', { name: /amazon/i })
    await clickByText('Next')

    //=====================================================================
    //                      review page
    //=====================================================================
    await clickByRole('button', { name: 'Submit' })

    const submitted = mockOnsubmit.mock.calls[0][0]
    expect(submitted[0].spec.template.spec.syncPolicy.automated).toEqual({ enabled: true, prune: true, selfHeal: true })
  })

  //=====================================================================
  //                      HELM
  //=====================================================================
  test('create helm', async () => {
    render(<TestArgoWizard />)

    //=====================================================================
    //                      general page
    //=====================================================================
    userEvent.type(
      screen.getByRole('textbox', {
        name: /name/i,
      }),
      'testapp'
    )
    userEvent.click(screen.getByPlaceholderText(/select the argo server/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /http:\/\/argoserver\.com/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )

    //=====================================================================
    //                      generators page - skip with defaults
    //=====================================================================
    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )

    //=====================================================================
    //                      repository page
    //=====================================================================
    userEvent.click(screen.getByText(/use a helm repository/i))
    await typeByRole('https://github.com/fxiang1/app-samples', 'combobox', { name: /enter or select a helm url/i })
    userEvent.click(
      screen.getByRole('option', {
        name: /https:\/\/github\.com\/fxiang1\/app-samples/i,
      })
    )
    userEvent.type(
      screen.getByRole('textbox', {
        name: /chart name/i,
      }),
      'chart'
    )
    userEvent.type(
      screen.getByRole('textbox', {
        name: /package version/i,
      }),
      '1.0.0'
    )
    userEvent.type(screen.getByPlaceholderText(/enter the destination namespace/i), 'default')

    //=====================================================================
    //                      placement page
    //=====================================================================
    userEvent.click(
      screen.getByRole('button', {
        name: /placement/i,
      })
    )
    userEvent.click(screen.getByText(/existing placement/i))
    userEvent.click(
      screen.getByRole('button', {
        name: /menu toggle/i,
      })
    )
    userEvent.click(
      screen.getByRole('option', {
        name: /placement1/i,
      })
    )

    //=====================================================================
    //                      review page
    //=====================================================================
    userEvent.click(
      screen.getByRole('button', {
        name: /review/i,
      })
    )

    userEvent.click(
      screen.getByRole('button', {
        name: /submit/i,
      })
    )

    expect(mockOnsubmit).toHaveBeenCalledWith(submittedHelm)
  })

  //=====================================================================
  //                      GIT - PULL MODEL
  //=====================================================================
  test('create git pull model', async () => {
    nockIgnoreApiPaths()
    const url = 'https://github.com/fxiang1/app-samples'

    render(<TestArgoWizardPullModel />)

    //=====================================================================
    //                      general page
    //=====================================================================
    userEvent.type(
      screen.getByRole('textbox', {
        name: /name/i,
      }),
      'testapp'
    )
    await clickByRole('combobox', { name: 'Select the Argo server' })
    await clickByRole('option', { name: /http:\/\/argoserver\.com/i })
    await clickByText('Next')

    //=====================================================================
    //                      generators page
    //=====================================================================
    // Click on the generator to expand it
    await clickByText('Cluster Decision Resource Generator')
    await clickByRole('combobox', { name: 'Select the requeue time' })
    await clickByRole('option', { name: /120/i })
    await clickByText('Next')

    //=====================================================================
    //                      repository page
    //=====================================================================
    await clickByText('Git')
    await typeByRole(url, 'combobox', { name: /Enter or select a Git URL/i })

    const appBranchNocks = [nockArgoGitBranches(url, { branchList: [{ name: 'main' }] })]
    userEvent.click(
      screen.getByRole('option', {
        name: /https:\/\/github\.com\/fxiang1\/app-samples/i,
      })
    )

    await waitForNocks(appBranchNocks)
    await clickByRole('combobox', { name: /enter or select a tracking revision/i })
    const pathNocks = [
      nockArgoGitPathSha(url, 'main', { commit: { sha: '01' } }),
      nockArgoGitPathTree(url, { tree: [{ path: 'application-test', type: 'tree' }] }),
    ]

    await clickByRole('option', { name: /main/i })
    await waitForNocks(pathNocks)

    await typeByRole('ansible', 'combobox', { name: /enter or select a repository path/i })
    await clickByRole('option', {
      name: /ansible/i,
    })

    await typeByRole('default', 'textbox')

    await clickByText('Next')

    //=====================================================================
    //                      sync page
    //=====================================================================
    await clickByText('Next')

    //=====================================================================
    //                      placement page - using default placement
    //                      which already excludes hub cluster for pull model
    //=====================================================================
    await clickByText('Next')

    //=====================================================================
    //                      review page
    //=====================================================================
    await clickByRole('button', { name: 'Submit' })
    expect(mockOnsubmit).toHaveBeenCalledWith(submittedGitPullModel)
  })

  //=====================================================================
  //                      gitGeneratorRepos tests
  //=====================================================================
  describe('gitGeneratorRepos extraction from applicationSets', () => {
    test('extracts git generator URLs, versions, and paths from regular git generators', async () => {
      nockIgnoreApiPaths()
      render(<TestArgoWizardWithGitGeneratorAppSets applicationSets={[mockAppSetWithGitGenerator]} />)

      // Navigate to general page
      userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'testapp')
      await clickByRole('combobox', { name: 'Select the Argo server' })
      await clickByRole('option', { name: /http:\/\/argoserver\.com/i })
      await clickByText('Next')

      // On generators page, click "Add generator" dropdown and select "Git generator"
      await clickByText('Add generator')
      await clickByText('Git generator')

      // Verify git generator URL options are populated from applicationSets
      const urlCombobox = screen.getByRole('combobox', { name: /Enter or select a Git URL/i })
      userEvent.click(urlCombobox)

      // Should see the URL from mockAppSetWithGitGenerator
      await waitForText('https://github.com/example/repo1')
    })

    test('extracts git generator info from matrix generators', async () => {
      nockIgnoreApiPaths()
      render(<TestArgoWizardWithGitGeneratorAppSets applicationSets={[mockAppSetWithMatrixGitGenerator]} />)

      // Navigate to general page
      userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'testapp')
      await clickByRole('combobox', { name: 'Select the Argo server' })
      await clickByRole('option', { name: /http:\/\/argoserver\.com/i })
      await clickByText('Next')

      // On generators page, click "Add generator" dropdown and select "Git generator"
      await clickByText('Add generator')
      await clickByText('Git generator')

      // Verify git generator URL options are populated from matrix generator
      const urlCombobox = screen.getByRole('combobox', { name: /Enter or select a Git URL/i })
      userEvent.click(urlCombobox)

      // Should see the URL from mockAppSetWithMatrixGitGenerator
      await waitForText('https://github.com/example/repo2')
    })

    test('deduplicates URLs, versions, and paths from multiple applicationSets', async () => {
      nockIgnoreApiPaths()
      // Include both an appset and one with duplicate values
      render(
        <TestArgoWizardWithGitGeneratorAppSets
          applicationSets={[mockAppSetWithGitGenerator, mockAppSetWithDuplicateGitInfo]}
        />
      )

      // Navigate to general page
      userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'testapp')
      await clickByRole('combobox', { name: 'Select the Argo server' })
      await clickByRole('option', { name: /http:\/\/argoserver\.com/i })
      await clickByText('Next')

      // On generators page, click "Add generator" dropdown and select "Git generator"
      await clickByText('Add generator')
      await clickByText('Git generator')

      // Verify git generator URL options are populated (duplicates should be removed)
      const urlCombobox = screen.getByRole('combobox', { name: /Enter or select a Git URL/i })
      userEvent.click(urlCombobox)

      // Should see the URL only once (deduplication via Set)
      const options = screen.getAllByRole('option')
      const repo1Options = options.filter((opt) => opt.textContent?.includes('https://github.com/example/repo1'))
      expect(repo1Options.length).toBe(1)
    })

    test('combines git info from multiple applicationSets', async () => {
      nockIgnoreApiPaths()
      render(
        <TestArgoWizardWithGitGeneratorAppSets
          applicationSets={[mockAppSetWithGitGenerator, mockAppSetWithMatrixGitGenerator]}
        />
      )

      // Navigate to general page
      userEvent.type(screen.getByRole('textbox', { name: /name/i }), 'testapp')
      await clickByRole('combobox', { name: 'Select the Argo server' })
      await clickByRole('option', { name: /http:\/\/argoserver\.com/i })
      await clickByText('Next')

      // On generators page, click "Add generator" dropdown and select "Git generator"
      await clickByText('Add generator')
      await clickByText('Git generator')

      // Verify both URLs are available
      const urlCombobox = screen.getByRole('combobox', { name: /Enter or select a Git URL/i })
      userEvent.click(urlCombobox)

      // Should see URLs from both applicationSets
      await waitForText('https://github.com/example/repo1')
      await waitForText('https://github.com/example/repo2')
    })
  })
})

const props: ArgoWizardProps = {
  createClusterSetCallback: mockCreateclustersetcallback,
  ansibleCredentials: [],
  argoServers: [
    {
      value: {
        apiVersion: GitOpsClusterApiVersion,
        kind: GitOpsClusterKind,
        metadata: {
          name: 'http://argoserver.com',
          namespace: 'http://argoserver.com',
        },
      },
      label: 'http://argoserver.com',
    },
  ],
  namespaces: [
    'aap',
    'default',
    'default-broker',
    'e2e-rbac-test-1',
    'e2e-rbac-test-2',
    'hive',
    'kube-node-lease',
    'kube-public',
    'kube-system',
    'local-cluster',
  ],
  applicationSets: [],
  placements: [{ metadata: { name: 'placement1', namespace: 'http://argoserver.com' } }],
  clusters: [
    {
      apiVersion: 'cluster.open-cluster-management.io/v1',
      kind: 'ManagedCluster',
      metadata: {
        labels: {
          cloud: 'Amazon',
          'cluster.open-cluster-management.io/clusterset': 'default',
          clusterID: '96ed9cd3-a3b3-412f-9bf1-4d9addeafc5f',
          'feature.open-cluster-management.io/addon-application-manager': 'available',
          'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
          'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
          'feature.open-cluster-management.io/addon-work-manager': 'available',
          'local-cluster': 'true',
          name: 'local-cluster',
          openshiftVersion: '4.11.24',
          'openshiftVersion-major': '4',
          'openshiftVersion-major-minor': '4.11',
          'velero.io/exclude-from-backup': 'true',
          vendor: 'OpenShift',
        },
        name: 'local-cluster',
      },
    },
  ],
  clusterSets: [
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSet',
      metadata: {
        name: 'default',
      },
    },
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSet',
      metadata: {
        name: 'global',
      },
    },
  ],
  clusterSetBindings: [
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta2',
      kind: 'ManagedClusterSetBinding',
      metadata: {
        name: 'global',
        namespace: 'open-cluster-management-global-set',
      },
      spec: {
        clusterSet: 'global',
      },
    },
  ],
  channels: [{ metadata: { name: 'channel1' }, spec: { type: 'type', pathname: 'pathname' } }],
  getGitRevisions: mockGetgitchannelbranches,
  getGitPaths: mockGetgitchannelpaths,
  yamlEditor: mockGetwizardsynceditor,
  onCancel: mockOncancel,
  onSubmit: mockOnsubmit,
  timeZones: [
    'America/New_York',
    'Africa/Abidjan',
    'Africa/Accra',
    'Africa/Addis_Ababa',
    'Africa/Algiers',
    'Africa/Asmara',
    'Africa/Asmera',
    'Africa/Bamako',
    'Africa/Bangui',
    'Africa/Banjul',
  ],
}

const submittedGit = [
  {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'ApplicationSet',
    metadata: {
      name: 'testapp',
      namespace: 'http://argoserver.com',
    },
    spec: {
      generators: [
        {
          clusterDecisionResource: {
            configMapRef: 'acm-placement',
            labelSelector: {
              matchLabels: {
                'cluster.open-cluster-management.io/placement': 'testapp-placement',
              },
            },
            requeueAfterSeconds: 120,
          },
        },
      ],
      template: {
        metadata: {
          labels: {
            'velero.io/exclude-from-backup': 'true',
          },
          name: 'testapp-{{name}}',
        },
        spec: {
          destination: {
            namespace: 'default',
            server: '{{server}}',
          },
          project: 'default',
          sources: [
            {
              path: 'ansible',
              repoURL: 'https://github.com/fxiang1/app-samples',
              repositoryType: 'git',
              targetRevision: 'main',
            },
          ],
          syncPolicy: {
            automated: {
              enabled: true,
              allowEmpty: true,
              prune: true,
              selfHeal: true,
            },
            syncOptions: [
              'CreateNamespace=false',
              'PruneLast=false',
              'ApplyOutOfSyncOnly=true',
              'Replace=true',
              'PrunePropagationPolicy=background',
              'Validate=true',
            ],
          },
        },
      },
    },
  },
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'Placement',
    metadata: {
      name: 'testapp-placement',
      namespace: 'http://argoserver.com',
    },
    spec: {
      predicates: [
        {
          requiredClusterSelector: {
            labelSelector: {
              matchExpressions: [
                {
                  key: 'cloud',
                  operator: 'NotIn',
                  values: ['Amazon'],
                },
              ],
            },
          },
        },
      ],
    },
  },
]

const submittedHelm = [
  {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'ApplicationSet',
    metadata: {
      name: 'testapp',
      namespace: 'http://argoserver.com',
    },
    spec: {
      generators: [
        {
          clusterDecisionResource: {
            configMapRef: 'acm-placement',
            labelSelector: {
              matchLabels: {
                'cluster.open-cluster-management.io/placement': 'placement1',
              },
            },
            requeueAfterSeconds: 180,
          },
        },
      ],
      template: {
        metadata: {
          labels: {
            'velero.io/exclude-from-backup': 'true',
          },
          name: 'testapp-{{name}}',
        },
        spec: {
          destination: {
            namespace: 'default',
            server: '{{server}}',
          },
          project: 'default',
          sources: [
            {
              chart: 'chart',
              repoURL: 'https://github.com/fxiang1/app-samples',
              targetRevision: '1.0.0',
              repositoryType: 'helm',
            },
          ],
          syncPolicy: {
            automated: {
              enabled: true,
              prune: true,
              selfHeal: true,
            },
            syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
          },
        },
      },
    },
  },
]

//=====================================================================
//                      gitGeneratorRepos mock data
//=====================================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAppSetWithGitGenerator: any = {
  apiVersion: 'argoproj.io/v1alpha1',
  kind: 'ApplicationSet',
  metadata: {
    name: 'git-appset',
    namespace: 'openshift-gitops',
  },
  spec: {
    generators: [
      {
        git: {
          repoURL: 'https://github.com/example/repo1',
          revision: 'main',
          directories: [{ path: 'apps/dev' }, { path: 'apps/prod' }],
        },
      },
    ],
    template: {
      metadata: { name: 'git-app-{{path.basename}}' },
      spec: {
        destination: { namespace: 'default', server: '{{server}}' },
        project: 'default',
        source: { path: '{{path}}', repoURL: 'https://github.com/example/repo1', targetRevision: 'main' },
      },
    },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAppSetWithMatrixGitGenerator: any = {
  apiVersion: 'argoproj.io/v1alpha1',
  kind: 'ApplicationSet',
  metadata: {
    name: 'matrix-git-appset',
    namespace: 'openshift-gitops',
  },
  spec: {
    generators: [
      {
        matrix: {
          generators: [
            {
              git: {
                repoURL: 'https://github.com/example/repo2',
                revision: 'develop',
                directories: [{ path: 'envs/staging' }],
              },
            },
            {
              clusterDecisionResource: {
                configMapRef: 'acm-placement',
                labelSelector: { matchLabels: { 'cluster.open-cluster-management.io/placement': 'test-placement' } },
                requeueAfterSeconds: 180,
              },
            },
          ],
        },
      },
    ],
    template: {
      metadata: { name: 'matrix-app-{{name}}' },
      spec: {
        destination: { namespace: 'default', server: '{{server}}' },
        project: 'default',
        source: { path: '{{path}}', repoURL: 'https://github.com/example/repo2', targetRevision: 'develop' },
      },
    },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAppSetWithDuplicateGitInfo: any = {
  apiVersion: 'argoproj.io/v1alpha1',
  kind: 'ApplicationSet',
  metadata: {
    name: 'duplicate-git-appset',
    namespace: 'openshift-gitops',
  },
  spec: {
    generators: [
      {
        git: {
          repoURL: 'https://github.com/example/repo1', // duplicate URL
          revision: 'main', // duplicate revision
          directories: [{ path: 'apps/dev' }], // duplicate path
        },
      },
    ],
    template: {
      metadata: { name: 'dup-app-{{path.basename}}' },
      spec: {
        destination: { namespace: 'default', server: '{{server}}' },
        project: 'default',
        source: { path: '{{path}}', repoURL: 'https://github.com/example/repo1', targetRevision: 'main' },
      },
    },
  },
}

const submittedGitPullModel = [
  {
    apiVersion: 'argoproj.io/v1alpha1',
    kind: 'ApplicationSet',
    metadata: {
      name: 'testapp',
      namespace: 'http://argoserver.com',
    },
    spec: {
      generators: [
        {
          clusterDecisionResource: {
            configMapRef: 'acm-placement',
            labelSelector: {
              matchLabels: {
                'cluster.open-cluster-management.io/placement': 'testapp-placement',
              },
            },
            requeueAfterSeconds: 120,
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
          labels: {
            'velero.io/exclude-from-backup': 'true',
            'apps.open-cluster-management.io/pull-to-ocm-managed-cluster': 'true',
          },
          name: 'testapp-{{name}}',
        },
        spec: {
          destination: {
            namespace: 'default',
            server: '{{server}}',
          },
          project: 'default',
          sources: [
            {
              path: 'ansible',
              repoURL: 'https://github.com/fxiang1/app-samples',
              repositoryType: 'git',
              targetRevision: 'main',
            },
          ],
          syncPolicy: {
            automated: {
              enabled: true,
              prune: true,
              selfHeal: true,
            },
            syncOptions: ['CreateNamespace=true', 'PruneLast=true'],
          },
        },
      },
    },
  },
  {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'Placement',
    metadata: {
      name: 'testapp-placement',
      namespace: 'http://argoserver.com',
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
      numberOfClusters: 1,
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
    },
  },
]
