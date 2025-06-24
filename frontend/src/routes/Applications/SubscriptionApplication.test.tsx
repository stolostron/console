/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, generatePath } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { NavigationPath } from '../../NavigationPath'
import {
  Application,
  ApplicationApiVersion,
  ApplicationKind,
  Channel,
  ChannelApiVersion,
  ChannelKind,
  ManagedCluster,
  ManagedClusterSetBinding,
  ManagedClusterSetBindingApiVersion,
  ManagedClusterSetBindingKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  Placement,
  PlacementApiVersionBeta,
  PlacementKind,
  PlacementRule,
  PlacementRuleApiVersion,
  PlacementRuleKind,
  Project,
  ProjectApiVersion,
  ProjectKind,
  ProviderConnection,
  ProviderConnectionApiVersion,
  ProviderConnectionKind,
  Secret,
  SecretApiVersion,
  SecretKind,
  Subscription,
  SubscriptionApiVersion,
  SubscriptionKind,
} from '../../resources'
import CreateSubscriptionApplicationPage from './SubscriptionApplication'
import {
  applicationsState,
  channelsState,
  managedClusterSetsState,
  managedClustersState,
  namespacesState,
  placementsState,
  secretsState,
} from '../../atoms'
import {
  clickBySelector,
  clickByTestId,
  clickByText,
  typeByTestId,
  waitForNock,
  waitForNocks,
  waitForText,
} from '../../lib/test-util'
import {
  nockAggegateRequest,
  nockCreate,
  nockGet,
  nockIgnoreApiPaths,
  nockIgnoreRBAC,
  nockList,
  nockPatch,
} from '../../lib/nock-util'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'
import { mockGlobalClusterSet } from '../../lib/test-metadata'
import { uidata } from './Application.sharedmocks'

///////////////////////////////// Mock Data /////////////////////////////////////////////////////

const gitLink = 'https://invalid.com'

const nockApplication = {
  apiVersion: 'app.k8s.io/v1beta1',
  kind: 'Application',
  metadata: { name: 'application-0', namespace: 'namespace-0' },
  spec: {
    componentKinds: [{ group: 'apps.open-cluster-management.io', kind: 'Subscription' }],
    descriptor: {},
    selector: { matchExpressions: [{ key: 'app', operator: 'In', values: ['application-0'] }] },
  },
}

const mockApplication0: Application = {
  apiVersion: ApplicationApiVersion,
  kind: ApplicationKind,
  metadata: {
    name: 'application-0',
    namespace: 'namespace-0',
    creationTimestamp: '2024-02-26T12:00:00Z',
    annotations: {
      'apps.open-cluster-management.io/subscriptions': 'namespace-0/subscription-0,namespace-0/subscription-0-local',
    },
  },
  spec: {
    componentKinds: [
      {
        group: 'apps.open-cluster-management.io',
        kind: 'Subscription',
      },
    ],
    selector: {
      matchExpressions: [
        {
          key: 'app',
          operator: 'In',
          values: ['application-0'],
        },
      ],
    },
  },
}

const mockSubscription: Subscription = {
  apiVersion: SubscriptionApiVersion,
  kind: SubscriptionKind,
  metadata: {
    annotations: {
      'apps.open-cluster-management.io/git-branch': 'test-branch',
      'apps.open-cluster-management.io/git-path': 'test-path',
      'apps.open-cluster-management.io/reconcile-option': 'merge',
    },
    labels: {
      app: 'application-0',
    },
    name: 'application-0-subscription-1',
    namespace: 'namespace-0',
  },
  spec: {
    channel: 'ginvalidcom-ns/ginvalidcom',
    placement: {
      placementRef: {
        kind: 'Placement',
        name: 'application-0-placement-1',
      },
    },
  },
}

const mockSubscriptionWithPlacement: Subscription = {
  apiVersion: SubscriptionApiVersion,
  kind: SubscriptionKind,
  metadata: {
    annotations: {
      'apps.open-cluster-management.io/git-branch': 'test-branch',
      'apps.open-cluster-management.io/git-path': 'test-path',
      'apps.open-cluster-management.io/reconcile-option': 'merge',
    },
    labels: {
      app: 'application-0',
    },
    name: 'application-0-subscription-1',
    namespace: 'namespace-0',
  },
  spec: {
    channel: 'ginvalidcom-ns/ginvalidcom',
    placement: {
      placementRef: {
        kind: 'Placement',
        name: 'application-0-placement-1',
      },
    },
  },
}

const mockSubscriptionPlacement: Subscription = {
  apiVersion: SubscriptionApiVersion,
  kind: SubscriptionKind,
  metadata: {
    annotations: {
      'apps.open-cluster-management.io/git-branch': 'test-branch',
      'apps.open-cluster-management.io/git-path': 'test-path',
      'apps.open-cluster-management.io/reconcile-option': 'merge',
    },
    labels: {
      app: 'application-0',
    },
    name: 'application-0-subscription-1',
    namespace: 'namespace-0',
  },
  spec: {
    channel: 'ginvalidcom-ns/ginvalidcom',
    placement: {
      placementRef: {
        kind: 'Placement',
        name: 'placement-1',
      },
    },
  },
}

const mockProject: Project = {
  kind: ProjectKind,
  apiVersion: ProjectApiVersion,
  metadata: {
    name: mockApplication0.metadata.namespace,
  },
}

const mockProject2: Project = {
  kind: ProjectKind,
  apiVersion: ProjectApiVersion,
  metadata: {
    name: 'test-ns',
  },
}

const mockAnsibleSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  type: 'Opaque',
  metadata: {
    name: 'ans-1',
    namespace: mockProject2.metadata.name,
  },
  stringData: {
    host: 'https://invalid.com',
    token: 'token',
  },
}

const mockCopiedFromSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  type: 'Opaque',
  metadata: {
    name: 'ans-2',
    namespace: mockProject2.metadata.name,
    labels: {
      'cluster.open-cluster-management.io/copiedFromNamespace': 'default',
      'cluster.open-cluster-management.io/copiedFromSecretName': 'ansible-tower-wizard',
    },
  },
  stringData: {
    host: 'https://invalid.com',
    token: 'token',
  },
}

const nockAnsibleSecret: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  type: 'Opaque',
  metadata: {
    name: 'ans-2',
    namespace: mockApplication0.metadata.namespace,
    labels: {
      'cluster.open-cluster-management.io/type': 'ans',
      'cluster.open-cluster-management.io/credentials': '',
    },
  },
  stringData: {
    host: 'https://invalid.com',
    token: 'token',
  },
}

const mockChannel: Channel = {
  apiVersion: ChannelApiVersion,
  kind: ChannelKind,
  metadata: {
    annotations: {
      'apps.open-cluster-management.io/reconcile-rate': 'medium',
    },
    name: 'ginvalidcom',
    namespace: 'ginvalidcom-ns',
  },
  spec: {
    type: 'Git',
    pathname: 'https://invalid.com',
  },
}

const mockChannel1: Channel = {
  apiVersion: ChannelApiVersion,
  kind: ChannelKind,
  metadata: {
    annotations: {
      'apps.open-cluster-management.io/reconcile-rate': 'medium',
    },
    name: 'ggithubcom-fxiang1-app-samples',
  },
  spec: {
    type: 'Git',
    pathname: 'https://github.com/fxiang1/app-samples',
  },
}

const mockChannelNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: 'ginvalidcom-ns',
  },
}

const mockChannelProject: Project = {
  apiVersion: ProjectApiVersion,
  kind: ProjectKind,
  metadata: {
    name: 'ginvalidcom-ns',
  },
}

const mockCreatePlacement: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    labels: {
      app: 'application-0',
    },
    name: 'application-0-placement-1',
    namespace: 'namespace-0',
  },
  spec: {
    predicates: [
      {
        requiredClusterSelector: {
          labelSelector: {
            matchExpressions: [
              {
                key: 'name',
                operator: 'In',
                values: ['local-cluster'],
              },
            ],
          },
        },
      },
    ],
    clusterSets: ['global'],
  },
}

const nockCreateManagedclustersetbindings: ManagedClusterSetBinding = {
  apiVersion: ManagedClusterSetBindingApiVersion,
  kind: ManagedClusterSetBindingKind,
  metadata: {
    namespace: 'namespace-0',
    name: 'global',
  },
  spec: {
    clusterSet: 'global',
  },
}

const mockPlacement: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    namespace: 'namespace-0',
    name: 'application-0-placement-1',
  },
  spec: {
    predicates: [
      {
        requiredClusterSelector: {
          labelSelector: {
            matchExpressions: [
              {
                key: 'name',
                operator: 'In',
                values: ['local-cluster'],
              },
            ],
          },
        },
      },
    ],
    clusterSets: ['global'],
  },
}

const mockPlacementRule: PlacementRule = {
  apiVersion: PlacementRuleApiVersion,
  kind: PlacementRuleKind,
  metadata: {
    labels: {
      app: 'application-0',
    },
    name: 'application-0-rule-1',
    namespace: 'namespace-0',
  },
  spec: {
    clusterConditions: [
      {
        status: 'True',
        type: 'ManagedClusterConditionAvailable',
      },
    ],
  },
}

const mockManagedClusters: ManagedCluster[] = [
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
]

const mockNamespace0: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: 'local-cluster',
  },
}

const mockNamespace1: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: mockApplication0.metadata.namespace,
  },
}

const mockProjects = [mockProject, mockProject2, mockChannelProject]
const mockPlacements = [mockPlacement]
const mockPlacementRules = [mockPlacementRule]
const mockNamespaces = [mockNamespace0, mockNamespace1]
const mockHubChannels = [mockChannel1]

const mockSecrets = [mockAnsibleSecret, mockCopiedFromSecret]

///////////////////////////////// TESTS /////////////////////////////////////////////////////

describe('Create Subscription Application page', () => {
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(secretsState, mockSecrets)
          snapshot.set(namespacesState, mockNamespaces)
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(managedClusterSetsState, [mockGlobalClusterSet])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.createApplicationSubscription]}>
          <Routes>
            <Route
              path={NavigationPath.createApplicationSubscription}
              element={<CreateSubscriptionApplicationPage />}
            />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('cancel create should redirect to the correct link', async () => {
    const initialNocks = [nockList(mockProject, mockProjects)]
    window.scrollBy = () => {}
    render(<Component />)
    await waitForNocks(initialNocks)
    await waitForText('Create application', true)
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    userEvent.click(cancelButton)
    expect(window.location.pathname).toEqual('/')
  })

  test('create a git subscription app using placement', async () => {
    const initialNocks = [nockList(mockProject, mockProjects)]
    window.scrollBy = () => {}
    const { container } = render(<Component />)
    await waitForNocks(initialNocks)
    await waitForText('Create application', true)
    // fill the form
    await typeByTestId('eman', mockApplication0.metadata.name!)
    await typeByTestId('emanspace', mockApplication0.metadata.namespace!)
    // click git card
    await clickByTestId('git')
    await waitForNocks([nockList(mockPlacementRule, mockPlacementRules), nockList(mockPlacement, mockPlacements)])
    await typeByTestId('githubURL', gitLink)
    userEvent.type(screen.getByLabelText(/branch/i), 'test-branch')
    userEvent.type(screen.getByLabelText(/path/i), 'test-path')

    // create placement
    await clickBySelector(container, '#clusterSelector-checkbox-clusterSelector')
    userEvent.click(screen.getByPlaceholderText(/select the cluster sets/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /global/i,
      })
    )

    // enter labels
    userEvent.click(screen.getByText(/select the label/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /name/i,
      })
    )
    userEvent.click(screen.getByText(/equals any of/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /equals any of/i,
      })
    )
    userEvent.click(screen.getByText(/select the values/i))
    userEvent.click(
      screen.getByRole('checkbox', {
        name: /local-cluster/i,
      })
    )

    await clickByTestId('create-button-portal-id-btn')
    await waitForNocks([
      nockCreate(nockApplication, undefined, 201, { dryRun: 'All' }),
      nockCreate(mockChannel, undefined, 201, { dryRun: 'All' }),
      nockCreate(mockSubscriptionWithPlacement, undefined, 201, { dryRun: 'All' }),
      nockCreate(mockCreatePlacement, undefined, 201, { dryRun: 'All' }),
      nockCreate(nockCreateManagedclustersetbindings, undefined, 201, { dryRun: 'All' }),
      nockCreate(nockApplication, undefined, 201),
      nockCreate(mockChannel, undefined, 201),
      nockCreate(mockCreatePlacement, undefined, 201),
      nockCreate(mockSubscriptionWithPlacement, undefined, 201),
      nockCreate(nockCreateManagedclustersetbindings, undefined, 201),
    ])
  })

  test('create a git subscription app using placementrule', async () => {
    const initialNocks = [nockList(mockProject, mockProjects)]
    window.scrollBy = () => {}
    render(<Component />)
    await waitForNocks(initialNocks)
    await waitForText('Create application', true)
    // fill the form
    await typeByTestId('eman', mockApplication0.metadata.name!)
    await typeByTestId('emanspace', mockApplication0.metadata.namespace!)
    // click git card
    userEvent.click(screen.getByText(/git/i))
    await waitForNocks([nockList(mockPlacementRule, mockPlacementRules), nockList(mockPlacement, mockPlacements)])
    const githubURL = screen.getByLabelText(/url/i)
    userEvent.type(githubURL, gitLink)
    userEvent.type(screen.getByLabelText(/branch/i), 'test-branch')
    userEvent.type(screen.getByLabelText(/path/i), 'test-path')

    const ansibleSecretName = screen.getByPlaceholderText(/select an existing secret from the list./i)

    userEvent.click(ansibleSecretName)
    userEvent.type(ansibleSecretName, mockAnsibleSecret.metadata.name!)

    // select an existing placement rule
    userEvent.click(
      screen.getByRole('radio', {
        name: /select an existing placement configuration/i,
      })
    )

    // pick existing PlacementRule
    screen.getByPlaceholderText(/select an existing placement configuration/i).click()
    await clickByText(mockPlacementRule.metadata.name!)

    // pick existing Placement
    screen.getByPlaceholderText(/select an existing placement configuration/i).click()
    await clickByText(mockPlacement.metadata.name!)

    // open and close the credential modal

    const dropdownButton = screen.getByPlaceholderText(/select an existing secret from the list\./i)
    userEvent.click(dropdownButton)
    userEvent.click(screen.getByText(/add credential/i))

    // fill modal form
    userEvent.type(
      screen.getByRole('textbox', {
        name: /credential name/i,
      }),
      nockAnsibleSecret.metadata.name!
    )

    userEvent.click(screen.getByPlaceholderText(/select a namespace for the credential/i))
    userEvent.click(
      screen.getByRole('option', {
        name: /namespace-0/i,
      })
    )

    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )

    userEvent.type(
      screen.getByRole('textbox', {
        name: /ansible tower host/i,
      }),
      'https://invalid.com'
    )

    userEvent.type(screen.getByPlaceholderText(/enter the ansible tower token/i), 'token')

    userEvent.click(
      screen.getByRole('button', {
        name: /next/i,
      })
    )

    // click add

    userEvent.click(
      screen.getByRole('button', {
        name: /add/i,
      })
    )
    await waitForNock(nockCreate(nockAnsibleSecret))

    await clickByTestId('create-button-portal-id-btn')
    await waitForNocks([
      nockCreate(nockApplication, undefined, 201, { dryRun: 'All' }),
      nockCreate(mockChannel, undefined, 201, { dryRun: 'All' }),
      nockCreate(mockSubscription, undefined, 201, { dryRun: 'All' }),
      nockCreate(nockApplication, undefined, 201),
      nockCreate(mockChannel, undefined, 201),
      nockCreate(mockSubscription, undefined, 201),
    ])
  })

  test('edit a git subscription application', async () => {
    const initialNocks = [
      nockList(mockProject, mockProjects),
      nockGet(mockApplication0),
      nockGet(mockChannel),
      nockGet(mockSubscriptionPlacement),
      nockGet(mockChannelNamespace),
      nockGet(mockPlacement),
      nockAggegateRequest('uidata', mockApplication0, uidata, 200, true),
    ]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(secretsState, mockSecrets)
          snapshot.set(namespacesState, mockNamespaces)
          snapshot.set(applicationsState, [mockApplication0])
          snapshot.set(channelsState, mockHubChannels)
          snapshot.set(placementsState, [mockPlacement])
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.editApplicationSubscription, {
              namespace: nockApplication.metadata?.namespace!,
              name: nockApplication.metadata?.name!,
            }),
          ]}
        >
          <Routes>
            <Route path={NavigationPath.editApplicationSubscription} element={<CreateSubscriptionApplicationPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNocks(initialNocks)
    expect(
      screen.getByRole('heading', {
        name: /application-0/i,
      })
    ).toBeTruthy()

    // click git card
    userEvent.click(screen.getByText(/git/i))
    await waitForNocks([nockList(mockPlacementRule, mockPlacementRules), nockList(mockPlacement, mockPlacements)])
    const githubURL = screen.getByLabelText(/url \*/i)
    userEvent.type(githubURL, gitLink)
    userEvent.type(screen.getByLabelText(/branch/i), 'test-branch')
    userEvent.type(screen.getByLabelText(/path/i), 'test-path2')
    await new Promise((resolve) => setTimeout(resolve, 500))

    // pick existing Placement

    await waitForText('Select an existing placement configuration')
    await new Promise((resolve) => setTimeout(resolve, 500))
    screen.getByPlaceholderText(/select an existing placement configuration/i).click()
    await clickByText(mockPlacement.metadata.name!)
    const patchNocks: Scope[] = [
      nockPatch(mockSubscriptionPlacement, [
        { op: 'replace', path: '/spec/placement/placementRef/name', value: mockPlacement.metadata.name },
        {
          op: 'replace',
          path: '/metadata/annotations/apps.open-cluster-management.io~1git-path',
          value: 'test-path2',
        },
      ]),
      nockPatch(mockApplication0, [{ op: 'remove', path: '/metadata/creationTimestamp' }]),
    ]
    //update the resources
    userEvent.click(screen.getByRole('button', { name: /update/i }))
    await waitForNocks(patchNocks)
  })
})
