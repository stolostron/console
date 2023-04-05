/* Copyright Contributors to the Open Cluster Management project */
import { cloneDeep } from 'lodash'
import { CIM } from 'openshift-assisted-ui-lib'
import { ClusterImageSetApiVersion, ClusterImageSetKind, ConfigMap } from '../../../../../resources'

export const clusterName = 'test'
export const baseDomain = 'base.domain.com'

export const mockConfigMapAI: ConfigMap = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
  metadata: {
    name: 'assisted-service-config',
    namespace: 'assisted-installer',
  },
  data: {},
}

export const mockClusterDeploymentAI: CIM.ClusterDeploymentK8sResource = {
  apiVersion: 'hive.openshift.io/v1',
  kind: 'ClusterDeployment',
  metadata: {
    annotations: {
      'agentBareMetal-agentSelector/autoSelect': 'true',
      'agentBareMetal-cpuArchitecture': 'x86_64',
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
      name: 'pullsecret-cluster-test',
    },
  },
}

export const mockAgentClusterInstall: CIM.AgentClusterInstallK8sResource = {
  apiVersion: 'extensions.hive.openshift.io/v1beta1',
  kind: 'AgentClusterInstall',
  metadata: { name: 'test', namespace: 'test' },
  spec: {
    clusterDeploymentRef: { name: 'test' },
    holdInstallation: true,
    provisionRequirements: { workerAgents: 0, controlPlaneAgents: 3 },
    imageSetRef: { name: 'ocp-release48' },
    networking: {
      clusterNetwork: [{ cidr: '10.128.0.0/14', hostPrefix: 23 }],
      serviceNetwork: ['172.30.0.0/16'],
    },
  } as any,
}

const mockAgent = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'Agent',
  metadata: {
    labels: {
      'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
      'infraenvs.agent-install.openshift.io': clusterName,
    },
    name: '0f093a00-5df8-40d7-840f-bca56216471',
    namespace: clusterName,
    uid: '0f093a00-5df8-40d7-840f-bca56216471_',
  },
  spec: {
    approved: true,
    clusterDeploymentName: {
      name: clusterName,
      namespace: clusterName,
    },
    hostname: 'host',
    role: '',
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

export const mockAgents = Array.from({ length: 5 }, (_val, index) => {
  const mockedAgent = cloneDeep(mockAgent)
  mockedAgent.metadata.name = `${mockedAgent.metadata.name}${index}`
  mockedAgent.metadata.uid = mockedAgent.metadata.name
  mockedAgent.spec.hostname = `${mockedAgent.spec.hostname}-${index}`
  return mockedAgent
})

export const clusterImageSet: CIM.ClusterImageSetK8sResource = {
  apiVersion: ClusterImageSetApiVersion,
  kind: ClusterImageSetKind,
  metadata: {
    name: 'ocp-release48',
  },
  spec: {
    releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.8.15-x86_64',
  },
}
export const mockClusterImageSet = [clusterImageSet]
