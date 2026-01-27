/* Copyright Contributors to the Open Cluster Management project */

import { AgentClusterInstallK8sResource, HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../cluster-curator'
import { ClusterDeployment, ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../cluster-deployment'
import {
  ClusterStatus,
  getClusterStatus,
  getDistributionInfo,
  getHCUpgradePercent,
  getHCUpgradeStatus,
  getCCUpgradeStatus,
  getCCUpgradePercent,
  getIsHostedCluster,
  getProvider,
} from './get-cluster'
import { HostedClusterApiVersion, HostedClusterKind } from '../'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../managed-cluster'
import { ManagedClusterInfo, ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../managed-cluster-info'

import { AgentClusterInstallKind } from '../agent-cluster-install'
import { Provider } from '../../ui-components'
import { cloneDeep } from 'lodash'

export const clusterName = 'test-cluster'

// Helper functions for creating test resources
const createManagedClusterWithPlatformClaim = (claimValue: string): ManagedCluster =>
  ({
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: { name: 'test-cluster' },
    spec: { hubAcceptsClient: true },
    status: {
      clusterClaims: [{ name: 'platform.open-cluster-management.io', value: claimValue }],
    } as any,
  }) as ManagedCluster

const createManagedClusterWithProductClaim = (productValue: string, platformValue = 'AWS'): ManagedCluster =>
  ({
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: { name: 'test-cluster' },
    spec: { hubAcceptsClient: true },
    status: {
      clusterClaims: [
        { name: 'product.open-cluster-management.io', value: productValue },
        { name: 'platform.open-cluster-management.io', value: platformValue },
      ],
    } as any,
  }) as ManagedCluster

const createManagedClusterWithMultipleClaims = (claims: Array<{ name: string; value: string }>): ManagedCluster =>
  ({
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: { name: 'test-cluster' },
    spec: { hubAcceptsClient: true },
    status: {
      clusterClaims: claims,
    } as any,
  }) as ManagedCluster

const createManagedClusterInfoWithCloudLabel = (cloudValue: string): ManagedClusterInfo =>
  ({
    apiVersion: 'internal.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterInfo',
    metadata: {
      name: 'test-cluster',
      namespace: 'test-cluster',
      labels: {
        cloud: cloudValue,
      },
    },
    spec: {},
  }) as ManagedClusterInfo

const createBasicManagedCluster = (): ManagedCluster =>
  ({
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: { name: 'test-cluster' },
    spec: { hubAcceptsClient: true },
  }) as ManagedCluster

const createBasicManagedClusterInfo = (): ManagedClusterInfo =>
  ({
    apiVersion: 'internal.open-cluster-management.io/v1beta1',
    kind: 'ManagedClusterInfo',
    metadata: { name: 'test-cluster', namespace: 'test-cluster' },
    spec: {},
  }) as ManagedClusterInfo

const createClusterDeploymentWithInstallRef = (): ClusterDeployment =>
  ({
    apiVersion: 'hive.openshift.io/v1',
    kind: 'ClusterDeployment',
    metadata: { name: 'test-cluster', namespace: 'test-cluster' },
    spec: {
      clusterName: 'test-cluster',
      clusterInstallRef: {
        group: 'extensions.hive.openshift.io',
        version: 'v1beta1',
        kind: AgentClusterInstallKind,
        name: 'test-cluster',
      },
    },
  }) as ClusterDeployment

const createAgentClusterInstallWithPlatformType = (platformType: string): AgentClusterInstallK8sResource =>
  ({
    apiVersion: 'extensions.hive.openshift.io/v1beta1',
    kind: AgentClusterInstallKind,
    metadata: { name: 'test-cluster', namespace: 'test-cluster' },
    spec: {
      clusterDeploymentRef: { name: 'test-cluster' },
      imageSetRef: { name: 'test-image-set' },
      platformType,
      networking: { clusterNetwork: [], serviceNetwork: [] },
    },
  }) as unknown as AgentClusterInstallK8sResource

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

const mockClusterDeploymentUnreachable: ClusterDeployment = {
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
    conditions: [{ type: 'Unreachable', status: 'True', reason: 'Unreachable', message: 'Cluster is unreachable' }],
    powerState: 'Unreachable',
    installerImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
    provisionRef: {
      name: 'test-cluster-31-26h5q',
    },
  },
}

const mockClusterCuratorPrehookFailed: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'feng-hyper-test24',
    namespace: 'clusters',
  },
  spec: {
    install: {
      jobMonitorTimeout: 5,
      posthook: [
        {
          extra_vars: {},
          name: 'Demo Job Template 2',
          type: 'Job',
        },
      ],
      prehook: [
        {
          extra_vars: {},
          name: 'Demo Job Template 2',
          type: 'Job',
        },
      ],
      towerAuthSecret: 'toweraccess',
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2023-10-18T17:31:55Z'),
        message:
          'curator-job-ghgkc DesiredCuration: install Failed - AnsibleJob clusters/prehookjob-q5qqn exited with an error',
        reason: 'Job_failed',
        status: 'True',
        type: 'clustercurator-job',
      },
      {
        lastTransitionTime: new Date('2023-10-18T17:31:55Z'),
        message: 'AnsibleJob clusters/prehookjob-q5qqn exited with an error',
        reason: 'Job_failed',
        status: 'True',
        type: 'prehook-ansiblejob',
      },
      {
        lastTransitionTime: new Date('2023-10-18T17:31:40Z'),
        message: 'prehookjob-q5qqn',
        reason: 'Job_has_finished',
        status: 'False',
        type: 'current-ansiblejob',
      },
    ],
  },
}

const mockClusterCuratorPosthookFailed: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'feng-hyper-test24',
    namespace: 'clusters',
  },
  spec: {
    install: {
      jobMonitorTimeout: 5,
      posthook: [
        {
          extra_vars: {},
          name: 'Demo Job Template 2',
          type: 'Job',
        },
      ],
      prehook: [
        {
          extra_vars: {},
          name: 'Demo Job Template 2',
          type: 'Job',
        },
      ],
      towerAuthSecret: 'toweraccess',
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2023-10-18T17:31:55Z'),
        message:
          'curator-job-ghgkc DesiredCuration: install Failed - AnsibleJob clusters/posthookjob-q5qqn exited with an error',
        reason: 'Job_failed',
        status: 'True',
        type: 'clustercurator-job',
      },
      {
        lastTransitionTime: new Date('2023-10-18T17:31:55Z'),
        message: 'AnsibleJob clusters/posthookjob-q5qqn exited with an error',
        reason: 'Job_failed',
        status: 'True',
        type: 'posthook-ansiblejob',
      },
      {
        lastTransitionTime: new Date('2023-10-18T17:31:40Z'),
        message: 'posthookjob-q5qqn',
        reason: 'Job_has_finished',
        status: 'False',
        type: 'current-ansiblejob',
      },
    ],
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
  it('should return unreachable for a cluster that that cannot be reached by hub', () => {
    const status = getClusterStatus(
      mockClusterDeploymentUnreachable,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      undefined /* managedCluster */,
      undefined /* clusterCurator */,
      undefined /* agentClusterInstall */,
      undefined /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.unreachable)
    expect(status.statusMessage).toBe('Cluster is unreachable')
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
  it('should return failed for clustercurator prehook job', () => {
    const status = getClusterStatus(
      undefined /* clusterDeployment */,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      mockHostedClusterManagedCluster /* managedCluster */,
      mockClusterCuratorPrehookFailed /* clusterCurator */,
      undefined /* agentClusterInstall */,
      mockHostedCluster /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.prehookfailed)
  })
  it('should return failed for clustercurator posthook job', () => {
    const status = getClusterStatus(
      undefined /* clusterDeployment */,
      undefined /* managedClusterInfo */,
      undefined /* certificateSigningRequests */,
      mockHostedClusterManagedCluster /* managedCluster */,
      mockClusterCuratorPosthookFailed /* clusterCurator */,
      undefined /* agentClusterInstall */,
      mockHostedCluster /* hostedCluster */
    )
    expect(status.status).toBe(ClusterStatus.posthookfailed)
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

describe('getHCUpgradePercent', () => {
  //Test getting upgrade % from ClusterVersionSucceeding and ClusterVersionProgressing
  //Test not upgrading
  it('getHCUpgradePercent not upgrading', () => {
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
          {
            lastTransitionTime: '2023-05-19T17:44:06Z',
            message: '',
            observedGeneration: 4,
            reason: 'FromClusterVersion',
            status: 'True',
            type: 'ClusterVersionSucceeding',
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

    expect(getHCUpgradePercent(hc)).toEqual('')
  })

  it('getHCUpgradePercent upgrading with message in ClusterVersionSucceeding', () => {
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
          {
            lastTransitionTime: '2023-05-19T17:44:06Z',
            message: 'Working towards 4.12.12: 484 of 573 done (84% complete)',
            observedGeneration: 4,
            reason: 'FromClusterVersion',
            status: 'True',
            type: 'ClusterVersionSucceeding',
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

    expect(getHCUpgradePercent(hc)).toEqual('(84% complete)')
  })
  it('getHCUpgradePercent upgrading with message in ClusterVersionSucceeding', () => {
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
          {
            lastTransitionTime: '2023-05-19T17:44:06Z',
            message: 'Working towards 4.12.12: 484 of 573 done (84% complete)',
            observedGeneration: 4,
            reason: 'FromClusterVersion',
            status: 'True',
            type: 'ClusterVersionProgressing',
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

    expect(getHCUpgradePercent(hc)).toEqual('(84% complete)')
  })
})

describe('getProvider', () => {
  describe('recognizes all known provider values', () => {
    it('should return Provider.aws for AWS platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('AWS')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.aws)
    })

    it('should return Provider.gcp for Google cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('google')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.gcp)
    })

    it('should return Provider.azure for Azure platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('AZURE')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.azure)
    })

    it('should return Provider.vmware for VMware cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('vmware')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.vmware)
    })

    it('should return Provider.openstack for OpenStack platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('OPENSTACK')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.openstack)
    })

    it('should return Provider.baremetal for BareMetal platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('BAREMETAL')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.baremetal)
    })

    it('should return Provider.ibm for IBM cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('ibm')
      const result = getProvider({ managedCluster: undefined, managedClusterInfo })
      expect(result).toBe(Provider.ibm)
    })

    it('should return Provider.other for OTHER platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('OTHER')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.other)
    })

    it('should return Provider.other for unknown platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('UNKNOWN_PLATFORM')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.other)
    })

    it('should return Provider.microshift for MicroShift product claim', () => {
      const managedCluster = createManagedClusterWithProductClaim('MicroShift', 'AWS')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.microshift)
    })

    it('should return Provider.aws for Amazon platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('AMAZON')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.aws)
    })

    it('should return Provider.aws for EKS cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('eks')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.aws)
    })

    it('should return Provider.gcp for GKE platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('GKE')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.gcp)
    })

    it('should return Provider.gcp for GCP cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('gcp')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.gcp)
    })

    it('should return Provider.gcp for GCE platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('GCE')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.gcp)
    })

    it('should return Provider.azure for AKS cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('aks')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.azure)
    })

    it('should return Provider.ibm for IKS platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('IKS')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.ibm)
    })

    it('should return Provider.ibmpower for IBMPOWERPLATFORM cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('ibmpowerplatform')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.ibmpower)
    })

    it('should return Provider.ibmz for IBMZPLATFORM platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('IBMZPLATFORM')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.ibmz)
    })

    it('should return Provider.vmware for VSPHERE cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('vsphere')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.vmware)
    })

    it('should return Provider.alibaba for ALIBABA platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('ALIBABA')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.alibaba)
    })

    it('should return Provider.alibaba for ALICLOUD cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('alicloud')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.alibaba)
    })

    it('should return Provider.alibaba for ALIBABACLOUD platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('ALIBABACLOUD')
      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.alibaba)
    })

    it('should return Provider.kubevirt for KUBEVIRT cloud label', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('kubevirt')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.kubevirt)
    })

    it('should return Provider.nutanix for AgentClusterInstall with Nutanix platformType', () => {
      const clusterDeployment = createClusterDeploymentWithInstallRef()
      const agentClusterInstall = createAgentClusterInstallWithPlatformType('Nutanix')

      const result = getProvider({
        clusterDeployment,
        agentClusterInstall,
      })
      expect(result).toBe(Provider.nutanix)
    })

    it('should return Provider.hostinventory for AgentClusterInstall with non-Nutanix platformType', () => {
      const clusterDeployment = createClusterDeploymentWithInstallRef()
      const agentClusterInstall = createAgentClusterInstallWithPlatformType('BareMetal')

      const result = getProvider({
        clusterDeployment,
        agentClusterInstall,
      })
      expect(result).toBe(Provider.hostinventory)
    })

    it('should return Provider.nutanix for platformClusterClaim with NUTANIX value', () => {
      const managedCluster = createManagedClusterWithMultipleClaims([
        { name: 'platform.open-cluster-management.io', value: 'NUTANIX' },
        { name: 'other.claim', value: 'some-value' },
      ])

      const result = getProvider({ managedCluster })
      expect(result).toBe(Provider.nutanix)
    })

    it('should return Provider.nutanix for cloudLabel with nutanix value (case insensitive)', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('nutanix')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.nutanix)
    })

    it('should return Provider.nutanix for cloudLabel with uppercase NUTANIX value', () => {
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('NUTANIX')
      const result = getProvider({ managedClusterInfo })
      expect(result).toBe(Provider.nutanix)
    })
  })

  describe('handles edge cases', () => {
    it('should return undefined when no provider information is available', () => {
      const result = getProvider({})
      expect(result).toBeUndefined()
    })

    it('should return undefined when only empty objects are provided', () => {
      const managedCluster = createBasicManagedCluster()
      const managedClusterInfo = createBasicManagedClusterInfo()

      const result = getProvider({
        managedCluster,
        managedClusterInfo,
      })
      expect(result).toBeUndefined()
    })

    it('should prioritize cloud label over platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('NUTANIX')
      const managedClusterInfo = createManagedClusterInfoWithCloudLabel('aws')

      const result = getProvider({
        managedCluster,
        managedClusterInfo,
      })
      expect(result).toBe(Provider.aws)
    })

    it('should return undefined for AUTO-DETECT platform claim', () => {
      const managedCluster = createManagedClusterWithPlatformClaim('AUTO-DETECT')
      const result = getProvider({ managedCluster })
      expect(result).toBeUndefined()
    })
  })

  describe('getCCUpgradeStatus', () => {
    it('should return curator upgrade status when curator is in progress', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: { desiredCuration: 'upgrade' },
        status: {
          conditions: [{ type: 'clustercurator-job', status: 'False', reason: 'Job_has_finished', message: '' }],
        },
      }
      expect(getCCUpgradeStatus(curator, undefined)).toBe(true)
    })

    it('should return false when curator job not in progress', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: {
          conditions: [{ type: 'clustercurator-job', status: 'True', reason: 'Running', message: '' }],
        },
      }
      expect(getCCUpgradeStatus(curator, undefined)).toBe(false)
    })

    it('should fallback to HC upgrade status when curator not provided', () => {
      const hc: HostedClusterK8sResource = {
        apiVersion: HostedClusterApiVersion,
        kind: HostedClusterKind,
        metadata: { name: 'test', namespace: 'clusters' },
        spec: {} as any,
        status: {
          version: {
            desired: { image: 'v1.0.1' },
            history: [{ image: 'v1.0.0', state: 'Completed' }],
          },
        } as any,
      }
      expect(getCCUpgradeStatus(undefined, hc)).toBe(true)
    })
  })

  describe('getCCUpgradePercent', () => {
    it('should return curator upgrade percentage when curator is provided', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: {
          conditions: [{ type: 'monitor-upgrade', status: 'True', reason: '', message: 'Upgrade 50% complete' }],
        },
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('50%')
    })

    it('should return empty string when no percentage match', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: { conditions: [{ type: 'monitor-upgrade', status: 'True', reason: '', message: 'Upgrading' }] },
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('')
    })

    it('should fallback to HC upgrade percent when curator not provided', () => {
      const hc: HostedClusterK8sResource = {
        apiVersion: HostedClusterApiVersion,
        kind: HostedClusterKind,
        metadata: { name: 'test', namespace: 'clusters' },
        spec: {} as any,
        status: {
          conditions: [{ type: 'ClusterVersionProgressing', status: 'True', message: 'Working towards (75%)' }],
        } as any,
      }
      expect(getCCUpgradePercent(undefined, hc)).toBe('(75%)')
    })

    it('should return empty string when curator has no monitor-upgrade condition', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: { conditions: [{ type: 'other-condition', status: 'True', reason: '', message: 'Other message' }] },
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('')
    })

    it('should return empty string when curator has no status', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('')
    })

    it('should return empty string when curator status has no conditions', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: { conditions: [] },
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('')
    })
  })

  describe('getCCUpgradeStatus - additional coverage', () => {
    it('should return false when curator job not in progress', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: { desiredCuration: 'install' },
        status: {
          conditions: [
            { type: 'clustercurator-job', status: 'True', reason: 'Job_has_finished', message: 'Completed' },
          ],
        },
      }
      expect(getCCUpgradeStatus(curator, undefined)).toBe(false)
    })

    it('should return false when curator has no status', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
      }
      expect(getCCUpgradeStatus(curator, undefined)).toBe(false)
    })

    it('should return false when curator job finished and desiredCuration is not upgrade', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: { desiredCuration: 'install' },
        status: {
          conditions: [{ type: 'clustercurator-job', status: 'True', reason: 'Job_has_finished', message: '' }],
        },
      }
      expect(getCCUpgradeStatus(curator, undefined)).toBe(false)
    })

    it('should return true when curator has desiredCuration upgrade and job in progress', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: { desiredCuration: 'upgrade' },
        status: {
          conditions: [{ type: 'clustercurator-job', status: 'False', reason: 'Job_has_finished', message: '' }],
        },
      }
      expect(getCCUpgradeStatus(curator, undefined)).toBe(true)
    })
  })

  describe('getCCUpgradePercent - edge cases', () => {
    it('should return percentage when found in detailed message', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: {
          conditions: [{ type: 'monitor-upgrade', status: 'True', reason: '', message: 'Upgrade is 85% complete' }],
        },
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('85%')
    })

    it('should return empty when no percentage match in message', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: {
          conditions: [{ type: 'monitor-upgrade', status: 'True', reason: '', message: 'Upgrade in progress' }],
        },
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('')
    })

    it('should handle empty condition message', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: {
          conditions: [{ type: 'monitor-upgrade', status: 'True', reason: '', message: '' }],
        },
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('')
    })

    it('should extract percentage from complex message', () => {
      const curator: ClusterCurator = {
        apiVersion: ClusterCuratorApiVersion,
        kind: ClusterCuratorKind,
        metadata: { name: 'test' },
        spec: {},
        status: {
          conditions: [
            {
              type: 'monitor-upgrade',
              status: 'True',
              reason: '',
              message: 'Progress: 42% - updating nodes',
            },
          ],
        },
      }
      expect(getCCUpgradePercent(curator, undefined)).toBe('42%')
    })
  })
})
