/* Copyright Contributors to the Open Cluster Management project */
import { HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import { importHostedControlPlaneCluster } from './HypershiftImportCommand'
import { nockIgnoreApiPaths, nockPostRequest } from '../../../../../lib/nock-util'
import { KlusterletAddonConfig, ManagedCluster, Namespace } from '../../../../../resources'
import { ResourceError } from '../../../../../resources/utils'

const mockHostedCluster: HostedClusterK8sResource = {
  apiVersion: 'hypershift.openshift.io/v1alpha1',
  kind: 'HostedCluster',
  metadata: {
    name: 'feng-test',
    namespace: 'feng-test',
  },
  spec: {
    fips: false,
    release: {
      image: 'quay.io/openshift-release-dev/ocp-release:4.11.9-x86_64',
    },
    dns: {
      baseDomain: 'dev06.red-chesterfield.com',
    },
    controllerAvailabilityPolicy: 'SingleReplica',
    infraID: 'feng-test',
    etcd: {
      managed: {
        storage: {
          persistentVolume: {
            size: '4Gi',
          },
          type: 'PersistentVolume',
        },
      },
      managementType: 'Managed',
    },
    infrastructureAvailabilityPolicy: 'SingleReplica',
    platform: {
      agent: {
        agentNamespace: 'agent-test2',
      },
      type: 'Agent',
    },
    networking: {
      clusterNetwork: [
        {
          cidr: '10.132.0.0/14',
        },
      ],
      machineNetwork: [
        {
          cidr: '10.1.158.0/24',
        },
      ],
      networkType: 'OVNKubernetes',
      serviceNetwork: [
        {
          cidr: '172.31.0.0/16',
        },
      ],
    },
    clusterID: 'dff4fe12-de44-4b6f-a78d-16e831234b07',
    pullSecret: {
      name: 'pullsecret-cluster-feng-test',
    },
    issuerURL: 'https://kubernetes.default.svc',
    sshKey: {
      name: 'sshkey-cluster-feng-test',
    },
    autoscaling: {},
    olmCatalogPlacement: 'management',
    services: [
      {
        service: 'APIServer',
        servicePublishingStrategy: {
          nodePort: {
            address: '10.1.158.55',
          },
          type: 'NodePort',
        },
      },
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
  status: {
    conditions: [
      {
        lastTransitionTime: '2022-10-24T20:34:08Z',
        message: 'Reconciliation completed succesfully',
        observedGeneration: 3,
        reason: 'ReconciliatonSucceeded',
        status: 'True',
        type: 'ReconciliationSucceeded',
      },
      {
        lastTransitionTime: '2022-11-03T19:52:46Z',
        message:
          'Some cluster operators are still updating: console, csi-snapshot-controller, dns, image-registry, insights, kube-storage-version-migrator, monitoring, network, openshift-samples, service-ca, storage',
        observedGeneration: 3,
        reason: 'ClusterOperatorsNotAvailable',
        status: 'False',
        type: 'ClusterVersionSucceeding',
      },
      {
        lastTransitionTime: '2022-10-24T20:42:58Z',
        message:
          'Kubernetes 1.25 and therefore OpenShift 4.12 remove several APIs which require admin consideration. Please see the knowledge article https://access.redhat.com/articles/6955381 for details and instructions.',
        observedGeneration: 1,
        reason: 'AdminAckRequired',
        status: 'False',
        type: 'ClusterVersionUpgradeable',
      },
      {
        lastTransitionTime: '2022-11-03T12:48:06Z',
        message: 'The hosted cluster is not degraded',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'False',
        type: 'Degraded',
      },
      {
        lastTransitionTime: '2022-10-24T20:42:05Z',
        message: 'The hosted control plane is available',
        observedGeneration: 3,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'Available',
      },
      {
        lastTransitionTime: '2022-10-24T20:34:08Z',
        message: 'Configuration passes validation',
        observedGeneration: 3,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'ValidConfiguration',
      },
      {
        lastTransitionTime: '2022-10-24T20:34:08Z',
        message: 'HostedCluster is supported by operator configuration',
        observedGeneration: 3,
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'SupportedHostedCluster',
      },
      {
        lastTransitionTime: '2022-10-24T20:34:23Z',
        message: 'Configuration passes validation',
        reason: 'HostedClusterAsExpected',
        status: 'True',
        type: 'ValidHostedControlPlaneConfiguration',
      },
      {
        lastTransitionTime: '2022-10-24T20:35:36Z',
        message: 'Ignition server deployent is available',
        observedGeneration: 3,
        reason: 'IgnitionServerDeploymentAsExpected',
        status: 'True',
        type: 'IgnitionEndpointAvailable',
      },
      {
        lastTransitionTime: '2022-10-24T20:34:08Z',
        message: 'Reconciliation active on resource',
        observedGeneration: 3,
        reason: 'ReconciliationActive',
        status: 'True',
        type: 'ReconciliationActive',
      },
      {
        lastTransitionTime: '2022-10-24T20:34:09Z',
        message: 'Release image is valid',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'True',
        type: 'ValidReleaseImage',
      },
      {
        lastTransitionTime: '2022-10-24T20:34:08Z',
        message: 'HostedCluster is at expected version',
        observedGeneration: 3,
        reason: 'AsExpected',
        status: 'False',
        type: 'Progressing',
      },
    ],
    ignitionEndpoint: 'ignition-server-feng-test-feng-test.apps.slot-09.dev06.red-chesterfield.com',
    kubeadminPassword: {
      name: 'feng-test-kubeadmin-password',
    },
    kubeconfig: {
      name: 'feng-test-admin-kubeconfig',
    },
    oauthCallbackURLTemplate:
      'https://oauth-feng-test-feng-test.apps.slot-09.dev06.red-chesterfield.com:443/oauthcallback/[identity-provider-name]',
    version: {
      desired: {
        image: 'quay.io/openshift-release-dev/ocp-release:4.11.9-x86_64',
      },
      history: [
        {
          completionTime: '',
          image: 'quay.io/openshift-release-dev/ocp-release:4.11.9-x86_64',
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

const t = (string: string) => {
  return string
}

const toastContextMock: any = {
  addAlert: jest.fn(),
}

const namespace: Namespace = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'feng-test',
  },
}

const managedCluster: ManagedCluster = {
  apiVersion: 'cluster.open-cluster-management.io/v1',
  kind: 'ManagedCluster',
  metadata: {
    name: 'feng-test',
    labels: {
      cloud: 'auto-detect',
      'cluster.open-cluster-management.io/clusterset': 'default',
      name: 'feng-test',
      vendor: 'OpenShift',
    },
    annotations: {
      'import.open-cluster-management.io/hosting-cluster-name': 'local-cluster',
      'import.open-cluster-management.io/klusterlet-deploy-mode': 'Hosted',
      'open-cluster-management/created-via': 'hypershift',
    },
  },
  spec: {
    hubAcceptsClient: true,
  },
}

const kac: KlusterletAddonConfig = {
  apiVersion: 'agent.open-cluster-management.io/v1',
  kind: 'KlusterletAddonConfig',
  metadata: {
    name: 'feng-test',
    namespace: 'feng-test',
  },
  spec: {
    clusterName: 'feng-test',
    clusterNamespace: 'feng-test',
    clusterLabels: {
      cloud: 'auto-detect',
      'cluster.open-cluster-management.io/clusterset': 'default',
      name: 'feng-test',
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

describe('HypershiftImportCommand import HCP', () => {
  it('should import HCP - MCE', async () => {
    nockIgnoreApiPaths()
    nockPostRequest('/api/v1/namespaces', namespace, 200)
    nockPostRequest('/apis/cluster.open-cluster-management.io/v1/managedclusters', managedCluster, 200)
    nockPostRequest('/apis/agent.open-cluster-management.io/v1/namespaces/feng-test/klusterletaddonconfigs', kac, 400)
    const requestResult = importHostedControlPlaneCluster(mockHostedCluster, t, toastContextMock, false)

    let errCode = 200
    try {
      await requestResult?.promise
    } catch (err) {
      errCode = (err as ResourceError).code
    }
    expect(errCode).toEqual(400)
  })

  it('should import HCP - ACM', async () => {
    nockIgnoreApiPaths()
    nockPostRequest('/api/v1/namespaces', namespace, 200)
    nockPostRequest('/apis/cluster.open-cluster-management.io/v1/managedclusters', managedCluster, 200)
    nockPostRequest('/apis/agent.open-cluster-management.io/v1/namespaces/feng-test/klusterletaddonconfigs', kac, 404)
    const requestResult = importHostedControlPlaneCluster(mockHostedCluster, t, toastContextMock, true)

    let errCode = 200
    try {
      await requestResult?.promise
    } catch (err) {
      errCode = (err as ResourceError).code
    }
    expect(errCode).toEqual(404)
  })
})
