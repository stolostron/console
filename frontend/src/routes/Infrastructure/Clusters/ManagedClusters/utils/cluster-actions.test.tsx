/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import { Provider } from '../../../../../ui-components'
import { clusterDestroyable } from './cluster-actions'

describe('ClusterDestroyable', () => {
  test('hive clusters should return true', () => {
    const mockCluster: Cluster = {
      name: 'test-cluster',
      displayName: 'test-cluster',
      namespace: 'test-cluster',
      uid: 'test-cluster-uid',
      status: ClusterStatus.ready,
      distribution: {
        k8sVersion: '1.19',
        ocp: {
          version: '4.6',
          availableUpdates: [],
          desiredVersion: '4.6',
          upgradeFailed: false,
        },
        displayVersion: '4.6',
        isManagedOpenShift: false,
      },
      labels: undefined,
      nodes: undefined,
      kubeApiServer: '',
      consoleURL: '',
      hasAutomationTemplate: false,
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
      isHostedCluster: false,
      isSNOCluster: false,
      owner: {},
      kubeconfig: '',
      kubeadmin: 'test-cluster-0-fk6c9-admin-password',
      isHypershift: false,
      isRegionalHubCluster: false,
    }
    expect(clusterDestroyable(mockCluster)).toBe(true)
  })

  test('hosted BM clusters should return true', () => {
    const mockBareMetalCluster: Cluster = {
      name: 'hypershift-cluster1',
      displayName: 'hypershift-cluster1',
      namespace: 'clusters',
      uid: 'hypershift-cluster1-uid',
      provider: Provider.hostinventory,
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
    expect(clusterDestroyable(mockBareMetalCluster)).toBe(true)
  })

  test('hosted BM clusters should return true', () => {
    const mockKubeVirtCluster: Cluster = {
      name: 'hypershift-cluster1',
      displayName: 'hypershift-cluster1',
      namespace: 'clusters',
      uid: 'hypershift-cluster1-uid',
      provider: Provider.kubevirt,
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
    expect(clusterDestroyable(mockKubeVirtCluster)).toBe(true)
  })

  test('hosted BM clusters should return true', () => {
    const mockHostedAWSCluster: Cluster = {
      name: 'hypershift-cluster1',
      displayName: 'hypershift-cluster1',
      namespace: 'clusters',
      uid: 'hypershift-cluster1-uid',
      provider: Provider.aws,
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
    expect(clusterDestroyable(mockHostedAWSCluster)).toBe(false)
  })
})
