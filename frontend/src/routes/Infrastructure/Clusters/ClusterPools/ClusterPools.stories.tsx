/* Copyright Contributors to the Open Cluster Management project */

import { Meta } from '@storybook/react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'
import {
  ClusterClaim,
  ClusterClaimApiVersion,
  ClusterClaimKind,
  ClusterImageSetApiVersion,
  ClusterImageSetKind,
  ClusterPool,
  ClusterPoolApiVersion,
  ClusterPoolKind,
} from '../../../../resources'
import { Cluster, ClusterStatus } from '../../../../resources/utils'
import { Provider } from '../../../../ui-components'
import { AcmAlertProvider } from '../../../../ui-components/AcmAlert/AcmAlert'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  clusterClaimsState,
  clusterImageSetsState,
  certificateSigningRequestsState,
  clusterDeploymentsState,
  managedClusterAddonsState,
  clusterManagementAddonsState,
  managedClusterInfosState,
  managedClustersState,
  agentClusterInstallsState,
  clusterCuratorsState,
  hostedClustersState,
  nodePoolsState,
  discoveredClusterState,
} from '../../../../atoms'
import { PluginDataContext, defaultContext } from '../../../../lib/PluginDataContext'
import { ClusterPoolsTable, ClusterPoolClustersTable, ClusterPoolClaimsTable } from './ClusterPools'

const pluginDataContextValue = { ...defaultContext, loadStarted: true, loadCompleted: true }

const meta: Meta = {
  title: 'ClusterPools',
  decorators: [
    (Story) => (
      <PluginDataContext.Provider value={pluginDataContextValue}>
        <Story />
      </PluginDataContext.Provider>
    ),
  ],
}
export default meta

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockClusterPool: ClusterPool = {
  apiVersion: ClusterPoolApiVersion,
  kind: ClusterPoolKind,
  metadata: {
    name: 'production-pool',
    namespace: 'hive-clusters',
    uid: 'pool-uid-1',
    finalizers: ['hive.openshift.io/clusters'],
  },
  spec: {
    baseDomain: 'dev.example.com',
    imageSetRef: { name: 'img4.14.5-x86-64' },
    installConfigSecretTemplateRef: { name: 'pool-install-config' },
    platform: {
      aws: {
        credentialsSecretRef: { name: 'pool-aws-creds' },
        region: 'us-east-1',
      },
    },
    pullSecretRef: { name: 'pool-pull-secret' },
    size: 3,
    runningCount: 2,
  },
  status: {
    conditions: [{ message: 'Capacity available', reason: 'Available', status: 'True', type: 'CapacityAvailable' }],
    ready: 2,
    standby: 1,
    size: 3,
  },
}

const mockClusterPoolGcp: ClusterPool = {
  apiVersion: ClusterPoolApiVersion,
  kind: ClusterPoolKind,
  metadata: {
    name: 'staging-pool',
    namespace: 'hive-clusters',
    uid: 'pool-uid-2',
    finalizers: ['hive.openshift.io/clusters'],
  },
  spec: {
    baseDomain: 'staging.example.com',
    imageSetRef: { name: 'img4.14.5-x86-64' },
    installConfigSecretTemplateRef: { name: 'staging-install-config' },
    platform: {
      gcp: { credentialsSecretRef: { name: 'staging-gcp-creds' } },
    },
    pullSecretRef: { name: 'staging-pull-secret' },
    size: 2,
  },
  status: {
    conditions: [{ message: 'Capacity available', reason: 'Available', status: 'True', type: 'CapacityAvailable' }],
    standby: 2,
    size: 2,
  },
}

const mockClusterPoolDeleting: ClusterPool = {
  apiVersion: ClusterPoolApiVersion,
  kind: ClusterPoolKind,
  metadata: {
    name: 'deprecated-pool',
    namespace: 'hive-clusters',
    uid: 'pool-uid-3',
    finalizers: ['hive.openshift.io/clusters'],
    deletionTimestamp: '2025-01-15T12:00:00Z',
  },
  spec: {
    baseDomain: 'old.example.com',
    imageSetRef: { name: 'img4.13.0-x86-64' },
    installConfigSecretTemplateRef: { name: 'old-install-config' },
    platform: {
      azure: { credentialsSecretRef: { name: 'old-azure-creds' } },
    },
    pullSecretRef: { name: 'old-pull-secret' },
    size: 1,
  },
  status: {
    conditions: [],
    size: 1,
  },
}

function makeMockCluster(name: string, poolName: string, status: ClusterStatus, claimName?: string): Cluster {
  return {
    name,
    displayName: name,
    namespace: name,
    uid: `uid-${name}`,
    status,
    distribution: {
      k8sVersion: '1.27',
      ocp: undefined,
      displayVersion: '4.14.5',
      isManagedOpenShift: false,
    },
    labels: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
      isHibernatable: true,
      clusterPool: poolName,
      clusterPoolNamespace: 'hive-clusters',
      clusterClaimName: claimName,
      secrets: { installConfig: '' },
    },
    isHive: true,
    isManaged: true,
    isCurator: false,
    hasAutomationTemplate: false,
    isHostedCluster: false,
    isSNOCluster: false,
    isRegionalHubCluster: false,
    owner: {},
    kubeconfig: '',
    kubeadmin: '',
    isHypershift: false,
    provider: Provider.aws,
    nodes: { ready: 3, unhealthy: 0, unknown: 0, nodeList: [] },
  }
}

const mockClusters: Cluster[] = [
  makeMockCluster('pool-cluster-1', 'production-pool', ClusterStatus.ready),
  makeMockCluster('pool-cluster-2', 'production-pool', ClusterStatus.running, 'claim-alpha'),
  makeMockCluster('pool-cluster-3', 'production-pool', ClusterStatus.hibernating),
]

const mockClusterClaims: ClusterClaim[] = [
  {
    apiVersion: ClusterClaimApiVersion,
    kind: ClusterClaimKind,
    metadata: {
      name: 'claim-beta',
      namespace: 'hive-clusters',
      annotations: {
        'open-cluster-management.io/user-identity': btoa('developer@example.com'),
      },
    },
    spec: { clusterPoolName: 'production-pool' },
    status: {
      conditions: [{ message: 'Pending', reason: 'Pending', status: 'True', type: 'ClusterRunning' }],
    },
  },
  {
    apiVersion: ClusterClaimApiVersion,
    kind: ClusterClaimKind,
    metadata: {
      name: 'claim-gamma',
      namespace: 'hive-clusters',
      annotations: {
        'open-cluster-management.io/user-identity': btoa('admin@example.com'),
      },
    },
    spec: { clusterPoolName: 'production-pool' },
    status: {
      conditions: [{ message: 'Pending', reason: 'Pending', status: 'True', type: 'ClusterRunning' }],
    },
  },
  {
    apiVersion: ClusterClaimApiVersion,
    kind: ClusterClaimKind,
    metadata: {
      name: 'claim-delta',
      namespace: 'hive-clusters',
    },
    spec: { clusterPoolName: 'production-pool' },
  },
]

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export function ClusterPoolClaimsTableStory() {
  return (
    <AcmAlertProvider>
      <ClusterPoolClaimsTable claims={mockClusterClaims} />
    </AcmAlertProvider>
  )
}
ClusterPoolClaimsTableStory.storyName = 'ClusterPoolClaimsTable'

export function ClusterPoolClaimsTableEmpty() {
  return (
    <AcmAlertProvider>
      <ClusterPoolClaimsTable claims={[]} />
    </AcmAlertProvider>
  )
}
ClusterPoolClaimsTableEmpty.storyName = 'ClusterPoolClaimsTable - Empty'

export function ClusterPoolClustersTableStory() {
  return <ClusterPoolClustersTable clusters={mockClusters} />
}
ClusterPoolClustersTableStory.storyName = 'ClusterPoolClustersTable'

export function ClusterPoolClustersTableEmpty() {
  return <ClusterPoolClustersTable clusters={[]} />
}
ClusterPoolClustersTableEmpty.storyName = 'ClusterPoolClustersTable - Empty'

export function ClusterPoolsTableStory() {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(clusterClaimsState, mockClusterClaims)
        snapshot.set(clusterImageSetsState, [
          {
            apiVersion: ClusterImageSetApiVersion,
            kind: ClusterImageSetKind,
            metadata: { name: 'img4.14.5-x86-64', labels: { visible: 'true' } },
            spec: { releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.14.5-x86_64' },
          },
        ])
        snapshot.set(certificateSigningRequestsState, [])
        snapshot.set(clusterDeploymentsState, [])
        snapshot.set(managedClusterAddonsState, {})
        snapshot.set(clusterManagementAddonsState, [])
        snapshot.set(managedClusterInfosState, [])
        snapshot.set(managedClustersState, [])
        snapshot.set(agentClusterInstallsState, [])
        snapshot.set(clusterCuratorsState, [])
        snapshot.set(hostedClustersState, [])
        snapshot.set(nodePoolsState, [])
        snapshot.set(discoveredClusterState, [])
      }}
    >
      <AcmAlertProvider>
        <ClusterPoolsTable
          clusterPools={[mockClusterPool, mockClusterPoolGcp, mockClusterPoolDeleting]}
          clusters={mockClusters}
          emptyState={<div>No cluster pools</div>}
        />
      </AcmAlertProvider>
    </RecoilRoot>
  )
}
ClusterPoolsTableStory.storyName = 'ClusterPoolsTable'

export function ClusterPoolsTableEmpty() {
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(clusterClaimsState, [])
        snapshot.set(clusterImageSetsState, [])
        snapshot.set(certificateSigningRequestsState, [])
        snapshot.set(clusterDeploymentsState, [])
        snapshot.set(managedClusterAddonsState, {})
        snapshot.set(clusterManagementAddonsState, [])
        snapshot.set(managedClusterInfosState, [])
        snapshot.set(managedClustersState, [])
        snapshot.set(agentClusterInstallsState, [])
        snapshot.set(clusterCuratorsState, [])
        snapshot.set(hostedClustersState, [])
        snapshot.set(nodePoolsState, [])
        snapshot.set(discoveredClusterState, [])
      }}
    >
      <AcmAlertProvider>
        <ClusterPoolsTable
          clusterPools={[]}
          clusters={[]}
          emptyState={<div>No cluster pools found. Create one to get started.</div>}
        />
      </AcmAlertProvider>
    </RecoilRoot>
  )
}
ClusterPoolsTableEmpty.storyName = 'ClusterPoolsTable - Empty'
