/* Copyright Contributors to the Open Cluster Management project */
import {
  DiscoveredCluster,
  DiscoveryConfig,
  DiscoveryConfigApiVersion,
  DiscoveryConfigKind,
  Secret,
  SecretApiVersion,
  SecretKind,
  SelfSubjectAccessReview,
} from '../../../../../resources'
import { Provider } from '../../../../../ui-components'

export const mockDiscoveredClusters: DiscoveredCluster[] = [
  {
    apiVersion: 'discovery.open-cluster-management.io/v1',
    kind: 'DiscoveredCluster',
    metadata: { name: 'test-cluster-01', namespace: 'alpha' },
    spec: {
      activityTimestamp: '2020-07-30T19:09:43Z',
      cloudProvider: 'aws',
      isManagedCluster: false,
      console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
      creationTimestamp: '2020-07-30T19:09:43Z',
      name: 'test-cluster-01',
      displayName: 'test-cluster-01',
      openshiftVersion: '4.5.5',
      type: 'OCP',
      apiUrl: 'https://api.test-cluster-01.dev01.red-chesterfield.com:6443',
      credential: {
        apiVersion: 'v1',
        kind: 'Secret',
        name: 'ocm-api-token',
        namespace: 'open-cluster-management',
        resourceVersion: '2673462626',
        uid: '8e103e5d-0267-4872-b185-1240e413d7b4',
      },
      status: 'Active',
    },
  },
  {
    apiVersion: 'discovery.open-cluster-management.io/v1',
    kind: 'DiscoveredCluster',
    metadata: { name: 'test-cluster-02', namespace: 'discovered-cluster-namespace' },
    spec: {
      activityTimestamp: '2020-07-30T19:09:43Z',
      apiUrl: 'https://api.test-cluster-02.dev01.red-chesterfield.com:6443',
      cloudProvider: 'gcp',
      isManagedCluster: false,
      displayName: 'test-cluster-02',
      console: 'https://console-openshift-console.apps.test-cluster-02.dev01.red-chesterfield.com',
      creationTimestamp: '2020-07-30T19:09:43Z',
      name: 'test-cluster-02',
      openshiftVersion: '4.6.1',
      status: 'Stale',
      type: 'OCP',
    },
  },
  {
    apiVersion: 'discovery.open-cluster-management.io/v1',
    kind: 'DiscoveredCluster',
    metadata: { name: 'test-cluster-03', namespace: 'discovered-cluster-namespace' },
    spec: {
      activityTimestamp: '2020-07-30T19:09:43Z',
      apiUrl: 'https://api.test-cluster-03.dev01.red-chesterfield.com:6443',
      cloudProvider: 'openstack',
      isManagedCluster: true,
      displayName: 'test-cluster-03',
      console: 'https://console-openshift-console.apps.test-cluster-03.dev01.red-chesterfield.com',
      creationTimestamp: '2020-07-30T19:09:43Z',
      name: 'test-cluster-03',
      openshiftVersion: '4.6.1',
      type: 'OCP',
      status: 'Stale',
    },
  },
]

export const mockRHOCMSecrets: Secret[] = [
  {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
      name: 'ocm-api-token',
      namespace: 'ocm',
      labels: {
        'cluster.open-cluster-management.io/type': Provider.redhatcloud,
        'cluster.open-cluster-management.io/credentials': '',
      },
    },
    type: 'Opaque',
  },
  {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
      name: 'ocm-api-token2',
      namespace: 'ocm2',
      labels: {
        'cluster.open-cluster-management.io/type': Provider.redhatcloud,
      },
    },
    type: 'Opaque',
  },
]

export const discoveryConfig: DiscoveryConfig = {
  apiVersion: DiscoveryConfigApiVersion,
  kind: DiscoveryConfigKind,
  metadata: {
    name: 'discovery',
    namespace: mockRHOCMSecrets[0].metadata.namespace!,
  },
  spec: {
    filters: {
      lastActive: 14,
      openShiftVersions: ['4.20'],
      clusterTypes: ['ROSA', 'MOA', 'OCP', 'OCP-AssistedInstall'],
      infrastructureProviders: ['aws', 'azure'],
    },
    credential: mockRHOCMSecrets[0].metadata.name!,
  },
}

export const minDiscoveryConfig: DiscoveryConfig = {
  apiVersion: DiscoveryConfigApiVersion,
  kind: DiscoveryConfigKind,
  metadata: {
    name: 'discovery',
    namespace: mockRHOCMSecrets[0].metadata.namespace!,
  },
  spec: {
    filters: {
      lastActive: 7,
    },
    credential: mockRHOCMSecrets[0].metadata.name!,
  },
}

export const discoveryConfigUpdated: DiscoveryConfig = {
  apiVersion: DiscoveryConfigApiVersion,
  kind: DiscoveryConfigKind,
  metadata: {
    name: 'discovery',
    namespace: mockRHOCMSecrets[0].metadata.namespace,
  },
  spec: {
    filters: {
      lastActive: 30,
      openShiftVersions: ['4.20', '4.21'],
      clusterTypes: ['ROSA', 'MOA', 'OCP', 'OCP-AssistedInstall'],
      infrastructureProviders: ['aws', 'azure'],
    },
    credential: mockRHOCMSecrets[0].metadata.name!,
  },
}

export const discoveryConfigCreateSelfSubjectAccessRequest: SelfSubjectAccessReview = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'discoveryconfigs',
      verb: 'create',
      group: 'discovery.open-cluster-management.io',
      namespace: discoveryConfig.metadata.namespace,
      name: 'discovery',
    },
  },
}

export const discoveryConfigCreateSelfSubjectAccessResponse: SelfSubjectAccessReview = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'discoveryconfigs',
      verb: 'create',
      group: 'discovery.open-cluster-management.io',
      namespace: discoveryConfig.metadata.namespace,
      name: 'discovery',
    },
  },
  status: {
    allowed: true,
  },
}

export const discoveryConfigUpdateSelfSubjectAccessRequest: SelfSubjectAccessReview = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'discoveryconfigs',
      verb: 'update',
      group: 'discovery.open-cluster-management.io',
      namespace: discoveryConfig.metadata.namespace,
      name: 'discovery',
    },
  },
}

export const discoveryConfigUpdateSelfSubjectAccessResponse: SelfSubjectAccessReview = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'discoveryconfigs',
      verb: 'update',
      group: 'discovery.open-cluster-management.io',
      namespace: discoveryConfig.metadata.namespace,
      name: 'discovery',
    },
  },
  status: {
    allowed: true,
  },
}

export const secretCreateSelfSubjectAccessRequest: SelfSubjectAccessReview = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'secrets',
      verb: 'create',
      group: '',
    },
  },
}

export const secretCreateSelfSubjectAccessResponse: SelfSubjectAccessReview = {
  apiVersion: 'authorization.k8s.io/v1',
  kind: 'SelfSubjectAccessReview',
  metadata: {},
  spec: {
    resourceAttributes: {
      resource: 'secrets',
      verb: 'create',
      group: '',
    },
  },
  status: {
    allowed: true,
  },
}
