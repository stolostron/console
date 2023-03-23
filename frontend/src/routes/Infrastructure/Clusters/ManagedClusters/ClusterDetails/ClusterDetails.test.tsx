/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import _ from 'lodash'
import { Scope } from 'nock/types'
import { CIM } from 'openshift-assisted-ui-lib'
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { generatePath } from 'react-router'
import { RecoilRoot } from 'recoil'
import cloneDeep from 'lodash/cloneDeep'
import {
  agentClusterInstallsState,
  certificateSigningRequestsState,
  clusterClaimsState,
  clusterCuratorsState,
  clusterDeploymentsState,
  clusterManagementAddonsState,
  clusterProvisionsState,
  configMapsState,
  hostedClustersState,
  machinePoolsState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClusterSetsState,
  managedClustersState,
} from '../../../../../atoms'
import {
  nockCreate,
  nockDelete,
  nockGet,
  nockIgnoreRBAC,
  nockIgnoreApiPaths,
  nockList,
  nockNamespacedList,
  nockPatch,
} from '../../../../../lib/nock-util'
import { mockManagedClusterSet, mockOpenShiftConsoleConfigMap } from '../../../../../lib/test-metadata'
import {
  clickByLabel,
  clickByText,
  typeByText,
  waitForCalled,
  waitForNock,
  waitForNocks,
  waitForNotText,
  waitForTestId,
  waitForText,
} from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import {
  AgentClusterInstallApiVersion,
  AgentClusterInstallGroup,
  AgentClusterInstallKind,
  AgentClusterInstallVersion,
  ClusterClaim,
  ClusterClaimApiVersion,
  ClusterClaimKind,
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  ClusterDeployment,
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  ClusterManagementAddOn,
  ClusterProvision,
  ClusterProvisionApiVersion,
  ClusterProvisionKind,
  HostedClusterApiVersion,
  HostedClusterKind,
  IResource,
  ManagedCluster,
  ManagedClusterAddOn,
  ManagedClusterAddOnApiVersion,
  ManagedClusterAddOnKind,
  ManagedClusterApiVersion,
  ManagedClusterInfo,
  ManagedClusterInfoApiVersion,
  ManagedClusterInfoKind,
  ManagedClusterKind,
  PodApiVersion,
  PodKind,
  PodList,
  Secret,
  SecretApiVersion,
  SecretKind,
  Namespace,
  NamespaceApiVersion,
  NamespaceKind,
  KlusterletAddonConfig,
  KlusterletAddonConfigApiVersion,
  KlusterletAddonConfigKind,
} from '../../../../../resources'
import {
  MultiClusterEngine,
  MultiClusterEngineApiVersion,
  MultiClusterEngineKind,
} from '../../../../../resources/multi-cluster-engine'
import ClusterDetails from './ClusterDetails'
import { clusterName, mockMachinePoolAuto, mockMachinePoolManual } from './ClusterDetails.sharedmocks'

const mockManagedClusterInfo: ManagedClusterInfo = {
  apiVersion: ManagedClusterInfoApiVersion,
  kind: ManagedClusterInfoKind,
  metadata: { name: clusterName, namespace: clusterName },
  status: {
    distributionInfo: {
      ocp: {
        desired: {
          version: '1.2.3',
          image: 'abc',
          channels: ['stable-1.2', 'stable-1.3'],
        },
        version: '1.2.3',
        channel: 'stable-1.2',
        availableUpdates: [],
        desiredVersion: '',
        upgradeFailed: false,
        versionAvailableUpdates: [{ version: '1.2.4', image: 'abc' }],
      },
      type: 'OCP',
    },
    conditions: [
      {
        message: 'Accepted by hub cluster admin',
        reason: 'HubClusterAdminAccepted',
        status: 'True',
        type: 'HubAcceptedManagedCluster',
      },
    ],
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
        conditions: [
          {
            status: 'True',
            type: 'Ready',
          },
        ],
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
        capacity: {
          cpu: '4',
          memory: '15944104Ki',
        },
        conditions: [
          {
            status: 'Unknown',
            type: 'Ready',
          },
        ],
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
        capacity: {
          cpu: '4',
          memory: '8194000Pi',
        },
        conditions: [
          {
            status: 'False',
            type: 'Ready',
          },
        ],
      },
    ],
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
    powerState: 'WaitingForMachines',
    installerImage:
      'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:a3ed2bf438dfa5a114aa94cb923103432cd457cac51d1c4814ae0ef7e6e9853b',
    provisionRef: {
      name: 'test-cluster-31-26h5q',
    },
  },
}

const mockClusterDeploymentDiffNs = cloneDeep(mockClusterDeployment)
mockClusterDeploymentDiffNs.metadata.name = 'diffname'
mockClusterDeploymentDiffNs.metadata.namespace = 'diffns'

const mockAIClusterDeployment: ClusterDeployment = _.cloneDeep(mockClusterDeployment)
mockAIClusterDeployment.metadata.labels = {
  'hive.openshift.io/cluster-platform': 'agent-baremetal',
}
mockAIClusterDeployment.metadata.annotations = {
  'agentBareMetal-agentSelector/autoSelect': 'false',
}
mockAIClusterDeployment.spec!.platform = {
  agentBareMetal: {
    agentSelector: {},
  },
}
mockAIClusterDeployment.spec!.clusterInstallRef = {
  group: AgentClusterInstallGroup,
  kind: AgentClusterInstallKind,
  name: clusterName,
  version: AgentClusterInstallVersion,
}

const mockAgentClusterInstall: CIM.AgentClusterInstallK8sResource = {
  apiVersion: AgentClusterInstallApiVersion,
  kind: AgentClusterInstallKind,
  metadata: {
    name: clusterName,
    namespace: clusterName,
    // skip ownerReference to CD for now
  },
  spec: {
    apiVIP: '192.168.122.152',
    ingressVIP: '192.168.122.155',
    clusterDeploymentRef: {
      name: clusterName,
    },
    clusterMetadata: {
      clusterID: '6aa9cdfe-a13c-4e8c-b7e3-0219fad10163',
      /* Add when actually needed
            adminKubeconfigSecretRef: {
                name: `${clusterName}-admin-kubeconfig`,
            },
            adminPasswordSecretRef: {
                name: `${clusterName}-admin-password`,
            },
            */
      // infraID: '570004e6-c97c-428a-92b7-2d1f7c4adc0f',
    },
    imageSetRef: {
      name: 'img4.8.13-x86-64-appsub',
    },
    networking: {
      clusterNetwork: [{ cidr: '10.128.0.0/14', hostPrefix: 23 }],
      serviceNetwork: ['172.30.0.0/16'],
    },
    provisionRequirements: {
      controlPlaneAgents: 3,
    },
    platformType: 'None',
  },
  status: {
    conditions: [],
    debugInfo: {
      // eventsUrl: '',
      // logsURL: '',
      state: 'adding-hosts',
      stateInfo: '',
    },
    progress: {
      totalPercentage: 0,
    },
    validationsInfo: { network: [] },
  },
}

const mockHiveProvisionPods: PodList = {
  kind: 'PodList',
  apiVersion: 'v1',
  metadata: { selfLink: '/api/v1/namespaces/test-cluster/pods', resourceVersion: '50100517' },
  items: [
    {
      apiVersion: PodApiVersion,
      kind: PodKind,
      metadata: {
        name: 'test-cluster-0-92r2t-provision-wtsph',
        generateName: 'test-cluster-0-92r2t-provision-',
        namespace: clusterName,
        selfLink: '/api/v1/namespaces/test-cluster/pods/test-cluster-0-92r2t-provision-wtsph',
        uid: '4facb96d-9737-407d-ac32-0b50bf66cc45',
        resourceVersion: '50084255',
        labels: {
          cloud: 'AWS',
          'controller-uid': 'a399648b-429b-4a96-928e-0396a335c3af',
          'hive.openshift.io/cluster-deployment-name': clusterName,
          'hive.openshift.io/cluster-platform': 'aws',
          'hive.openshift.io/cluster-provision': 'test-cluster-0-92r2t',
          'hive.openshift.io/cluster-provision-name': 'test-cluster-0-92r2t',
          'hive.openshift.io/cluster-region': 'us-east-1',
          'hive.openshift.io/install': 'true',
          'hive.openshift.io/job-type': 'provision',
          'job-name': 'test-cluster-0-92r2t-provision',
          region: 'us-east-1',
          vendor: 'OpenShift',
        },
      },
    },
  ],
}

const mockMultiClusterEngineListResponse: MultiClusterEngine[] = [
  {
    apiVersion: 'multicluster.openshift.io/v1',
    kind: 'MultiClusterEngine',
    metadata: {
      creationTimestamp: '2022-05-05T15:12:32Z',
      finalizers: ['finalizer.multicluster.openshift.io'],
      generation: 4,
      labels: {
        'installer.name': 'multiclusterhub',
        'installer.namespace': 'open-cluster-management',
      },
      managedFields: [
        {
          apiVersion: 'multicluster.openshift.io/v1',
          fieldsType: 'FieldsV1',
          fieldsV1: {
            'f:metadata': {
              'f:labels': {
                'f:installer.name': {},
                'f:installer.namespace': {},
              },
            },
            'f:spec': {
              'f:imagePullSecret': {},
              'f:overrides': {},
              'f:tolerations': {},
            },
          },
          manager: 'multiclusterhub-operator',
          operation: 'Apply',
          time: '2022-06-28T05:52:39Z',
        },
        {
          apiVersion: 'multicluster.openshift.io/v1',
          fieldsType: 'FieldsV1',
          fieldsV1: {
            'f:status': {
              '.': {},
              'f:components': {},
              'f:conditions': {},
              'f:phase': {},
            },
          },
          manager: 'backplane-operator',
          operation: 'Update',
          subresource: 'status',
          time: '2022-05-05T15:12:38Z',
        },
        {
          apiVersion: 'multicluster.openshift.io/v1',
          fieldsType: 'FieldsV1',
          fieldsV1: {
            'f:metadata': {
              'f:finalizers': {
                '.': {},
                'v:"finalizer.multicluster.openshift.io"': {},
              },
            },
            'f:spec': {
              'f:availabilityConfig': {},
              'f:overrides': {
                'f:components': {},
              },
              'f:targetNamespace': {},
            },
          },
          manager: 'backplane-operator',
          operation: 'Update',
          time: '2022-05-06T07:49:42Z',
        },
      ],
      name: 'multiclusterengine',
      resourceVersion: '295088094',
      uid: '763cb473-a075-49a2-b8f6-f140ac9d7d37',
    },
    spec: {
      availabilityConfig: 'High',
      imagePullSecret: 'multiclusterhub-operator-pull-secret',
      overrides: {
        components: [
          {
            enabled: true,
            name: 'hypershift-preview',
          },
          {
            enabled: true,
            name: 'assisted-service',
          },
          {
            enabled: true,
            name: 'cluster-lifecycle',
          },
          {
            enabled: true,
            name: 'cluster-manager',
          },
          {
            enabled: true,
            name: 'discovery',
          },
          {
            enabled: true,
            name: 'hive',
          },
          {
            enabled: true,
            name: 'server-foundation',
          },
          {
            enabled: false,
            name: 'managedserviceaccount-preview',
          },
          {
            enabled: true,
            name: 'console-mce',
          },
        ],
      },
      targetNamespace: 'multicluster-engine',
      tolerations: [
        {
          effect: 'NoSchedule',
          key: 'node-role.kubernetes.io/infra',
          operator: 'Exists',
        },
      ],
    },
    status: {
      components: [
        {
          kind: 'Component',
          lastTransitionTime: '2022-06-24T10:53:31Z',
          message: 'No resources present',
          name: 'managedservice',
          reason: 'ComponentDisabled',
          status: 'True',
          type: 'NotPresent',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T09:35:22Z',
          name: 'hypershift-addon-manager',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:52:25Z',
          name: 'hypershift-deployment-controller',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:51:12Z',
          name: 'console-mce-console',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:52:08Z',
          name: 'discovery-operator',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:51:43Z',
          name: 'hive-operator',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:52:08Z',
          name: 'infrastructure-operator',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:42:32Z',
          name: 'cluster-curator-controller',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:51:19Z',
          name: 'clusterclaims-controller',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:53:18Z',
          name: 'provider-credential-controller',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T09:35:24Z',
          name: 'clusterlifecycle-state-metrics-v2',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:51:47Z',
          name: 'cluster-manager',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'ClusterManager',
          lastTransitionTime: '2022-06-24T10:53:31Z',
          message: 'Components of cluster manager are applied',
          name: 'cluster-manager',
          reason: 'ClusterManagerApplied',
          status: 'True',
          type: 'Applied',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:53:21Z',
          name: 'ocm-controller',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:51:56Z',
          name: 'ocm-proxyserver',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
        {
          kind: 'Deployment',
          lastTransitionTime: '2022-06-24T10:52:08Z',
          name: 'ocm-webhook',
          reason: 'MinimumReplicasAvailable',
          status: 'True',
          type: 'Available',
        },
      ],
      conditions: [
        {
          lastTransitionTime: '2022-06-24T10:52:05Z',
          lastUpdateTime: '2022-06-24T10:52:05Z',
          message: 'All components deployed',
          reason: 'ComponentsDeployed',
          status: 'True',
          type: 'Progressing',
        },
        {
          lastTransitionTime: '2022-06-24T10:53:31Z',
          lastUpdateTime: '2022-06-24T10:53:31Z',
          reason: 'ComponentsAvailable',
          status: 'True',
          type: 'Available',
        },
      ],
      phase: 'Available',
    },
  },
]

const mockManagedClusterAddOnApp: ManagedClusterAddOn = {
  apiVersion: ManagedClusterAddOnApiVersion,
  kind: ManagedClusterAddOnKind,
  metadata: {
    name: 'application-manager',
    namespace: clusterName,
  },
  spec: {},
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2021-05-14T15:11:35Z'),
        message: 'Progressing',
        reason: 'Progressing',
        status: 'True',
        type: 'Progressing',
      },
    ],
    addOnMeta: {
      displayName: 'application-manager',
      description: 'application-manager description',
    },
    addOnConfiguration: {
      crdName: 'klusterletaddonconfig',
      crName: clusterName,
    },
  },
}

const mockManagedClusterAddOnWork: ManagedClusterAddOn = {
  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
  kind: 'ManagedClusterAddOn',
  metadata: {
    name: 'work-manager',
    namespace: clusterName,
  },
  spec: {},
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2021-05-14T15:11:35Z'),
        message: 'Degraded',
        reason: 'Degraded',
        status: 'True',
        type: 'Degraded',
      },
    ],
    addOnMeta: {
      displayName: 'work-manager',
      description: 'work-manager description',
    },
    addOnConfiguration: {
      crdName: 'klusterletaddonconfig',
      crName: clusterName,
    },
  },
}

const mockManagedClusterAddOnCert: ManagedClusterAddOn = {
  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
  kind: 'ManagedClusterAddOn',
  metadata: {
    name: 'cert-policy-controller',
    namespace: clusterName,
  },
  spec: {},
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2021-05-14T15:11:35Z'),
        message: 'Available',
        reason: 'Available',
        status: 'True',
        type: 'Available',
      },
    ],
    addOnMeta: {
      displayName: 'cert-policy-controller',
      description: 'cert-policy-controller description',
    },
    addOnConfiguration: {
      crdName: 'klusterletaddonconfig',
      crName: clusterName,
    },
  },
}

const mockManagedClusterAddOnPolicy: ManagedClusterAddOn = {
  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
  kind: 'ManagedClusterAddOn',
  metadata: {
    uid: '',
    name: 'policy-controller',
    namespace: clusterName,
  },
  spec: {},
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2021-05-14T15:11:35Z'),
        message: 'Progressing',
        reason: 'Progressing',
        status: 'False',
        type: 'Progressing',
      },
    ],
    addOnMeta: {
      displayName: 'policy-controller',
      description: 'policy-controller description',
    },
    addOnConfiguration: {
      crdName: 'klusterletaddonconfig',
      crName: clusterName,
    },
  },
}

const mockManagedClusterAddOnSearch: ManagedClusterAddOn = {
  apiVersion: 'addon.open-cluster-management.io/v1alpha1',
  kind: 'ManagedClusterAddOn',
  metadata: {
    uid: '',
    name: 'search-collector',
    namespace: clusterName,
  },
  spec: {},
  status: {
    conditions: [
      {
        lastTransitionTime: new Date('2021-05-14T15:11:35Z'),
        message: 'Unknown',
        reason: 'Unknown',
        status: 'True',
        type: 'Unknown',
      },
    ],
    addOnMeta: {
      displayName: 'search-collector',
      description: 'search-collector description',
    },
    addOnConfiguration: {
      crdName: 'klusterletaddonconfig',
      crName: clusterName,
    },
  },
}

const mockClusterManagementAddons: ClusterManagementAddOn[] = [
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      name: 'application-manager',
      annotations: {
        'console.open-cluster-management.io/launch-link': '/cma/grafana',
        'console.open-cluster-management.io/launch-link-text': 'Grafana',
      },
    },
    spec: {
      addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
      addOnMeta: {
        description: 'Processes events and other requests to managed resources.',
        displayName: 'Application Manager',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      name: 'cert-policy-controller',
    },
    spec: {
      addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
      addOnMeta: {
        description: 'Monitors certificate expiration based on distributed policies.',
        displayName: 'Cert Policy Controller',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      name: 'iam-policy-controller',
    },
    spec: {
      addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
      addOnMeta: {
        description: 'Monitors identity controls based on distributed policies.',
        displayName: 'IAM Policy Controller',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      name: 'policy-controller',
    },
    spec: {
      addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
      addOnMeta: {
        description: 'Distributes configured policies and monitors Kubernetes-based policies.',
        displayName: 'Policy Controller',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      name: 'search-collector',
    },
    spec: {
      addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
      addOnMeta: {
        description: 'Collects cluster data to be indexed by search components on the hub cluster.',
        displayName: 'Search Collector',
      },
    },
  },
  {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ClusterManagementAddOn',
    metadata: {
      name: 'work-manager',
    },
    spec: {
      addOnConfiguration: { crName: '', crdName: 'klusterletaddonconfigs.agent.open-cluster-management.io' },
      addOnMeta: {
        description: 'Handles endpoint work requests and managed cluster status.',
        displayName: 'Work Manager',
      },
    },
  },
]

const mockManagedClusterAddOns: ManagedClusterAddOn[] = [
  mockManagedClusterAddOnApp,
  mockManagedClusterAddOnWork,
  mockManagedClusterAddOnCert,
  mockManagedClusterAddOnPolicy,
  mockManagedClusterAddOnSearch,
]

const mockKlusterletAddonConfig: KlusterletAddonConfig = {
  apiVersion: KlusterletAddonConfigApiVersion,
  kind: KlusterletAddonConfigKind,
  metadata: {
    name: 'hostedcluster1',
    namespace: 'hostedcluster1',
  },
  spec: {
    clusterName: 'hostedcluster1',
    clusterNamespace: 'hostedcluster1',
    clusterLabels: {
      cloud: 'Amazon',
      vendor: 'Openshift',
    },
    applicationManager: {
      enabled: true,
      argocdCluster: false,
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

const mockNamespace: Namespace = {
  apiVersion: NamespaceApiVersion,
  kind: NamespaceKind,
  metadata: {
    name: 'hostedcluster1',
  },
}

const mockHostedCluster1: HostedClusterK8sResource = {
  apiVersion: HostedClusterApiVersion,
  kind: HostedClusterKind,
  metadata: {
    name: 'hostedcluster1',
    namespace: clusterName,
  },
  spec: {
    services: [],
    dns: {
      baseDomain: 'test.com',
    },
    pullSecret: { name: 'local-cluster-pull-secret' },
    release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
    sshKey: { name: 'feng-hypershift-test-ssh-key' },
    platform: {
      agent: {
        agentNamespace: clusterName,
      },
      type: 'Agent',
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: '',
        observedGeneration: 1,
        reason: 'StatusUnknown',
        status: 'Unknown',
        type: 'ValidAWSIdentityProvider',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: 'Condition not found in the CVO.',
        observedGeneration: 3,
        reason: 'StatusUnknown',
        status: 'Unknown',
        type: 'ClusterVersionProgressing',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: 'Condition not found in the CVO.',
        observedGeneration: 3,
        reason: 'StatusUnknown',
        status: 'Unknown',
        type: 'ClusterVersionReleaseAccepted',
      },
      {
        lastTransitionTime: '2022-12-20T16:51:09Z',
        message:
          'Kubernetes 1.25 and therefore OpenShift 4.12 remove several APIs which require admin consideration. Please see the knowledge article https://access.redhat.com/articles/6955381 for details and instructions.',
        observedGeneration: 3,
        reason: 'AdminAckRequired',
        status: 'False',
        type: 'ClusterVersionUpgradeable',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: 'Condition not found in the CVO.',
        observedGeneration: 3,
        reason: 'StatusUnknown',
        status: 'Unknown',
        type: 'ClusterVersionAvailable',
      },
      {
        lastTransitionTime: '2022-12-20T19:15:09Z',
        message: 'Working towards 4.11.17: 508 of 560 done (90% complete)',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'ClusterVersionSucceeding',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:55Z',
        message:
          '[capi-provider deployment has 1 unavailable replicas, cluster-api deployment has 1 unavailable replicas]',
        observedGeneration: 3,
        reason: 'UnavailableReplicas',
        status: 'True',
        type: 'Degraded',
      },
      {
        lastTransitionTime: '2022-12-20T16:49:32Z',
        message: '',
        observedGeneration: 3,
        reason: 'QuorumAvailable',
        status: 'True',
        type: 'EtcdAvailable',
      },
      {
        lastTransitionTime: '2022-12-20T16:50:08Z',
        message: 'Kube APIServer deployment is available',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'KubeAPIServerAvailable',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:59Z',
        message: '',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'InfrastructureReady',
      },
      {
        lastTransitionTime: '2022-12-20T16:50:08Z',
        message: 'The hosted control plane is available',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: 'Configuration passes validation',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'ValidConfiguration',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: 'HostedCluster is supported by operator configuration',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'SupportedHostedCluster',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:55Z',
        message: 'Configuration passes validation',
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'ValidHostedControlPlaneConfiguration',
      },
      {
        lastTransitionTime: '2022-12-20T16:50:10Z',
        message: 'Ignition server deployment is available',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'IgnitionEndpointAvailable',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: 'Reconciliation active on resource',
        observedGeneration: 3,
        reason: 'ReconciliationActive',
        status: 'True',
        type: 'ReconciliationActive',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: 'Release image is valid',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'ValidReleaseImage',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:44Z',
        message: 'HostedCluster is at expected version',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'False',
        type: 'Progressing',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:46Z',
        message: 'Reconciliation completed succesfully',
        observedGeneration: 3,
        reason: 'ReconciliatonSucceeded',
        status: 'True',
        type: 'ReconciliationSucceeded',
      },
      {
        lastTransitionTime: '2022-12-20T16:48:46Z',
        message: 'OIDC configuration is valid',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'ValidOIDCConfiguration',
      },
    ],
  },
}

const mockSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    namespace: 'hostedcluster1',
    name: 'hostedcluster1-import',
  },
}

const mockClusterProvisions: ClusterProvision = {
  apiVersion: ClusterProvisionApiVersion,
  kind: ClusterProvisionKind,
  metadata: {
    labels: {
      cloud: 'GCP',
      'hive.openshift.io/cluster-deployment-name': clusterName,
      'hive.openshift.io/cluster-platform': 'gcp',
      'hive.openshift.io/cluster-region': 'us-east1',
      region: 'us-east1',
      vendor: 'OpenShift',
    },
    name: 'test-cluster-0-hmd44',
    namespace: clusterName,
  },
  spec: {
    attempt: 0,
    clusterDeploymentRef: { name: clusterName },
    installLog:
      'level=info msg="Credentials loaded from environment variable \\"GOOGLE_CREDENTIALS\\", file \\"/.gcp/osServiceAccount.json\\""\nlevel=fatal msg="failed to fetch Master Machines: failed to load asset \\"Install Config\\": platform.gcp.project: Invalid value: \\"gc-acm-dev-fake\\": invalid project ID"\n',
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2021-01-04T18:23:30Z',
        message: 'Install job has been created',
        reason: 'JobCreated',
        status: 'True',
        type: 'ClusterProvisionJobCreated',
      },
      {
        lastTransitionTime: '2021-01-04T18:23:37Z',
        message: 'Invalid GCP project ID',
        reason: 'GCPInvalidProjectID',
        status: 'True',
        type: 'ClusterProvisionFailed',
      },
    ],
  },
}

const mockClusterCurator: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test-cluster',
    namespace: 'test-cluster',
  },
  spec: {
    desiredCuration: 'install',
    install: {
      towerAuthSecret: 'ansible-credential-i',
      prehook: [],
      posthook: [
        { name: 'posthook-1', type: 'Job' },
        { name: 'posthook-2', type: 'Job' },
      ],
    },
    upgrade: {
      towerAuthSecret: 'ansible-credential-i',
      prehook: [],
      posthook: [],
    },
  },
}

const mockMultiClusterEngineList = () =>
  nockList<MultiClusterEngine>(
    {
      apiVersion: MultiClusterEngineApiVersion,
      kind: MultiClusterEngineKind,
    },
    mockMultiClusterEngineListResponse
  )

const createManagedcluster1: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    annotations: {
      'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
      'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
      'open-cluster-management/created-via': 'other',
    },
    labels: {
      cloud: 'auto-detect',
      'cluster.open-cluster-management.io/clusterset': 'default',
      name: 'hostedcluster1',
      vendor: 'OpenShift',
    },
    name: 'hostedcluster1',
  },
  spec: {
    hubAcceptsClient: true,
    leaseDurationSeconds: 60,
  },
}

const mockHostedClusters = [mockHostedCluster1]

const mockClusterClaimClusterDeployment: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    name: 'cd-namespace',
    namespace: 'cd-namespace',
  },
}

const mockClusterClaim: ClusterClaim = {
  apiVersion: ClusterClaimApiVersion,
  kind: ClusterClaimKind,
  metadata: {
    name: 'clusterClaimName',
    namespace: 'clusterClaimNs',
  },
  spec: {
    clusterPoolName: 'foo-pool',
    namespace: 'cd-namespace',
  },
}

const nockListHiveProvisionJobs = () =>
  nockNamespacedList(
    { apiVersion: PodApiVersion, kind: PodKind, metadata: { namespace: clusterName } },
    mockHiveProvisionPods,
    ['hive.openshift.io/cluster-deployment-name=test-cluster', 'hive.openshift.io/job-type=provision']
  )

const Component = ({ clusterDeployment = mockClusterDeployment }) => (
  <RecoilRoot
    initializeState={(snapshot) => {
      snapshot.set(managedClusterAddonsState, mockManagedClusterAddOns)
      snapshot.set(clusterManagementAddonsState, mockClusterManagementAddons)
      snapshot.set(managedClustersState, [mockManagedCluster])
      snapshot.set(clusterDeploymentsState, [clusterDeployment])
      snapshot.set(managedClusterInfosState, [mockManagedClusterInfo])
      snapshot.set(certificateSigningRequestsState, [])
      snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
      snapshot.set(configMapsState, [mockOpenShiftConsoleConfigMap])
      snapshot.set(clusterProvisionsState, [mockClusterProvisions])
      snapshot.set(machinePoolsState, [mockMachinePoolManual, mockMachinePoolAuto])
      snapshot.set(clusterCuratorsState, [mockClusterCurator])
      snapshot.set(agentClusterInstallsState, [mockAgentClusterInstall])
      snapshot.set(clusterClaimsState, [mockClusterClaim])
    }}
  >
    <MemoryRouter
      initialEntries={[
        generatePath(NavigationPath.clusterDetails, {
          name: clusterDeployment.metadata.name!,
          namespace: clusterDeployment.metadata.namespace!,
        }),
      ]}
    >
      <Switch>
        <Route path={NavigationPath.clusterDetails} component={ClusterDetails} />
      </Switch>
    </MemoryRouter>
  </RecoilRoot>
)

describe('ClusterDetails', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(<Component />)
  })

  test('overview page renders', async () => {
    await waitForText(clusterName, true)
    await waitForText('Overview')
    await waitForText('Details')
  })

  test('overview page opens logs', async () => {
    const nocks: Scope[] = [nockListHiveProvisionJobs()]
    window.open = jest.fn()
    await clickByText('View logs', 1)
    await waitForNocks(nocks)
    await waitForCalled(window.open as jest.Mock)
  })

  test('overview page opens edit labels', async () => {
    await waitForText(clusterName, true)

    await clickByLabel('Edit labels')
    await waitForText(
      'Labels help you organize and select resources. Adding labels allows you to query for objects by using the labels. Selecting labels during policy and application creation allows you to distribute your resources to different clusters that share common labels.'
    )

    await clickByText('Cancel')
    await waitForNotText(
      'Labels help you organize and select resources. Adding labels allows you to query for objects by using the labels. Selecting labels during policy and application creation allows you to distribute your resources to different clusters that share common labels.'
    )
  })

  test('overview page handles channel select', async () => {
    await waitForText(clusterName, true)
    await waitForText(clusterName, true)

    await clickByLabel('Select channels')
    await waitForText(
      'Select channels for the clusters. Only the selected clusters that have available channels are listed.'
    )

    await clickByText('Cancel')
    await waitForNotText(
      'Select channels for the clusters. Only the selected clusters that have available channels are listed.'
    )
  })

  test('nodes page renders', async () => {
    await clickByText('Nodes')
    await waitForText(mockManagedClusterInfo.status?.nodeList?.[0].name!)

    await clickByText('Role')
    await waitForText(mockManagedClusterInfo.status?.nodeList?.[0].name!)

    await clickByText('Region')
    await waitForText(mockManagedClusterInfo.status?.nodeList?.[0].name!)
  })

  test('machine pools page renders', async () => {
    await clickByText('Machine pools')
    await waitForText(mockMachinePoolManual.metadata.name!)
    await waitForText(mockMachinePoolAuto.metadata.name!)
  })

  test('settings page renders', async () => {
    await clickByText('Add-ons')
    await waitForText(mockManagedClusterAddOns[0].metadata.name!)
  })

  test('overview page handles detach', async () => {
    await clickByText('Actions')

    await clickByText('Detach cluster')
    await typeByText(
      `Confirm by typing "${mockManagedCluster.metadata.name!}" below:`,
      mockManagedCluster.metadata.name!
    )

    const deleteNock = nockDelete(mockManagedCluster)
    await clickByText('Detach')
    await waitForNock(deleteNock)
  })

  test('overview page handles destroy', async () => {
    await clickByText('Actions')
    await clickByText('Destroy cluster')
    await typeByText(
      `Confirm by typing "${mockManagedCluster.metadata.name!}" below:`,
      mockManagedCluster.metadata.name!
    )

    const deleteNocks: Scope[] = [nockDelete(mockManagedCluster), nockDelete(mockClusterDeployment)]
    await clickByText('Destroy')
    await waitForNocks(deleteNocks)
  })
})

describe('ClusterDetails - different name to namespace', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    render(<Component clusterDeployment={mockClusterDeploymentDiffNs} />)
  })

  test('overview page renders', async () => {
    await waitForText(mockClusterDeploymentDiffNs.metadata.name!, true)
    await waitForText('Overview')
    await waitForText('Details')
  })
})

const AIComponent = () => <Component clusterDeployment={mockAIClusterDeployment} />

describe('ClusterDetails for On Premise', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('overview page renders AI empty details', async () => {
    const nocks: Scope[] = [mockMultiClusterEngineList()]
    render(<AIComponent />)
    await waitForNocks(nocks)

    await waitForText(clusterName, true)
    await waitForText('Overview')
    await waitForText('Details')

    await waitForText('Cluster hosts')
    await waitForTestId('col-header-hostname', true) // Multiple === true since the Empty state reuses the column
    await waitForTestId('col-header-role')
    await waitForTestId('col-header-infraenvstatus')
    await waitForTestId('col-header-infraenv')
    await waitForTestId('col-header-cpucores')
    await waitForTestId('col-header-memory')
    await waitForTestId('col-header-disk')

    await waitForText('ai:Waiting for hosts...')

    // TODO(mlibra): If only we can address titles/headers in the table by ID. That would require changes to the AcmDescriptionList component
    await waitForText('Host inventory')

    // screen.debug(undefined, -1)
  })
})

describe('ClusterDetails - ClusterClaim', () => {
  test('overview page renders for ClusterClaim', async () => {
    nockIgnoreRBAC()
    render(<Component clusterDeployment={mockClusterClaimClusterDeployment} />)
    await waitForText(mockClusterClaimClusterDeployment.metadata.name!, true)
    await waitForText('Overview')
    await waitForText('Details')
  })
})

describe('Automation Details', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(<Component />)
  })

  test('summary link is visible', async () => {
    await waitForText(clusterName, true)
    await waitForText('Automation template', true)
    await waitForText('View template', true)
  })

  test('modal displays correct values', async () => {
    await clickByText('View template')
    await waitForText('Automation template for test-cluster')

    await waitForText('Install')
    await waitForText('posthook-1')

    await waitForText('Upgrade')
  })
})

describe('ClusterDetails with not found', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('page renders error state to return to cluster page', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(managedClusterAddonsState, [])
          snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
          snapshot.set(configMapsState, [])
        }}
      >
        <MemoryRouter initialEntries={[NavigationPath.clusterDetails.replace(':id', clusterName)]}>
          <Switch>
            <Route path={NavigationPath.clusterDetails} component={ClusterDetails} />
          </Switch>
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Not found')
    userEvent.click(
      screen.getByRole('button', {
        name: /back to clusters/i,
      })
    )
    expect(window.location.pathname).toEqual('/')
  })
  test('page renders error state, should have option to import', async () => {
    nockGet(mockSecret)
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(managedClusterAddonsState, [])
          snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
          snapshot.set(configMapsState, [])
          snapshot.set(hostedClustersState, mockHostedClusters)
        }}
      >
        <MemoryRouter
          initialEntries={[
            generatePath(NavigationPath.clusterDetails, {
              name: mockHostedCluster1.metadata?.name!,
              namespace: mockHostedCluster1.metadata?.namespace!,
            }),
          ]}
        >
          <Switch>
            <Route path={NavigationPath.clusterDetails} component={ClusterDetails} />
          </Switch>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText(mockHostedCluster1.metadata?.name!, true)
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: /https:\/\/console-openshift-console\.apps\.hostedcluster1\.test\.com/i,
        })
      )
    )

    const mockImportHostedCluster = [
      nockCreate(createManagedcluster1, createManagedcluster1),
      nockCreate(mockKlusterletAddonConfig, mockKlusterletAddonConfig),
      nockCreate(mockNamespace, mockNamespace),
      nockPatch(mockHostedCluster1 as IResource, [
        {
          op: 'replace',
          path: '/metadata/annotations',
          value: {
            'cluster.open-cluster-management.io/managedcluster-name': 'hostedcluster1',
            'cluster.open-cluster-management.io/hypershiftdeployment': 'test-cluster/hostedcluster1',
          },
        },
      ]),
    ]

    userEvent.click(
      screen.getByRole('button', {
        name: /import cluster/i,
      })
    )
    await waitForNocks(mockImportHostedCluster)
  })
})
