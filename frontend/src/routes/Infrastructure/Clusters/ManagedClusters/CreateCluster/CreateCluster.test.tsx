/* Copyright Contributors to the Open Cluster Management project */

import { ClusterImageSetK8sResource } from '@openshift-assisted/ui-lib/cim'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  clusterCuratorsState,
  managedClusterInfosState,
  managedClusterSetsState,
  managedClustersState,
  namespacesState,
  secretsState,
  settingsState,
  subscriptionOperatorsState,
} from '../../../../../atoms'
import {
  nockCreate,
  nockIgnoreApiPaths,
  nockIgnoreOperatorCheck,
  nockIgnoreRBAC,
  nockList,
} from '../../../../../lib/nock-util'
import { defaultPlugin, PluginContext } from '../../../../../lib/PluginContext'
import {
  clickByPlaceholderText,
  clickByTestId,
  clickByText,
  pasteByTestId,
  typeByPlaceholderText,
  typeByTestId,
  typeByText,
  waitForNocks,
  waitForNotText,
  waitForText,
} from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import {
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  ClusterImageSet,
  ClusterImageSetApiVersion,
  ClusterImageSetKind,
  HostedCluster,
  IResource,
  MachinePool,
  MachinePoolApiVersion,
  MachinePoolKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterInfoApiVersion,
  ManagedClusterInfoKind,
  ManagedClusterKind,
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
  SubscriptionOperator,
  SubscriptionOperatorApiVersion,
  SubscriptionOperatorKind,
} from '../../../../../resources'
import { CLUSTER_INFRA_TYPE_PARAM } from '../ClusterInfrastructureType'
import { CreateClusterPage } from '../CreateClusterPage'
import {
  baseDomain,
  clusterImageSet,
  clusterName,
  mockAgentClusterInstall,
  mockClusterDeploymentAI,
  mockClusterImageSet,
} from './CreateCluster.sharedmocks'
import userEvent from '@testing-library/user-event'

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
    upgrade: {
      posthook: [
        {
          name: 'test-posthook-upgrade',
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
    upgrade: {
      posthook: [
        {
          name: 'test-posthook-upgrade',
          extra_vars: {},
        },
      ],
      towerAuthSecret: 'toweraccess-upgrade',
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

const mockProviderConnectionAnsibleCopiedUpgrade: ProviderConnection = {
  apiVersion: ProviderConnectionApiVersion,
  kind: ProviderConnectionKind,
  metadata: {
    name: 'toweraccess-upgrade',
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

/// Kubevirt

const kubeconfig = JSON.stringify({
  clusters: [
    {
      name: 'my-cluster',
      cluster: {
        server: 'https://my-cluster.example.com',
      },
    },
  ],
  contexts: [
    {
      name: 'my-context',
      context: {
        cluster: 'my-cluster',
        user: 'my-user',
      },
    },
  ],
  'current-context': 'my-context',
  users: [
    {
      name: 'my-user',
      user: {
        token: 'abc123',
      },
    },
  ],
})

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

const mockPullSecretKubevirt: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'pullsecret-cluster-test',
    namespace: 'clusters',
    labels: {
      'cluster.open-cluster-management.io/backup': 'cluster',
      'cluster.open-cluster-management.io/copiedFromNamespace': 'clusters',
      'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
    },
  },
  stringData: {
    '.dockerconfigjson': '{"pullSecret":"secret"}',
  },
  type: 'kubernetes.io/dockerconfigjson',
}

// Secret for 'sshkey-cluster-test'
const mockSSHKeySecret: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'sshkey-cluster-test',
    namespace: 'clusters',
    labels: {
      'cluster.open-cluster-management.io/backup': 'cluster',
      'cluster.open-cluster-management.io/copiedFromNamespace': 'clusters',
      'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
    },
  },
  stringData: {
    'id_rsa.pub': 'ssh-rsa AAAAB1 fake@email.com',
  },
}
const mockKubeConfigSecretKubevirt: Secret = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: 'infra-cluster-test',
    namespace: 'clusters',
    labels: {
      'cluster.open-cluster-management.io/backup': 'cluster',
      'cluster.open-cluster-management.io/copiedFromNamespace': 'clusters',
      'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
    },
  },
  stringData: {
    kubeconfig:
      '{"clusters":[{"name":"my-cluster","cluster":{"server":"https://my-cluster.example.com"}}],"contexts":[{"name":"my-context","context":{"cluster":"my-cluster","user":"my-user"}}],"current-context":"my-context","users":[{"name":"my-user","user":{"token":"abc123"}}]}\n',
  },
}

const mockNodePools = {
  apiVersion: 'hypershift.openshift.io/v1beta1',
  kind: 'NodePool',
  metadata: {
    name: 'nodepool',
    namespace: 'clusters',
  },
  spec: {
    arch: 'amd64',
    clusterName: 'test',
    replicas: 2,
    management: {
      autoRepair: false,
      upgradeType: 'Replace',
    },
    platform: {
      type: 'KubeVirt',
      kubevirt: {
        compute: {
          cores: 2,
          memory: '8Gi',
        },
        rootVolume: {
          type: 'Persistent',
          persistent: {
            size: '32Gi',
          },
        },
        defaultPodNetwork: true,
      },
    },
    release: {
      image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
    },
  },
}
const clusterImageSetKubervirt: ClusterImageSetK8sResource = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
  metadata: {
    name: 'ocp-release4.15.36',
  },
  spec: {
    releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
  },
}
const storageClass = {
  kind: 'StorageClass',
  apiVersion: 'storage.k8s.io/v1',
  metadata: {
    name: 'gp3-csi',
    annotations: {
      'storageclass.kubernetes.io/is-default-class': 'true',
    },
  },
  provisioner: 'ebs.csi.aws.com',
  parameters: {
    encrypted: 'true',
    type: 'gp3',
  },
  reclaimPolicy: 'Delete',
  allowVolumeExpansion: true,
  volumeBindingMode: 'WaitForFirstConsumer',
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
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
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
    await clickByPlaceholderText('Select an automation template')
    await clickByText(mockClusterCurators[0].metadata.name!)

    // check template summary
    await waitForText(`View ${mockClusterCurators[0].metadata.name!}`)
    await waitForText('Pre-install Ansible template')
    await waitForText(mockClusterCurators[0].spec!.install!.prehook![0].name!)
    await waitForText('Post-upgrade Ansible template')
    await waitForText(mockClusterCurators[0].spec!.upgrade!.posthook![0].name!)

    // clear template
    screen
      .getByRole('button', {
        name: /clear input value/i,
      })
      .click()
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
      nockCreate(mockProviderConnectionAnsibleCopiedUpgrade),
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
      <PluginContext.Provider value={{ ...defaultPlugin, isACMAvailable: false }}>
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
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
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

      await waitForText('OpenShift 4.8.15-x86_64') // single value of combobox
      await typeByTestId('additionalLabels', 'myLabelKey=myValue')
      await clickByTestId('form-input-pullSecret-field')

      await pasteByTestId('form-input-pullSecret-field', pullSecretAI)

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

// verifies adding storage class and volumesnapshotclass to the hosted cluster
describe('CreateCluster KubeVirt with RH OpenShift Virtualization credential that has external infrastructure', () => {
  const mockProject = {
    apiVersion: ProjectApiVersion,
    kind: 'ProjectRequest',
    metadata: {
      name: 'test',
    },
  }
  const mockProjectResponse = {
    apiVersion: ProjectApiVersion,
    kind: 'Project',
    metadata: {
      name: 'test',
    },
  }
  // ProjectRequest and Project types
  const mockClusterProjectKubevirt: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'clusters' },
  }

  const mockClusterProjectKubevirtResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
      name: 'clusters',
    },
  }

  // ManagedClusterKubevirt
  const mockKlusterletAddonConfigKubevirt = {
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
    },
  }

  // HostedCluster
  const mockHostedClusterKubervirt: HostedCluster = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'HostedCluster',
    metadata: {
      name: 'test',
      namespace: 'clusters',
    },
    spec: {
      etcd: {
        managed: {
          storage: {
            persistentVolume: {
              size: '8Gi',
            },
            type: 'PersistentVolume',
          },
        },
        managementType: 'Managed',
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
      pullSecret: {
        name: 'pullsecret-cluster-test',
      },
      sshKey: {
        name: 'sshkey-cluster-test',
      },
      networking: {
        clusterNetwork: [
          {
            cidr: '10.132.0.0/14',
          },
        ],
        serviceNetwork: [
          {
            cidr: '172.31.0.0/16',
          },
        ],
        networkType: 'OVNKubernetes',
      },
      controllerAvailabilityPolicy: 'HighlyAvailable',
      infrastructureAvailabilityPolicy: 'HighlyAvailable',
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          baseDomainPassthrough: true,
          storageDriver: {
            manual: {
              storageClassMapping: [
                {
                  infraStorageClassName: 'storage-class1',
                  guestStorageClassName: 'guest-storage1',
                  group: 'group1',
                },
              ],
              volumeSnapshotClassMapping: [
                {
                  infraVolumeSnapshotClassName: 'snapshot-class1',
                  guestVolumeSnapshotClassName: 'guest-snap1',
                  group: 'group1',
                },
              ],
            },
          },
          credentials: {
            infraKubeConfigSecret: {
              name: 'infra-cluster-test',
              key: 'kubeconfig',
            },
            infraNamespace: 'kubevirt-namespace',
          },
        },
      },
      infraID: 'test',
      services: [
        {
          service: 'OAuthServer',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'OIDC',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Konnectivity',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Ignition',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
      ],
    },
  }

  const managedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
      annotations: {
        'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
        'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
        'open-cluster-management/created-via': 'hypershift',
      },
      labels: {
        cloud: 'BareMetal',
        vendor: 'OpenShift',
        name: 'test',
      },
      name: 'test',
    },
    spec: {
      hubAcceptsClient: true,
    },
  }
  const mockKubevirtSecret = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    type: 'Opaque',
    metadata: {
      name: 'kubevirt-with-ei',
      namespace: 'clusters',
      labels: {
        'cluster.open-cluster-management.io/type': 'kubevirt',
        'cluster.open-cluster-management.io/credentials': '',
      },
    },
    stringData: {
      pullSecret: '{"pullSecret":"secret"}\n',
      'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
      kubeconfig: kubeconfig,
      externalInfraNamespace: 'kubevirt-namespace',
    },
  }

  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(namespacesState, [
            {
              apiVersion: NamespaceApiVersion,
              kind: NamespaceKind,
              metadata: { name: 'clusters' },
            },
          ])
          snapshot.set(managedClustersState, [])
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(managedClusterInfosState, [
            {
              apiVersion: ManagedClusterInfoApiVersion,
              kind: ManagedClusterInfoKind,
              metadata: { name: 'local-cluster', namespace: 'local-cluster' },
              status: {
                consoleURL: 'https://testCluster.com',
                conditions: [
                  {
                    type: 'ManagedClusterConditionAvailable',
                    reason: 'ManagedClusterConditionAvailable',
                    status: 'True',
                  },
                  { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
                  { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
                ],
                version: '1.17',
                distributionInfo: {
                  type: 'ocp',
                  ocp: {
                    version: '1.2.3',
                    availableUpdates: [],
                    desiredVersion: '1.2.3',
                    upgradeFailed: false,
                  },
                },
              },
            },
          ])
          snapshot.set(secretsState, [mockKubevirtSecret as Secret])
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?${CLUSTER_INFRA_TYPE_PARAM}=kubevirt`]}>
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })

  test('KubeVirt cluster creation with a kubervirt credential that has external infrastructure', async () => {
    window.scrollBy = () => {}
    const initialNocks = [
      nockList(clusterImageSetKubervirt as IResource, [clusterImageSetKubervirt] as IResource[]),
      nockList(storageClass as IResource, [storageClass] as IResource[]),
    ]
    render(<Component />)

    await new Promise((resolve) => setTimeout(resolve, 500))

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)

    await waitForText('Cluster details', true)
    await waitForText('Node pools')
    await waitForText('Review and create')

    // step 1 -- cluster details
    await typeByTestId('clusterName', clusterName)
    await clickByPlaceholderText('Select or enter a release image')
    await clickByText('OpenShift 4.15.36')

    const inputElement = screen.getByTestId('emanspace')
    expect(inputElement).toHaveValue('clusters')

    // step 2 -- node pools
    await clickByText('Next')
    const nodePoolNameInput = screen.getByTestId('nodePoolName')
    fireEvent.change(nodePoolNameInput, { target: { value: 'nodepool' } })

    // Review and Save step
    await clickByText('Next')

    // verify initial state - only prompts visible
    expect(screen.getByText('Add storage class mapping')).toBeInTheDocument()
    expect(screen.getByText('Add volume snapshot class mapping')).toBeInTheDocument()

    // verify no mapping fields visible initially
    expect(screen.queryByTestId('infraStorageClassName')).not.toBeInTheDocument()
    expect(screen.queryByTestId('infraVolumeSnapshotClassName')).not.toBeInTheDocument()

    // add storage mapping
    await clickByText('Add storage class mapping')
    await typeByTestId('infraStorageClassName', 'storage-class1')
    await typeByTestId('guestStorageClassName', 'guest-storage1')
    await typeByTestId('storageClassGroup', 'group1')

    // add volume snapshot mapping
    await clickByText('Add volume snapshot class mapping')
    await typeByTestId('infraVolumeSnapshotClassName', 'snapshot-class1')
    await typeByTestId('guestVolumeSnapshotClassName', 'guest-snap1')
    await typeByTestId('volumeSnapshotGroup', 'group1')

    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      nockCreate(mockProject, mockProjectResponse),
      nockCreate(mockClusterProjectKubevirt, mockClusterProjectKubevirtResponse),
      nockCreate(mockNodePools),
      nockCreate(managedCluster),
      nockCreate(mockHostedClusterKubervirt),
      nockCreate(mockKlusterletAddonConfigKubevirt),
      nockCreate(mockKubeConfigSecretKubevirt),
      nockCreate(mockPullSecretKubevirt),
      nockCreate(mockSSHKeySecret),
    ]
    // click create button
    await clickByText('Create')

    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })
})

// test verifies addition of 2 additional networks to a node pool and the expected behavior of the default pod netwoek checkbox
// verifies adding storage class and volumesnapshotclass to the hosted cluster
describe('CreateCluster KubeVirt with RH OpenShift Virtualization credential that has external infrastructure', () => {
  const mockProject = {
    apiVersion: ProjectApiVersion,
    kind: 'ProjectRequest',
    metadata: {
      name: 'test',
    },
  }
  const mockProjectResponse = {
    apiVersion: ProjectApiVersion,
    kind: 'Project',
    metadata: {
      name: 'test',
    },
  }

  // ProjectRequest and Project types
  const mockClusterProjectKubevirt: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'new-hns' },
  }

  const mockClusterProjectKubevirtResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
      name: 'new-hns',
    },
  }

  // ManagedClusterKubevirt
  const mockKlusterletAddonConfigKubevirt = {
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
    },
  }

  const managedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
      annotations: {
        'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
        'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
        'open-cluster-management/created-via': 'hypershift',
      },
      labels: {
        cloud: 'BareMetal',
        vendor: 'OpenShift',
        name: 'test',
      },
      name: 'test',
    },
    spec: {
      hubAcceptsClient: true,
    },
  }
  const mockKubevirtSecret = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    type: 'Opaque',
    metadata: {
      name: 'kubevirt-with-ei',
      namespace: 'clusters',
      labels: {
        'cluster.open-cluster-management.io/type': 'kubevirt',
        'cluster.open-cluster-management.io/credentials': '',
      },
    },
    stringData: {
      pullSecret: '{"pullSecret":"secret"}\n',
      'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
      kubeconfig: kubeconfig,
      externalInfraNamespace: 'kubevirt-namespace',
    },
  }

  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(namespacesState, [
            {
              apiVersion: NamespaceApiVersion,
              kind: NamespaceKind,
              metadata: { name: 'clusters' },
            },
          ])
          snapshot.set(managedClustersState, [])
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(managedClusterInfosState, [
            {
              apiVersion: ManagedClusterInfoApiVersion,
              kind: ManagedClusterInfoKind,
              metadata: { name: 'local-cluster', namespace: 'local-cluster' },
              status: {
                consoleURL: 'https://testCluster.com',
                conditions: [
                  {
                    type: 'ManagedClusterConditionAvailable',
                    reason: 'ManagedClusterConditionAvailable',
                    status: 'True',
                  },
                  { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
                  { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
                ],
                version: '1.17',
                distributionInfo: {
                  type: 'ocp',
                  ocp: {
                    version: '1.2.3',
                    availableUpdates: [],
                    desiredVersion: '1.2.3',
                    upgradeFailed: false,
                  },
                },
              },
            },
          ])
          snapshot.set(secretsState, [mockKubevirtSecret as Secret])
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?${CLUSTER_INFRA_TYPE_PARAM}=kubevirt`]}>
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })

  test('KubeVirt cluster creation with a kubervirt credential that has external infrastructure', async () => {
    const mockPullSecretKubevirt1: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'pullsecret-cluster-test',
        namespace: 'new-hns',
        labels: {
          'cluster.open-cluster-management.io/backup': 'cluster',
          'cluster.open-cluster-management.io/copiedFromNamespace': 'clusters',
          'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
        },
      },
      stringData: {
        '.dockerconfigjson': '{"pullSecret":"secret"}',
      },
      type: 'kubernetes.io/dockerconfigjson',
    }

    // Secret for 'sshkey-cluster-test'
    const mockSSHKeySecret2: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'sshkey-cluster-test',
        namespace: 'new-hns',
        labels: {
          'cluster.open-cluster-management.io/backup': 'cluster',
          'cluster.open-cluster-management.io/copiedFromNamespace': 'clusters',
          'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
        },
      },
      stringData: {
        'id_rsa.pub': 'ssh-rsa AAAAB1 fake@email.com',
      },
    }
    const mockKubeConfigSecretKubevirt3: Secret = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: 'infra-cluster-test',
        namespace: 'new-hns',
        labels: {
          'cluster.open-cluster-management.io/backup': 'cluster',
          'cluster.open-cluster-management.io/copiedFromNamespace': 'clusters',
          'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
        },
      },
      stringData: {
        kubeconfig:
          '{"clusters":[{"name":"my-cluster","cluster":{"server":"https://my-cluster.example.com"}}],"contexts":[{"name":"my-context","context":{"cluster":"my-cluster","user":"my-user"}}],"current-context":"my-context","users":[{"name":"my-user","user":{"token":"abc123"}}]}\n',
      },
    }

    // HostedCluster
    const mockHostedClusterKubervirt4: HostedCluster = {
      apiVersion: 'hypershift.openshift.io/v1beta1',
      kind: 'HostedCluster',
      metadata: {
        name: 'test',
        namespace: 'new-hns',
      },
      spec: {
        etcd: {
          managed: {
            storage: {
              persistentVolume: {
                size: '8Gi',
              },
              type: 'PersistentVolume',
            },
          },
          managementType: 'Managed',
        },
        release: {
          image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
        },
        pullSecret: {
          name: 'pullsecret-cluster-test',
        },
        sshKey: {
          name: 'sshkey-cluster-test',
        },
        networking: {
          clusterNetwork: [
            {
              cidr: '10.132.0.0/14',
            },
          ],
          serviceNetwork: [
            {
              cidr: '172.31.0.0/16',
            },
          ],
          networkType: 'OVNKubernetes',
        },
        controllerAvailabilityPolicy: 'SingleReplica',
        infrastructureAvailabilityPolicy: 'SingleReplica',
        platform: {
          type: 'KubeVirt',
          kubevirt: {
            baseDomainPassthrough: true,
            credentials: {
              infraKubeConfigSecret: {
                name: 'infra-cluster-test',
                key: 'kubeconfig',
              },
              infraNamespace: 'kubevirt-namespace',
            },
            storageDriver: {
              manual: {
                storageClassMapping: [
                  {
                    infraStorageClassName: 'storage-class1',
                    guestStorageClassName: 'guest-storage1',
                    group: 'group1',
                  },
                ],
                volumeSnapshotClassMapping: [
                  {
                    infraVolumeSnapshotClassName: 'snapshot-class1',
                    guestVolumeSnapshotClassName: 'guest-snap1',
                    group: 'group1',
                  },
                ],
              },
            },
          },
        },
        infraID: 'test',
        services: [
          {
            service: 'OAuthServer',
            servicePublishingStrategy: {
              type: 'Route',
            },
          },
          {
            service: 'OIDC',
            servicePublishingStrategy: {
              type: 'Route',
            },
          },
          {
            service: 'Konnectivity',
            servicePublishingStrategy: {
              type: 'Route',
            },
          },
          {
            service: 'Ignition',
            servicePublishingStrategy: {
              type: 'Route',
            },
          },
        ],
      },
    }

    const mockNodePools5 = {
      apiVersion: 'hypershift.openshift.io/v1beta1',
      kind: 'NodePool',
      metadata: {
        name: 'nodepool',
        namespace: 'new-hns',
      },
      spec: {
        arch: 'amd64',
        clusterName: 'test',
        replicas: 2,
        management: {
          autoRepair: false,
          upgradeType: 'Replace',
        },
        platform: {
          type: 'KubeVirt',
          kubevirt: {
            compute: {
              cores: 2,
              memory: '8Gi',
            },
            rootVolume: {
              type: 'Persistent',
              persistent: {
                size: '32Gi',
              },
            },
            additionalNetworks: [{ name: 'ns1/name1' }, { name: 'ns2/name2' }],
            defaultPodNetwork: false,
          },
        },
        release: {
          image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
        },
      },
    }

    window.scrollBy = () => {}
    const initialNocks = [
      nockList(clusterImageSetKubervirt as IResource, [clusterImageSetKubervirt] as IResource[]),
      nockList(storageClass as IResource, [storageClass] as IResource[]),
    ]
    render(<Component />)

    await new Promise((resolve) => setTimeout(resolve, 500))

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)

    await waitForText('Cluster details', true)
    await waitForText('Node pools')
    await waitForText('Review and create')

    // step 1 -- cluster details
    await typeByTestId('clusterName', clusterName)
    await clickByPlaceholderText('Select or enter a release image')
    await clickByText('OpenShift 4.15.36')

    const inputField = await waitFor(() => screen.getByTestId('emanspace'))
    expect(inputField).toHaveValue('clusters')

    await clickByTestId('emanspace')
    await typeByTestId('emanspace', 'new-hns')
    fireEvent.keyDown(screen.getByTestId('emanspace'), { key: 'Enter', code: 'Enter' })

    // Check default radio button selections for availability policies to be 'HighlyAvailable'
    const controllerHighlyAvailable = screen.getByTestId('controller-ha')
    const infraHighlyAvailable = screen.getByTestId('infra-ha')

    expect(controllerHighlyAvailable).toBeChecked()
    expect(infraHighlyAvailable).toBeChecked()

    // Change both policies to SingleReplica
    const controllerSingleReplica = screen.getByTestId('controller-single')
    const infraSingleReplica = screen.getByTestId('infra-single')

    fireEvent.click(controllerSingleReplica)
    fireEvent.click(infraSingleReplica)

    expect(controllerSingleReplica).toBeChecked()
    expect(infraSingleReplica).toBeChecked()
    expect(controllerHighlyAvailable).not.toBeChecked()
    expect(infraHighlyAvailable).not.toBeChecked()

    // step 2 -- node pools
    await clickByText('Next')
    const nodePoolNameInput = screen.getByTestId('nodePoolName')
    fireEvent.change(nodePoolNameInput, { target: { value: 'nodepool' } })

    // Assert that the checkbox is disabled and checked
    const defaultPodNetworkCheckbox = screen.getByRole('checkbox', { name: /default pod network/i })

    expect(defaultPodNetworkCheckbox).toBeDisabled()

    expect(defaultPodNetworkCheckbox).toBeChecked()

    // Enter network details
    const additionalNetworksInput = screen.getByPlaceholderText(
      'Enter the additional network in the format <namespace>/<name>'
    )
    fireEvent.change(additionalNetworksInput, { target: { value: 'ns1/name1' } })
    // Assert that the checkbox is enabled and checked
    expect(defaultPodNetworkCheckbox).toBeEnabled()
    expect(defaultPodNetworkCheckbox).toBeChecked()

    await clickByText('Add additional network')
    const additionalNetworksInput2 = screen.getByTestId('text-additionalNetworks-1')
    fireEvent.change(additionalNetworksInput2, { target: { value: 'ns2/name2' } })
    // uncheck the default pod network checkbox
    fireEvent.click(defaultPodNetworkCheckbox)

    // Review and Save step
    await clickByText('Next')

    // verify initial state - only prompts visible
    expect(screen.getByText('Add storage class mapping')).toBeInTheDocument()
    expect(screen.getByText('Add volume snapshot class mapping')).toBeInTheDocument()

    // verify no mapping fields visible initially
    expect(screen.queryByTestId('infraStorageClassName')).not.toBeInTheDocument()
    expect(screen.queryByTestId('infraVolumeSnapshotClassName')).not.toBeInTheDocument()

    // add storage mapping
    await clickByText('Add storage class mapping')
    await typeByTestId('infraStorageClassName', 'storage-class1')
    await typeByTestId('guestStorageClassName', 'guest-storage1')
    await typeByTestId('storageClassGroup', 'group1')

    // add volume snapshot mapping
    await clickByText('Add volume snapshot class mapping')
    await typeByTestId('infraVolumeSnapshotClassName', 'snapshot-class1')
    await typeByTestId('guestVolumeSnapshotClassName', 'guest-snap1')
    await typeByTestId('volumeSnapshotGroup', 'group1')

    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      nockCreate(mockProject, mockProjectResponse),
      nockCreate(mockClusterProjectKubevirt, mockClusterProjectKubevirtResponse),
      nockCreate(mockNodePools5),
      nockCreate(managedCluster),
      nockCreate(mockHostedClusterKubervirt4),
      nockCreate(mockKlusterletAddonConfigKubevirt),
      nockCreate(mockKubeConfigSecretKubevirt3),
      nockCreate(mockPullSecretKubevirt1),
      nockCreate(mockSSHKeySecret2),
    ]
    // click create button
    await clickByText('Create')

    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })
})

// verifies adding storage class and volumesnapshotclass to the hosted cluster
describe('CreateCluster KubeVirt with RH OpenShift Virtualization credential that has external infrastructure - Wizard Credential creation', () => {
  const mockProject = {
    apiVersion: ProjectApiVersion,
    kind: 'ProjectRequest',
    metadata: {
      name: 'test',
    },
  }
  const mockProjectResponse = {
    apiVersion: ProjectApiVersion,
    kind: 'Project',
    metadata: {
      name: 'test',
    },
  }

  const mockClusterProjectKubevirt: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'new-ns' },
  }

  const mockClusterProjectKubevirtResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
      name: 'new-ns',
    },
  }
  const pullSecret = '{"pullSecret":"secret"}\n'
  const expectedKubevirtCredential = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    type: 'Opaque',
    metadata: {
      name: 'kubevirt-with-ei',
      namespace: 'new-ns',
      labels: {
        'cluster.open-cluster-management.io/type': 'kubevirt',
        'cluster.open-cluster-management.io/credentials': '',
      },
    },
    stringData: {
      pullSecret: '{"pullSecret":"secret"}\n',
      'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
      kubeconfig: kubeconfig,
      externalInfraNamespace: 'kubevirt-namespace',
    },
  }
  // ManagedClusterKubevirt
  const mockKlusterletAddonConfigKubevirt = {
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
    },
  }

  const managedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
      annotations: {
        'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
        'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
        'open-cluster-management/created-via': 'hypershift',
      },
      labels: {
        cloud: 'BareMetal',
        vendor: 'OpenShift',
        name: 'test',
        myLabelKey: 'myValue',
      },
      name: 'test',
    },
    spec: {
      hubAcceptsClient: true,
    },
  }

  const mockPullSecretKubevirt1: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'pullsecret-cluster-test',
      namespace: 'new-ns',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'new-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
      },
    },
    stringData: {
      '.dockerconfigjson': '{"pullSecret":"secret"}',
    },
    type: 'kubernetes.io/dockerconfigjson',
  }

  // Secret for 'sshkey-cluster-test'
  const mockSSHKeySecret2: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'sshkey-cluster-test',
      namespace: 'new-ns',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'new-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
      },
    },
    stringData: {
      'id_rsa.pub': 'ssh-rsa AAAAB1 fake@email.com',
    },
  }
  const mockKubeConfigSecretKubevirt3: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'infra-cluster-test',
      namespace: 'new-ns',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'new-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-with-ei',
      },
    },
    stringData: {
      kubeconfig:
        '{"clusters":[{"name":"my-cluster","cluster":{"server":"https://my-cluster.example.com"}}],"contexts":[{"name":"my-context","context":{"cluster":"my-cluster","user":"my-user"}}],"current-context":"my-context","users":[{"name":"my-user","user":{"token":"abc123"}}]}\n',
    },
  }

  // HostedCluster
  const mockHostedClusterKubervirt4: HostedCluster = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'HostedCluster',
    metadata: {
      name: 'test',
      namespace: 'new-ns',
    },
    spec: {
      etcd: {
        managed: {
          storage: {
            persistentVolume: {
              size: '8Gi',
            },
            type: 'PersistentVolume',
          },
        },
        managementType: 'Managed',
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
      pullSecret: {
        name: 'pullsecret-cluster-test',
      },
      sshKey: {
        name: 'sshkey-cluster-test',
      },
      networking: {
        clusterNetwork: [
          {
            cidr: '10.132.0.0/14',
          },
        ],
        serviceNetwork: [
          {
            cidr: '172.31.0.0/16',
          },
        ],
        networkType: 'OVNKubernetes',
      },
      controllerAvailabilityPolicy: 'HighlyAvailable',
      infrastructureAvailabilityPolicy: 'HighlyAvailable',
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          baseDomainPassthrough: true,
          storageDriver: {
            manual: {
              storageClassMapping: [
                {
                  infraStorageClassName: 'storage-class1',
                  guestStorageClassName: 'guest-storage1',
                  group: 'group1',
                },
              ],
              volumeSnapshotClassMapping: [
                {
                  infraVolumeSnapshotClassName: 'snapshot-class1',
                  guestVolumeSnapshotClassName: 'guest-snap1',
                  group: 'group1',
                },
              ],
            },
          },
          credentials: {
            infraKubeConfigSecret: {
              name: 'infra-cluster-test',
              key: 'kubeconfig',
            },
            infraNamespace: 'kubevirt-namespace',
          },
        },
      },
      infraID: 'test',
      services: [
        {
          service: 'OAuthServer',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'OIDC',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Konnectivity',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Ignition',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
      ],
    },
  }

  const mockNodePools5 = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'NodePool',
    metadata: {
      name: 'nodepool',
      namespace: 'new-ns',
    },
    spec: {
      arch: 'amd64',
      clusterName: 'test',
      replicas: 2,
      management: {
        autoRepair: false,
        upgradeType: 'Replace',
      },
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          compute: {
            cores: 2,
            memory: '8Gi',
          },
          rootVolume: {
            type: 'Persistent',
            persistent: {
              size: '32Gi',
            },
          },
          defaultPodNetwork: true,
        },
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    },
  }
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(namespacesState, [
            {
              apiVersion: NamespaceApiVersion,
              kind: NamespaceKind,
              metadata: { name: 'new-ns' },
            },
          ])
          snapshot.set(managedClustersState, [])
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(managedClusterInfosState, [
            {
              apiVersion: ManagedClusterInfoApiVersion,
              kind: ManagedClusterInfoKind,
              metadata: { name: 'local-cluster', namespace: 'local-cluster' },
              status: {
                consoleURL: 'https://testCluster.com',
                conditions: [
                  {
                    type: 'ManagedClusterConditionAvailable',
                    reason: 'ManagedClusterConditionAvailable',
                    status: 'True',
                  },
                  { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
                  { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
                ],
                version: '1.17',
                distributionInfo: {
                  type: 'ocp',
                  ocp: {
                    version: '1.2.3',
                    availableUpdates: [],
                    desiredVersion: '1.2.3',
                    upgradeFailed: false,
                  },
                },
              },
            },
          ])
          snapshot.set(secretsState, [
            {
              apiVersion: ProviderConnectionApiVersion,
              kind: ProviderConnectionKind,
              metadata: {
                name: 'kubevirt-with-ei',
                namespace: 'new-ns',
                labels: {
                  'cluster.open-cluster-management.io/type': 'kubevirt',
                  'cluster.open-cluster-management.io/credentials': '',
                },
              },
              stringData: {
                pullSecret: pullSecret,
                'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
                kubeconfig: kubeconfig,
                externalInfraNamespace: 'kubevirt-namespace',
              },
              type: 'kubernetes.io/dockerconfigjson',
            } as Secret,
          ])
          snapshot.set(clusterCuratorsState, mockClusterCurators)
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?${CLUSTER_INFRA_TYPE_PARAM}=kubevirt`]}>
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })

  test('KubeVirt cluster creation with a kubervirt credential that has external infrastructure', async () => {
    const clusterImageSetKubervirt: ClusterImageSetK8sResource = {
      apiVersion: ClusterImageSetApiVersion,
      kind: ClusterImageSetKind,
      metadata: {
        name: 'ocp-release4.15.36',
      },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    }
    const storageClass = {
      kind: 'StorageClass',
      apiVersion: 'storage.k8s.io/v1',
      metadata: {
        name: 'gp3-csi',
        annotations: {
          'storageclass.kubernetes.io/is-default-class': 'true',
        },
      },
      provisioner: 'ebs.csi.aws.com',
      parameters: {
        encrypted: 'true',
        type: 'gp3',
      },
      reclaimPolicy: 'Delete',
      allowVolumeExpansion: true,
      volumeBindingMode: 'WaitForFirstConsumer',
    }

    const initialNocks: Scope[] = [
      nockList(clusterImageSetKubervirt as IResource, [clusterImageSetKubervirt] as IResource[]),
      nockList(storageClass as IResource, [storageClass] as IResource[]),
    ]
    render(<Component />)

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)
    await waitForText('Cluster details', true)
    await waitForText('Node pools')
    await waitForText('Review and create')

    // fill-in Cluster details
    await typeByTestId('clusterName', clusterName)

    await clickByPlaceholderText('Select or enter a release image')
    await clickByText('OpenShift 4.15.36')

    const inputField = await waitFor(() => screen.getByTestId('emanspace'))
    expect(inputField).toHaveValue('clusters')

    await clickByTestId('emanspace')
    await typeByTestId('emanspace', 'new-ns')
    fireEvent.keyDown(screen.getByTestId('emanspace'), { key: 'Enter', code: 'Enter' })

    await typeByTestId('additionalLabels', 'myLabelKey=myValue')
    await clickByPlaceholderText('kubevirt-with-ei')
    screen
      .getByRole('combobox', {
        name: 'Infrastructure provider credential',
      })
      .click()
    await clickByText('Add credential')
    await typeByTestId('credentialsName', 'kubevirt-with-ei')
    screen
      .getByRole('combobox', {
        name: /namespace/i,
      })
      .click()
    await clickByText('new-ns')
    await clickByText('Next', 1)
    await clickByTestId('isExternalInfra')
    await typeByTestId('kubeconfig', kubeconfig)
    await typeByTestId('externalInfraNamespace', 'kubevirt-namespace')
    await clickByText('Next', 1)
    await pasteByTestId('pullSecret', pullSecret)
    await pasteByTestId('ssh-publickey', 'ssh-rsa AAAAB1 fake@email.com')
    await clickByText('Next', 1)
    await clickByText('Add')

    // wait for kubevirt credential creation
    await waitForNocks([nockCreate(expectedKubevirtCredential)])

    // transition to NodePools
    await clickByText('Next')

    const nodePoolNameInput = screen.getByTestId('nodePoolName')
    fireEvent.change(nodePoolNameInput, { target: { value: 'nodepool' } })

    // Review and Save step
    await clickByText('Next')

    // verify initial state - only prompts visible
    expect(screen.getByText('Add storage class mapping')).toBeInTheDocument()
    expect(screen.getByText('Add volume snapshot class mapping')).toBeInTheDocument()

    // verify no mapping fields visible initially
    expect(screen.queryByTestId('infraStorageClassName')).not.toBeInTheDocument()
    expect(screen.queryByTestId('infraVolumeSnapshotClassName')).not.toBeInTheDocument()

    // add storage mapping
    await clickByText('Add storage class mapping')
    await typeByTestId('infraStorageClassName', 'storage-class1')
    await typeByTestId('guestStorageClassName', 'guest-storage1')
    await typeByTestId('storageClassGroup', 'group1')

    // add volume snapshot mapping
    await clickByText('Add volume snapshot class mapping')
    await typeByTestId('infraVolumeSnapshotClassName', 'snapshot-class1')
    await typeByTestId('guestVolumeSnapshotClassName', 'guest-snap1')
    await typeByTestId('volumeSnapshotGroup', 'group1')

    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      nockCreate(mockProject, mockProjectResponse),
      nockCreate(mockClusterProjectKubevirt, mockClusterProjectKubevirtResponse),
      nockCreate(mockNodePools5),
      nockCreate(managedCluster),
      nockCreate(mockHostedClusterKubervirt4),
      nockCreate(mockKlusterletAddonConfigKubevirt),
      nockCreate(mockKubeConfigSecretKubevirt3),
      nockCreate(mockPullSecretKubevirt1),
      nockCreate(mockSSHKeySecret2),
    ]

    await clickByText('Create')
    await waitForText('Creating cluster ...')
    // make sure creating
    await waitForNocks(createNocks)
  })
})

// verifies adding storage class and volumesnapshotclass to the hosted cluster
describe('CreateCluster KubeVirt with RH OpenShift Virtualization credential that has no external infrastructure - Wizard Credential creation', () => {
  const mockProject = {
    apiVersion: ProjectApiVersion,
    kind: 'ProjectRequest',
    metadata: {
      name: 'test',
    },
  }
  const mockProjectResponse = {
    apiVersion: ProjectApiVersion,
    kind: 'Project',
    metadata: {
      name: 'test',
    },
  }

  const mockClusterProjectKubevirt: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'clusters' },
  }

  const mockClusterProjectKubevirtResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
      name: 'clusters',
    },
  }
  const pullSecret = '{"pullSecret":"secret"}\n'

  // ManagedClusterKubevirt
  const mockKlusterletAddonConfigKubevirt = {
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
    },
  }

  const managedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
      annotations: {
        'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
        'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
        'open-cluster-management/created-via': 'hypershift',
      },
      labels: {
        cloud: 'BareMetal',
        vendor: 'OpenShift',
        name: 'test',
        myLabelKey: 'myValue',
      },
      name: 'test',
    },
    spec: {
      hubAcceptsClient: true,
    },
  }

  const mockPullSecretKubevirt1: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'pullsecret-cluster-test',
      namespace: 'clusters',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-no-ei',
      },
    },
    stringData: {
      '.dockerconfigjson': '{"pullSecret":"secret"}',
    },
    type: 'kubernetes.io/dockerconfigjson',
  }

  // Secret for 'sshkey-cluster-test'
  const mockSSHKeySecret2: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'sshkey-cluster-test',
      namespace: 'clusters',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-no-ei',
      },
    },
    stringData: {
      'id_rsa.pub': 'ssh-rsa AAAAB1 fake@email.com',
    },
  }

  // HostedCluster
  const mockHostedClusterKubervirt4: HostedCluster = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'HostedCluster',
    metadata: {
      name: 'test',
      namespace: 'clusters',
    },
    spec: {
      etcd: {
        managed: {
          storage: {
            persistentVolume: {
              size: '8Gi',
            },
            type: 'PersistentVolume',
          },
        },
        managementType: 'Managed',
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
      pullSecret: {
        name: 'pullsecret-cluster-test',
      },
      sshKey: {
        name: 'sshkey-cluster-test',
      },
      networking: {
        clusterNetwork: [
          {
            cidr: '10.132.0.0/14',
          },
        ],
        serviceNetwork: [
          {
            cidr: '172.31.0.0/16',
          },
        ],
        networkType: 'OVNKubernetes',
      },
      controllerAvailabilityPolicy: 'HighlyAvailable',
      infrastructureAvailabilityPolicy: 'HighlyAvailable',
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          baseDomainPassthrough: true,
          storageDriver: {
            manual: {
              storageClassMapping: [
                {
                  infraStorageClassName: 'storage-class1',
                  guestStorageClassName: 'guest-storage1',
                  group: 'group1',
                },
              ],
              volumeSnapshotClassMapping: [
                {
                  infraVolumeSnapshotClassName: 'snapshot-class1',
                  guestVolumeSnapshotClassName: 'guest-snap1',
                  group: 'group1',
                },
              ],
            },
          },
        },
      },
      infraID: 'test',
      services: [
        {
          service: 'OAuthServer',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'OIDC',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Konnectivity',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Ignition',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
      ],
    },
  }

  const mockNodePools5 = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'NodePool',
    metadata: {
      name: 'nodepool',
      namespace: 'clusters',
    },
    spec: {
      arch: 'amd64',
      clusterName: 'test',
      replicas: 2,
      management: {
        autoRepair: false,
        upgradeType: 'Replace',
      },
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          compute: {
            cores: 2,
            memory: '8Gi',
          },
          rootVolume: {
            type: 'Persistent',
            persistent: {
              size: '32Gi',
            },
          },
          defaultPodNetwork: true,
        },
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    },
  }

  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(namespacesState, [
            {
              apiVersion: NamespaceApiVersion,
              kind: NamespaceKind,
              metadata: { name: 'test-ns' },
            },
          ])
          snapshot.set(managedClustersState, [])
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(managedClusterInfosState, [
            {
              apiVersion: ManagedClusterInfoApiVersion,
              kind: ManagedClusterInfoKind,
              metadata: { name: 'local-cluster', namespace: 'local-cluster' },
              status: {
                consoleURL: 'https://testCluster.com',
                conditions: [
                  {
                    type: 'ManagedClusterConditionAvailable',
                    reason: 'ManagedClusterConditionAvailable',
                    status: 'True',
                  },
                  { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
                  { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
                ],
                version: '1.17',
                distributionInfo: {
                  type: 'ocp',
                  ocp: {
                    version: '1.2.3',
                    availableUpdates: [],
                    desiredVersion: '1.2.3',
                    upgradeFailed: false,
                  },
                },
              },
            },
          ])
          snapshot.set(secretsState, [
            {
              apiVersion: ProviderConnectionApiVersion,
              kind: ProviderConnectionKind,
              metadata: {
                name: 'kubevirt-no-ei',
                namespace: 'test-ns',
                labels: {
                  'cluster.open-cluster-management.io/type': 'kubevirt',
                },
              },
              stringData: {
                pullSecret: pullSecret,
                'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
              },
              type: 'kubernetes.io/dockerconfigjson',
            } as Secret,
          ])
          snapshot.set(clusterCuratorsState, mockClusterCurators)
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?${CLUSTER_INFRA_TYPE_PARAM}=kubevirt`]}>
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })

  test('KubeVirt cluster creation with a kubervirt credential that has no external infrastructure', async () => {
    const clusterImageSetKubervirt: ClusterImageSetK8sResource = {
      apiVersion: ClusterImageSetApiVersion,
      kind: ClusterImageSetKind,
      metadata: {
        name: 'ocp-release4.15.36',
      },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    } as ClusterImageSetK8sResource

    const storageClass = {
      kind: 'StorageClass',
      apiVersion: 'storage.k8s.io/v1',
      metadata: {
        name: 'gp3-csi',
        annotations: {
          'storageclass.kubernetes.io/is-default-class': 'true',
        },
      },
      provisioner: 'ebs.csi.aws.com',
      parameters: {
        encrypted: 'true',
        type: 'gp3',
      },
      reclaimPolicy: 'Delete',
      allowVolumeExpansion: true,
      volumeBindingMode: 'WaitForFirstConsumer',
    }

    const expectedKubevirtCredentialWithNoEI = {
      apiVersion: 'v1',
      kind: 'Secret',
      type: 'Opaque',
      metadata: {
        name: 'kubevirt-noei',
        namespace: 'test-ns',
        labels: {
          'cluster.open-cluster-management.io/type': 'kubevirt',
          'cluster.open-cluster-management.io/credentials': '',
        },
      },
      stringData: {
        pullSecret: '{"pullSecret":"secret"}\n',
        'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
      },
    }
    const initialNocks: Scope[] = [
      nockList(clusterImageSetKubervirt as IResource, [clusterImageSetKubervirt] as IResource[]),
      nockList(storageClass as IResource, [storageClass] as IResource[]),
    ]
    render(<Component />)

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)
    await waitForText('Cluster details', true)
    await waitForText('Node pools')
    await waitForText('Review and create')

    // fill-in Cluster details
    await typeByTestId('clusterName', clusterName)

    await clickByPlaceholderText('Select or enter a release image')
    await clickByText('OpenShift 4.15.36')
    const inputElement = screen.getByTestId('emanspace')
    expect(inputElement).toHaveValue('clusters')
    await typeByTestId('additionalLabels', 'myLabelKey=myValue')
    await clickByPlaceholderText('kubevirt-no-ei')
    await clickByText('Add credential')
    await typeByTestId('credentialsName', 'kubevirt-noei')
    screen
      .getByRole('combobox', {
        name: 'Namespace',
      })
      .click()
    await clickByText('test-ns')
    await clickByText('Next', 1)
    await clickByText('Next', 1)
    await pasteByTestId('pullSecret', pullSecret)
    await pasteByTestId('ssh-publickey', 'ssh-rsa AAAAB1 fake@email.com')
    await clickByText('Next', 1)
    await clickByText('Add')

    // wait for kubevirt credential creation
    await waitForNocks([nockCreate(expectedKubevirtCredentialWithNoEI)])

    // transition to NodePools
    await clickByText('Next')

    const nodePoolNameInput = screen.getByTestId('nodePoolName')
    fireEvent.change(nodePoolNameInput, { target: { value: 'nodepool' } })

    await clickByText('Next')

    // verify initial state - only prompts visible
    expect(screen.getByText('Add storage class mapping')).toBeInTheDocument()
    expect(screen.getByText('Add volume snapshot class mapping')).toBeInTheDocument()

    // verify no mapping fields visible initially
    expect(screen.queryByTestId('infraStorageClassName')).not.toBeInTheDocument()
    expect(screen.queryByTestId('infraVolumeSnapshotClassName')).not.toBeInTheDocument()

    // add storage mapping
    await clickByText('Add storage class mapping')
    await typeByTestId('infraStorageClassName', 'storage-class1')
    await typeByTestId('guestStorageClassName', 'guest-storage1')
    await typeByTestId('storageClassGroup', 'group1')

    // add volume snapshot mapping
    await clickByText('Add volume snapshot class mapping')
    await typeByTestId('infraVolumeSnapshotClassName', 'snapshot-class1')
    await typeByTestId('guestVolumeSnapshotClassName', 'guest-snap1')
    await typeByTestId('volumeSnapshotGroup', 'group1')

    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      nockCreate(mockProject, mockProjectResponse),
      nockCreate(mockClusterProjectKubevirt, mockClusterProjectKubevirtResponse),
      nockCreate(mockNodePools5),
      nockCreate(managedCluster),
      nockCreate(mockHostedClusterKubervirt4),
      nockCreate(mockKlusterletAddonConfigKubevirt),
      nockCreate(mockPullSecretKubevirt1),
      nockCreate(mockSSHKeySecret2),
    ]

    await clickByText('Create')
    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })
})

// verifies adding storage class and volumesnapshotclass to the hosted cluster
describe('CreateCluster KubeVirt with RH OpenShift Virtualization credential that has no external infrastructure - Wizard Credential creation', () => {
  const mockProject = {
    apiVersion: ProjectApiVersion,
    kind: 'ProjectRequest',
    metadata: {
      name: 'test',
    },
  }
  const mockProjectResponse = {
    apiVersion: ProjectApiVersion,
    kind: 'Project',
    metadata: {
      name: 'test',
    },
  }

  const mockClusterProjectKubevirt: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'test-namespace' },
  }

  const mockClusterProjectKubevirtResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
      name: 'test-namespace',
    },
  }
  const pullSecret = '{"pullSecret":"secret"}\n'

  // ManagedClusterKubevirt
  const mockKlusterletAddonConfigKubevirt = {
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
    },
  }

  const managedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
      annotations: {
        'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
        'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
        'open-cluster-management/created-via': 'hypershift',
      },
      labels: {
        cloud: 'BareMetal',
        vendor: 'OpenShift',
        name: 'test',
        myLabelKey: 'myValue',
      },
      name: 'test',
    },
    spec: {
      hubAcceptsClient: true,
    },
  }

  const mockPullSecretKubevirt1: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'pullsecret-cluster-test',
      namespace: 'test-namespace',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-no-ei',
      },
    },
    stringData: {
      '.dockerconfigjson': '{"pullSecret":"secret"}',
    },
    type: 'kubernetes.io/dockerconfigjson',
  }

  // Secret for 'sshkey-cluster-test'
  const mockSSHKeySecret2: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'sshkey-cluster-test',
      namespace: 'test-namespace',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-no-ei',
      },
    },
    stringData: {
      'id_rsa.pub': 'ssh-rsa AAAAB1 fake@email.com',
    },
  }

  // HostedCluster
  const mockHostedClusterKubervirt4: HostedCluster = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'HostedCluster',
    metadata: {
      name: 'test',
      namespace: 'test-namespace',
    },
    spec: {
      etcd: {
        managed: {
          storage: {
            persistentVolume: {
              size: '8Gi',
            },
            type: 'PersistentVolume',
          },
        },
        managementType: 'Managed',
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
      pullSecret: {
        name: 'pullsecret-cluster-test',
      },
      sshKey: {
        name: 'sshkey-cluster-test',
      },
      networking: {
        clusterNetwork: [
          {
            cidr: '10.132.0.0/14',
          },
        ],
        serviceNetwork: [
          {
            cidr: '172.31.0.0/16',
          },
        ],
        networkType: 'OVNKubernetes',
      },
      controllerAvailabilityPolicy: 'HighlyAvailable',
      infrastructureAvailabilityPolicy: 'HighlyAvailable',
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          baseDomainPassthrough: true,
          storageDriver: {
            manual: {
              storageClassMapping: [
                {
                  infraStorageClassName: 'storage-class1',
                  guestStorageClassName: 'guest-storage1',
                  group: 'group1',
                },
              ],
              volumeSnapshotClassMapping: [
                {
                  infraVolumeSnapshotClassName: 'snapshot-class1',
                  guestVolumeSnapshotClassName: 'guest-snap1',
                  group: 'group1',
                },
              ],
            },
          },
        },
      },
      infraID: 'test',
      services: [
        {
          service: 'OAuthServer',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'OIDC',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Konnectivity',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Ignition',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
      ],
    },
  }

  const mockNodePools5 = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'NodePool',
    metadata: {
      name: 'nodepool',
      namespace: 'test-namespace',
    },
    spec: {
      arch: 'amd64',
      clusterName: 'test',
      replicas: 2,
      management: {
        autoRepair: false,
        upgradeType: 'Replace',
      },
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          compute: {
            cores: 2,
            memory: '8Gi',
          },
          rootVolume: {
            type: 'Persistent',
            persistent: {
              size: '32Gi',
            },
          },
          defaultPodNetwork: true,
        },
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    },
  }

  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(namespacesState, [
            {
              apiVersion: NamespaceApiVersion,
              kind: NamespaceKind,
              metadata: { name: 'test-ns' },
            },
          ])
          snapshot.set(managedClustersState, [])
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(managedClusterInfosState, [
            {
              apiVersion: ManagedClusterInfoApiVersion,
              kind: ManagedClusterInfoKind,
              metadata: { name: 'local-cluster', namespace: 'local-cluster' },
              status: {
                consoleURL: 'https://testCluster.com',
                conditions: [
                  {
                    type: 'ManagedClusterConditionAvailable',
                    reason: 'ManagedClusterConditionAvailable',
                    status: 'True',
                  },
                  { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
                  { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
                ],
                version: '1.17',
                distributionInfo: {
                  type: 'ocp',
                  ocp: {
                    version: '1.2.3',
                    availableUpdates: [],
                    desiredVersion: '1.2.3',
                    upgradeFailed: false,
                  },
                },
              },
            },
          ])
          snapshot.set(secretsState, [
            {
              apiVersion: ProviderConnectionApiVersion,
              kind: ProviderConnectionKind,
              metadata: {
                name: 'kubevirt-no-ei',
                namespace: 'test-ns',
                labels: {
                  'cluster.open-cluster-management.io/type': 'kubevirt',
                },
              },
              stringData: {
                pullSecret: pullSecret,
                'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
              },
              type: 'kubernetes.io/dockerconfigjson',
            } as Secret,
          ])
          snapshot.set(clusterCuratorsState, mockClusterCurators)
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?${CLUSTER_INFRA_TYPE_PARAM}=kubevirt`]}>
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })

  test('KubeVirt cluster creation with a kubervirt credential that has no external infrastructure', async () => {
    const clusterImageSetKubervirt: ClusterImageSetK8sResource = {
      apiVersion: ClusterImageSetApiVersion,
      kind: ClusterImageSetKind,
      metadata: {
        name: 'ocp-release4.15.36',
      },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    } as ClusterImageSetK8sResource

    const storageClass = {
      kind: 'StorageClass',
      apiVersion: 'storage.k8s.io/v1',
      metadata: {
        name: 'gp3-csi',
        annotations: {
          'storageclass.kubernetes.io/is-default-class': 'true',
        },
      },
      provisioner: 'ebs.csi.aws.com',
      parameters: {
        encrypted: 'true',
        type: 'gp3',
      },
      reclaimPolicy: 'Delete',
      allowVolumeExpansion: true,
      volumeBindingMode: 'WaitForFirstConsumer',
    }

    const expectedKubevirtCredentialWithNoEI = {
      apiVersion: 'v1',
      kind: 'Secret',
      type: 'Opaque',
      metadata: {
        name: 'kubevirt-noei',
        namespace: 'test-ns',
        labels: {
          'cluster.open-cluster-management.io/type': 'kubevirt',
          'cluster.open-cluster-management.io/credentials': '',
        },
      },
      stringData: {
        pullSecret: '{"pullSecret":"secret"}\n',
        'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
      },
    }
    const initialNocks: Scope[] = [
      nockList(clusterImageSetKubervirt as IResource, [clusterImageSetKubervirt] as IResource[]),
      nockList(storageClass as IResource, [storageClass] as IResource[]),
    ]
    render(<Component />)

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)
    await waitForText('Cluster details', true)
    await waitForText('Node pools')
    await waitForText('Review and create')

    // fill-in Cluster details
    await typeByTestId('clusterName', clusterName)

    await clickByPlaceholderText('Select or enter a release image')
    await clickByText('OpenShift 4.15.36')

    const inputElement = screen.getByTestId('emanspace')
    expect(inputElement).toHaveValue('clusters')

    const clearButtons = screen.getAllByRole('button', { name: /clear selected item/i })
    fireEvent.click(clearButtons[0])
    expect(inputElement).toHaveValue('')

    await clickByTestId('emanspace')

    // Simulate hitting Enter key
    const inputField = screen.getByTestId('emanspace')
    userEvent.type(inputField, 'test{enter}')

    // Check if the input field has the correct value
    expect(inputField).toHaveValue('test')

    //Check for validation message
    await waitFor(() => {
      expect(screen.getByText('The namespace cannot be the same as the cluster name.')).toBeInTheDocument()
    })

    fireEvent.click(clearButtons[0])
    userEvent.type(inputField, 'test-namespace{enter}')

    await typeByTestId('additionalLabels', 'myLabelKey=myValue')

    await clickByPlaceholderText('kubevirt-no-ei')
    await clickByText('Add credential')
    await typeByTestId('credentialsName', 'kubevirt-noei')
    screen
      .getByRole('combobox', {
        name: 'Namespace',
      })
      .click()
    await clickByText('test-ns')
    await clickByText('Next', 1)
    await clickByText('Next', 1)
    await pasteByTestId('pullSecret', pullSecret)
    await pasteByTestId('ssh-publickey', 'ssh-rsa AAAAB1 fake@email.com')
    await clickByText('Next', 1)
    await clickByText('Add')

    // wait for kubevirt credential creation
    await waitForNocks([nockCreate(expectedKubevirtCredentialWithNoEI)])

    // transition to NodePools
    await clickByText('Next')

    const nodePoolNameInput = screen.getByTestId('nodePoolName')
    fireEvent.change(nodePoolNameInput, { target: { value: 'nodepool' } })

    await clickByText('Next')

    // verify initial state - only prompts visible
    expect(screen.getByText('Add storage class mapping')).toBeInTheDocument()
    expect(screen.getByText('Add volume snapshot class mapping')).toBeInTheDocument()

    // verify no mapping fields visible initially
    expect(screen.queryByTestId('infraStorageClassName')).not.toBeInTheDocument()
    expect(screen.queryByTestId('infraVolumeSnapshotClassName')).not.toBeInTheDocument()

    // add storage mapping
    await clickByText('Add storage class mapping')
    await typeByTestId('infraStorageClassName', 'storage-class1')
    await typeByTestId('guestStorageClassName', 'guest-storage1')
    await typeByTestId('storageClassGroup', 'group1')

    // add volume snapshot mapping
    await clickByText('Add volume snapshot class mapping')
    await typeByTestId('infraVolumeSnapshotClassName', 'snapshot-class1')
    await typeByTestId('guestVolumeSnapshotClassName', 'guest-snap1')
    await typeByTestId('volumeSnapshotGroup', 'group1')

    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      nockCreate(mockProject, mockProjectResponse),
      nockCreate(mockClusterProjectKubevirt, mockClusterProjectKubevirtResponse),
      nockCreate(mockNodePools5),
      nockCreate(managedCluster),
      nockCreate(mockHostedClusterKubervirt4),
      nockCreate(mockKlusterletAddonConfigKubevirt),
      nockCreate(mockPullSecretKubevirt1),
      nockCreate(mockSSHKeySecret2),
    ]

    await clickByText('Create')
    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })
})

// test verifies each node pool definition track its own set of additional networks - with 2 node pools
describe('CreateCluster KubeVirt with RH OpenShift Virtualization credential that has no external infrastructure - Wizard Credential creation', () => {
  const mockProject = {
    apiVersion: ProjectApiVersion,
    kind: 'ProjectRequest',
    metadata: {
      name: 'test',
    },
  }
  const mockProjectResponse = {
    apiVersion: ProjectApiVersion,
    kind: 'Project',
    metadata: {
      name: 'test',
    },
  }

  const mockClusterProjectKubevirt: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'test-namespace' },
  }

  const mockClusterProjectKubevirtResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
      name: 'test-namespace',
    },
  }
  const pullSecret = '{"pullSecret":"secret"}\n'

  // ManagedClusterKubevirt
  const mockKlusterletAddonConfigKubevirt = {
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
    },
  }

  const managedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
      annotations: {
        'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
        'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
        'open-cluster-management/created-via': 'hypershift',
      },
      labels: {
        cloud: 'BareMetal',
        vendor: 'OpenShift',
        name: 'test',
        myLabelKey: 'myValue',
      },
      name: 'test',
    },
    spec: {
      hubAcceptsClient: true,
    },
  }

  const mockPullSecretKubevirt1: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'pullsecret-cluster-test',
      namespace: 'test-namespace',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-no-ei',
      },
    },
    stringData: {
      '.dockerconfigjson': '{"pullSecret":"secret"}',
    },
    type: 'kubernetes.io/dockerconfigjson',
  }

  // Secret for 'sshkey-cluster-test'
  const mockSSHKeySecret2: Secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: 'sshkey-cluster-test',
      namespace: 'test-namespace',
      labels: {
        'cluster.open-cluster-management.io/backup': 'cluster',
        'cluster.open-cluster-management.io/copiedFromNamespace': 'test-ns',
        'cluster.open-cluster-management.io/copiedFromSecretName': 'kubevirt-no-ei',
      },
    },
    stringData: {
      'id_rsa.pub': 'ssh-rsa AAAAB1 fake@email.com',
    },
  }

  // HostedCluster
  const mockHostedClusterKubervirt4: HostedCluster = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'HostedCluster',
    metadata: {
      name: 'test',
      namespace: 'test-namespace',
    },
    spec: {
      etcd: {
        managed: {
          storage: {
            persistentVolume: {
              size: '8Gi',
            },
            type: 'PersistentVolume',
          },
        },
        managementType: 'Managed',
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
      pullSecret: {
        name: 'pullsecret-cluster-test',
      },
      sshKey: {
        name: 'sshkey-cluster-test',
      },
      networking: {
        clusterNetwork: [
          {
            cidr: '10.132.0.0/14',
          },
        ],
        serviceNetwork: [
          {
            cidr: '172.31.0.0/16',
          },
        ],
        networkType: 'OVNKubernetes',
      },
      controllerAvailabilityPolicy: 'HighlyAvailable',
      infrastructureAvailabilityPolicy: 'HighlyAvailable',
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          baseDomainPassthrough: true,
          storageDriver: {
            manual: {
              storageClassMapping: [
                {
                  infraStorageClassName: 'storage-class1',
                  guestStorageClassName: 'guest-storage1',
                  group: 'group1',
                },
              ],
              volumeSnapshotClassMapping: [
                {
                  infraVolumeSnapshotClassName: 'snapshot-class1',
                  guestVolumeSnapshotClassName: 'guest-snap1',
                  group: 'group1',
                },
              ],
            },
          },
        },
      },
      infraID: 'test',
      services: [
        {
          service: 'OAuthServer',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'OIDC',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Konnectivity',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
        {
          service: 'Ignition',
          servicePublishingStrategy: {
            type: 'Route',
          },
        },
      ],
    },
  }

  const mockNodePools1 = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'NodePool',
    metadata: {
      name: 'nodepool1',
      namespace: 'test-namespace',
    },
    spec: {
      arch: 'amd64',
      clusterName: 'test',
      replicas: 2,
      management: {
        autoRepair: false,
        upgradeType: 'Replace',
      },
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          compute: {
            cores: 2,
            memory: '8Gi',
          },
          rootVolume: {
            type: 'Persistent',
            persistent: {
              size: '32Gi',
            },
          },
          additionalNetworks: [{ name: 'ns1/name1' }],
          defaultPodNetwork: true,
        },
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    },
  }

  const mockNodePools2 = {
    apiVersion: 'hypershift.openshift.io/v1beta1',
    kind: 'NodePool',
    metadata: {
      name: 'nodepool2',
      namespace: 'test-namespace',
    },
    spec: {
      arch: 'amd64',
      clusterName: 'test',
      replicas: 2,
      management: {
        autoRepair: false,
        upgradeType: 'Replace',
      },
      platform: {
        type: 'KubeVirt',
        kubevirt: {
          compute: {
            cores: 2,
            memory: '8Gi',
          },
          rootVolume: {
            type: 'Persistent',
            persistent: {
              size: '32Gi',
            },
          },
          additionalNetworks: [{ name: 'ns1/name1' }],
          defaultPodNetwork: true,
        },
      },
      release: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    },
  }

  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(namespacesState, [
            {
              apiVersion: NamespaceApiVersion,
              kind: NamespaceKind,
              metadata: { name: 'test-ns' },
            },
          ])
          snapshot.set(managedClustersState, [])
          snapshot.set(managedClusterSetsState, [])
          snapshot.set(managedClusterInfosState, [
            {
              apiVersion: ManagedClusterInfoApiVersion,
              kind: ManagedClusterInfoKind,
              metadata: { name: 'local-cluster', namespace: 'local-cluster' },
              status: {
                consoleURL: 'https://testCluster.com',
                conditions: [
                  {
                    type: 'ManagedClusterConditionAvailable',
                    reason: 'ManagedClusterConditionAvailable',
                    status: 'True',
                  },
                  { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
                  { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
                ],
                version: '1.17',
                distributionInfo: {
                  type: 'ocp',
                  ocp: {
                    version: '1.2.3',
                    availableUpdates: [],
                    desiredVersion: '1.2.3',
                    upgradeFailed: false,
                  },
                },
              },
            },
          ])
          snapshot.set(secretsState, [
            {
              apiVersion: ProviderConnectionApiVersion,
              kind: ProviderConnectionKind,
              metadata: {
                name: 'kubevirt-no-ei',
                namespace: 'test-ns',
                labels: {
                  'cluster.open-cluster-management.io/type': 'kubevirt',
                },
              },
              stringData: {
                pullSecret: pullSecret,
                'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
              },
              type: 'kubernetes.io/dockerconfigjson',
            } as Secret,
          ])
          snapshot.set(clusterCuratorsState, mockClusterCurators)
        }}
      >
        <MemoryRouter initialEntries={[`${NavigationPath.createCluster}?${CLUSTER_INFRA_TYPE_PARAM}=kubevirt`]}>
          <Routes>
            <Route path={NavigationPath.createCluster} element={<CreateClusterPage />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
  }

  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    nockIgnoreOperatorCheck()
  })

  // verifies adding networks to 2 different node pools
  // verifies adding storage class and volumesnapshotclass to the hosted cluster
  test('KubeVirt cluster creation with a kubervirt credential that has no external infrastructure', async () => {
    const clusterImageSetKubervirt: ClusterImageSetK8sResource = {
      apiVersion: ClusterImageSetApiVersion,
      kind: ClusterImageSetKind,
      metadata: {
        name: 'ocp-release4.15.36',
      },
      spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.15.36-multi',
      },
    } as ClusterImageSetK8sResource

    const storageClass = {
      kind: 'StorageClass',
      apiVersion: 'storage.k8s.io/v1',
      metadata: {
        name: 'gp3-csi',
        annotations: {
          'storageclass.kubernetes.io/is-default-class': 'true',
        },
      },
      provisioner: 'ebs.csi.aws.com',
      parameters: {
        encrypted: 'true',
        type: 'gp3',
      },
      reclaimPolicy: 'Delete',
      allowVolumeExpansion: true,
      volumeBindingMode: 'WaitForFirstConsumer',
    }

    const expectedKubevirtCredentialWithNoEI = {
      apiVersion: 'v1',
      kind: 'Secret',
      type: 'Opaque',
      metadata: {
        name: 'kubevirt-noei',
        namespace: 'test-ns',
        labels: {
          'cluster.open-cluster-management.io/type': 'kubevirt',
          'cluster.open-cluster-management.io/credentials': '',
        },
      },
      stringData: {
        pullSecret: '{"pullSecret":"secret"}\n',
        'ssh-publickey': 'ssh-rsa AAAAB1 fake@email.com',
      },
    }
    const initialNocks: Scope[] = [
      nockList(clusterImageSetKubervirt as IResource, [clusterImageSetKubervirt] as IResource[]),
      nockList(storageClass as IResource, [storageClass] as IResource[]),
    ]
    render(<Component />)

    // wait for tables/combos to fill in
    await waitForNocks(initialNocks)
    await waitForText('Cluster details', true)
    await waitForText('Node pools')
    await waitForText('Storage mapping')
    await waitForText('Review and create')

    // fill-in Cluster details
    await typeByTestId('clusterName', clusterName)

    await clickByPlaceholderText('Select or enter a release image')
    await clickByText('OpenShift 4.15.36')

    const inputElement = screen.getByTestId('emanspace')
    expect(inputElement).toHaveValue('clusters')

    const clearButtons = screen.getAllByRole('button', { name: /clear selected item/i })
    fireEvent.click(clearButtons[0])
    expect(inputElement).toHaveValue('')

    await clickByTestId('emanspace')

    // Simulate hitting Enter key
    const inputField = screen.getByTestId('emanspace')
    userEvent.type(inputField, 'test{enter}')

    // Check if the input field has the correct value
    expect(inputField).toHaveValue('test')

    //Check for validation message
    await waitFor(() => {
      expect(screen.getByText('The namespace cannot be the same as the cluster name.')).toBeInTheDocument()
    })

    fireEvent.click(clearButtons[0])
    userEvent.type(inputField, 'test-namespace{enter}')

    await typeByTestId('additionalLabels', 'myLabelKey=myValue')

    await clickByPlaceholderText('kubevirt-no-ei')
    await clickByText('Add credential')
    await typeByTestId('credentialsName', 'kubevirt-noei')
    screen
      .getByRole('combobox', {
        name: 'Namespace',
      })
      .click()
    await clickByText('test-ns')
    await clickByText('Next', 1)
    await clickByText('Next', 1)
    await pasteByTestId('pullSecret', pullSecret)
    await pasteByTestId('ssh-publickey', 'ssh-rsa AAAAB1 fake@email.com')
    await clickByText('Next', 1)
    await clickByText('Add')

    // wait for kubevirt credential creation
    await waitForNocks([nockCreate(expectedKubevirtCredentialWithNoEI)])

    // transition to NodePools step 2 -- node pools
    // add node pool1
    await clickByText('Next')
    const nodePoolNameInput1 = screen.getByTestId('nodePoolName')
    fireEvent.change(nodePoolNameInput1, { target: { value: 'nodepool1' } })

    // Enter network details
    const additionalNetworksInput = screen.getByPlaceholderText(
      'Enter the additional network in the format <namespace>/<name>'
    )
    fireEvent.change(additionalNetworksInput, { target: { value: 'ns1/name1' } })

    const defaultPodNetworkCheckbox = screen.getByRole('checkbox', { name: /default pod network/i })
    // uncheck the default pod network checkbox
    fireEvent.click(defaultPodNetworkCheckbox)

    // add node pool2
    await clickByText('Add node pool')
    const nodePoolNameInput2 = screen.getByTestId('nodePoolNamegrp1')
    fireEvent.change(nodePoolNameInput2, { target: { value: 'nodepool2' } })

    // Enter network details
    const additionalNetworksInput2 = screen.getByTestId('text-additionalNetworksgrp1-0')
    fireEvent.change(additionalNetworksInput2, { target: { value: 'ns1/name1' } })

    // uncheck the default pod network checkbox
    fireEvent.click(defaultPodNetworkCheckbox)

    await clickByText('Next')

    // verify initial state - only prompts visible
    expect(screen.getByText('Add storage class mapping')).toBeInTheDocument()
    expect(screen.getByText('Add volume snapshot class mapping')).toBeInTheDocument()

    // verify no mapping fields visible initially
    expect(screen.queryByTestId('infraStorageClassName')).not.toBeInTheDocument()
    expect(screen.queryByTestId('infraVolumeSnapshotClassName')).not.toBeInTheDocument()

    // add storage mapping
    await clickByText('Add storage class mapping')
    await typeByTestId('infraStorageClassName', 'storage-class1')
    await typeByTestId('guestStorageClassName', 'guest-storage1')
    await typeByTestId('storageClassGroup', 'group1')

    // add volume snapshot mapping
    await clickByText('Add volume snapshot class mapping')
    await typeByTestId('infraVolumeSnapshotClassName', 'snapshot-class1')
    await typeByTestId('guestVolumeSnapshotClassName', 'guest-snap1')
    await typeByTestId('volumeSnapshotGroup', 'group1')

    await clickByText('Next')

    // nocks for cluster creation
    const createNocks = [
      nockCreate(mockProject, mockProjectResponse),
      nockCreate(mockClusterProjectKubevirt, mockClusterProjectKubevirtResponse),
      nockCreate(mockNodePools1),
      nockCreate(mockNodePools2),
      nockCreate(managedCluster),
      nockCreate(mockHostedClusterKubervirt4),
      nockCreate(mockKlusterletAddonConfigKubevirt),
      nockCreate(mockPullSecretKubevirt1),
      nockCreate(mockSSHKeySecret2),
    ]
    await clickByText('Create')
    await waitForText('Creating cluster ...')

    // make sure creating
    await waitForNocks(createNocks)
  })
})
