/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  ClusterImageSet,
  ClusterImageSetApiVersion,
  ClusterImageSetKind,
  IResource,
  MachinePool,
  MachinePoolApiVersion,
  MachinePoolKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
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
  SubscriptionOperator,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
} from '../../../../../resources'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
  clusterCuratorsState,
  managedClusterSetsState,
  managedClustersState,
  secretsState,
  settingsState,
  subscriptionOperatorsState,
} from '../../../../../atoms'
import { nockCreate, nockIgnoreApiPaths, nockIgnoreRBAC, nockList } from '../../../../../lib/nock-util'
import {
  clickByPlaceholderText,
  clickByRole,
  clickByTestId,
  clickByText,
  typeByPlaceholderText,
  typeByTestId,
  typeByText,
  waitForNocks,
  waitForNotText,
  waitForText,
} from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { Scope } from 'nock/types'
import {
  clusterName,
  baseDomain,
  mockAgentClusterInstall,
  mockClusterDeploymentAI,
  clusterImageSet,
  mockClusterImageSet,
} from './CreateCluster.sharedmocks'
import { PluginContext } from '../../../../../lib/PluginContext'
import { CreateClusterPage } from '../CreateClusterPage'
import { PluginDataContext } from '../../../../../lib/PluginDataContext'
import { CLUSTER_INFRA_TYPE_PARAM } from '../ClusterInfrastructureType'

//const awsProjectNamespace = 'test-aws-namespace'

///////////////////////////////// FILL FORM //////////////////////////////////////////////////

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

const mockClusterCuratorInstall: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: clusterName,
    namespace: clusterName,
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
    desiredCuration: 'install',
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
    namespace: clusterName,
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

const mockClusterCurators = [clusterCurator]

///// AWS /////
const providerConnectionAws: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'connectionAws',
    namespace: clusterName,
    labels: {
      'cluster.open-cluster-management.io/type': 'aws',
    },
  },
  stringData: {
    aws_access_key_id: 'fake-aws-key-id',
    aws_secret_access_key: 'fake-aws-secret-access-key',
    baseDomain,
    pullSecret: '{"pullSecret":"secret"}',
    'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
    'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
    httpProxy: 'http://example.com',
    httpsProxy: 'https://example.com',
  },
  type: 'Opaque',
}

const clusterImageSetAws: ClusterImageSet = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
  metadata: {
    name: 'ocp-release48',
  },
  spec: {
    releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.0-fc.7-x86_64',
  },
}
const mockClusterImageSetAws = [clusterImageSetAws]

const mockMachinePoolAws: MachinePool = {
  apiVersion: MachinePoolApiVersion,
  kind: MachinePoolKind,
  metadata: {
    name: 'test-worker',
    namespace: clusterName,
  },
  spec: {
    clusterDeploymentRef: {
      name: 'test',
    },
    name: 'worker',
    platform: {
      aws: {
        rootVolume: {
          iops: 2000,
          size: 100,
          type: 'io1',
        },
        type: 'm5.xlarge',
      },
    },
    replicas: 3,
  },
}

//////////////////////////////// CREATE MOCKS //////////////////////////////////////////
const mockClusterProject: ProjectRequest = {
  apiVersion: ProjectRequestApiVersion,
  kind: ProjectRequestKind,
  metadata: { name: clusterName },
}

const mockClusterProjectResponse: Project = {
  apiVersion: ProjectApiVersion,
  kind: ProjectKind,
  metadata: {
    name: clusterName,
  },
}

const mockManagedClusterAI: ManagedCluster = {
  apiVersion: 'cluster.open-cluster-management.io/v1',
  kind: 'ManagedCluster',
  metadata: {
    labels: {
      cloud: 'BareMetal',
      vendor: 'OpenShift',
      name: 'test',
      myLabelKey: 'myValue',
    },
    name: 'test',
  },
  spec: { hubAcceptsClient: true },
}

const pullSecretAI = '{"auths":{"cloud.openshift.com":{"auth":"b3BlbSKIPPED","email":"my@email.somewhere.com"}}}'
const mockPullSecretAI = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'pullsecret-cluster-test',
    namespace: 'test',
    labels: { 'cluster.open-cluster-management.io/backup': 'cluster' },
  },
  data: {
    '.dockerconfigjson':
      'eyJhdXRocyI6eyJjbG91ZC5vcGVuc2hpZnQuY29tIjp7ImF1dGgiOiJiM0JsYlNLSVBQRUQiLCJlbWFpbCI6Im15QGVtYWlsLnNvbWV3aGVyZS5jb20ifX19',
  },
  type: 'kubernetes.io/dockerconfigjson',
}

const mockInstallConfigSecretPrivate = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-install-config',
    namespace: 'test',
    labels: {
      'cluster.open-cluster-management.io/backup': 'cluster',
    },
  },
  type: 'Opaque',
  data: {
    'install-config.yaml':
      'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogJ3Rlc3QnCmJhc2VEb21haW46IGJhc2UuZG9tYWluLmNvbQpjb250cm9sUGxhbmU6CiAgaHlwZXJ0aHJlYWRpbmc6IEVuYWJsZWQKICBuYW1lOiBtYXN0ZXIKICByZXBsaWNhczogMwogIHBsYXRmb3JtOgogICAgYXdzOgogICAgICByb290Vm9sdW1lOgogICAgICAgIGlvcHM6IDQwMDAKICAgICAgICBzaXplOiAxMDAKICAgICAgICB0eXBlOiBpbzEKICAgICAgdHlwZTogbTUueGxhcmdlCmNvbXB1dGU6Ci0gaHlwZXJ0aHJlYWRpbmc6IEVuYWJsZWQKICBuYW1lOiAnd29ya2VyJwogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogMjAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKbmV0d29ya2luZzoKICBuZXR3b3JrVHlwZTogT3BlblNoaWZ0U0ROCiAgY2x1c3Rlck5ldHdvcms6CiAgLSBjaWRyOiAxMC4xMjguMC4wLzE0CiAgICBob3N0UHJlZml4OiAyMwogIG1hY2hpbmVOZXR3b3JrOgogIC0gY2lkcjogMTAuMC4wLjAvMTYKICBzZXJ2aWNlTmV0d29yazoKICAtIDE3Mi4zMC4wLjAvMTYKcGxhdGZvcm06CiAgYXdzOgogICAgcmVnaW9uOiB1cy1lYXN0LTEKICAgIHN1Ym5ldHM6CiAgICAgIC0gc3VibmV0LTAyMjE2ZGQ0ZGFlN2M0NWQwCiAgICBzZXJ2aWNlRW5kcG9pbnRzOgogICAgICAtIG5hbWU6IGVuZHBvaW50LTEKICAgICAgICB1cmw6IGh0dHBzOi8vYXdzLmVuZHBvaW50LTEuY29tCiAgICBob3N0ZWRab25lOiBhd3MtaG9zdGVkLXpvbmUuY29tCiAgICBhbWlJRDogYW1pLTA4NzZlYWNiMzgxOTFlOTFmCnB1Ymxpc2g6IEludGVybmFsCnB1bGxTZWNyZXQ6ICIiICMgc2tpcCwgaGl2ZSB3aWxsIGluamVjdCBiYXNlZCBvbiBpdCdzIHNlY3JldHMKc3NoS2V5OiB8LQogICAgc3NoLXJzYSBBQUFBQjEgZmFrZUBlbWFpbC5jb20K',
  },
}

const mockPullSecretAws = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-pull-secret',
    namespace: 'test',
    labels: {
      'cluster.open-cluster-management.io/backup': 'cluster',
      'cluster.open-cluster-management.io/copiedFromNamespace': providerConnectionAws.metadata.namespace!,
      'cluster.open-cluster-management.io/copiedFromSecretName': providerConnectionAws.metadata.name!,
    },
  },
  stringData: {
    '.dockerconfigjson': '{"pullSecret":"secret"}',
  },
  type: 'kubernetes.io/dockerconfigjson',
}

const mockInstallConfigSecretAws = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-install-config',
    namespace: 'test',
    labels: {
      'cluster.open-cluster-management.io/backup': 'cluster',
    },
  },
  type: 'Opaque',
  data: {
    'install-config.yaml':
      'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogJ3Rlc3QnCmJhc2VEb21haW46IGJhc2UuZG9tYWluLmNvbQpjb250cm9sUGxhbmU6CiAgaHlwZXJ0aHJlYWRpbmc6IEVuYWJsZWQKICBuYW1lOiBtYXN0ZXIKICByZXBsaWNhczogMwogIHBsYXRmb3JtOgogICAgYXdzOgogICAgICByb290Vm9sdW1lOgogICAgICAgIGlvcHM6IDQwMDAKICAgICAgICBzaXplOiAxMDAKICAgICAgICB0eXBlOiBpbzEKICAgICAgdHlwZTogbTUueGxhcmdlCmNvbXB1dGU6Ci0gaHlwZXJ0aHJlYWRpbmc6IEVuYWJsZWQKICBuYW1lOiAnd29ya2VyJwogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogMjAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKbmV0d29ya2luZzoKICBuZXR3b3JrVHlwZTogT3BlblNoaWZ0U0ROCiAgY2x1c3Rlck5ldHdvcms6CiAgLSBjaWRyOiAxMC4xMjguMC4wLzE0CiAgICBob3N0UHJlZml4OiAyMwogIG1hY2hpbmVOZXR3b3JrOgogIC0gY2lkcjogMTAuMC4wLjAvMTYKICBzZXJ2aWNlTmV0d29yazoKICAtIDE3Mi4zMC4wLjAvMTYKcGxhdGZvcm06CiAgYXdzOgogICAgcmVnaW9uOiB1cy1lYXN0LTEKcHVsbFNlY3JldDogIiIgIyBza2lwLCBoaXZlIHdpbGwgaW5qZWN0IGJhc2VkIG9uIGl0J3Mgc2VjcmV0cwpzc2hLZXk6IHwtCiAgICBzc2gtcnNhIEFBQUFCMSBmYWtlQGVtYWlsLmNvbQo=',
  },
}

const mockProviderConnectionSecretCopiedAws = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-aws-creds',
    namespace: 'test',
    labels: {
      'cluster.open-cluster-management.io/backup': 'cluster',
      'cluster.open-cluster-management.io/copiedFromNamespace': providerConnectionAws.metadata.namespace!,
      'cluster.open-cluster-management.io/copiedFromSecretName': providerConnectionAws.metadata.name!,
    },
  },
  type: 'Opaque',
  stringData: {
    aws_access_key_id: 'fake-aws-key-id',
    aws_secret_access_key: 'fake-aws-secret-access-key',
  },
}

const mockKlusterletAddonConfigAI = {
  apiVersion: 'agent.open-cluster-management.io/v1',
  kind: 'KlusterletAddonConfig',
  metadata: {
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    clusterName: clusterName,
    clusterNamespace: clusterName,
    clusterLabels: {
      cloud: 'BareMetal',
      vendor: 'OpenShift',
    },
    applicationManager: {
      enabled: true,
    },
    policyController: {
      enabled: true,
    },
    searchCollector: {
      enabled: true,
    },
    certPolicyController: {
      enabled: true,
    },
    iamPolicyController: {
      enabled: true,
    },
  },
}

///// AWS /////
const mockManagedClusterAws: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    labels: {
      cloud: 'Amazon',
      region: 'us-east-1',
      name: clusterName,
      vendor: 'OpenShift',
    },
    name: clusterName,
  },
  spec: {
    hubAcceptsClient: true,
  },
}

const mockClusterDeploymentAws = {
  apiVersion: 'hive.openshift.io/v1',
  kind: 'ClusterDeployment',
  metadata: {
    name: 'test',
    namespace: 'test',
    labels: {
      cloud: 'AWS',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
  },
  spec: {
    baseDomain,
    clusterName: 'test',
    controlPlaneConfig: {
      servingCertificates: {},
    },
    installAttemptsLimit: 1,
    installed: false,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-aws-creds',
        },
        region: 'us-east-1',
      },
    },
    provisioning: {
      installConfigSecretRef: {
        name: 'test-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-ssh-private-key',
      },
      imageSetRef: {
        name: 'ocp-release48',
      },
    },
    pullSecretRef: {
      name: 'test-pull-secret',
    },
  },
}

const mockClusterDeploymentAwsPrivate = {
  apiVersion: 'hive.openshift.io/v1',
  kind: 'ClusterDeployment',
  metadata: {
    name: 'test',
    namespace: 'test',
    labels: {
      cloud: 'AWS',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
  },
  spec: {
    baseDomain,
    clusterName: 'test',
    controlPlaneConfig: {
      servingCertificates: {},
    },
    installAttemptsLimit: 1,
    installed: false,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-aws-creds',
        },
        region: 'us-east-1',
        privateLink: {
          enabled: true,
        },
      },
    },
    provisioning: {
      installConfigSecretRef: {
        name: 'test-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-ssh-private-key',
      },
      imageSetRef: {
        name: 'ocp-release48',
      },
    },
    pullSecretRef: {
      name: 'test-pull-secret',
    },
  },
}

const mockClusterDeploymentAwsAnsible = {
  apiVersion: 'hive.openshift.io/v1',
  kind: 'ClusterDeployment',
  metadata: {
    name: 'test',
    namespace: 'test',
    labels: {
      cloud: 'AWS',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
    annotations: {
      'hive.openshift.io/reconcile-pause': 'true',
    },
  },
  spec: {
    baseDomain,
    clusterName: 'test',
    controlPlaneConfig: {
      servingCertificates: {},
    },
    installAttemptsLimit: 1,
    installed: false,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-aws-creds',
        },
        region: 'us-east-1',
      },
    },
    provisioning: {
      installConfigSecretRef: {
        name: 'test-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-ssh-private-key',
      },
      imageSetRef: {
        name: 'ocp-release48',
      },
    },
    pullSecretRef: {
      name: 'test-pull-secret',
    },
  },
}

const mockPrivateSecretAws = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'test-ssh-private-key',
    namespace: 'test',
    labels: {
      'cluster.open-cluster-management.io/backup': 'cluster',
      'cluster.open-cluster-management.io/copiedFromNamespace': providerConnectionAws.metadata.namespace!,
      'cluster.open-cluster-management.io/copiedFromSecretName': providerConnectionAws.metadata.name!,
    },
  },
  stringData: {
    'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
  },
  type: 'Opaque',
}

const mockKlusterletAddonSecretAws = {
  apiVersion: 'agent.open-cluster-management.io/v1',
  kind: 'KlusterletAddonConfig',
  metadata: {
    name: 'test',
    namespace: 'test',
  },
  spec: {
    clusterName: 'test',
    clusterNamespace: 'test',
    clusterLabels: {
      cloud: 'Amazon',
      vendor: 'OpenShift',
    },
    applicationManager: {
      enabled: true,
    },
    policyController: {
      enabled: true,
    },
    searchCollector: {
      enabled: true,
    },
    certPolicyController: {
      enabled: true,
    },
    iamPolicyController: {
      enabled: true,
    },
  },
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

///////////////////////////////// TESTS /////////////////////////////////////////////////////

describe('CreateCluster AWS', () => {
  const Component = (props: { subscriptions?: SubscriptionOperator[] }) => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, [])
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(secretsState, [providerConnectionAnsible as Secret, providerConnectionAws as Secret])
          snapshot.set(clusterCuratorsState, mockClusterCurators)
          snapshot.set(settingsState, {
            ansibleIntegration: 'enabled',
            singleNodeOpenshift: 'enabled',
            awsPrivateWizardStep: 'enabled',
          })
          snapshot.set(subscriptionOperatorsState, props.subscriptions || [])
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?${CLUSTER_INFRA_TYPE_PARAM}=AWS`]}>
          <Route path={NavigationPath.createCluster}>
            <CreateClusterPage />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('can create AWS cluster without ansible template', async () => {
    window.scrollBy = () => {}

    const initialNocks = [nockList(clusterImageSetAws, mockClusterImageSetAws)]

    // create the form
    const { container } = render(<Component />)

    await new Promise((resolve) => setTimeout(resolve, 500))

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)

    // connection should be pre-selected

    // step 1 -- cluster details
    await typeByTestId('eman', clusterName!)
    await typeByTestId('imageSet', clusterImageSetAws!.spec!.releaseImage!)
    container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
    await clickByText('Next')

    // step 2 -- node pools
    await clickByText('Next')

    // step 3 -- netwroking
    await clickByText('Next')

    // step 4 -- proxy
    screen.getByRole('checkbox', { name: /use proxy/i }).click()
    await clickByText('Next')

    // step 5 - AWS private configuration
    await clickByText('Next')

    // step 6 -- automation
    await waitForText('Install the operator')
    await clickByPlaceholderText('Select an automation template')
    await clickByText(mockClusterCurators[0].metadata.name!)

    // check template summary
    await waitForText(`View ${mockClusterCurators[0].metadata.name!}`)
    await waitForText('Preinstall Ansible templates')
    await waitForText(mockClusterCurators[0].spec!.install!.prehook![0].name!)

    // clear template
    await clickByRole('button', { name: /clear selected item/i })
    await waitForNotText('View test')
    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      // create aws namespace (project)
      nockCreate(mockClusterProject, mockClusterProjectResponse),

      // create the managed cluster
      nockCreate(mockManagedClusterAws),
      nockCreate(mockMachinePoolAws),
      nockCreate(mockProviderConnectionSecretCopiedAws),
      nockCreate(mockPullSecretAws),
      nockCreate(mockInstallConfigSecretAws),
      nockCreate(mockPrivateSecretAws),
      nockCreate(mockKlusterletAddonSecretAws),
      nockCreate(mockClusterDeploymentAws),
    ]

    // click create button
    await clickByText('Create')

    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })

  test('can create AWS cluster with ansible template', async () => {
    window.scrollBy = () => {}

    const initialNocks = [nockList(clusterImageSetAws, mockClusterImageSetAws)]

    // create the form
    const { container } = render(<Component subscriptions={[subscriptionOperator]} />)

    await new Promise((resolve) => setTimeout(resolve, 500))

    // wait for tables/combos to fill in

    await waitForNocks(initialNocks)

    // connection should be pre-selected

    // step 1 -- cluster details
    await typeByTestId('eman', clusterName!)
    await typeByTestId('imageSet', clusterImageSetAws!.spec!.releaseImage!)
    container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
    await clickByText('Next')

    // step 2 -- node pools
    await clickByText('Next')

    // step 3 -- networking
    await clickByText('Next')

    // step 4 -- proxy
    screen.getByRole('checkbox', { name: /use proxy/i }).click()
    await clickByText('Next')

    // step 5 -- AWS private configuration
    await clickByText('Next')

    // step 6 -- automation
    await waitForText('Automation template')
    await waitForNotText('Install the operator')
    await clickByPlaceholderText('Select an automation template')
    await clickByText(mockClusterCurators[0].metadata.name!)
    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      // create aws namespace (project)
      nockCreate(mockClusterProject, mockClusterProjectResponse),

      // create the managed cluster
      nockCreate(mockManagedClusterAws),
      nockCreate(mockMachinePoolAws),
      nockCreate(mockProviderConnectionSecretCopiedAws),
      nockCreate(mockPullSecretAws),
      nockCreate(mockInstallConfigSecretAws),
      nockCreate(mockPrivateSecretAws),
      nockCreate(mockKlusterletAddonSecretAws),
      nockCreate(mockClusterDeploymentAwsAnsible),
      nockCreate(mockProviderConnectionAnsibleCopied),
      nockCreate(mockClusterCuratorInstall),
    ]

    // click create button
    await clickByText('Create')

    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })

  test('can create AWS cluster with private configuration', async () => {
    window.scrollBy = () => {}

    const initialNocks = [nockList(clusterImageSetAws, mockClusterImageSetAws)]

    // create the form
    const { container } = render(<Component />)

    await new Promise((resolve) => setTimeout(resolve, 500))

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)

    // connection should be pre-selected

    // step 1 -- cluster details
    await typeByTestId('eman', clusterName!)
    await typeByTestId('imageSet', clusterImageSetAws!.spec!.releaseImage!)
    container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
    await clickByText('Next')

    // step 2 -- node pools
    await clickByText('Next')

    // step 3 -- networking
    await clickByText('Next')

    // step 4 -- proxy
    screen.getByRole('checkbox', { name: /use proxy/i }).click()
    await clickByText('Next')

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

    // step 6 -- automation
    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      // create aws namespace (project)
      nockCreate(mockClusterProject, mockClusterProjectResponse),

      // create the managed cluster
      nockCreate(mockManagedClusterAws),
      nockCreate(mockMachinePoolAws),
      nockCreate(mockProviderConnectionSecretCopiedAws),
      nockCreate(mockPullSecretAws),
      nockCreate(mockInstallConfigSecretPrivate),
      nockCreate(mockPrivateSecretAws),
      nockCreate(mockKlusterletAddonSecretAws),
      nockCreate(mockClusterDeploymentAwsPrivate),
    ]

    // click create button
    await clickByText('Create')

    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })

  test('can create AWS cluster without KlusterletAddonConfig on MCE', async () => {
    window.scrollBy = () => {}

    const initialNocks = [nockList(clusterImageSetAws, mockClusterImageSetAws)]

    // create the form
    const { container } = render(
      <PluginContext.Provider value={{ isACMAvailable: false, dataContext: PluginDataContext }}>
        <Component />
      </PluginContext.Provider>
    )

    await new Promise((resolve) => setTimeout(resolve, 500))

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)

    // connection should be pre-selected

    // step 1 -- cluster details
    await typeByTestId('eman', clusterName!)
    await typeByTestId('imageSet', clusterImageSetAws!.spec!.releaseImage!)
    container.querySelector<HTMLButtonElement>('.tf--list-box__menu-item')?.click()
    await clickByText('Next')

    // step 2 -- node pools
    await clickByText('Next')

    // step 4 -- networking
    await clickByText('Next')

    // step 4 -- proxy
    screen.getByRole('checkbox', { name: /use proxy/i }).click()
    await clickByText('Next')

    // step 5 -- AWS private configuration
    await clickByText('Next')

    // step 6 -- automation
    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      // create aws namespace (project)
      nockCreate(mockClusterProject, mockClusterProjectResponse),

      // create the managed cluster
      nockCreate(mockManagedClusterAws),
      nockCreate(mockMachinePoolAws),
      nockCreate(mockProviderConnectionSecretCopiedAws),
      nockCreate(mockPullSecretAws),
      nockCreate(mockInstallConfigSecretAws),
      nockCreate(mockPrivateSecretAws),
      nockCreate(mockClusterDeploymentAws),
    ]

    // click create button
    await clickByText('Create')

    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })
})

describe('CreateCluster on premise', () => {
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, [])
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(secretsState, [providerConnectionAnsible as Secret, providerConnectionAws as Secret])
          snapshot.set(clusterCuratorsState, mockClusterCurators)
          snapshot.set(settingsState, {
            ansibleIntegration: 'enabled',
            singleNodeOpenshift: 'enabled',
            awsPrivateWizardStep: 'enabled',
          })
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?${CLUSTER_INFRA_TYPE_PARAM}=CIM`]}>
          <Route path={NavigationPath.createCluster}>
            <CreateClusterPage />
          </Route>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test(
    'can create On Premise cluster',
    async () => {
      const initialNocks: Scope[] = [nockList(clusterImageSet as IResource, mockClusterImageSet as IResource[])]
      render(<Component />)

      // Create On Premise cluster
      // TODO(mlibra) Add specific test case for the ai flow (start by clicking cluster.create.ai.subtitle hear instead)

      // wait for tables/combos to fill in
      await waitForNocks(initialNocks)

      // check integration of AI in the left-side navigation
      await waitForText('Cluster details', true)
      await waitForText('Review and save')
      await waitForText('Hosts')
      await waitForText('Networking')
      await waitForText('Review and create')

      // fill-in Cluster details
      await typeByTestId('form-input-name-field', clusterName)
      await typeByTestId('form-input-baseDnsDomain-field', baseDomain)

      await clickByTestId('form-input-highAvailabilityMode-field')
      await waitForText('ai:SNO enables you to install OpenShift using only one host.')
      await clickByTestId('form-input-highAvailabilityMode-field')

      await waitForText('OpenShift 4.8.15') // single value of combobox
      await typeByTestId('additionalLabels', 'myLabelKey=myValue')
      await clickByTestId('form-input-pullSecret-field')

      await typeByTestId('form-input-pullSecret-field', pullSecretAI)

      // transition to Automation
      await new Promise((resolve) => setTimeout(resolve, 500))
      await clickByText('Next')
      // The test is flaky here
      await new Promise((resolve) => setTimeout(resolve, 500))
      await waitForText('Automation template')

      // skip Automation to the Review and Save step
      await clickByText('Next')
      await waitForText('Infrastructure provider credential')

      await waitForText(
        'Ensure these settings are correct. The saved cluster draft will be used to determine the available network resources. Therefore after you press Save you will not be able to change these cluster settings.'
      )

      // Let's save it
      const createNocks = [
        nockCreate(mockClusterProject, mockClusterProjectResponse),
        nockCreate(mockClusterDeploymentAI as IResource),
        nockCreate(mockManagedClusterAI),
        nockCreate(mockAgentClusterInstall as IResource),
        nockCreate(mockPullSecretAI),
        nockCreate(mockKlusterletAddonConfigAI),
      ]

      await clickByText('Save')

      // make sure creating
      await waitForNocks(createNocks)

      // next step (Hosts selection) is tested in the HostsForm.test

      // screen.debug(undefined, -1)
    },
    2 * 60 * 1000
  )
})
