/* Copyright Contributors to the Open Cluster Management project */

import { ClusterDeployment, ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../cluster-deployment'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../managed-cluster'
import { ManagedClusterInfo, ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../managed-cluster-info'
import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../cluster-curator'
import {
  ClusterStatus,
  getClusterStatus,
  getDistributionInfo,
  getHCUpgradeStatus,
  getIsHostedCluster,
} from './get-cluster'
import { HostedClusterApiVersion, HostedClusterKind } from '..'
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { cloneDeep } from 'lodash'
export const clusterName = 'test-cluster'
const mockClusterCurator: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    upgrade: {
      desiredUpdate: '1.2.5',
    },
  },
}
const conditionCuratorJobRunning = {
  reason: 'Job_has_finished',
  status: 'False',
  type: 'clustercurator-job',
}
const conditionCuratorUpdating = {
  reason: 'Job_has_finished',
  status: 'False',
  type: 'upgrade-cluster',
}
const conditionCuratorMonitoring = {
  reason: 'Job_has_finished',
  status: 'False',
  type: 'monitor-upgrade',
  message: 'Upgrade status Working towards 4.6.13: 11% complete',
}
const conditionCuratorFailedUpdate = {
  lastTransitionTime: new Date('2021-01-04T18:23:37Z'),
  message: 'curator-job-mvjq6 DesiredCuration: upgrade failed',
  reason: 'Job_failed',
  status: 'True',
  type: 'clustercurator-job',
}

const mockClusterCuratorUpdating: ClusterCurator = {
  ...mockClusterCurator,
  spec: {
    desiredCuration: 'upgrade',
    upgrade: {
      desiredUpdate: '1.2.5',
    },
  },
  status: {
    conditions: [conditionCuratorJobRunning, conditionCuratorUpdating],
  },
}
const mockClusterCuratorMonitoring: ClusterCurator = {
  ...mockClusterCurator,
  spec: {
    desiredCuration: 'upgrade',
    upgrade: {
      desiredUpdate: '1.2.5',
    },
  },
  status: {
    conditions: [conditionCuratorJobRunning, conditionCuratorMonitoring],
  },
}

const mockClusterCuratorFailedUpdateJob: ClusterCurator = {
  ...mockClusterCurator,
  spec: {
    desiredCuration: 'upgrade',
    upgrade: {
      desiredUpdate: '1.2.5',
      posthook: [
        {
          name: 'job_1',
          type: 'Job',
        },
      ],
    },
  },
  status: {
    conditions: [conditionCuratorFailedUpdate, conditionCuratorJobRunning, conditionCuratorMonitoring],
  },
}

const mockClusterCuratorSelectingChannel: ClusterCurator = {
  ...mockClusterCurator,
  spec: {
    desiredCuration: 'upgrade',
    upgrade: {
      channel: 'stable-1.3',
    },
  },
  status: {
    conditions: [conditionCuratorJobRunning, conditionCuratorUpdating],
  },
}
const mockClusterCuratorRunningOther: ClusterCurator = {
  ...mockClusterCurator,
  spec: {
    desiredCuration: 'scale',
  },
  status: {
    conditions: [conditionCuratorJobRunning],
  },
}

const mockHostedCluster: HostedClusterK8sResource = {
  apiVersion: HostedClusterApiVersion,
  kind: HostedClusterKind,
  metadata: {
    name: 'feng-hypershift-import',
    namespace: 'clusters',
    annotations: {
      'cluster.open-cluster-management.io/hypershiftdeployment': 'clusters/feng-hypershift-import',
      'cluster.open-cluster-management.io/managedcluster-name': 'feng-hypershift-import',
    },
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
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-12-17T22:14:15Z',
        message: 'The hosted control plane is available',
        observedGeneration: 4,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'Available',
      },
    ],
  },
}

const mockHostedClusterManagedCluster: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    annotations: {
      'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
      'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
    },
    name: 'feng-hypershift-import',
  },
  status: {
    allocatable: {
      cpu: '1500ms',
      memory: '6692664Ki',
    },
    capacity: {
      cpu: '2',
      memory: '7843640Ki',
    },
    clusterClaims: [{ name: 'hostedcluster.hypershift.openshift.io', value: 'true' }],
    conditions: [
      {
        message: 'Accepted by hub cluster admin',
        reason: 'HubClusterAdminAccepted',
        status: 'True',
        type: 'HubAcceptedManagedCluster',
      },
      {
        message: 'Managed cluster joined',
        reason: 'ManagedClusterJoined',
        status: 'True',
        type: 'ManagedClusterJoined',
      },
      {
        status: 'Unknown',
        type: 'ManagedClusterConditionAvailable',
      },
    ],
    version: { kubernetes: 'v1.24.6+5658434' },
  },
}

const mockManagedClusterInfoHasAvailableUpdates: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: clusterName, namespace: clusterName },
  status: {
    distributionInfo: {
      ocp: {
        version: '1.2.3',
        availableUpdates: [], //deprecated
        versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
        desiredVersion: '', //deprecated
        upgradeFailed: false,
        channel: 'stable-1.2',
        desired: {
          channels: ['stable-1.3', 'stable-1.2'],
          version: '1.2.3',
          image: 'abc',
        },
      },
      type: 'OCP',
    },
  },
}
const mockManagedClusterInfoFailedInstall: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: clusterName, namespace: clusterName },
  status: {
    distributionInfo: {
      ocp: {
        version: '1.2.3',
        availableUpdates: [], //deprecated
        versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
        desiredVersion: '', //deprecated
        upgradeFailed: true,
        channel: 'stable-1.2',
        desired: {
          channels: ['stable-1.3', 'stable-1.2'],
          version: '1.2.3',
          image: 'abc',
        },
      },
      type: 'OCP',
    },
  },
}
const mockManagedClusterInfoUpdating: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: clusterName, namespace: clusterName },
  status: {
    distributionInfo: {
      ocp: {
        version: '1.2.3',
        availableUpdates: [], //deprecated
        versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
        desiredVersion: '', //deprecated
        upgradeFailed: false,
        channel: 'stable-1.2',
        desired: {
          channels: ['stable-1.3', 'stable-1.2'],
          version: '1.2.4',
          image: 'abc',
        },
      },
      type: 'OCP',
    },
  },
}
const mockManagedClusterInfoFailedUpdating: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: clusterName, namespace: clusterName },
  status: {
    distributionInfo: {
      ocp: {
        version: '1.2.3',
        availableUpdates: [], //deprecated
        versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
        desiredVersion: '', //deprecated
        upgradeFailed: true,
        channel: 'stable-1.2',
        desired: {
          channels: ['stable-1.3', 'stable-1.2'],
          version: '1.2.4',
          image: 'abc',
        },
      },
      type: 'OCP',
    },
  },
}

const mockManagedClusterInfoFailedUpdatingPosthookNotRun: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: clusterName, namespace: clusterName },
  status: {
    distributionInfo: {
      ocp: {
        version: '1.2.4',
        availableUpdates: [], //deprecated
        versionAvailableUpdates: [],
        desiredVersion: '', //deprecated
        upgradeFailed: true,
        channel: 'stable-1.2',
        desired: {
          channels: ['stable-1.3', 'stable-1.2'],
          version: '1.2.4',
          image: 'abc',
        },
      },
      type: 'OCP',
    },
  },
}

const mockManagedClusterInfo311: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: clusterName, namespace: clusterName },
  status: {
    distributionInfo: {
      ocp: {
        version: '3',
        availableUpdates: [], //deprecated
        versionAvailableUpdates: [],
        desiredVersion: '', //deprecated
        upgradeFailed: false,
        desired: {
          version: '',
          image: '',
        },
      },
      type: 'OCP',
    },
  },
}

const mockManagedCluster: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: clusterName },
  spec: { hubAcceptsClient: true },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    version: { kubernetes: '' },
    clusterClaims: [],
    conditions: [],
  },
}

const mockManagedClusterOCM: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: clusterName },
  spec: { hubAcceptsClient: true },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    version: { kubernetes: '' },
    clusterClaims: [{ name: 'product.open-cluster-management.io', value: 'OpenShiftDedicated' }],
    conditions: [],
  },
}

const mockManagedClusterImporting: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: clusterName },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    version: { kubernetes: '' },
    clusterClaims: [],
    conditions: [
      {
        type: 'HubAcceptedManagedCluster',
        status: 'True',
      },
      {
        type: 'ManagedClusterImportSucceeded',
        status: 'False',
        reason: 'ManagedClusterImporting',
        message: 'Importing resources are applied, wait for resources be available',
      },
    ],
  },
}

const mockManagedClusterImportfailed: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: { name: clusterName },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    version: { kubernetes: '' },
    clusterClaims: [],
    conditions: [
      {
        type: 'HubAcceptedManagedCluster',
        status: 'True',
      },
      {
        type: 'ManagedClusterImportSucceeded',
        status: 'False',
        reason: 'ManagedClusterImportFailed',
        message:
          'Try to import managed cluster, retry times: 15/15, error: [the server could not find the requested resource (post customresourcedefinitions.apiextensions.k8s.io)',
      },
    ],
  },
}

const mockClusterDeployment: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    labels: {
      cloud: 'AWS',
      'hive.openshift.io/cluster-platform': 'aws',
      'hive.openshift.io/cluster-region': 'us-east-1',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    baseDomain: 'dev02.test-chesterfield.com',
    clusterName: clusterName,
    installed: false,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-cluster-aws-creds',
        },
        region: 'us-east-1',
      },
    },
    provisioning: {
      imageSetRef: {
        name: 'img4.5.15-x86-64',
      },
      installConfigSecretRef: {
        name: 'test-cluster-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-cluster-ssh-private-key',
      },
    },
    pullSecretRef: {
      name: 'test-cluster-pull-secret',
    },
  },
  status: {
    cliImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb',
    conditions: [],
    powerState: 'Running',
    installerImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
    provisionRef: {
      name: 'test-cluster-31-26h5q',
    },
  },
}

const mockClusterDeploymentClusterPoolRef: Required<ClusterDeployment>['spec']['clusterPoolRef'] = {
  poolName: 'example-pool',
  namespace: 'example-pool',
}

const mockClusterDeploymentInstalled: Required<ClusterDeployment> = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    labels: {
      cloud: 'AWS',
      'hive.openshift.io/cluster-platform': 'aws',
      'hive.openshift.io/cluster-region': 'us-east-1',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    baseDomain: 'dev02.test-chesterfield.com',
    clusterName: clusterName,
    clusterPoolRef: mockClusterDeploymentClusterPoolRef,
    installed: true,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-cluster-aws-creds',
        },
        region: 'us-east-1',
      },
    },
    provisioning: {
      imageSetRef: {
        name: 'img4.5.15-x86-64',
      },
      installConfigSecretRef: {
        name: 'test-cluster-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-cluster-ssh-private-key',
      },
    },
    pullSecretRef: {
      name: 'test-cluster-pull-secret',
    },
  },
  status: {
    cliImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb',
    conditions: [],
    powerState: 'Running',
    installerImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
    provisionRef: {
      name: 'test-cluster-31-26h5q',
    },
  },
}

const mockClusterDeploymentHibernating: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    labels: {
      cloud: 'AWS',
      'hive.openshift.io/cluster-platform': 'aws',
      'hive.openshift.io/cluster-region': 'us-east-1',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    baseDomain: 'dev02.test-chesterfield.com',
    clusterName: clusterName,
    installed: true,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-cluster-aws-creds',
        },
        region: 'us-east-1',
      },
    },
    provisioning: {
      imageSetRef: {
        name: 'img4.5.15-x86-64',
      },
      installConfigSecretRef: {
        name: 'test-cluster-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-cluster-ssh-private-key',
      },
    },
    pullSecretRef: {
      name: 'test-cluster-pull-secret',
    },
  },
  status: {
    cliImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb',
    conditions: [],
    powerState: 'Hibernating',
    installerImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
    provisionRef: {
      name: 'test-cluster-31-26h5q',
    },
  },
}

const mockClusterDeploymentStarting: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    labels: {
      cloud: 'AWS',
      'hive.openshift.io/cluster-platform': 'aws',
      'hive.openshift.io/cluster-region': 'us-east-1',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    baseDomain: 'dev02.test-chesterfield.com',
    clusterName: clusterName,
    installed: true,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-cluster-aws-creds',
        },
        region: 'us-east-1',
      },
    },
    provisioning: {
      imageSetRef: {
        name: 'img4.5.15-x86-64',
      },
      installConfigSecretRef: {
        name: 'test-cluster-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-cluster-ssh-private-key',
      },
    },
    pullSecretRef: {
      name: 'test-cluster-pull-secret',
    },
    powerState: 'Running',
  },
  status: {
    cliImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb',
    conditions: [
      {
        message: 'Waiting for cluster machines to start. Some machines are not yet running: i-somemachine (step 1/4)',
        reason: 'WaitingForMachines',
        status: 'False',
        type: 'Ready',
      },
    ],
    powerState: 'WaitingForMachines',
    installerImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
    provisionRef: {
      name: 'test-cluster-31-26h5q',
    },
  },
}

const mockClusterDeploymentStopping: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    labels: {
      cloud: 'AWS',
      'hive.openshift.io/cluster-platform': 'aws',
      'hive.openshift.io/cluster-region': 'us-east-1',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    baseDomain: 'dev02.test-chesterfield.com',
    clusterName: clusterName,
    installed: true,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-cluster-aws-creds',
        },
        region: 'us-east-1',
      },
    },
    provisioning: {
      imageSetRef: {
        name: 'img4.5.15-x86-64',
      },
      installConfigSecretRef: {
        name: 'test-cluster-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-cluster-ssh-private-key',
      },
    },
    pullSecretRef: {
      name: 'test-cluster-pull-secret',
    },
    powerState: 'Hibernating',
  },
  status: {
    cliImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb',
    conditions: [
      {
        message: 'Stopping cluster machines. Some machines have not yet stopped: i-somemachine',
        reason: 'WaitingForMachinesToStop',
        status: 'False',
        type: 'Hibernating',
      },
    ],
    powerState: 'WaitingForMachinesToStop',
    installerImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
    provisionRef: {
      name: 'test-cluster-31-26h5q',
    },
  },
}

const mockClusterDeploymentUnknown: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    labels: {
      cloud: 'AWS',
      'hive.openshift.io/cluster-platform': 'aws',
      'hive.openshift.io/cluster-region': 'us-east-1',
      region: 'us-east-1',
      vendor: 'OpenShift',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    baseDomain: 'dev02.test-chesterfield.com',
    clusterName: clusterName,
    installed: true,
    platform: {
      aws: {
        credentialsSecretRef: {
          name: 'test-cluster-aws-creds',
        },
        region: 'us-east-1',
      },
    },
    provisioning: {
      imageSetRef: {
        name: 'img4.5.15-x86-64',
      },
      installConfigSecretRef: {
        name: 'test-cluster-install-config',
      },
      sshPrivateKeySecretRef: {
        name: 'test-cluster-ssh-private-key',
      },
    },
    pullSecretRef: {
      name: 'test-cluster-pull-secret',
    },
  },
  status: {
    cliImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:8b8e08e498c61ccec5c446d6ab50c96792799c992c78cfce7bbb8481f04a64cb',
    conditions: [],
    powerState: 'Unreachable',
    installerImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
    provisionRef: {
      name: 'test-cluster-31-26h5q',
    },
  },
}

describe('getDistributionInfo', () => {
  it('should have correct available updates and available channels', () => {
    const d = getDistributionInfo(
      mockManagedClusterInfoHasAvailableUpdates,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCurator
    )
    expect(d?.upgradeInfo.availableUpdates).toEqual(['1.2.4'])
    expect(d?.upgradeInfo.availableChannels).toEqual(['stable-1.3', 'stable-1.2'])
    expect(d?.upgradeInfo.isUpgrading).toBeFalsy()
    expect(d?.upgradeInfo.isSelectingChannel).toBeFalsy()
    expect(d?.upgradeInfo.desiredChannel).toEqual('stable-1.2')
    expect(d?.upgradeInfo.desiredVersion).toEqual('1.2.3')
  })
  it('should get percentage information from curator when updating', () => {
    const d1 = getDistributionInfo(
      mockManagedClusterInfoUpdating,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorMonitoring
    )
    expect(d1?.upgradeInfo.isReadySelectChannels).toBeFalsy()
    expect(d1?.upgradeInfo.isReadyUpdates).toBeFalsy()
    expect(d1?.upgradeInfo.upgradePercentage).toEqual('11%')
    expect(d1?.upgradeInfo.isUpgrading).toBeTruthy()
  })
  it('should return false for ready for update if curator is running, or if currently updating, or if managed by ocm', () => {
    const d1 = getDistributionInfo(
      mockManagedClusterInfoUpdating,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorMonitoring
    )
    expect(d1?.upgradeInfo.isUpgrading).toBeTruthy()
    expect(d1?.upgradeInfo.isReadySelectChannels).toBeFalsy()
    expect(d1?.upgradeInfo.isReadyUpdates).toBeFalsy()
    const d2 = getDistributionInfo(
      mockManagedClusterInfoHasAvailableUpdates,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorUpdating
    )
    expect(d2?.upgradeInfo.isUpgrading).toBeTruthy()
    expect(d2?.upgradeInfo.isReadySelectChannels).toBeFalsy()
    expect(d2?.upgradeInfo.isReadyUpdates).toBeFalsy()
    const d3 = getDistributionInfo(
      mockManagedClusterInfoHasAvailableUpdates,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorRunningOther
    )
    expect(d3?.upgradeInfo.isUpgrading).toBeFalsy()
    expect(d3?.upgradeInfo.isReadySelectChannels).toBeFalsy()
    expect(d3?.upgradeInfo.isReadyUpdates).toBeFalsy()
  })
  it('should return false for ready to update if the cluster is managed by ocm', () => {
    const d1 = getDistributionInfo(
      mockManagedClusterInfoHasAvailableUpdates,
      mockManagedClusterOCM,
      mockClusterDeployment,
      mockClusterCurator
    )
    expect(d1?.upgradeInfo.isUpgrading).toBeFalsy()
    expect(d1?.upgradeInfo.isReadySelectChannels).toBeFalsy()
    expect(d1?.upgradeInfo.isReadyUpdates).toBeFalsy()
  })
  it('should return update failed only if update is failed', () => {
    const d1 = getDistributionInfo(
      mockManagedClusterInfoFailedUpdating,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorMonitoring
    )
    expect(d1?.upgradeInfo.isUpgrading).toBeTruthy()
    expect(d1?.upgradeInfo.upgradeFailed).toBeTruthy()
    const d2 = getDistributionInfo(
      mockManagedClusterInfoFailedInstall,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorMonitoring
    )
    expect(d2?.upgradeInfo.isUpgrading).toBeTruthy()
    expect(d2?.upgradeInfo.upgradeFailed).toBeFalsy()
  })
  it('should return updating correctly for ocm managedclusters', () => {
    const d2 = getDistributionInfo(
      mockManagedClusterInfoUpdating,
      mockManagedClusterOCM,
      mockClusterDeployment,
      mockClusterCurator
    )
    expect(d2?.upgradeInfo.currentVersion).toEqual('1.2.3')
    expect(d2?.upgradeInfo.desiredVersion).toEqual('1.2.4')
    expect(d2?.upgradeInfo.isUpgrading).toBeTruthy()
  })
  it('should return channel selecting if curator is running & having a desired channel', () => {
    const d1 = getDistributionInfo(
      mockManagedClusterInfoHasAvailableUpdates,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorSelectingChannel
    )
    expect(d1?.upgradeInfo.isSelectingChannel).toBeTruthy()
    expect(d1?.upgradeInfo.isUpgrading).toBeFalsy()
    expect(d1?.upgradeInfo.currentChannel).toEqual('stable-1.2')
    expect(d1?.upgradeInfo.desiredChannel).toEqual('stable-1.3')
  })
  it('should not return upgrading for 3.11 clusters', () => {
    const d1 = getDistributionInfo(
      mockManagedClusterInfo311,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorSelectingChannel
    )
    expect(d1?.upgradeInfo.isUpgrading).toBeFalsy()
  })
  it('should return posthookDidNotRun when update failure occurs and there is no status from posthook', () => {
    const d1 = getDistributionInfo(
      mockManagedClusterInfoFailedUpdatingPosthookNotRun,
      mockManagedCluster,
      mockClusterDeployment,
      mockClusterCuratorFailedUpdateJob
    )
    expect(d1?.upgradeInfo.posthookDidNotRun).toBeTruthy()
  })
})

describe('getClusterStatus', () => {
  it('should return running for an unclaimed running cluster in a pool', () => {
    const status = getClusterStatus(
      mockClusterDeploymentInstalled,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      undefined /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.running)
    expect(status.statusMessage).toBeUndefined()
  })
  it('should return detached for a claimed running cluster', () => {
    const mockClusterDeploymentClaimed = cloneDeep(mockClusterDeploymentInstalled)
    const mockClusterPoolRefClaimed = cloneDeep(mockClusterDeploymentClusterPoolRef)
    mockClusterPoolRefClaimed.claimName = 'claim'
    mockClusterDeploymentClaimed.spec.clusterPoolRef = mockClusterPoolRefClaimed

    const status = getClusterStatus(
      mockClusterDeploymentClaimed,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      undefined /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.detached)
    expect(status.statusMessage).toBeUndefined()
  })
  it('should return hibernating for a stopped cluster', () => {
    const status = getClusterStatus(
      mockClusterDeploymentHibernating,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      undefined /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.hibernating)
    expect(status.statusMessage).toBeUndefined()
  })
  it('should return resuming for a starting cluster', () => {
    const status = getClusterStatus(
      mockClusterDeploymentStarting,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      undefined /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.resuming)
    expect(status.statusMessage).toBe(
      'Waiting for cluster machines to start. Some machines are not yet running: i-somemachine (step 1/4)'
    )
  })
  it('should return stopping for a cluster that is shutting down', () => {
    const status = getClusterStatus(
      mockClusterDeploymentStopping,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      undefined /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.stopping)
    expect(status.statusMessage).toBe('Stopping cluster machines. Some machines have not yet stopped: i-somemachine')
  })
  it('should return unknown for a cluster in a pool that has an unrecognized desired power state', () => {
    const status = getClusterStatus(
      mockClusterDeploymentUnknown,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      undefined /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.unknown)
    expect(status.statusMessage).toBeUndefined()
  })
  it('should return unknown for a hosted cluster with corresponding managed cluster', () => {
    const status = getClusterStatus(
      undefined /* clusterDeployment */,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      mockHostedClusterManagedCluster /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      mockHostedCluster /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.unknown)
    expect(status.statusMessage).toBeUndefined()
  })
  it('should return importing for managed cluster that is being automatically imported', () => {
    const status = getClusterStatus(
      undefined /* clusterDeployment */,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      mockManagedClusterImporting /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.importing)
    expect(status.statusMessage).toBe('Importing resources are applied, wait for resources be available')
  })
  it('should return importfailed for managed cluster that has failed being automatically imported', () => {
    const status = getClusterStatus(
      undefined /* clusterDeployment */,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      mockManagedClusterImportfailed /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.importfailed)
    expect(status.statusMessage).toBe(
      'Try to import managed cluster, retry times: 15/15, error: [the server could not find the requested resource (post customresourcedefinitions.apiextensions.k8s.io)'
    )
  })
})

describe('getIsHostedCluster', () => {
  it('getIsHostedCluster true', () => {
    const mc: ManagedCluster = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {
        annotations: {
          'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
        },
      },
    }

    expect(getIsHostedCluster(mc)).toEqual(true)
  })

  it('getIsHostedCluster no annotation', () => {
    const mc: ManagedCluster = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {},
    }

    expect(getIsHostedCluster(mc)).toEqual(false)
  })

  it('getIsHostedCluster no kube deploy mode', () => {
    const mc: ManagedCluster = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {
        annotations: {
          'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
        },
      },
    }

    expect(getIsHostedCluster(mc)).toEqual(false)
  })

  it('getIsHostedCluster kube deploy mode not hosted', () => {
    const mc: ManagedCluster = {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {
        annotations: {
          'import.open-cluster-management.io/klusterlet-deploy-mode': 'Standalone',
        },
      },
    }

    expect(getIsHostedCluster(mc)).toEqual(false)
  })

  it('getIsHostedCluster no mc', () => {
    expect(getIsHostedCluster(undefined)).toEqual(false)
  })
})

describe('getHCUpgradeStatus', () => {
  it('getIsHostedCluster true', () => {
    const hc: HostedClusterK8sResource = {
      apiVersion: HostedClusterApiVersion,
      kind: HostedClusterKind,
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
      status: {
        conditions: [
          {
            lastTransitionTime: '2022-12-17T22:14:15Z',
            message: 'The hosted control plane is available',
            observedGeneration: 4,
            reason: 'HostedClusterAsExpected',
            status: 'True',
            type: 'Available',
          },
        ],
        version: {
          desired: {
            image: 'quay.io/openshift-release-dev/ocp-release:4.11.22-x86_64',
          },
          history: [
            {
              completionTime: '',
              image: 'quay.io/openshift-release-dev/ocp-release:4.11.22-x86_64',
              startedTime: '2022-10-24T20:34:08Z',
              state: 'Partial',
              verified: false,
              version: '',
            },
          ],
          observedGeneration: 2,
        },
      },
    }

    expect(getHCUpgradeStatus(hc)).toEqual(true)
  })

  it('getIsHostedCluster false', () => {
    const hc: HostedClusterK8sResource = {
      apiVersion: HostedClusterApiVersion,
      kind: HostedClusterKind,
      spec: {
        dns: {
          baseDomain: 'dev06.red-chesterfield.com',
        },
        release: {
          image: 'quay.io/openshift-release-dev/ocp-release:4.11.22-x86_64',
        },
        services: [],
        platform: {},
        pullSecret: { name: 'psecret' },
        sshKey: { name: 'thekey' },
      },
      status: {
        conditions: [
          {
            lastTransitionTime: '2022-12-17T22:14:15Z',
            message: 'The hosted control plane is available',
            observedGeneration: 4,
            reason: 'HostedClusterAsExpected',
            status: 'True',
            type: 'Available',
          },
        ],
        version: {
          desired: {
            image: 'quay.io/openshift-release-dev/ocp-release:4.11.22-x86_64',
          },
          history: [
            {
              completionTime: '',
              image: 'quay.io/openshift-release-dev/ocp-release:4.11.22-x86_64',
              startedTime: '2022-10-24T20:34:08Z',
              state: 'Complete',
              verified: false,
              version: '',
            },
          ],
          observedGeneration: 2,
        },
      },
    }

    expect(getHCUpgradeStatus(hc)).toEqual(false)
  })
})
