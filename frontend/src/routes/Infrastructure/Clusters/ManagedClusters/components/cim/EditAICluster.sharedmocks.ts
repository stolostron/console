/* Copyright Contributors to the Open Cluster Management project */
import { cloneDeep } from 'lodash'
import set from 'lodash/set'
import { CIM } from 'openshift-assisted-ui-lib'
import { AgentK8sResource } from 'openshift-assisted-ui-lib/cim'

import { ClusterImageSet, ClusterImageSetApiVersion, ClusterImageSetKind, ConfigMap } from '../../../../../../resources'

export const clusterName = 'my-cluster-name'
export const baseDomain = 'base.domain.com'

export const mockInfraEnv1: CIM.InfraEnvK8sResource = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'InfraEnv',
  metadata: {
    labels: {
      'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
      networkType: 'dhcp',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    agentLabels: {
      'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
    },
    pullSecretRef: {
      name: `pullsecret-${clusterName}`,
    },
  },
  status: {
    agentLabelSelector: {
      matchLabels: {
        'infraenvs.agent-install.openshift.io': clusterName,
      },
    },
    conditions: [
      {
        lastTransitionTime: '2021-10-04T11:26:37Z',
        message: 'Image has been created',
        reason: 'ImageCreated',
        status: 'True',
        type: 'ImageCreated',
      },
    ],
    createdTime: '2021-11-10T13:00:00Z',
    isoDownloadURL: 'https://my.funny.download.url',
  },
}

export const mockClusterImageSet: ClusterImageSet = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
  metadata: {
    name: 'ocp-release48',
  },
  spec: {
    releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.15-x86_64',
  },
}

export const mockClusterDeploymentAI: CIM.ClusterDeploymentK8sResource = {
  apiVersion: 'hive.openshift.io/v1',
  kind: 'ClusterDeployment',
  metadata: {
    annotations: {
      'agentBareMetal-agentSelector/autoSelect': 'true',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    baseDomain,
    clusterInstallRef: {
      group: 'extensions.hive.openshift.io',
      kind: 'AgentClusterInstall',
      name: clusterName,
      version: 'v1beta1',
    },
    clusterName,
    platform: {
      agentBareMetal: {
        agentSelector: {},
      },
    },
    pullSecretRef: {
      name: `pullsecret-cluster-${clusterName}`,
    },
  },
}

export const mockAgentClusterInstall: CIM.AgentClusterInstallK8sResource = {
  apiVersion: 'extensions.hive.openshift.io/v1beta1',
  kind: 'AgentClusterInstall',
  metadata: {
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    clusterDeploymentRef: { name: clusterName },
    holdInstallation: true,
    provisionRequirements: { controlPlaneAgents: 3 },
    imageSetRef: { name: 'ocp-release48' },
    networking: {
      clusterNetwork: [{ cidr: '10.128.0.0/14', hostPrefix: 23 }],
      serviceNetwork: ['172.30.0.0/16'],
    },
    platformType: 'None',
  },
}

export const mockConfigMapAI: ConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'assisted-service-config',
    namespace: 'assisted-installer',
  },
  data: {},
}

export const mockAgent: AgentK8sResource = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'Agent',
  metadata: {
    labels: {
      'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
      'infraenvs.agent-install.openshift.io': clusterName,
    },
    name: '0f093a00-5df8-40d7-840f-bca56216471',
    namespace: clusterName,
  },
  spec: {
    approved: true,
    clusterDeploymentName: {
      name: clusterName,
      namespace: clusterName,
    },
    hostname: 'host',
    role: 'auto-assign',
  },
  status: {
    conditions: [],
    debugInfo: {
      state: 'known',
      stateInfo: '',
    },
    inventory: {},
    ntpSources: [],
    progress: {},
    role: 'auto-assign',
  },
}

export const mockAgents: AgentK8sResource[] = Array.from({ length: 5 }, (_val, index) => {
  const mockedAgent = cloneDeep(mockAgent)
  set(mockedAgent, 'metadata.name', `${mockedAgent.metadata?.name}${index}`)
  mockedAgent.spec.hostname = `${mockedAgent.spec.hostname}-${index}`
  return mockedAgent
})

export const mockNMStateConfig = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'NMStateConfig',
  metadata: {
    labels: {
      'some-user-defined-label-name': 'some-user-defined-label-value',
    },
    name: clusterName,
    namespace: clusterName,
  },
  spec: {
    config: {
      'dns-resolver': {
        config: {
          server: ['192.168.1.239', '192.168.7.1'],
        },
      },
      interfaces: [
        {
          ethernet: {
            'auto-negotiation': true,
            duplex: 'full',
            speed: 1000,
          },
          ipv4: {
            address: [
              {
                ip: '192.168.7.9',
                'prefix-length': 24,
              },
            ],
            enabled: true,
          },
          'mac-address': '02:00:00:80:12:14',
          mtu: 1500,
          name: 'eno1',
          state: 'up',
          type: 'ethernet',
        },
      ],
      routes: {
        config: [
          {
            destination: '0.0.0.0/0',
            'next-hop-address': '192.168.7.1',
            'next-hop-interface': 'eno1',
          },
        ],
      },
    },
    interfaces: [
      {
        macAddress: '02:00:00:80:12:14',
        name: 'eno1',
      },
    ],
  },
}

export const pullSecretMock = {
  kind: 'Secret',
  apiVersion: 'v1',
  metadata: {
    name: `pullsecret-cluster-${clusterName}`,
    namespace: clusterName,
    labels: {
      'agent-install.openshift.io/watch': 'true',
      'cluster.open-cluster-management.io/backup': 'cluster',
    },
    data: {
      '.dockerconfigjson': 'foo',
      type: 'kubernetes.io/dockerconfigjson',
    },
  },
}

export const managedClusterMock = {
  apiVersion: 'cluster.open-cluster-management.io/v1',
  kind: 'ManagedCluster',
  metadata: {
    name: clusterName,
    namespace: undefined,
    labels: {
      name: clusterName,
    },
  },
  spec: {
    hubAcceptsClient: true,
    leaseDurationSeconds: 60,
  },
}

export const klusterletMock = {
  apiVersion: 'agent.open-cluster-management.io/v1',
  kind: 'KlusterletAddonConfig',
  metadata: {
    name: clusterName,
    namespace: clusterName,
  },
  spec: {},
}
