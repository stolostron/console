/* Copyright Contributors to the Open Cluster Management project */

import { deleteCluster, detachCluster } from './delete-cluster'
import {
  Cluster,
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  ClusterStatus,
  HostedClusterApiVersion,
  HostedClusterKind,
  InfraEnvApiVersion,
  InfraEnvKind,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  SecretApiVersion,
  SecretKind,
} from '../resources'
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
  isHostedCluster: true,
  isHypershift: false,
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
