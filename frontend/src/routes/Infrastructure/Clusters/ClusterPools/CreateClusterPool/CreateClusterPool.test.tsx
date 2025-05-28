/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterImageSet,
  ClusterImageSetApiVersion,
  ClusterImageSetKind,
  ClusterPool,
  ClusterPoolApiVersion,
  ClusterPoolKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  ProjectRequest,
  ProjectRequestApiVersion,
  ProjectRequestKind,
  ProviderConnection,
  ProviderConnectionApiVersion,
  ProviderConnectionKind,
  Secret,
  SecretApiVersion,
  SecretKind,
} from '../../../../../resources'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { managedClusterSetsState, namespacesState, secretsState, Settings, settingsState } from '../../../../../atoms'
import { nockCreate, nockIgnoreApiPaths, nockIgnoreRBAC, nockList, nockReplace } from '../../../../../lib/nock-util'
import {
  clickByTestId,
  clickByText,
  selectByText,
  typeByPlaceholderText,
  typeByTestId,
  typeByText,
  waitForNocks,
  waitForTestId,
  waitForText,
} from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { CreateClusterPoolPage } from '../CreateClusterPoolPage'
import { CLUSTER_POOL_INFRA_TYPE_PARAM } from '../ClusterPoolInfrastructureType'
import { createProviderConnection } from '../../../../../test-helpers/createProviderConnection'

const clusterName = 'test'

///////////////////////////////// FILL FORM //////////////////////////////////////////////////

const clusterImageSet: ClusterImageSet = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
  metadata: {
    name: 'ocp-release43',
  },
  spec: {
    releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.6.15-x86_64',
  },
}
const mockClusterImageSet = [clusterImageSet]

const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3', 'test-namespace'].map((name) => ({
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name },
}))

const providerConnection: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'connection',
    namespace: clusterName,
    labels: {
      'cluster.open-cluster-management.io/type': 'aws',
      'cluster.open-cluster-management.io/credentials': '',
    },
  },
  stringData: {
    aws_access_key_id: 'aws_access_key_id',
    aws_secret_access_key: 'aws_secret_access_key',
    baseDomain: 'base.domain',
    pullSecret: '{"pullSecret":"secret"}',
    'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
    'ssh-publickey': 'ssh-rsa AAAAB1 fakeemail@redhat.com',
  },
  type: 'Opaque',
}

const mockNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: { name: 'test-namespace' },
}

const mockNamespaceUpdate: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: mockNamespace.metadata.name,
    labels: { 'open-cluster-management.io/managed-by': 'clusterpools' },
  },
}

const mockCreateProject: ProjectRequest = {
  apiVersion: ProjectRequestApiVersion,
  kind: ProjectRequestKind,
  metadata: { name: mockNamespace.metadata.name },
}

///////////////////////////////// CREATE RESOURCE MOCKS //////////////////////////////////////////////////

const mockPullSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-pull-secret',
    namespace: mockNamespace.metadata.name!,
  },
  stringData: {
    '.dockerconfigjson': '{"pullSecret":"secret"}',
  },
  type: 'kubernetes.io/dockerconfigjson',
}

const mockInstallConfigSecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-install-config',
    namespace: mockNamespace.metadata.name!,
  },
  type: 'Opaque',
  data: {
    'install-config.yaml':
      'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogJ3Rlc3QnCmJhc2VEb21haW46IGJhc2UuZG9tYWluCmNvbnRyb2xQbGFuZToKICBoeXBlcnRocmVhZGluZzogRW5hYmxlZAogIG5hbWU6IG1hc3RlcgogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogNDAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKY29tcHV0ZToKLSBoeXBlcnRocmVhZGluZzogRW5hYmxlZAogIG5hbWU6ICd3b3JrZXInCiAgcmVwbGljYXM6IDMKICBwbGF0Zm9ybToKICAgIGF3czoKICAgICAgcm9vdFZvbHVtZToKICAgICAgICBpb3BzOiAyMDAwCiAgICAgICAgc2l6ZTogMTAwCiAgICAgICAgdHlwZTogaW8xCiAgICAgIHR5cGU6IG01LnhsYXJnZQpuZXR3b3JraW5nOgogIG5ldHdvcmtUeXBlOiBPcGVuU2hpZnRTRE4KICBjbHVzdGVyTmV0d29yazoKICAtIGNpZHI6IDEwLjEyOC4wLjAvMTQKICAgIGhvc3RQcmVmaXg6IDIzCiAgbWFjaGluZU5ldHdvcms6CiAgLSBjaWRyOiAxMC4wLjAuMC8xNgogIHNlcnZpY2VOZXR3b3JrOgogIC0gMTcyLjMwLjAuMC8xNgpwbGF0Zm9ybToKICBhd3M6CiAgICByZWdpb246IHVzLWVhc3QtMQpwdWxsU2VjcmV0OiAiIiAjIHNraXAsIGhpdmUgd2lsbCBpbmplY3QgYmFzZWQgb24gaXQncyBzZWNyZXRzCnNzaEtleTogfC0KICAgIHNzaC1yc2EgQUFBQUIxIGZha2VlbWFpbEByZWRoYXQuY29tCg==',
  },
}

const mockInstallConfigSecretAWSPrivate: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-install-config',
    namespace: mockNamespace.metadata.name!,
  },
  type: 'Opaque',
  data: {
    'install-config.yaml':
      'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogJ3Rlc3QnCmJhc2VEb21haW46IGJhc2UuZG9tYWluCmNvbnRyb2xQbGFuZToKICBoeXBlcnRocmVhZGluZzogRW5hYmxlZAogIG5hbWU6IG1hc3RlcgogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogNDAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKY29tcHV0ZToKLSBoeXBlcnRocmVhZGluZzogRW5hYmxlZAogIG5hbWU6ICd3b3JrZXInCiAgcmVwbGljYXM6IDMKICBwbGF0Zm9ybToKICAgIGF3czoKICAgICAgcm9vdFZvbHVtZToKICAgICAgICBpb3BzOiAyMDAwCiAgICAgICAgc2l6ZTogMTAwCiAgICAgICAgdHlwZTogaW8xCiAgICAgIHR5cGU6IG01LnhsYXJnZQpuZXR3b3JraW5nOgogIG5ldHdvcmtUeXBlOiBPcGVuU2hpZnRTRE4KICBjbHVzdGVyTmV0d29yazoKICAtIGNpZHI6IDEwLjEyOC4wLjAvMTQKICAgIGhvc3RQcmVmaXg6IDIzCiAgbWFjaGluZU5ldHdvcms6CiAgLSBjaWRyOiAxMC4wLjAuMC8xNgogIHNlcnZpY2VOZXR3b3JrOgogIC0gMTcyLjMwLjAuMC8xNgpwbGF0Zm9ybToKICBhd3M6CiAgICByZWdpb246IHVzLWVhc3QtMQogICAgc3VibmV0czoKICAgICAgLSBzdWJuZXQtMDIyMTZkZDRkYWU3YzQ1ZDAKICAgIHNlcnZpY2VFbmRwb2ludHM6CiAgICAgIC0gbmFtZTogZW5kcG9pbnQtMQogICAgICAgIHVybDogaHR0cHM6Ly9hd3MuZW5kcG9pbnQtMS5jb20KICAgIGhvc3RlZFpvbmU6IGF3cy1ob3N0ZWQtem9uZS5jb20KICAgIGFtaUlEOiBhbWktMDg3NmVhY2IzODE5MWU5MWYKcHVibGlzaDogSW50ZXJuYWwKcHVsbFNlY3JldDogIiIgIyBza2lwLCBoaXZlIHdpbGwgaW5qZWN0IGJhc2VkIG9uIGl0J3Mgc2VjcmV0cwpzc2hLZXk6IHwtCiAgICBzc2gtcnNhIEFBQUFCMSBmYWtlZW1haWxAcmVkaGF0LmNvbQo=',
  },
}

const mockCredentialSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  type: 'Opaque',
  metadata: {
    name: `${clusterName}-aws-creds`,
    namespace: mockNamespace.metadata.name!,
  },
  stringData: {
    aws_access_key_id: 'aws_access_key_id',
    aws_secret_access_key: 'aws_secret_access_key',
  },
}

const mockClusterPool: ClusterPool = {
  apiVersion: ClusterPoolApiVersion,
  kind: ClusterPoolKind,
  metadata: {
    name: clusterName,
    namespace: mockNamespace.metadata.name!,
    labels: {
      cloud: 'AWS',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
  },
  spec: {
    size: 1,
    runningCount: 0,
    baseDomain: providerConnection.stringData?.baseDomain!,
    installConfigSecretTemplateRef: {
      name: mockInstallConfigSecret.metadata.name!,
    },
    imageSetRef: {
      name: clusterImageSet.metadata.name!,
    },
    pullSecretRef: {
      name: mockPullSecret.metadata.name!,
    },
    platform: {
      aws: {
        credentialsSecretRef: {
          name: mockCredentialSecret.metadata.name!,
        },
        region: 'us-east-1',
      },
    },
  },
}
const mockClusterPoolPrivate: ClusterPool = {
  apiVersion: ClusterPoolApiVersion,
  kind: ClusterPoolKind,
  metadata: {
    name: clusterName,
    namespace: mockNamespace.metadata.name!,
    labels: {
      cloud: 'AWS',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
  },
  spec: {
    size: 1,
    runningCount: 0,
    baseDomain: providerConnection.stringData?.baseDomain!,
    installConfigSecretTemplateRef: {
      name: mockInstallConfigSecret.metadata.name!,
    },
    imageSetRef: {
      name: clusterImageSet.metadata.name!,
    },
    pullSecretRef: {
      name: mockPullSecret.metadata.name!,
    },
    platform: {
      aws: {
        credentialsSecretRef: {
          name: mockCredentialSecret.metadata.name!,
        },
        region: 'us-east-1',
        privateLink: {
          enabled: true,
        },
      },
    },
  },
}

const settings: Settings = {
  awsPrivateWizardStep: 'enabled',
}

///////////////////////////////// TESTS /////////////////////////////////////////////////////

describe('CreateClusterPool AWS', () => {
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(namespacesState, mockNamespaces)
          snapshot.set(secretsState, [providerConnection as Secret])
          snapshot.set(settingsState, settings)
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createClusterPool}?${CLUSTER_POOL_INFRA_TYPE_PARAM}=AWS`]}>
          <Routes>
            <Route path={NavigationPath.createClusterPool} element={<CreateClusterPoolPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('can create a cluster pool', async () => {
    window.scrollBy = () => {}

    const initialNocks = [nockList(clusterImageSet, mockClusterImageSet)]

    const newProviderConnection = createProviderConnection(
      'aws',
      { aws_access_key_id: 'aws_access_key_id', aws_secret_access_key: 'aws_secret_access_key' },
      true
    )

    // create the form
    const { container } = render(<Component />)

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)

    // connection
    let select = screen
      .getByRole('combobox', { name: /Infrastructure provider credential/i })
      .querySelector('input[type="text"]') as HTMLElement
    select.click()

    // Should show the modal wizard
    await clickByText('Add credential')
    // Credentials type
    await waitForTestId('credentialsType-input-toggle')
    await typeByTestId('credentialsName', newProviderConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', newProviderConnection.metadata.namespace!)
    await clickByText('Cancel', 1)

    select = screen
      .getByRole('combobox', { name: /Infrastructure provider credential/i })
      .querySelector('input[type="text"]') as HTMLElement
    select.click()
    await clickByText(providerConnection.metadata.name!)

    // step 2 -- the name, namespace and imageset
    await typeByTestId('eman', clusterName!)
    await typeByTestId('emanspace', mockCreateProject.metadata.name!)
    await typeByTestId('imageSet', clusterImageSet!.spec!.releaseImage!)
    container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
    await clickByText('Next')

    // skip AWS private config
    await clickByText('Next')

    await clickByText('Review and create')

    // nocks for cluster creation
    const createNocks = [
      // create aws namespace (project)
      nockCreate(mockCreateProject),
      nockReplace(mockNamespaceUpdate),

      // create the managed cluster
      nockCreate(mockPullSecret),
      nockCreate(mockInstallConfigSecret),
      nockCreate(mockCredentialSecret),
      nockCreate(mockClusterPool),
    ]

    // click create button
    await clickByText('Create')

    await waitForText('Creating ClusterPool ...')

    // make sure creating
    await waitForNocks(createNocks)
  })

  test('can create a cluster pool with AWS private', async () => {
    window.scrollBy = () => {}

    const initialNocks = [nockList(clusterImageSet, mockClusterImageSet)]

    const newProviderConnection = createProviderConnection(
      'aws',
      { aws_access_key_id: 'aws_access_key_id', aws_secret_access_key: 'aws_secret_access_key' },
      true
    )

    // create the form
    const { container } = render(<Component />)

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)

    // connection
    screen.queryByPlaceholderText(/connection/i)!.click()

    // Should show the modal wizard
    await clickByText('Add credential')
    // Credentials type
    await waitForTestId('credentialsType-input-toggle')
    await typeByTestId('credentialsName', newProviderConnection.metadata.name!)
    await selectByText('Select a namespace for the credential', newProviderConnection.metadata.namespace!)
    await clickByText('Cancel', 1)

    screen.queryByPlaceholderText(/connection/i)!.click()
    await clickByText(providerConnection.metadata.name!)

    // step 2 -- the name, namespace and imageset
    await typeByTestId('eman', clusterName!)
    await typeByTestId('emanspace', mockCreateProject.metadata.name!)
    await typeByTestId('imageSet', clusterImageSet!.spec!.releaseImage!)
    container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
    await clickByText('Next')
    await clickByText('Next')
    await clickByText('Next')
    await clickByText('Next')

    // AWS private config
    // step 5 -- AWS private configuration
    await clickByTestId('hasPrivateConfig')
    await typeByText('Hosted zone', 'aws-hosted-zone.com')
    await typeByPlaceholderText('Enter AMI ID', 'ami-0876eacb38191e91f')
    await clickByText('Subnets')
    await typeByPlaceholderText('Enter one or more subnet IDs', 'subnet-02216dd4dae7c45d0')
    await clickByText('Service Endpoints')
    await typeByPlaceholderText('Enter AWS service endpoint name', 'endpoint-1')
    await typeByPlaceholderText('Enter AWS service endpoint URL', 'https://aws.endpoint-1.com')
    await clickByText('Next')
    await clickByText('Review and create', 1)
    // nocks for cluster creation
    const createNocks = [
      // create aws namespace (project)
      nockCreate(mockCreateProject),
      nockReplace(mockNamespaceUpdate),

      // create the managed cluster
      nockCreate(mockPullSecret),
      nockCreate(mockInstallConfigSecretAWSPrivate),
      nockCreate(mockCredentialSecret),
      nockCreate(mockClusterPoolPrivate),
    ]

    // click create button
    await clickByText('Create')

    await waitForText('Creating ClusterPool ...')

    // make sure creating
    await waitForNocks(createNocks)
  })
})
