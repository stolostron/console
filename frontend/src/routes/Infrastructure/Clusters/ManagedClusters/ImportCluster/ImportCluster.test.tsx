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
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
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
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot, useSetRecoilState } from 'recoil'
import {
  clusterCuratorsState,
  discoveredClusterState,
  discoveryConfigState,
  managedClusterSetsState,
  secretsState,
  subscriptionOperatorsState,
  namespacesState,
} from '../../../../../atoms'
import {
  mockBadRequestStatus,
  nockCreate,
  nockGet,
  nockIgnoreApiPaths,
  nockIgnoreOperatorCheck,
  nockIgnoreRBAC,
} from '../../../../../lib/nock-util'
import {
  mockCRHCredential,
  mockCRHCredential1,
  mockCRHCredential2,
  mockCRHCredential3,
  mockDiscoveryConfig,
  mockManagedClusterSet,
} from '../../../../../lib/test-metadata'
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
import { defaultPlugin, PluginContext } from '../../../../../lib/PluginContext'
import { AcmToastGroup, AcmToastProvider } from '../../../../../ui-components'
import { PropsWithChildren, useEffect } from 'react'

const mockProject: ProjectRequest = {
  apiVersion: ProjectRequestApiVersion,
  kind: ProjectRequestKind,
  metadata: { name: 'foobar' },
}

const mockROSADiscoveryProject: ProjectRequest = {
  apiVersion: ProjectRequestApiVersion,
  kind: ProjectRequestKind,
  metadata: { name: 'rosa-discovery-cluster' },
}

const mockNamepaces: Namespace[] = [
  {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'foobar' },
  },
  {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'rosa-discovery-cluster' },
  },
]

const mockDiscoveredClusters: DiscoveredCluster[] = [
  {
    apiVersion: DiscoveredClusterApiVersion,
    kind: DiscoveredClusterKind,
    metadata: {
      name: 'foobar',
      namespace: 'foobar',
      uid: 'foobar',
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
    metadata: {
      name: 'rosa-discovery-cluster',
      namespace: 'foobar',
    },
    spec: {
      activityTimestamp: '2020-07-30T19:09:40Z',
      cloudProvider: 'aws',
      apiUrl: 'https://api.rosa-discovery-cluster.dev01.red -chesterfield.com',
      displayName: 'rosa-discovery-cluster',
      console: 'https://console-openshift-console.apps.rosa-discovery-cluster.dev01.red-chesterfield.com',
      creationTimestamp: '2020-07-30T19:09:43Z',
      name: 'rosa-discovery-cluster',
      type: 'ROSA',
      openshiftVersion: '4.5.5',
      status: 'Active',
      rhocmClusterId: '39ldt3r51vjjsho1eqntrg3m',
      credential: {
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        name: 'OCM-Access-API',
        namespace: 'foobar',
        resourceVersion: '87010',
        uid: '6a',
      },
    },
  },
  {
    apiVersion: DiscoveredClusterApiVersion,
    kind: DiscoveredClusterKind,
    metadata: {
      name: 'rosa-discovery-cluster',
      namespace: 'foobar',
    },
    spec: {
      activityTimestamp: '2020-07-30T19:09:40Z',
      cloudProvider: 'aws',
      apiUrl: 'https://api.rosa-discovery-cluster.dev01.red -chesterfield.com',
      displayName: 'rosa-discovery-cluster',
      console: 'https://console-openshift-console.apps.rosa-discovery-cluster.dev01.red-chesterfield.com',
      creationTimestamp: '2022-30T19:09:43Z',
      name: 'rosa-discovery-cluster',
      type: 'ROSA',
      openshiftVersion: '4.5.5',
      status: 'Active',
      rhocmClusterId: '39ldt3r51vjjsho1eqntrg3m',
      credential: {
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        name: 'OCM-Access-SA',
        namespace: 'foobar',
        resourceVersion: '87010',
        uid: '6a',
      },
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
  {
    apiVersion: DiscoveredClusterApiVersion,
    kind: DiscoveredClusterKind,
    metadata: {
      name: 'mce-hcp',
      namespace: 'mce-hcp',
      uid: 'mce-hcp',
    },
    spec: {
      activityTimestamp: '2024-06-18T10:39:27Z',
      cloudProvider: 'N/A',
      apiUrl: 'https://api.mce-hcp.dev01.red-chesterfield.com',
      displayName: 'mce-hcp',
      console: 'https://console-openshift-console.apps.mce-hcp.dev01.red-chesterfield.com',
      creationTimestamp: '2024-06-18T10:39:27Z',
      name: 'mce-hcp',
      type: 'MultiClusterEngineHCP',
      openshiftVersion: '4.17.8',
      status: 'Active',
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
  data: { kubeconfig: 'Test text' },
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
  data: { token: 'Test token', server: 'Test server' },
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
    token: 'Test token',
    server: 'Test server',
  },
  type: 'Opaque',
}
const mockROSAAutoTokenSecretAPIToken: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'auto-import-secret',
    namespace: 'rosa-discovery-cluster',
  },
  stringData: {
    cluster_id: '39ldt3r51vjjsho1eqntrg3m',
    auth_method: 'offline-token',
    api_token: 'fake_token',
  },
  type: 'auto-import/rosa',
}

const mockROSAAutoTokenSecretServiceAcc: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'auto-import-secret',
    namespace: 'rosa-discovery-cluster',
  },
  stringData: {
    cluster_id: '39ldt3r51vjjsho1eqntrg3m',
    auth_method: 'service-account',
    client_id: 'fake_client_id1234',
    client_secret: 'fake_client_secret1234',
  },
  type: 'auto-import/rosa',
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

const mockManagedROSADiscoveredCluster: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'rosa-discovery-cluster',
    labels: { cloud: 'auto-detect', vendor: 'auto-detect', name: 'rosa-discovery-cluster', foo: 'bar' },
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
    applicationManager: { enabled: true },
    policyController: { enabled: true },
    searchCollector: { enabled: true },
    certPolicyController: { enabled: true },
  },
}

const mockROSADiscoveryKlusterletAddonConfig: KlusterletAddonConfig = {
  apiVersion: KlusterletAddonConfigApiVersion,
  kind: KlusterletAddonConfigKind,
  metadata: { name: 'rosa-discovery-cluster', namespace: 'rosa-discovery-cluster' },
  spec: {
    clusterName: 'rosa-discovery-cluster',
    clusterNamespace: 'rosa-discovery-cluster',
    clusterLabels: { cloud: 'auto-detect', vendor: 'auto-detect', name: 'rosa-discovery-cluster', foo: 'bar' },
    applicationManager: { enabled: true },
    policyController: { enabled: true },
    searchCollector: { enabled: true },
    certPolicyController: { enabled: true },
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
const mockROSADiscoveryProjectResponse: Project = {
  apiVersion: ProjectApiVersion,
  kind: ProjectKind,
  metadata: {
    name: 'rosa-discovery-cluster',
    selfLink: '/apis/project.openshift.io/v1/projectrequests/rosa-discovery-cluster',
    uid: 'a452d',
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

const mockManagedROSADiscoveredClusterResponse: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    labels: { cloud: 'auto-detect', name: 'rosa-discovery-cluster', vendor: 'auto-detect', foo: 'bar' },
    name: 'rosa-discovery-cluster',
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
    applicationManager: { enabled: true },
    certPolicyController: { enabled: true },
    clusterLabels: { cloud: 'auto-detect', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
    clusterName: 'foobar',
    clusterNamespace: 'foobar',
    policyController: { enabled: true },
    searchCollector: { enabled: true },
  },
}

const mockROSADiscoveryKlusterletAddonConfigResponse: KlusterletAddonConfig = {
  apiVersion: 'agent.open-cluster-management.io/v1',
  kind: 'KlusterletAddonConfig',
  metadata: {
    name: 'rosa-discovery-cluster',
    namespace: 'rosa-discovery-cluster',
    uid: 'fba00095-386b-4d68-b2da-97003bc6a987',
  },
  spec: {
    applicationManager: { enabled: true },
    certPolicyController: { enabled: true },
    clusterLabels: { cloud: 'auto-detect', name: 'foobar', vendor: 'auto-detect', foo: 'bar' },
    clusterName: 'rosa-discovery-cluster',
    clusterNamespace: 'rosa-discovery-cluster',
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

const mockOCMConnection: Secret = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'OCM-access',
    namespace: 'foobar',
    labels: {
      'cluster.open-cluster-management.io/type': 'rhocm',
      'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ROSA',
      'cluster.open-cluster-management.io/copiedFromSecretName': 'OCM-connection',
      'cluster.open-cluster-management.io/backup': 'cluster',
    },
  },
  stringData: {
    ocmAPIToken: 'fake_token',
  },
  type: 'Opaque',
}

const mockOCMConnection1: Secret = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'OCM-Access-API',
    namespace: 'foobar',
    labels: {
      'cluster.open-cluster-management.io/type': 'rhocm',
      'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ROSA',
      'cluster.open-cluster-management.io/copiedFromSecretName': 'OCM-connection',
      'cluster.open-cluster-management.io/backup': 'cluster',
    },
  },
  stringData: {
    auth_method: 'offline-token',
    ocmAPIToken: 'fake_token',
  },
  type: 'Opaque',
}

const mockOCMConnection2: Secret = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'OCM-Access-SA',
    namespace: 'foobar',
    labels: {
      'cluster.open-cluster-management.io/type': 'rhocm',
      'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ROSA',
      'cluster.open-cluster-management.io/copiedFromSecretName': 'OCM-connection',
      'cluster.open-cluster-management.io/backup': 'cluster',
    },
  },
  stringData: {
    auth_method: 'service-account',
    client_id: 'fake_client_id1234',
    client_secret: 'fake_client_secret1234',
  },
  type: 'Opaque',
}

const subscriptionOperator: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: {
    name: 'aap',
    namespace: 'ansible-automation-platform-operator',
  },
  spec: { name: 'ansible-automation-platform-operator' },
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
            <Routes>
              <Route path="/import-cluster" element={<ImportClusterPage />} />
            </Routes>
          </MemoryRouter>
        </AcmToastProvider>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    window.sessionStorage.clear()
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck(true)
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
    await clickByRole('button', { name: /clear input value/i })

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
      <PluginContext.Provider value={{ ...defaultPlugin, isACMAvailable: false }}>
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
    await clickByText('Run import commands manually', 0)
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
    await clickByText('Run import commands manually', 0)
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
    nockIgnoreOperatorCheck()
  })
  window.sessionStorage.setItem('DiscoveredClusterConsoleURL', 'https://test-cluster.com')
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
          snapshot.set(secretsState, [mockCRHCredential, mockOCMConnection])
          snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
          snapshot.set(discoveredClusterState, mockDiscoveredClusters)
          snapshot.set(namespacesState, mockNamepaces)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<DiscoveredClustersPage />} />
            <Route path={NavigationPath.importCluster} element={<ImportClusterPage />} />
          </Routes>
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

    await clickByText('Enter your server URL and API token for the existing cluster', 0)
    await clickByText('Run import commands manually')

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

  test('sets discovered OCP cluster URL field', async () => {
    const { getAllByText, getAllByLabelText, getByDisplayValue } = render(<Component />) // Render component

    await waitFor(() => expect(getAllByText(mockDiscoveredClusters[0].metadata.name!)[0]!).toBeInTheDocument()) // Wait for Discovered ROSA Cluster to appear in table
    userEvent.click(getAllByLabelText('Actions')[0]) // Click on Kebab menu

    await clickByText('Import cluster')
    await waitForText('Enter your server URL and API token for the existing cluster', true)
    getByDisplayValue(mockDiscoveredClusters[0].spec.apiUrl!)
  })

  test('disabled for MultiClusterEngineHCP clusters', async () => {
    const { container } = render(<Component />) // Render component
    expect(
      container.querySelector(
        `[data-ouia-component-id=${mockDiscoveredClusters[0].metadata.uid!}] td.pf-v5-c-table__action`
      )?.innerHTML
    ).toBeDefined()
    expect(
      container.querySelector(
        `[data-ouia-component-id=${mockDiscoveredClusters[4].metadata.uid!}] td.pf-v5-c-table__action`
      )
    ).toBeEmptyDOMElement()
  })
})

describe('Import Discovered Cluster with import credentials', () => {
  beforeEach(() => {
    localStorage.clear()
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })
  test('create discovered ROSA cluster with auto import api token', async () => {
    // Set the sessionStorage item specifically for this test
    window.sessionStorage.setItem('DiscoveredClusterConsoleURL', 'https://test-cluster.com')

    // Custom Component for this test
    const Component = () => (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
          snapshot.set(secretsState, [mockCRHCredential1, mockOCMConnection1])
          snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
          snapshot.set(discoveredClusterState, mockDiscoveredClusters)
          snapshot.set(namespacesState, mockNamepaces)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<DiscoveredClustersPage />} />
            <Route path={NavigationPath.importCluster} element={<ImportClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    const { getAllByText, getAllByLabelText, getByDisplayValue } = render(<Component />) // Render the custom component

    await waitFor(() => {
      expect(getAllByText(mockDiscoveredClusters[1].metadata.name!)[0]!).toBeInTheDocument()
    })
    userEvent.click(getAllByLabelText('Actions')[1]) // Click on Kebab menu
    await clickByText('Import cluster')
    await waitForText('Import from Red Hat OpenShift Cluster Manager', true)

    await waitForText('OCM-Access-API')
    await waitForText(mockDiscoveredClusters[1].spec.credential!.name) // discovery credential field should be set correctly
    await waitForText('Cluster ID')
    getByDisplayValue('39ldt3r51vjjsho1eqntrg3m') // cluster ID field should be set correctly

    const projectNock = nockCreate(mockROSADiscoveryProject, mockROSADiscoveryProjectResponse)
    const managedClusterNock = nockCreate(mockManagedROSADiscoveredCluster, mockManagedROSADiscoveredClusterResponse)
    const kacNock = nockCreate(mockROSADiscoveryKlusterletAddonConfig, mockROSADiscoveryKlusterletAddonConfigResponse)
    const autoImportSecretNock = nockCreate(mockROSAAutoTokenSecretAPIToken)
    const importCommandNock = nockGet(mockROSAAutoTokenSecretAPIToken)

    // Add labels
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')

    // Advance to Review step and submit the form
    await clickByText('Next')
    await clickByText('Next')
    await waitForText('Import')
    await clickByText('Import')

    await waitForNocks([projectNock, managedClusterNock, kacNock, importCommandNock, autoImportSecretNock])
  })

  test('create discovered ROSA cluster with auto import service account', async () => {
    window.sessionStorage.setItem('DiscoveredClusterConsoleURL', 'https://test-cluster-serviceaccount.com')

    const Component = () => (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
          snapshot.set(secretsState, [mockCRHCredential2, mockOCMConnection2])
          snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
          snapshot.set(discoveredClusterState, mockDiscoveredClusters)
          snapshot.set(namespacesState, mockNamepaces)
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<DiscoveredClustersPage />} />
            <Route path={NavigationPath.importCluster} element={<ImportClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    const { getAllByText, getAllByLabelText, getByDisplayValue } = render(<Component />) // Render the custom component

    await waitFor(() => {
      expect(getAllByText(mockDiscoveredClusters[2].metadata.name!)[0]!).toBeInTheDocument()
    })
    userEvent.click(getAllByLabelText('Actions')[2]) // Click on Kebab menu
    await clickByText('Import cluster')
    await waitForText('Import from Red Hat OpenShift Cluster Manager', true)

    await waitForText('OCM-Access-SA')
    await waitForText(mockDiscoveredClusters[2].spec.credential!.name)
    await waitForText('Cluster ID')
    getByDisplayValue('39ldt3r51vjjsho1eqntrg3m') // cluster ID field should be set correctly

    const projectNock = nockCreate(mockROSADiscoveryProject, mockROSADiscoveryProjectResponse)
    const managedClusterNock = nockCreate(mockManagedROSADiscoveredCluster, mockManagedROSADiscoveredClusterResponse)
    const kacNock = nockCreate(mockROSADiscoveryKlusterletAddonConfig, mockROSADiscoveryKlusterletAddonConfigResponse)
    const autoImportSecretNock = nockCreate(mockROSAAutoTokenSecretServiceAcc)
    const importCommandNock = nockGet(mockROSAAutoTokenSecretServiceAcc)

    // Add labels
    await clickByTestId('label-input-button')
    await typeByTestId('additionalLabels', 'foo=bar{enter}')

    // Advance to Review step and submit the form
    await clickByText('Next')
    await clickByText('Next')
    await waitForText('Import')
    await clickByText('Import')

    await waitForNocks([projectNock, managedClusterNock, kacNock, importCommandNock, autoImportSecretNock])
  })
})
describe('Import cluster RHOCM mode', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })
  const RecoilCaptureSecretsSetter = ({ setSetSecrets, children }: PropsWithChildren<{ setSetSecrets: jest.Mock }>) => {
    const setSecrets = useSetRecoilState(secretsState)
    useEffect(() => {
      setSetSecrets(setSecrets)
    }, [setSetSecrets, setSecrets])
    return <>{children}</>
  }
  const Component = ({ secrets, setSetSecrets }: { secrets: Secret[]; setSetSecrets: jest.Mock }) => (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(secretsState, secrets)
        snapshot.set(namespacesState, mockNamepaces)
      }}
    >
      <RecoilCaptureSecretsSetter setSetSecrets={setSetSecrets} />
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<ImportClusterPage />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
  it('responds to changes in available RHOCM credentials', async () => {
    const setSetSecrets = jest.fn()
    render(<Component secrets={[mockCRHCredential1, mockCRHCredential2]} setSetSecrets={setSetSecrets} />)
    await clickByText('Import from Red Hat OpenShift Cluster Manager')
    await clickByText('Select a namespace')
    await clickByText(mockCRHCredential1.metadata.namespace!)
    await waitForText(mockCRHCredential1.metadata.name!)

    // Remove the 1st credential (setSecrets is the 1st argument to the most recent call to setSetSecrets)
    setSetSecrets.mock.calls.slice(-1)[0][0]([mockCRHCredential2])

    // Second credential should now be selected
    await waitForText(mockCRHCredential2.metadata.name!)
  })
  it('assert that deleted RHOCM credential does not exist in the credentials dropdown', async () => {
    const setSetSecrets = jest.fn()
    render(
      <Component secrets={[mockCRHCredential1, mockCRHCredential2, mockCRHCredential3]} setSetSecrets={setSetSecrets} />
    )

    await clickByText('Import from Red Hat OpenShift Cluster Manager')
    await clickByText('Select a namespace')
    await clickByText(mockCRHCredential1.metadata.namespace!)
    await waitForText(mockCRHCredential1.metadata.name!)

    // Remove the 1st credential (setSecrets is the 1st argument to the most recent call to setSetSecrets)
    setSetSecrets.mock.calls.slice(-1)[0][0]([mockCRHCredential2, mockCRHCredential3])

    // Second credential should now be selected
    await waitForText(mockCRHCredential2.metadata.name!)

    // Click on the button with the name "Credential Options menu"
    screen
      .getByRole('combobox', {
        name: 'Credential',
      })
      .click()
    // Assert the removed credential does not exist
    expect(screen.queryByText(mockCRHCredential1.metadata.name!)).not.toBeInTheDocument()
    expect(screen.queryByText(mockCRHCredential3.metadata.name!)).toBeInTheDocument()
    // Remove the 2nd credential (now the 1st in the list)
    setSetSecrets.mock.calls.slice(-1)[0][0]([mockCRHCredential3])

    // Assert the second removed credential does not exist
    expect(screen.queryByText(mockCRHCredential2.metadata.name!)).not.toBeInTheDocument()
    // Third credential should now be selected
    // Click on the button with the name "Credential Options menu"
    screen
      .getByRole('combobox', {
        name: 'Credential',
      })
      .click()
    // await new Promise((resolve) => setTimeout(resolve, 500))
    expect(screen.queryByText(mockCRHCredential3.metadata.name!)).toBeInTheDocument()
  })
})
