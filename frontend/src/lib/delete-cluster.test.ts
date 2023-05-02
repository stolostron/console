/* Copyright Contributors to the Open Cluster Management project */

import { detachCluster } from './delete-cluster'
import { Cluster, ClusterStatus } from '../resources'
import { nockIgnoreApiPaths } from './nock-util'

const mockCluster1: Cluster = {
  name: 'hypershift-cluster1',
  displayName: 'hypershift-cluster1',
  namespace: 'clusters',
  uid: 'hypershift-cluster1-uid',
  provider: undefined,
  status: ClusterStatus.ready,
  distribution: {
    ocp: {
      version: '4.11.12',
      availableUpdates: [],
      desiredVersion: '4.11.12',
      upgradeFailed: false,
    },
    isManagedOpenShift: false,
  },
  labels: { abc: '123' },
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    secrets: {
      installConfig: '',
    },
  },
  hypershift: {
    agent: false,
    hostingNamespace: 'clusters',
    nodePools: [],
    secretNames: ['feng-hs-bug-ssh-key', 'feng-hs-bug-pull-secret'],
  },
  isHive: false,
  isManaged: true,
  isCurator: true,
  hasAutomationTemplate: false,
  isHostedCluster: true,
  isHypershift: true,
  isSNOCluster: false,
  owner: {},
  kubeadmin: '',
  kubeconfig: '',
  isRegionalHubCluster: false,
}

const mockCluster2: Cluster = {
  name: 'hypershift-cluster1',
  displayName: 'hypershift-cluster1',
  namespace: 'clusters',
  uid: 'hypershift-cluster1-uid',
  provider: undefined,
  status: ClusterStatus.ready,
  distribution: {
    ocp: {
      version: '4.11.12',
      availableUpdates: [],
      desiredVersion: '4.11.12',
      upgradeFailed: false,
    },
    isManagedOpenShift: false,
  },
  labels: { abc: '123' },
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    secrets: {
      installConfig: '',
    },
  },
  isHive: false,
  isManaged: true,
  isCurator: true,
  hasAutomationTemplate: false,
  isHostedCluster: true,
  isHypershift: true,
  isSNOCluster: false,
  owner: {},
  kubeadmin: '',
  kubeconfig: '',
  isRegionalHubCluster: false,
}

describe('detachCluster normal operation', () => {
  nockIgnoreApiPaths()
  it('detachCluster normal operation', () => {
    detachCluster(mockCluster1)
  })
})

describe('detachCluster no hypershift', () => {
  nockIgnoreApiPaths()
  it('detachCluster no hypershift', () => {
    detachCluster(mockCluster2)
  })
})
