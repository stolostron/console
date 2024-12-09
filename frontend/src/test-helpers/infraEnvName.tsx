/* Copyright Contributors to the Open Cluster Management project */
import { InfraEnvK8sResource, SecretK8sResource } from '@openshift-assisted/ui-lib/cim'

export const infraEnvName = 'infra-env-name'

export const mockInfraEnv1: InfraEnvK8sResource = {
  apiVersion: 'agent-install.openshift.io/v1beta1',
  kind: 'InfraEnv',
  metadata: {
    labels: {
      'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
      networkType: 'dhcp',
    },
    name: infraEnvName,
    namespace: infraEnvName,
  },
  spec: {
    agentLabels: {
      'agentclusterinstalls.extensions.hive.openshift.io/location': 'brno',
    },
    pullSecretRef: {
      name: `pullsecret-${infraEnvName}`,
    },
    cpuArchitecture: 'x86_64',
  },
  status: {
    agentLabelSelector: {
      matchLabels: {
        'infraenvs.agent-install.openshift.io': infraEnvName,
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

export const mockPullSecret: SecretK8sResource = {
  apiVersion: 'v1',
  kind: 'Secret',
  metadata: {
    name: `pullsecret-${infraEnvName}`,
    namespace: infraEnvName,
    labels: { 'cluster.open-cluster-management.io/backup': 'cluster' },
  },
  data: {
    '.dockerconfigjson':
      'eyJhdXRocyI6eyJjbG91ZC5vcGVuc2hpZnQuY29tIjp7ImF1dGgiOiJiM0JsYlNLSVBQRUQiLCJlbWFpbCI6Im15QGVtYWlsLnNvbWV3aGVyZS5jb20ifX19',
  },
  type: 'kubernetes.io/dockerconfigjson',
}
