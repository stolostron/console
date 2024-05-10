/* Copyright Contributors to the Open Cluster Management project */

import { HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import {
  CertificateSigningRequest,
  CertificateSigningRequestApiVersion,
  CertificateSigningRequestKind,
  ClusterDeployment,
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  ClusterManagementAddOn,
  ClusterManagementAddOnApiVersion,
  ClusterManagementAddOnKind,
  HostedClusterApiVersion,
  HostedClusterKind,
  ManagedCluster,
  ManagedClusterAddOn,
  ManagedClusterAddOnApiVersion,
  ManagedClusterAddOnKind,
  ManagedClusterApiVersion,
  ManagedClusterInfo,
  ManagedClusterInfoApiVersion,
  ManagedClusterInfoKind,
  ManagedClusterKind,
  managedClusterSetLabel,
} from '../../../../resources'
import { mockManagedClusterSet } from '../../../../lib/test-metadata'

export const mockManagedCluster0: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'managed-cluster-0-clusterset',
    labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
  },
  spec: { hubAcceptsClient: true },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
    conditions: [],
    version: { kubernetes: '' },
  },
}
export const mockManagedCluster1: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: 'managed-cluster-1' },
  spec: { hubAcceptsClient: true },
}
const readyManagedClusterConditions = [
  { type: 'ManagedClusterConditionAvailable', reason: 'ManagedClusterConditionAvailable', status: 'True' },
  { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
  { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
]
const readyManagedClusterStatus = {
  allocatable: { cpu: '', memory: '' },
  capacity: { cpu: '', memory: '' },
  version: { kubernetes: '1.17' },
  clusterClaims: [],
  conditions: readyManagedClusterConditions,
}
const mockManagedCluster2: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: 'managed-cluster-2-no-upgrade' },
  spec: { hubAcceptsClient: true },
  status: readyManagedClusterStatus,
}
const mockManagedCluster3: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: 'managed-cluster-3-upgrade-available' },
  spec: { hubAcceptsClient: true },
  status: readyManagedClusterStatus,
}
const mockManagedCluster4: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: 'managed-cluster-4-upgrading' },
  spec: { hubAcceptsClient: true },
  status: readyManagedClusterStatus,
}
const mockManagedCluster5: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: 'managed-cluster-5-upgrade-available' },
  spec: { hubAcceptsClient: true },
  status: readyManagedClusterStatus,
}
export const mockManagedCluster6: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: 'local-cluster' },
  spec: { hubAcceptsClient: true },
}
export const mockManagedCluster7: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'hypershift-cluster',
    annotations: {
      'cluster.open-cluster-management.io/hypershiftdeployment': 'hypershift-cluster/hypershift-cluster',
    },
  },
  spec: { hubAcceptsClient: true },
}
export const mockManagedCluster8: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'regional-cluster',
    labels: {
      'feature.open-cluster-management.io/addon-multicluster-global-hub-controller': 'available',
    },
  },
  spec: { hubAcceptsClient: true },
}
export const mockManagedClusters: ManagedCluster[] = [
  mockManagedCluster0,
  mockManagedCluster1,
  mockManagedCluster2,
  mockManagedCluster3,
  mockManagedCluster4,
  mockManagedCluster5,
]
export const upgradeableMockManagedClusters: ManagedCluster[] = [mockManagedCluster3, mockManagedCluster5]

export const mockManagedClusterInfo0: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: 'managed-cluster-0-clusterset', namespace: 'managed-cluster-0-clusterset' },
}
const mockManagedClusterInfo1: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: 'managed-cluster-1', namespace: 'managed-cluster-1', labels: { cloud: 'Google' } },
}
const mockManagedClusterInfo2: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: 'managed-cluster-2-no-upgrade', namespace: 'managed-cluster-2-no-upgrade' },
  status: {
    conditions: readyManagedClusterConditions,
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
}
const mockManagedClusterInfo3: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: {
    name: 'managed-cluster-3-upgrade-available',
    namespace: 'managed-cluster-3-upgrade-available',
  },
  status: {
    conditions: readyManagedClusterConditions,
    version: '1.17',
    distributionInfo: {
      type: 'ocp',
      ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5'],
        desiredVersion: '1.2.3',
        channel: 'stable-1.2',
        upgradeFailed: false,
        versionAvailableUpdates: [
          { version: '1.2.4', image: '1.2.4' },
          { version: '1.2.5', image: '1.2.5' },
        ],
        desired: {
          channels: ['stable-1.2', 'stable-1.3'],
          version: '1.2.3',
          image: 'abc',
        },
      },
    },
  },
}
const mockManagedClusterInfo4: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: 'managed-cluster-4-upgrading', namespace: 'managed-cluster-4-upgrading' },
  status: {
    conditions: readyManagedClusterConditions,
    version: '1.17',
    distributionInfo: {
      type: 'ocp',
      ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5'],
        desiredVersion: '1.2.4',
        upgradeFailed: false,
        versionAvailableUpdates: [
          { version: '1.2.4', image: '1.2.4' },
          { version: '1.2.5', image: '1.2.5' },
        ],
      },
    },
  },
}
const mockManagedClusterInfo5: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: {
    name: 'managed-cluster-5-upgrade-available',
    namespace: 'managed-cluster-5-upgrade-available',
  },
  status: {
    conditions: readyManagedClusterConditions,
    version: '1.17',
    distributionInfo: {
      type: 'ocp',
      ocp: {
        version: '1.2.3',
        availableUpdates: ['1.2.4', '1.2.5', '1.2.6'],
        desiredVersion: '1.2.3',
        upgradeFailed: false,
        channel: 'stable-1.2',
        versionAvailableUpdates: [
          { version: '1.2.4', image: '1.2.4' },
          { version: '1.2.5', image: '1.2.5' },
        ],
        desired: {
          channels: ['stable-1.2', 'stable-1.3'],
          version: '1.2.3',
          image: 'abc',
        },
      },
    },
    nodeList: [
      {
        name: 'ip-10-0-134-240.ec2.internal',
        labels: {
          'beta.kubernetes.io/instance-type': 'm5.xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-west-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 'm5.xlarge',
        },
        conditions: [{ status: 'True', type: 'Ready' }],
      },
      {
        name: 'ip-10-0-130-30.ec2.internal',
        labels: {
          'beta.kubernetes.io/instance-type': 'm5.xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-east-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
          'node-role.kubernetes.io/master': '',
          'node.kubernetes.io/instance-type': 'm5.xlarge',
        },
        capacity: { cpu: '4', memory: '15944104Ki' },
        conditions: [{ status: 'Unknown', type: 'Ready' }],
      },
      {
        name: 'ip-10-0-151-254.ec2.internal',
        labels: {
          'beta.kubernetes.io/instance-type': 'm5.xlarge',
          'failure-domain.beta.kubernetes.io/region': 'us-south-1',
          'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
          'node-role.kubernetes.io/master': '',
          'node.kubernetes.io/instance-type': 'm5.xlarge',
        },
        capacity: { cpu: '4', memory: '8194000Pi' },
        conditions: [{ status: 'False', type: 'Ready' }],
      },
    ],
  },
}
export const mockManagedClusterInfo6: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: 'local-cluster', namespace: 'local-cluster' },
}
export const mockManagedClusterInfo7: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: 'hypershift-cluster', namespace: 'hypershift-cluster' },
}
export const mockManagedClusterInfo8: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: 'regional-cluster', namespace: 'regional-cluster' },
}
export const mockManagedClusterInfos = [
  mockManagedClusterInfo0,
  mockManagedClusterInfo1,
  mockManagedClusterInfo2,
  mockManagedClusterInfo3,
  mockManagedClusterInfo4,
  mockManagedClusterInfo5,
]

export const mockClusterDeployment0: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    name: 'managed-cluster-0-clusterset',
    namespace: 'managed-cluster-0-clusterset',
    labels: { 'hive.openshift.io/cluster-platform': 'aws' },
  },
}
// ClusterDeployment without a ManagedCluster
const mockClusterDeployment6: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    name: 'managed-cluster-6-no-managed-cluster',
    namespace: 'managed-cluster-6-no-managed-cluster',
    labels: { 'hive.openshift.io/cluster-platform': 'aws' },
  },
  spec: {
    clusterName: 'managed-cluster-6-no-managed-cluster',
    installed: true,
    provisioning: {
      imageSetRef: { name: '' },
      installConfigSecretRef: { name: '' },
      sshPrivateKeySecretRef: { name: '' },
    },
    pullSecretRef: { name: '' },
  },
}
export const mockClusterDeployments = [mockClusterDeployment0, mockClusterDeployment6]

const mockCertificateSigningRequest0: CertificateSigningRequest = {
  apiVersion: CertificateSigningRequestApiVersion,
  kind: CertificateSigningRequestKind,
  metadata: { name: 'managed-cluster-0-clusterset', namespace: 'managed-cluster-0-clusterset' },
}
export const mockCertificateSigningRequests = [mockCertificateSigningRequest0]

const mockHostedCluster0: HostedClusterK8sResource = {
  apiVersion: HostedClusterApiVersion,
  kind: HostedClusterKind,
  metadata: {
    name: 'hypershift-cluster',
    namespace: 'hypershift-cluster',
  },
  spec: {
    dns: {
      baseDomain: 'dev06.red-chesterfield.com',
    },
    release: {
      image: 'randomimage',
    },
    services: [],
    platform: {},
    pullSecret: { name: 'psecret' },
    sshKey: { name: 'thekey' },
  },
}

const mockHostedCluster1: HostedClusterK8sResource = {
  apiVersion: HostedClusterApiVersion,
  kind: HostedClusterKind,
  metadata: {
    name: 'hypershift-cluster2',
    namespace: 'hypershift-cluster2',
  },
  spec: {
    dns: {
      baseDomain: 'dev07.red-chesterfield.com',
    },
    release: {
      image: 'randomimage',
    },
    services: [],
    platform: {},
    pullSecret: { name: 'psecret' },
    sshKey: { name: 'thekey' },
  },
}

export const mockManagedClusterAddon: ManagedClusterAddOn = {
  apiVersion: ManagedClusterAddOnApiVersion,
  kind: ManagedClusterAddOnKind,
  metadata: {
    name: 'application-manager',
    namespace: 'managed-cluster-1',
  },
  spec: {
    installNamespace: 'open-cluster-management-agent-addon',
  },
  status: {
    conditions: [
      {
        lastTransitionTime: undefined,
        message: 'application-manager add-on is available.',
        reason: 'ManagedClusterAddOnLeaseUpdated',
        status: 'True',
        type: 'Available',
      },
    ],
    addOnMeta: {
      displayName: '',
      description: '',
    },
    addOnConfiguration: {
      crdName: '',
      crName: '',
    },
  },
}

export const mockClusterManagementAddon: ClusterManagementAddOn = {
  apiVersion: ClusterManagementAddOnApiVersion,
  kind: ClusterManagementAddOnKind,
  metadata: {
    name: 'application-manager',
  },
  spec: {
    addOnMeta: {
      displayName: 'Application Manager',
      description: 'Synchronizes application on the managed clusters from the hub',
    },
    addOnConfiguration: {
      crdName: '',
      crName: '',
    },
  },
}

export const mockHostedClusters: HostedClusterK8sResource[] = [mockHostedCluster0, mockHostedCluster1]
