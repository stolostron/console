/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  DiscoveredCluster,
  DiscoveredClusterApiVersion,
  DiscoveredClusterKind,
  KlusterletAddonConfig,
  KlusterletAddonConfigApiVersion,
  KlusterletAddonConfigKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  managedClusterSetLabel,
  Project,
  ProjectApiVersion,
  ProjectKind,
  ProjectRequest,
  ProjectRequestApiVersion,
  ProjectRequestKind,
  ProviderConnection,
  ProviderConnectionApiVersion,
  ProviderConnectionKind,
  Secret,
  SecretApiVersion,
  SecretKind,
  SubscriptionOperator,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
} from '../../../../../resources'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
  clusterCuratorsState,
  discoveredClusterState,
  discoveryConfigState,
  managedClusterSetsState,
  secretsState,
  subscriptionOperatorsState,
} from '../../../../../atoms'
import {
  mockBadRequestStatus,
  nockCreate,
  nockGet,
  nockIgnoreApiPaths,
  nockIgnoreRBAC,
} from '../../../../../lib/nock-util'
import { mockCRHCredential, mockDiscoveryConfig, mockManagedClusterSet } from '../../../../../lib/test-metadata'
import {
  clickByPlaceholderText,
  clickByRole,
  clickByTestId,
  clickByText,
  typeByTestId,
  waitForNocks,
  waitForNotText,
  waitForText,
} from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import DiscoveredClustersPage from '../../DiscoveredClusters/DiscoveredClusters'
import ImportClusterPage from './ImportCluster'
import { PluginContext } from '../../../../../lib/PluginContext'
import { AcmToastGroup, AcmToastProvider } from '../../../../../ui-components'
import { PluginDataContext } from '../../../../../lib/PluginDataContext'

const mockProject: ProjectRequest = {
  apiVersion: ProjectRequestApiVersion,
  kind: ProjectRequestKind,
  metadata: { name: 'foobar' },
}

const mockDiscoveredClusters: DiscoveredCluster[] = [
  {
    apiVersion: DiscoveredClusterApiVersion,
    kind: DiscoveredClusterKind,
    metadata: {
      name: 'foobar',
      namespace: 'foobar',
    },
    spec: {
      activityTimestamp: '2020-07-30T19:09:43Z',
      cloudProvider: 'aws',
      apiUrl: 'https://api.foobar.dev01.red-chesterfield.com',
      displayName: 'foobar',
      console: 'https://console-openshift-console.apps.foobar.dev01.red-chesterfield.com',
      creationTimestamp: '2020-07-30T19:09:43Z',
      name: 'foobar',
      type: 'OCP',
      openshiftVersion: '4.5.5',
      status: 'Active',
    },
  },
  {
    apiVersion: DiscoveredClusterApiVersion,
    kind: DiscoveredClusterKind,
    metadata: { name: 'test-cluster-02', namespace: 'foobar' },
    spec: {
      activityTimestamp: '2020-07-30T19:09:43Z',
      displayName: 'test-cluster-02',
      cloudProvider: 'gcp',
      console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
      creationTimestamp: '2020-07-30T19:09:43Z',
      name: 'test-cluster-02',
      openshiftVersion: '4.6.1',
      status: 'Stale',
    },
  },
]

const mockSecretResponse: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'foobar-import',
    namespace: 'foobar',
  },
  data: { 'crds.yaml': 'crd yaml', 'import.yaml': 'import yaml' },
  type: 'Opaque',
}

const mockAutoSecretResponse: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'auto-import-secret',
    namespace: 'foobar',
  },
  data: { autoImportRetry: '2', kubeconfig: 'Test text' },
  type: 'Opaque',
}

const mockAutoSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'auto-import-secret',
    namespace: 'foobar',
  },
  stringData: {
    autoImportRetry: '2',
    kubeconfig: 'Test text',
  },
  type: 'Opaque',
}

const mockAutoTokenSecretResponse: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'auto-import-secret',
    namespace: 'foobar',
  },
  data: { autoImportRetry: '2', token: 'Test token', server: 'Test server' },
  type: 'Opaque',
}

const mockAutoTokenSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'auto-import-secret',
    namespace: 'foobar',
  },
  stringData: {
    autoImportRetry: '2',
    token: 'Test token',
    server: 'Test server',
  },
  type: 'Opaque',
}

const mockManagedCluster: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'foobar',
    labels: { cloud: 'auto-detect', vendor: 'auto-detect', name: 'foobar', foo: 'bar' },
    annotations: {},
  },
  spec: { hubAcceptsClient: true },
}

const mockManagedDiscoveredCluster: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'foobar',
    labels: { cloud: 'auto-detect', vendor: 'auto-detect', name: 'foobar', foo: 'bar' },
    annotations: {
      'open-cluster-management/created-via': 'discovery',
    },
  },
  spec: { hubAcceptsClient: true },
}

const mockKlusterletAddonConfig: KlusterletAddonConfig = {
  apiVersion: KlusterletAddonConfigApiVersion,
  kind: KlusterletAddonConfigKind,
  metadata: { name: 'foobar', namespace: 'foobar' },
  spec: {
    clusterName: 'foobar',
    clusterNamespace: 'foobar',
    clusterLabels: { cloud: 'auto-detect', vendor: 'auto-detect', name: 'foobar', foo: 'bar' },
    applicationManager: { enabled: true, argocdCluster: false },
    policyController: { enabled: true },
    searchCollector: { enabled: true },
    certPolicyController: { enabled: true },
    iamPolicyController: { enabled: true },
  },
}

const mockProjectResponse: Project = {
  apiVersion: ProjectApiVersion,
  kind: ProjectKind,
  metadata: {
    name: 'foobar',
    selfLink: '/apis/project.openshift.io/v1/projectrequests/foobar',
    uid: 'f628792b-79d2-4c41-a07a-c7f1afac5e8a',
    resourceVersion: '16251055',
    annotations: {
      'openshift.io/description': '',
      'openshift.io/display-name': '',
      'openshift.io/requester': 'kube:admin',
      'openshift.io/sa.scc.mcs': 's0:c25,c15',
      'openshift.io/sa.scc.supplemental-groups': '1000630000/10000',
      'openshift.io/sa.scc.uid-range': '1000630000/10000',
    },
  },
}

const mockManagedDiscoveredClusterResponse: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    labels: { cloud: 'auto-detect', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
    name: 'foobar',
    uid: 'e60ef618-324b-49d4-8a28-48839c546565',
    annotations: {
      'open-cluster-management/created-via': 'discovery',
    },
  },
  spec: { hubAcceptsClient: true, leaseDurationSeconds: 60 },
}

const mockManagedClusterResponse: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    labels: { cloud: 'auto-detect', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
    name: 'foobar',
    uid: 'e60ef618-324b-49d4-8a28-48839c546565',
    annotations: {},
  },
  spec: { hubAcceptsClient: true, leaseDurationSeconds: 60 },
}

const mockKlusterletAddonConfigResponse: KlusterletAddonConfig = {
  apiVersion: 'agent.open-cluster-management.io/v1',
  kind: 'KlusterletAddonConfig',
  metadata: {
    name: 'foobar',
    namespace: 'foobar',
    uid: 'fba00095-386b-4d68-b2da-97003bc6a987',
  },
  spec: {
    applicationManager: { enabled: true, argocdCluster: false },
    certPolicyController: { enabled: true },
    clusterLabels: { cloud: 'auto-detect', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
    clusterName: 'foobar',
    clusterNamespace: 'foobar',
    iamPolicyController: { enabled: true },
    policyController: { enabled: true },
    searchCollector: { enabled: true },
  },
}

const clusterCurator: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test',
    namespace: 'test-ii',
    labels: {
      'open-cluster-management': 'curator',
    },
  },
  spec: {
    desiredCuration: undefined,
    install: {
      prehook: [
        {
          name: 'test-prehook-install',
          extra_vars: {},
        },
      ],
      towerAuthSecret: 'ansible-connection',
    },
  },
}

const mockClusterCurator: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'foobar',
    namespace: 'foobar',
    labels: {
      'open-cluster-management': 'curator',
    },
  },
  spec: {
    install: {
      prehook: [
        {
          name: 'test-prehook-install',
          extra_vars: {},
        },
      ],
      towerAuthSecret: 'toweraccess-install',
    },
  },
}

const providerConnectionAnsible: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'ansible-connection',
    namespace: 'test-ii',
    labels: {
      'cluster.open-cluster-management.io/type': 'ans',
    },
  },
  stringData: {
    host: 'test',
    token: 'test',
  },
  type: 'Opaque',
}

const mockProviderConnectionAnsibleCopied: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'toweraccess-install',
    namespace: 'foobar',
    labels: {
      'cluster.open-cluster-management.io/type': 'ans',
      'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ii',
      'cluster.open-cluster-management.io/copiedFromSecretName': 'ansible-connection',
      'cluster.open-cluster-management.io/backup': 'cluster',
    },
  },
  stringData: {
    host: 'test',
    token: 'test',
  },
  type: 'Opaque',
}

const subscriptionOperator: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'ansible-automation-platform-operator',
    namespace: 'ansible-automation-platform-operator',
  },
  status: {
    conditions: [
      {
        reason: 'AllCatalogSourcesHealthy',
        lastTransitionTime: '',
        message: '',
        type: 'CatalogSourcesUnhealthy',
        status: 'False',
      },
    ],
  },
  spec: {},
}

const mockClusterCurators = [clusterCurator]

describe('ImportCluster', () => {
  function Component(props: { subscriptions?: SubscriptionOperator[] }) {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
          snapshot.set(clusterCuratorsState, mockClusterCurators)
          snapshot.set(secretsState, [providerConnectionAnsible as Secret])
          snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
        }}
      >
        <AcmToastProvider>
          <AcmToastGroup />
          <MemoryRouter initialEntries={['/import-cluster']}>
            <Route path="/import-cluster">
              <ImportClusterPage />
            </Route>
          </MemoryRouter>
        </AcmToastProvider>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    window.sessionStorage.clear()
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('can create resources and generate the import command', async () => {
    const projectNock = nockCreate(mockProject, mockProjectResponse)
    const mockCluster = JSON.parse(JSON.stringify(mockManagedCluster))
    const mockClusterResponse = JSON.parse(JSON.stringify(mockManagedClusterResponse))
    const mockKac = JSON.parse(JSON.stringify(mockKlusterletAddonConfig))
    const mockKacResponse = JSON.parse(JSON.stringify(mockKlusterletAddonConfigResponse))
    mockCluster.metadata.labels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    mockClusterResponse.metadata.labels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    mockKac.spec.clusterLabels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    mockKacResponse.spec.clusterLabels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    const managedClusterNock = nockCreate(mockCluster, mockClusterResponse)
    const kacNock = nockCreate(mockKac, mockKacResponse)
    const importSecretNock = nockGet(mockSecretResponse)

    render(<Component />)

    await typeByTestId('clusterName', 'foobar')

    await clickByText('Select a cluster set')
    await clickByText(mockManagedClusterSet.metadata.name!)
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')

    // Advance to Automation step; choose automation template then clear
    await clickByText('Next')
    await waitForText('Install the operator')
    await clickByPlaceholderText('Select an automation template')
    await clickByText(mockClusterCurators[0].metadata.name!)
    await clickByRole('button', { name: /clear selected item/i })

    // Advance to Review step and submit the form
    await clickByText('Next')
    await waitForText('Generate command')
    await clickByText('Generate command')
    await waitForText('Generating')

    await waitForNocks([projectNock, managedClusterNock, kacNock, importSecretNock])
  })

  test('can create resources with ansible template', async () => {
    const projectNock = nockCreate(mockProject, mockProjectResponse)
    const mockCluster = JSON.parse(JSON.stringify(mockManagedCluster))
    const mockClusterResponse = JSON.parse(JSON.stringify(mockManagedClusterResponse))
    const mockKac = JSON.parse(JSON.stringify(mockKlusterletAddonConfig))
    const mockKacResponse = JSON.parse(JSON.stringify(mockKlusterletAddonConfigResponse))
    mockCluster.metadata.labels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    mockClusterResponse.metadata.labels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    mockKac.spec.clusterLabels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    mockKacResponse.spec.clusterLabels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    const managedClusterNock = nockCreate(mockCluster, mockClusterResponse)
    const kacNock = nockCreate(mockKac, mockKacResponse)
    const importSecretNock = nockGet(mockSecretResponse)
    const ansibleCopiedNock = nockCreate(mockProviderConnectionAnsibleCopied)
    const clusterCuratorNock = nockCreate(mockClusterCurator)

    render(<Component subscriptions={[subscriptionOperator]} />)

    await typeByTestId('clusterName', 'foobar')

    await clickByText('Select a cluster set')
    await clickByText(mockManagedClusterSet.metadata.name!)
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')

    // Advance to Automation step
    await clickByText('Next')
    await waitForText('Automation template')
    await waitForNotText('Install the operator')
    await clickByPlaceholderText('Select an automation template')
    await clickByText(mockClusterCurators[0].metadata.name!)

    // check automation summary
    await waitForText(`View ${mockClusterCurators[0].metadata.name!}`)
    await waitForText('Pre-install Ansible template')
    await waitForText(mockClusterCurators[0].spec!.install!.prehook![0].name!)

    // Advance to Review step and submit the form
    await clickByText('Next')
    await waitForText('Generate command')
    await clickByText('Generate command')

    await waitForNocks([
      projectNock,
      managedClusterNock,
      kacNock,
      importSecretNock,
      ansibleCopiedNock,
      clusterCuratorNock,
    ])
  })

  test('can import without KlusterletAddonConfig for MCE', async () => {
    const projectNock = nockCreate(mockProject, mockProjectResponse)
    const mockCluster = JSON.parse(JSON.stringify(mockManagedCluster))
    const mockClusterResponse = JSON.parse(JSON.stringify(mockManagedClusterResponse))
    mockCluster.metadata.labels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    mockClusterResponse.metadata.labels[managedClusterSetLabel] = mockManagedClusterSet.metadata.name
    const managedClusterNock = nockCreate(mockCluster, mockClusterResponse)
    const importSecretNock = nockGet(mockSecretResponse)

    render(
      <PluginContext.Provider value={{ isACMAvailable: false, dataContext: PluginDataContext }}>
        <Component />
      </PluginContext.Provider>
    )

    await typeByTestId('clusterName', 'foobar')

    await clickByText('Select a cluster set')
    await clickByText(mockManagedClusterSet.metadata.name!)
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')

    // Advance to Review step and submit the form
    await clickByText('Next')
    await clickByText('Next')
    await waitForText('Generate command')
    await clickByText('Generate command')

    await waitForNocks([projectNock, managedClusterNock, importSecretNock])
  })

  test('can create resources when auto importing using kubeconfig', async () => {
    const projectNock = nockCreate(mockProject, mockProjectResponse)
    const managedClusterNock = nockCreate(mockManagedCluster, mockManagedClusterResponse)
    const kacNock = nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfigResponse)
    const importAutoSecretNock = nockCreate(mockAutoSecret, mockAutoSecretResponse)

    render(<Component />)

    await typeByTestId('clusterName', 'foobar')
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')
    await clickByText('Run import commands manually')
    await clickByText('Kubeconfig', 0)
    await clickByTestId('kubeConfigEntry')
    await typeByTestId('kubeConfigEntry', 'Test text')

    // Advance to Review step and submit the form
    await clickByText('Next')
    await clickByText('Next')
    await waitForText('Import')
    await clickByText('Import')
    await waitForText('Importing')

    await waitForNocks([projectNock, managedClusterNock, kacNock, importAutoSecretNock])
  })

  test('can create resources when auto importing using token/server', async () => {
    const projectNock = nockCreate(mockProject, mockProjectResponse)
    const managedClusterNock = nockCreate(mockManagedCluster, mockManagedClusterResponse)
    const kacNock = nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfigResponse)
    const importAutoTokenSecretNock = nockCreate(mockAutoTokenSecret, mockAutoTokenSecretResponse)

    render(<Component />)

    await typeByTestId('clusterName', 'foobar')
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')
    await clickByText('Run import commands manually')
    await clickByText('Enter your server URL and API token for the existing cluster')
    await clickByTestId('token')
    await typeByTestId('token', 'Test token')
    await clickByTestId('server')
    await typeByTestId('server', 'Test server')

    // Advance to Review step and submit the form
    await clickByText('Next')
    await clickByText('Next')
    await waitForText('Import')
    await clickByText('Import')

    await waitForNocks([projectNock, managedClusterNock, kacNock, importAutoTokenSecretNock])
  })

  test('handles project creation error', async () => {
    const projectNock = nockCreate(mockProject, mockBadRequestStatus)
    render(<Component />)
    await typeByTestId('clusterName', 'foobar')

    // Advance to Review step and submit the form
    await clickByText('Next')
    await clickByText('Next')
    await waitForText('Generate command')
    await clickByText('Generate command')

    await waitForNocks([projectNock])
    await waitForText(mockBadRequestStatus.message, true)
  })

  test('handles resource creation errors', async () => {
    const createProjectNock = nockCreate(mockProject, mockProjectResponse)
    const badRequestNock = nockCreate(mockManagedCluster, mockBadRequestStatus)

    render(<Component />)

    await typeByTestId('clusterName', 'foobar')
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')

    // Advance to Review step and submit the form
    await clickByText('Next')
    await clickByText('Next')
    await waitForText('Generate command')
    await clickByText('Generate command')

    await waitForNocks([createProjectNock, badRequestNock])
    await waitForText(mockBadRequestStatus.message, true)
  })
})

let store: Record<string, string> = {}

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem(key: string) {
      return store[key] || null
    },
    setItem(key: string, value: string | Record<string, string>) {
      store[key] = value.toString()
    },
    removeItem(key: string) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  },
})

describe('Import Discovered Cluster', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  window.sessionStorage.setItem('DiscoveredClusterConsoleURL', 'https://test-cluster.com')
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
          snapshot.set(secretsState, [mockCRHCredential])
          snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
          snapshot.set(discoveredClusterState, mockDiscoveredClusters)
        }}
      >
        <MemoryRouter>
          <Route>
            <DiscoveredClustersPage />
          </Route>
          <Route path={NavigationPath.importCluster}>
            <ImportClusterPage />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }
  test('create discovered cluster', async () => {
    const { getAllByText, getAllByLabelText } = render(<Component />) // Render component

    await waitFor(() => expect(getAllByText(mockDiscoveredClusters[0].metadata.name!)[0]!).toBeInTheDocument()) // Wait for DiscoveredCluster to appear in table
    userEvent.click(getAllByLabelText('Actions')[0]) // Click on Kebab menu

    await clickByText('Import cluster')
    await waitForText('Import an existing cluster', true)

    const projectNock = nockCreate(mockProject, mockProjectResponse)
    const managedClusterNock = nockCreate(mockManagedDiscoveredCluster, mockManagedDiscoveredClusterResponse)
    const kacNock = nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfigResponse)
    const importCommandNock = nockGet(mockSecretResponse)

    // Add labels
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')

    // Advance to Review step and submit the form
    await clickByText('Next')
    await clickByText('Next')
    await waitForText('Generate command')
    await clickByText('Generate command')

    await waitForNocks([projectNock, managedClusterNock, kacNock, importCommandNock])
  })
})
