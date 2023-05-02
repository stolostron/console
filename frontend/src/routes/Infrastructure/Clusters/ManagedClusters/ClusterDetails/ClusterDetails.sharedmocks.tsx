/* Copyright Contributors to the Open Cluster Management project */
import { HostedClusterK8sResource } from 'openshift-assisted-ui-lib/cim'
import { Cluster, ClusterStatus, MachinePool, MachinePoolApiVersion, MachinePoolKind } from '../../../../../resources'
import { Provider } from '../../../../../ui-components'

export const clusterName = 'test-cluster'

export const mockCluster: Cluster = {
  name: clusterName,
  displayName: clusterName,
  namespace: clusterName,
  uid: clusterName,
  status: ClusterStatus.ready,
  distribution: {
    k8sVersion: '1.19',
    ocp: undefined,
    displayVersion: '1.19',
    isManagedOpenShift: false,
  },
  labels: undefined,
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
  nodes: {
    ready: 0,
    unhealthy: 0,
    unknown: 0,
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
        name: 'ip-10-0-134-241.ec2.internal',
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
        name: 'ip-10-0-134-242.ec2.internal',
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

export const mockAWSHypershiftCluster: Cluster = {
  clusterSet: 'default',
  consoleURL: 'https://console-openshift-console.apps.feng-hypershift-test.dev06.red-chesterfield.com',
  creationTimestamp: '2022-08-31T18:54:48Z',
  displayName: 'feng-hypershift-test',
  distribution: {
    displayVersion: 'OpenShift 4.10.15',
    isManagedOpenShift: false,
    k8sVersion: 'v1.23.5+3afdacb',
    ocp: undefined,
  },
  hasAutomationTemplate: false,
  hive: {
    clusterClaimName: undefined,
    clusterPool: undefined,
    clusterPoolNamespace: undefined,
    isHibernatable: false,
    lifetime: undefined,
  },
  hypershift: {
    agent: false,
    hostingNamespace: 'clusters',
    nodePools: [
      {
        apiVersion: 'hypershift.openshift.io/v1alpha1',
        kind: 'NodePool',
        metadata: {
          annotations: {
            'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
            'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
          },
          creationTimestamp: '2022-08-31T18:55:05Z',
          labels: {
            'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
          },
          name: 'feng-hypershift-test',
          namespace: 'clusters',
        },
        spec: {
          autoScaling: {
            min: 1,
            max: 1,
          },
          clusterName: 'feng-hypershift-test',
          management: {
            autoRepair: false,
            replace: {
              rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
              strategy: 'RollingUpdate',
            },
            upgradeType: 'Replace',
          },
          platform: {
            aws: {
              instanceProfile: 'feng-hypershift-test-mjhpv-worker',
              instanceType: 't3.large',
              rootVolume: { size: 35, type: 'gp3' },
              securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
              subnet: { id: 'subnet-067d3045daf35213d' },
            },
            type: 'AWS',
          },
          release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
          replicas: 1,
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2022-08-31T19:02:51Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              message: '',
              status: 'True',
              type: 'Ready',
            },
          ],
        },
      },
    ],
    secretNames: ['feng-hypershift-test-ssh-key', 'local-cluster-pull-secret'],
  },
  isCurator: false,
  isHive: false,
  isHostedCluster: true,
  isHypershift: true,
  isManaged: true,
  isSNOCluster: false,
  isRegionalHubCluster: false,
  kubeApiServer: 'https://a664fd4e2b6034215a0ead32fc530bc0-e526bec562569550.elb.us-east-1.amazonaws.com:6443',
  kubeadmin: 'feng-hypershift-test-kubeadmin-password',
  kubeconfig: 'feng-hypershift-test-admin-kubeconfig',
  labels: {
    cloud: 'Amazon',
    'cluster.open-cluster-management.io/clusterset': 'default',
    clusterID: '49b5fce0-6556-4bec-aa04-81072382c860',
    'feature.open-cluster-management.io/addon-application-manager': 'available',
    'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
    'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
    'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-search-collector': 'available',
    'feature.open-cluster-management.io/addon-work-manager': 'available',
    name: 'feng-hypershift-test',
    openshiftVersion: '4.10.15',
    vendor: 'OpenShift',
  },
  name: 'feng-hypershift-test',
  namespace: 'feng-hypershift-test',
  nodes: {
    nodeList: [
      {
        capacity: { cpu: '2', memory: '8047856Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 't3.large',
          'failure-domain.beta.kubernetes.io/region': 'us-west-2',
          'failure-domain.beta.kubernetes.io/zone': 'us-west-2a',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 't3.large',
        },
        name: 'ip-10-0-134-203.us-west-2.compute.internal',
      },
    ],
    ready: 1,
    unhealthy: 0,
    unknown: 0,
  },
  owner: { createdBy: undefined, claimedBy: undefined },
  provider: Provider.hypershift,
  status: ClusterStatus.ready,
  statusMessage: undefined,
  uid: 'b458380a-7844-43a6-9cd5-31520512d5ad',
}

export const mockAWSHostedCluster: HostedClusterK8sResource = {
  apiVersion: 'hypershift.openshift.io/v1alpha1',
  kind: 'HostedCluster',
  metadata: {
    annotations: {
      'cluster.open-cluster-management.io/hypershiftdeployment': 'multicluster-engine/feng-hypershift-test',
      'cluster.open-cluster-management.io/managedcluster-name': 'feng-hypershift-test',
    },
    name: 'feng-hypershift-test',
    namespace: 'clusters',
  },
  spec: {
    services: [],
    autoscaling: {},
    clusterID: '49b5fce0-6556-4bec-aa04-81072382c860',
    controllerAvailabilityPolicy: 'SingleReplica',
    dns: {
      baseDomain: 'dev06.red-chesterfield.com',
      privateZoneID: 'Z05280312TKV05LK210UX',
      publicZoneID: 'Z2KFHRPLWG1H9H',
    },
    infraID: 'feng-hypershift-test-mjhpv',
    infrastructureAvailabilityPolicy: 'SingleReplica',
    issuerURL: 'https://feng-hypershift-bucket.s3.us-west-2.amazonaws.com/feng-hypershift-test-mjhpv',
    pullSecret: { name: 'local-cluster-pull-secret' },
    release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
    sshKey: { name: 'feng-hypershift-test-ssh-key' },
    platform: {
      aws: {
        cloudProviderConfig: {
          subnet: {
            id: 'subnet-048b18b8c0a7db89a',
          },
          vpc: 'vpc-0810759aa5a7598de',
          zone: 'us-west-2a',
        },
        controlPlaneOperatorCreds: {},
        endpointAccess: 'Public',
        kubeCloudControllerCreds: {},
        nodePoolManagementCreds: {},
        region: 'us-west-2',
        resourceTags: [
          {
            key: 'kubernetes.io/cluster/feng-hs-scale-74zxh',
            value: 'owned',
          },
        ],
      },
      type: 'AWS',
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-09-07T20:30:02Z',
        message: 'Reconciliation completed succesfully',
        observedGeneration: 1564,
        reason: 'ReconciliatonSucceeded',
        status: 'True',
        type: 'ReconciliationSucceeded',
      },
      {
        lastTransitionTime: '2022-08-31T19:07:00Z',
        message: '',
        observedGeneration: 1564,
        reason: 'AsExpected',
        status: 'True',
        type: 'ClusterVersionSucceeding',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'The hosted control plane is not found',
        observedGeneration: 1564,
        reason: 'ClusterVersionStatusUnknown',
        status: 'Unknown',
        type: 'ClusterVersionUpgradeable',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'The hosted control plane is not found',
        observedGeneration: 1564,
        reason: 'ClusterVersionStatusUnknown',
        status: 'Unknown',
        type: 'Degraded',
      },
      {
        lastTransitionTime: '2022-08-31T18:57:42Z',
        message: 'The hosted control plane is available',
        observedGeneration: 1564,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'Configuration passes validation',
        observedGeneration: 1564,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'ValidConfiguration',
      },
      {
        lastTransitionTime: '2022-08-31T18:55:06Z',
        message: 'HostedCluster is at expected version',
        observedGeneration: 1564,
        reason: 'AsExpected',
        status: 'False',
        type: 'Progressing',
      },
    ],
    kubeadminPassword: { name: 'feng-hypershift-test-kubeadmin-password' },
    kubeconfig: { name: 'feng-hypershift-test-admin-kubeconfig' },
    ignitionEndpoint:
      'ignition-server-clusters-feng-hypershift-test.apps.app-aws-410-hub-fpgwc.dev06.red-chesterfield.com',
  },
}

export const mockBMHypershiftCluster: Cluster = {
  clusterSet: 'default',
  consoleURL: 'https://console-openshift-console.apps.feng-hypershift-test.dev06.red-chesterfield.com',
  creationTimestamp: '2022-08-31T18:54:48Z',
  displayName: 'feng-hypershift-test',
  distribution: {
    displayVersion: 'OpenShift 4.10.15',
    isManagedOpenShift: false,
    k8sVersion: 'v1.23.5+3afdacb',
    ocp: undefined,
  },
  hasAutomationTemplate: false,
  hive: {
    clusterClaimName: undefined,
    clusterPool: undefined,
    clusterPoolNamespace: undefined,
    isHibernatable: false,
    lifetime: undefined,
  },
  hypershift: {
    agent: false,
    hostingNamespace: 'clusters',
    nodePools: [
      {
        apiVersion: 'hypershift.openshift.io/v1alpha1',
        kind: 'NodePool',
        metadata: {
          annotations: {
            'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
            'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
          },
          creationTimestamp: '2022-08-31T18:55:05Z',
          labels: {
            'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
          },
          name: 'feng-hypershift-test',
          namespace: 'clusters',
        },
        spec: {
          autoScaling: { max: 1, min: 1 },
          clusterName: 'feng-hypershift-test',
          management: {
            autoRepair: false,
            replace: {
              rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
              strategy: 'RollingUpdate',
            },
            upgradeType: 'Replace',
          },
          platform: {
            aws: {
              instanceProfile: 'feng-hypershift-test-mjhpv-worker',
              instanceType: 't3.large',
              rootVolume: { size: 35, type: 'gp3' },
              securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
              subnet: { id: 'subnet-067d3045daf35213d' },
            },
            type: 'AWS',
          },
          release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
          replicas: 1,
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2022-08-31T19:02:51Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              message: '',
              status: 'True',
              type: 'Ready',
            },
          ],
        },
      },
    ],
    secretNames: ['feng-hypershift-test-ssh-key', 'local-cluster-pull-secret'],
  },
  isCurator: false,
  isHive: false,
  isHostedCluster: false,
  isHypershift: true,
  isManaged: true,
  isSNOCluster: false,
  isRegionalHubCluster: false,
  kubeApiServer: 'https://a664fd4e2b6034215a0ead32fc530bc0-e526bec562569550.elb.us-east-1.amazonaws.com:6443',
  kubeadmin: 'feng-hypershift-test-kubeadmin-password',
  kubeconfig: 'feng-hypershift-test-admin-kubeconfig',
  labels: {
    cloud: 'Amazon',
    'cluster.open-cluster-management.io/clusterset': 'default',
    clusterID: '49b5fce0-6556-4bec-aa04-81072382c860',
    'feature.open-cluster-management.io/addon-application-manager': 'available',
    'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
    'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
    'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-search-collector': 'available',
    'feature.open-cluster-management.io/addon-work-manager': 'available',
    name: 'feng-hypershift-test',
    openshiftVersion: '4.10.15',
    vendor: 'OpenShift',
  },
  name: 'feng-hypershift-test',
  namespace: 'feng-hypershift-test',
  nodes: {
    nodeList: [
      {
        capacity: { cpu: '2', memory: '8047856Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 't3.large',
          'failure-domain.beta.kubernetes.io/region': 'us-west-2',
          'failure-domain.beta.kubernetes.io/zone': 'us-west-2a',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 't3.large',
        },
        name: 'ip-10-0-134-203.us-west-2.compute.internal',
      },
    ],
    ready: 1,
    unhealthy: 0,
    unknown: 0,
  },
  owner: { createdBy: undefined, claimedBy: undefined },
  provider: Provider.hypershift,
  status: ClusterStatus.ready,
  statusMessage: undefined,
  uid: 'b458380a-7844-43a6-9cd5-31520512d5ad',
}

export const mockBMHypershiftClusterNoNamespace: Cluster = {
  clusterSet: 'default',
  consoleURL: 'https://console-openshift-console.apps.feng-hypershift-test.dev06.red-chesterfield.com',
  creationTimestamp: '2022-08-31T18:54:48Z',
  displayName: 'feng-hypershift-test',
  distribution: {
    displayVersion: 'OpenShift 4.10.15',
    isManagedOpenShift: false,
    k8sVersion: 'v1.23.5+3afdacb',
    ocp: undefined,
  },
  hasAutomationTemplate: false,
  hive: {
    clusterClaimName: undefined,
    clusterPool: undefined,
    clusterPoolNamespace: undefined,
    isHibernatable: false,
    lifetime: undefined,
  },
  hypershift: {
    agent: false,
    hostingNamespace: 'clusters',
    nodePools: [
      {
        apiVersion: 'hypershift.openshift.io/v1alpha1',
        kind: 'NodePool',
        metadata: {
          annotations: {
            'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
            'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
          },
          creationTimestamp: '2022-08-31T18:55:05Z',
          labels: {
            'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
          },
          name: 'feng-hypershift-test',
          namespace: 'clusters',
        },
        spec: {
          clusterName: 'feng-hypershift-test',
          management: {
            autoRepair: false,
            replace: {
              rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
              strategy: 'RollingUpdate',
            },
            upgradeType: 'Replace',
          },
          platform: {
            aws: {
              instanceProfile: 'feng-hypershift-test-mjhpv-worker',
              instanceType: 't3.large',
              rootVolume: { size: 35, type: 'gp3' },
              securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
              subnet: { id: 'subnet-067d3045daf35213d' },
            },
            type: 'AWS',
          },
          release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
          replicas: 1,
        },
        status: {
          conditions: [
            {
              lastTransitionTime: '2022-08-31T19:02:51Z',
              observedGeneration: 1,
              reason: 'AsExpected',
              message: '',
              status: 'True',
              type: 'Ready',
            },
          ],
        },
      },
    ],
    secretNames: ['feng-hypershift-test-ssh-key', 'local-cluster-pull-secret'],
  },
  isCurator: false,
  isHive: false,
  isHostedCluster: false,
  isHypershift: true,
  isManaged: true,
  isSNOCluster: false,
  isRegionalHubCluster: false,
  kubeApiServer: 'https://a664fd4e2b6034215a0ead32fc530bc0-e526bec562569550.elb.us-east-1.amazonaws.com:6443',
  kubeadmin: 'feng-hypershift-test-kubeadmin-password',
  kubeconfig: 'feng-hypershift-test-admin-kubeconfig',
  labels: {
    cloud: 'Amazon',
    'cluster.open-cluster-management.io/clusterset': 'default',
    clusterID: '49b5fce0-6556-4bec-aa04-81072382c860',
    'feature.open-cluster-management.io/addon-application-manager': 'available',
    'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
    'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
    'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-search-collector': 'available',
    'feature.open-cluster-management.io/addon-work-manager': 'available',
    name: 'feng-hypershift-test',
    openshiftVersion: '4.10.15',
    vendor: 'OpenShift',
  },
  name: 'feng-hypershift-test',
  namespace: undefined,
  nodes: {
    nodeList: [
      {
        capacity: { cpu: '2', memory: '8047856Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 't3.large',
          'failure-domain.beta.kubernetes.io/region': 'us-west-2',
          'failure-domain.beta.kubernetes.io/zone': 'us-west-2a',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 't3.large',
        },
        name: 'ip-10-0-134-203.us-west-2.compute.internal',
      },
    ],
    ready: 1,
    unhealthy: 0,
    unknown: 0,
  },
  owner: { createdBy: undefined, claimedBy: undefined },
  provider: Provider.hypershift,
  status: ClusterStatus.ready,
  statusMessage: undefined,
  uid: 'b458380a-7844-43a6-9cd5-31520512d5ad',
}

export const mockAWSHypershiftClusterNoHypershift: Cluster = {
  clusterSet: 'default',
  consoleURL: 'https://console-openshift-console.apps.feng-hypershift-test.dev06.red-chesterfield.com',
  creationTimestamp: '2022-08-31T18:54:48Z',
  displayName: 'feng-hypershift-test',
  distribution: {
    displayVersion: 'OpenShift 4.10.15',
    isManagedOpenShift: false,
    k8sVersion: 'v1.23.5+3afdacb',
    ocp: undefined,
  },
  hasAutomationTemplate: false,
  hive: {
    clusterClaimName: undefined,
    clusterPool: undefined,
    clusterPoolNamespace: undefined,
    isHibernatable: false,
    lifetime: undefined,
  },
  hypershift: undefined,
  isCurator: false,
  isHive: false,
  isHostedCluster: true,
  isHypershift: true,
  isManaged: true,
  isSNOCluster: false,
  isRegionalHubCluster: false,
  kubeApiServer: 'https://a664fd4e2b6034215a0ead32fc530bc0-e526bec562569550.elb.us-east-1.amazonaws.com:6443',
  kubeadmin: 'feng-hypershift-test-kubeadmin-password',
  kubeconfig: 'feng-hypershift-test-admin-kubeconfig',
  labels: {
    cloud: 'Amazon',
    'cluster.open-cluster-management.io/clusterset': 'default',
    clusterID: '49b5fce0-6556-4bec-aa04-81072382c860',
    'feature.open-cluster-management.io/addon-application-manager': 'available',
    'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
    'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
    'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-search-collector': 'available',
    'feature.open-cluster-management.io/addon-work-manager': 'available',
    name: 'feng-hypershift-test',
    openshiftVersion: '4.10.15',
    vendor: 'OpenShift',
  },
  name: 'feng-hypershift-test',
  namespace: 'feng-hypershift-test',
  nodes: {
    nodeList: [
      {
        capacity: { cpu: '2', memory: '8047856Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 't3.large',
          'failure-domain.beta.kubernetes.io/region': 'us-west-2',
          'failure-domain.beta.kubernetes.io/zone': 'us-west-2a',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 't3.large',
        },
        name: 'ip-10-0-134-203.us-west-2.compute.internal',
      },
    ],
    ready: 1,
    unhealthy: 0,
    unknown: 0,
  },
  owner: { createdBy: undefined, claimedBy: undefined },
  provider: Provider.hypershift,
  status: ClusterStatus.ready,
  statusMessage: undefined,
  uid: 'b458380a-7844-43a6-9cd5-31520512d5ad',
}

export const mockMachinePoolManual: MachinePool = {
  apiVersion: MachinePoolApiVersion,
  kind: MachinePoolKind,
  metadata: {
    name: `${clusterName}-manual`,
    namespace: clusterName,
  },
  spec: {
    clusterDeploymentRef: {
      name: clusterName,
    },
    name: 'worker',
    platform: {
      openstack: {
        flavor: 'nova-default',
      },
    },
    replicas: 3,
  },
  status: {
    replicas: 3,
    machineSets: [
      {
        maxReplicas: 1,
        minReplicas: 1,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1a`,
        replicas: 1,
        readyReplicas: 1,
      },
      {
        maxReplicas: 1,
        minReplicas: 1,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1b`,
        replicas: 1,
        readyReplicas: 1,
      },
      {
        maxReplicas: 1,
        minReplicas: 1,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1c`,
        replicas: 1,
        readyReplicas: 1,
      },
      {
        maxReplicas: 0,
        minReplicas: 0,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1d`,
        replicas: 0,
      },
      {
        maxReplicas: 0,
        minReplicas: 0,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1e`,
        replicas: 0,
      },
      {
        maxReplicas: 0,
        minReplicas: 0,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1f`,
        replicas: 0,
      },
    ],
  },
}

export const mockMachinePoolAuto: MachinePool = {
  apiVersion: MachinePoolApiVersion,
  kind: MachinePoolKind,
  metadata: {
    name: `${clusterName}-auto`,
    namespace: clusterName,
  },
  spec: {
    clusterDeploymentRef: {
      name: clusterName,
    },
    name: 'worker',
    platform: {
      aws: {
        rootVolume: {
          iops: 100,
          size: 22,
          type: 'gp2',
        },
        type: 'm4.xlarge',
      },
    },
    autoscaling: {
      minReplicas: 1,
      maxReplicas: 3,
    },
  },
  status: {
    replicas: 3,
    machineSets: [
      {
        maxReplicas: 1,
        minReplicas: 1,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1a`,
        replicas: 1,
      },
      {
        maxReplicas: 1,
        minReplicas: 1,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1b`,
        replicas: 1,
      },
      {
        maxReplicas: 1,
        minReplicas: 1,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1c`,
        replicas: 1,
      },
      {
        maxReplicas: 0,
        minReplicas: 0,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1d`,
        replicas: 0,
      },
      {
        maxReplicas: 0,
        minReplicas: 0,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1e`,
        replicas: 0,
      },
      {
        maxReplicas: 0,
        minReplicas: 0,
        name: `${clusterName}-rxzsv-9k5qn-worker-us-east-1f`,
        replicas: 0,
      },
    ],
  },
}

export const mockMachinePoolOther: MachinePool = {
  apiVersion: MachinePoolApiVersion,
  kind: MachinePoolKind,
  metadata: {
    name: `${clusterName}-other`,
    namespace: clusterName,
  },
  spec: {
    clusterDeploymentRef: {
      name: clusterName,
    },
    name: 'worker',
    platform: {
      ovirt: {
        vmType: 'high_performance',
      },
    },
    replicas: 1,
  },
  status: {
    replicas: 1,
    machineSets: [
      {
        maxReplicas: 1,
        minReplicas: 1,
        name: `${clusterName}-other-ovirt`,
        replicas: 1,
        readyReplicas: 2,
      },
    ],
  },
}

export const mockRegionalHubCluster: Cluster = {
  clusterSet: 'default',
  consoleURL: 'https://console-openshift-console.apps.feng-hypershift-test.dev06.red-chesterfield.com',
  creationTimestamp: '2022-08-31T18:54:48Z',
  displayName: 'feng-hypershift-test',
  distribution: {
    displayVersion: 'OpenShift 4.10.15',
    isManagedOpenShift: false,
    k8sVersion: 'v1.23.5+3afdacb',
    ocp: undefined,
  },
  acmConsoleURL: '',
  acmDistribution: {
    version: '2.7.0',
    channel: 'release-2.7',
  },
  hasAutomationTemplate: false,
  hive: {
    clusterClaimName: undefined,
    clusterPool: undefined,
    clusterPoolNamespace: undefined,
    isHibernatable: false,
    lifetime: undefined,
  },
  hypershift: undefined,
  isCurator: false,
  isHive: false,
  isHostedCluster: true,
  isHypershift: true,
  isManaged: true,
  isSNOCluster: false,
  isRegionalHubCluster: true,
  kubeApiServer: 'https://a664fd4e2b6034215a0ead32fc530bc0-e526bec562569550.elb.us-east-1.amazonaws.com:6443',
  kubeadmin: 'feng-hypershift-test-kubeadmin-password',
  kubeconfig: 'feng-hypershift-test-admin-kubeconfig',
  labels: {
    cloud: 'Amazon',
    'cluster.open-cluster-management.io/clusterset': 'default',
    clusterID: '49b5fce0-6556-4bec-aa04-81072382c860',
    'feature.open-cluster-management.io/addon-application-manager': 'available',
    'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
    'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
    'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
    'feature.open-cluster-management.io/addon-search-collector': 'available',
    'feature.open-cluster-management.io/addon-work-manager': 'available',
    'feature.open-cluster-management.io/addon-multicluster-global-hub-controller': 'available',
    name: 'feng-hypershift-test',
    openshiftVersion: '4.10.15',
    vendor: 'OpenShift',
  },
  name: 'feng-hypershift-test',
  namespace: 'feng-hypershift-test',
  nodes: {
    nodeList: [
      {
        capacity: { cpu: '2', memory: '8047856Ki' },
        conditions: [{ status: 'True', type: 'Ready' }],
        labels: {
          'beta.kubernetes.io/instance-type': 't3.large',
          'failure-domain.beta.kubernetes.io/region': 'us-west-2',
          'failure-domain.beta.kubernetes.io/zone': 'us-west-2a',
          'node-role.kubernetes.io/worker': '',
          'node.kubernetes.io/instance-type': 't3.large',
        },
        name: 'ip-10-0-134-203.us-west-2.compute.internal',
      },
    ],
    ready: 1,
    unhealthy: 0,
    unknown: 0,
  },
  owner: { createdBy: undefined, claimedBy: undefined },
  provider: Provider.hypershift,
  status: ClusterStatus.ready,
  statusMessage: undefined,
  uid: 'b458380a-7844-43a6-9cd5-31520512d5ad',
}
