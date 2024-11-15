/* Copyright Contributors to the Open Cluster Management project */

import { deleteCluster, detachCluster } from './delete-cluster'
import {
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  HostedClusterApiVersion,
  HostedClusterKind,
  InfraEnvApiVersion,
  InfraEnvKind,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  NodePoolApiVersion,
  NodePoolKind,
  SecretApiVersion,
  SecretKind,
} from '../resources'
import { Cluster, ClusterStatus } from '../resources/utils'
import { nockDelete, nockIgnoreApiPaths, nockPatch } from './nock-util'
import { waitForNocks } from './test-util'
import { Provider } from '../ui-components'

const mockCluster1: Cluster = {
  name: 'hypershift-cluster1',
  displayName: 'hypershift-cluster1',
  namespace: 'clusters',
  uid: 'hypershift-cluster1-uid',
  provider: undefined,
  status: ClusterStatus.ready,
  distribution: {
    ocp: {
      version: '4.11.12',
      availableUpdates: [],
      desiredVersion: '4.11.12',
      upgradeFailed: false,
    },
    isManagedOpenShift: false,
  },
  labels: { abc: '123' },
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    secrets: {
      installConfig: '',
      pullSecret: 'foo-secret',
    },
  },
  hypershift: {
    agent: false,
    hostingNamespace: 'clusters',
    nodePools: [],
    secretNames: ['feng-hs-bug-ssh-key', 'feng-hs-bug-pull-secret'],
  },
  isHive: false,
  isManaged: true,
  isCurator: true,
  hasAutomationTemplate: false,
  isHostedCluster: true,
  isHypershift: true,
  isSNOCluster: false,
  owner: {},
  kubeadmin: '',
  kubeconfig: '',
  isRegionalHubCluster: false,
}

const mockCluster2: Cluster = {
  name: 'hypershift-cluster1',
  displayName: 'hypershift-cluster1',
  namespace: 'clusters',
  uid: 'hypershift-cluster1-uid',
  provider: undefined,
  status: ClusterStatus.ready,
  distribution: {
    ocp: {
      version: '4.11.12',
      availableUpdates: [],
      desiredVersion: '4.11.12',
      upgradeFailed: false,
    },
    isManagedOpenShift: false,
  },
  labels: { abc: '123' },
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    secrets: {
      installConfig: '',
    },
  },
  isHive: false,
  isManaged: true,
  isCurator: true,
  hasAutomationTemplate: false,
  isHostedCluster: true,
  isHypershift: true,
  isSNOCluster: false,
  owner: {},
  kubeadmin: '',
  kubeconfig: '',
  isRegionalHubCluster: false,
}

const mockCluster3: Cluster = {
  name: 'hive-cluster1',
  displayName: 'hive-cluster1',
  namespace: 'clusters',
  uid: 'hive-cluster1-uid',
  provider: undefined,
  status: ClusterStatus.ready,
  distribution: {
    ocp: {
      version: '4.11.12',
      availableUpdates: [],
      desiredVersion: '4.11.12',
      upgradeFailed: false,
    },
    isManagedOpenShift: false,
  },
  labels: { abc: '123' },
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    secrets: {
      installConfig: '',
    },
  },
  isHive: true,
  isManaged: true,
  isCurator: true,
  hasAutomationTemplate: false,
  isHostedCluster: false,
  isHypershift: false,
  isSNOCluster: false,
  owner: {},
  kubeadmin: '',
  kubeconfig: '',
  isRegionalHubCluster: false,
}

const mockHostedCluster: Cluster = {
  name: 'hosted-cluster1',
  displayName: 'hosted-cluster1',
  namespace: 'clusters',
  uid: 'hosted-cluster1-uid',
  provider: Provider.kubevirt,
  status: ClusterStatus.ready,
  distribution: {
    ocp: {
      version: '4.11.12',
      availableUpdates: [],
      desiredVersion: '4.11.12',
      upgradeFailed: false,
    },
    isManagedOpenShift: false,
  },
  labels: { abc: '123' },
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hive: {
    isHibernatable: false,
    clusterPool: undefined,
    secrets: {
      installConfig: '',
    },
  },
  hypershift: {
    agent: false,
    hostingNamespace: 'clusters',
    nodePools: [
      {
        apiVersion: 'hypershift.openshift.io/v1beta1',
        kind: 'NodePool',
        metadata: {
          annotations: {
            'hypershift.openshift.io/nodePoolCurrentConfig': '814967cb',
            'hypershift.openshift.io/nodePoolCurrentConfigVersion': '0e8b8078',
            'hypershift.openshift.io/nodePoolPlatformMachineTemplate': 'hosted-cluster1-304faa18',
          },
          finalizers: ['hypershift.openshift.io/finalizer'],
          labels: {
            'hypershift.openshift.io/auto-created-for-infra': 'hosted-cluster1-qvl8m',
          },
          name: 'hosted-cluster1-nodepool',
          namespace: 'clusters',
        },
        spec: {
          clusterName: 'hosted-cluster1',
          management: {
            autoRepair: false,
            replace: {
              rollingUpdate: {
                maxSurge: 1,
                maxUnavailable: 0,
              },
              strategy: 'RollingUpdate',
            },
            upgradeType: 'Replace',
          },
          platform: {
            aws: {
              instanceProfile: 'test',
              instanceType: 'test',
              rootVolume: {
                size: 10,
                type: 'Persistent',
              },
              securityGroups: [],
              subnet: {
                id: 'string',
              },
            },
            type: 'AWS',
          },
          release: {
            image: 'quay.io/openshift-release-dev/ocp-release:4.15.10-x86_64',
          },
          replicas: 2,
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2024-06-14T15:55:12Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'False',
              type: 'AutoscalingEnabled',
            },
            {
              lastTransitionTime: '2024-06-14T15:55:12Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'UpdateManagementEnabled',
            },
            {
              lastTransitionTime: '2024-06-18T00:17:55Z',
              message: 'Using release image: quay.io/openshift-release-dev/ocp-release:4.15.10-x86_64',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'ValidReleaseImage',
            },
            {
              lastTransitionTime: '2024-06-14T15:58:54Z',
              message: 'Payload generated successfully',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'ValidGeneratedPayload',
            },
            {
              lastTransitionTime: '2024-06-14T15:59:47Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'ReachedIgnitionEndpoint',
            },
            {
              lastTransitionTime: '2024-06-14T15:57:52Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'ValidTuningConfig',
            },
            {
              lastTransitionTime: '2024-06-14T15:57:52Z',
              message: 'Reconciliation active on resource',
              observedGeneration: 1,
              reason: 'ReconciliationActive',
              status: 'True',
              type: 'ReconciliationActive',
            },
            {
              lastTransitionTime: '2024-07-10T07:58:00Z',
              message: 'All is well',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'AllMachinesReady',
            },
            {
              lastTransitionTime: '2024-06-14T16:07:05Z',
              message: 'All is well',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'AllNodesHealthy',
            },
            {
              lastTransitionTime: '2024-06-14T15:57:52Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'False',
              type: 'AutorepairEnabled',
            },
            {
              lastTransitionTime: '2024-06-14T16:07:05Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'Ready',
            },
            {
              lastTransitionTime: '2024-07-10T15:39:26Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              status: 'True',
              type: 'ValidMachineConfig',
            },
          ],
          replicas: 2,
          version: '4.15.10',
        },
      },
    ],
    secretNames: ['secret1'],
  },
  isHive: false,
  isManaged: true,
  isCurator: true,
  hasAutomationTemplate: false,
  isHostedCluster: true,
  isHypershift: true,
  isSNOCluster: false,
  owner: {},
  kubeadmin: '',
  kubeconfig: '',
  isRegionalHubCluster: false,
}

const getDetatchNocks = (name: string, namespace: string) => [
  nockPatch(
    {
      apiVersion: HostedClusterApiVersion,
      kind: HostedClusterKind,
      metadata: {
        name,
        namespace,
      },
    },
    [
      {
        op: 'remove',
        path: '/metadata/annotations/cluster.open-cluster-management.io~1hypershiftdeployment',
      },
      {
        op: 'remove',
        path: '/metadata/annotations/cluster.open-cluster-management.io~1managedcluster-name',
      },
    ]
  ),
  nockDelete({
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
      name,
    },
  }),
]

describe('detachCluster', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nockIgnoreApiPaths()
  })

  it('detachCluster normal operation', async () => {
    const nocks = getDetatchNocks(mockCluster1.name, mockCluster1.hypershift?.hostingNamespace!)
    detachCluster(mockCluster1)
    await waitForNocks(nocks)
  })

  it('detachCluster no hypershift', async () => {
    const nocks = getDetatchNocks(mockCluster2.name, mockCluster2.hypershift?.hostingNamespace!)
    detachCluster(mockCluster2)
    await waitForNocks(nocks)
  })
})

const deleteClusterNocks = () => [
  nockDelete({
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
      name: mockCluster3.name,
    },
  }),
  nockDelete({
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
      name: mockCluster3.name,
      namespace: mockCluster3.namespace,
    },
  }),
]

const deleteInfraEnvNock = () =>
  nockDelete({
    apiVersion: InfraEnvApiVersion,
    kind: InfraEnvKind,
    metadata: {
      name: 'infraenv',
      namespace: 'infraenvns',
    },
  })

const infraEnv = {
  metadata: {
    name: 'infraenv',
    namespace: 'infraenvns',
  },
  spec: {
    clusterRef: {
      name: mockCluster3.name,
      namespace: mockCluster3.namespace!,
    },
  },
}

describe('deleteCluster', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nockIgnoreApiPaths()
  })

  it('delete Hive cluster', async () => {
    const nocks = deleteClusterNocks()
    deleteCluster({
      cluster: mockCluster3,
      deletePullSecret: false,
      infraEnvs: [],
      ignoreClusterDeploymentNotFound: true,
    })

    await waitForNocks(nocks)
  })

  it('Host Inventory Cluster - AI', async () => {
    const deleteNocks = [...deleteClusterNocks(), deleteInfraEnvNock()]
    deleteCluster({
      cluster: {
        ...mockCluster3,
        provider: Provider.hostinventory,
      },
      deletePullSecret: false,
      infraEnvs: [infraEnv],
      ignoreClusterDeploymentNotFound: true,
    })

    await waitForNocks(deleteNocks)
  })

  it('Host Inventory Cluster - AI with pull secret', async () => {
    const deleteNocks = [
      ...deleteClusterNocks(),
      deleteInfraEnvNock(),
      nockDelete({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
          name: 'foo',
          namespace: mockCluster3.namespace,
        },
      }),
      nockDelete({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
          name: 'bar',
          namespace: infraEnv.metadata.namespace,
        },
      }),
    ]
    deleteCluster({
      cluster: {
        ...mockCluster3,
        provider: Provider.hostinventory,
        hive: {
          ...mockCluster3.hive,
          secrets: {
            pullSecret: 'foo',
          },
        },
      },
      deletePullSecret: true,
      infraEnvs: [
        {
          ...infraEnv,
          spec: {
            ...infraEnv.spec,
            pullSecretRef: {
              name: 'bar',
            },
          },
        },
      ],
      ignoreClusterDeploymentNotFound: true,
    })

    await waitForNocks(deleteNocks)
  })

  it('Host Inventory Cluster - AI with the same pull secret', async () => {
    const deleteNocks = [
      ...deleteClusterNocks(),
      nockDelete({
        apiVersion: InfraEnvApiVersion,
        kind: InfraEnvKind,
        metadata: {
          name: 'infraenv',
          namespace: mockCluster3.namespace,
        },
      }),
      nockDelete({
        apiVersion: SecretApiVersion,
        kind: SecretKind,
        metadata: {
          name: 'foo',
          namespace: mockCluster3.namespace,
        },
      }),
    ]
    deleteCluster({
      cluster: {
        ...mockCluster3,
        provider: Provider.hostinventory,
        hive: {
          ...mockCluster3.hive,
          secrets: {
            pullSecret: 'foo',
          },
        },
      },
      deletePullSecret: true,
      infraEnvs: [
        {
          ...infraEnv,
          metadata: {
            ...infraEnv.metadata,
            namespace: mockCluster3.namespace,
          },
          spec: {
            ...infraEnv.spec,
            pullSecretRef: {
              name: 'foo',
            },
          },
        },
      ],
      ignoreClusterDeploymentNotFound: true,
    })

    await waitForNocks(deleteNocks)
  })
})

const deleteHostedClusterNocks = () => [
  nockDelete({
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
      name: mockHostedCluster.name,
    },
  }),
  nockDelete({
    apiVersion: HostedClusterApiVersion,
    kind: HostedClusterKind,
    metadata: {
      name: mockHostedCluster.name,
      namespace: mockHostedCluster.namespace,
    },
  }),
  nockDelete({
    apiVersion: NodePoolApiVersion,
    kind: NodePoolKind,
    metadata: {
      name: 'hosted-cluster1-nodepool',
      namespace: 'clusters',
    },
  }),
  nockDelete({
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
      name: 'secret1',
      namespace: 'clusters',
    },
  }),
]

describe('deleteCluster hostedcluster', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nockIgnoreApiPaths()
  })

  it('delete Hosted cluster', async () => {
    const nocks = deleteHostedClusterNocks()
    deleteCluster({
      cluster: mockHostedCluster,
      deletePullSecret: false,
      infraEnvs: [],
      ignoreClusterDeploymentNotFound: true,
    })

    await waitForNocks(nocks)
  })
})
