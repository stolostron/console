/* Copyright Contributors to the Open Cluster Management project */
import { ArgoWizard, ArgoWizardProps } from './ArgoWizard'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { NavigationPath } from '../../NavigationPath'
import { waitForNocks, waitForText } from '../../lib/test-util'
import { argoCDsState, managedClusterSetsState, namespacesState, subscriptionOperatorsState } from '../../atoms'
import { gitOpsOperators, mockArgoCD, mockClusterSets } from '../../routes/Applications/Application.sharedmocks'
import { nockCreate, nockIgnoreApiPaths, nockIgnoreOperatorCheck } from '../../lib/nock-util'
import {
  GitOpsCluster,
  GitOpsClusterApiVersion,
  GitOpsClusterKind,
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  Placement,
  PlacementApiVersionBeta,
  PlacementKind,
} from '../../resources'

const mockCreateclustersetcallback = jest.fn()
const mockGetgitchannelbranches = jest.fn().mockImplementation(() => {
  return ['main']
})
const mockGetgitchannelpaths = jest.fn().mockImplementation(() => {
  return ['ansible']
})
const mockGetwizardsynceditor = jest.fn()
const mockOncancel = jest.fn()
const mockOnsubmit = jest.fn()

const gitOpsCluster: GitOpsCluster = {
  apiVersion: GitOpsClusterApiVersion,
  kind: GitOpsClusterKind,
  metadata: {
    name: 'test-gitops',
    namespace: 'openshift-gitops',
  },
  spec: {
    argoServer: {
      argoNamespace: 'openshift-gitops',
    },
    placementRef: {
      kind: PlacementKind,
      apiVersion: PlacementApiVersionBeta,
      name: 'test-gitops-placement',
    },
  },
}

const managedClusterSetBinding: ManagedClusterSetBinding = {
  apiVersion: ManagedClusterSetBindingApiVersion,
  kind: ManagedClusterSetBindingKind,
  metadata: {
    name: 'default',
    namespace: 'openshift-gitops',
  },
  spec: {
    clusterSet: 'default',
  },
}

const placement: Placement = {
  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
  kind: 'Placement',
  metadata: {
    name: 'test-gitops-placement',
    namespace: 'openshift-gitops',
  },
  spec: {
    clusterSets: ['default'],
  },
}

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

  test('CreateArgoResources', async () => {
    nockIgnoreApiPaths()
    render(<TestArgoWizard />)
    userEvent.click(screen.getByText(/select the argo server/i))
    userEvent.click(screen.getByRole('button', { name: /add argo server/i }))

    //fill the form

    userEvent.type(
      screen.getByRole('textbox', {
        name: /name/i,
      }),
      'test-gitops'
    )

    userEvent.click(screen.getByPlaceholderText(/select the namespace/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /openshift-gitops/i,
      })
    )

    userEvent.click(
      screen.getByRole('button', {
        name: /add/i,
      })
    )
  })

  //=====================================================================
  //                      GIT
  //=====================================================================
  test('create git', async () => {
    nockIgnoreApiPaths()
    const { container } = render(<TestArgoWizard />)

    //=====================================================================
    //                      general page
    //=====================================================================
    userEvent.type(
      screen.getByRole('textbox', {
        name: /name/i,
      }),
      'testapp'
    )
    userEvent.click(screen.getByText(/select the argo server/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /http:\/\/argoserver\.com/i,
      })
    )
    userEvent.click(screen.getByText(/180/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /120/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )

    //=====================================================================
    //                      template page
    //=====================================================================
    userEvent.click(screen.getByText(/use a git repository/i))
    userEvent.click(screen.getByText(/enter or select a git url/i))
    userEvent.type(screen.getByRole('searchbox'), 'https://github.com/fxiang1/app-samples')
    userEvent.click(
      screen.getByRole('option', {
        name: /create "https:\/\/github\.com\/fxiang1\/app-samples"/i,
      })
    )
    const dropdown = container.querySelector(
      '#spec-template-spec-source-targetrevision-form-group > div:nth-child(2) > div > div > div'
    )
    if (dropdown) {
      userEvent.click(dropdown)
    }

    const initialNocks = [
      nockCreate(gitOpsCluster, undefined, 201, { dryRun: 'All' }),
      nockCreate(gitOpsCluster, gitOpsCluster, 400),
      nockCreate(managedClusterSetBinding, undefined, 201, { dryRun: 'All' }),
      nockCreate(placement, undefined, 201, { dryRun: 'All' }),
    ]

    await waitForNocks(initialNocks)

    userEvent.type(screen.getByRole('textbox'), 'default')
    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )
    //=====================================================================
    //                      sync page
    //=====================================================================
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /delete resources that are no longer defined in the source repository at the end of a sync operation/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /only synchronize out-of-sync resources/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /allow applications to have empty resources/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /replace resources instead of applying changes from the source repository/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /prune propagation policy/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /automatically create namespace if it does not exist/i,
      })
    )
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /disable kubectl validation/i,
      })
    )
    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )

    //=====================================================================
    //                      placement page
    //=====================================================================
    userEvent.click(screen.getByText(/new placement/i))
    userEvent.click(
      screen.getByRole('button', {
        name: /action/i,
      })
    )
    userEvent.click(screen.getByText(/select the label/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /cloud/i,
      })
    )
    userEvent.click(screen.getByText(/equals any of/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /does not equal any of/i,
      })
    )
    userEvent.click(screen.getByText(/select the values/i))
    userEvent.click(screen.getByText(/amazon/i))
    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )

    //=====================================================================
    //                      review page
    //=====================================================================
    userEvent.click(
      screen.getByRole('button', {
        name: /submit/i,
      })
    )
    expect(mockOnsubmit).toHaveBeenCalledWith(submittedGit)
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
    userEvent.click(screen.getByText(/select the argo server/i))
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
    //                      template page
    //=====================================================================
    userEvent.click(screen.getByText(/use a helm repository/i))
    userEvent.click(screen.getByText(/enter or select a helm url/i))
    userEvent.type(screen.getByRole('searchbox'), 'https://github.com/fxiang1/app-samples')
    userEvent.click(
      screen.getByRole('option', {
        name: /create "https:\/\/github\.com\/fxiang1\/app-samples"/i,
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
        name: /options menu/i,
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
              repoURL: 'https://github.com/fxiang1/app-samples',
              repositoryType: 'git',
            },
          ],
          syncPolicy: {
            automated: {
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
