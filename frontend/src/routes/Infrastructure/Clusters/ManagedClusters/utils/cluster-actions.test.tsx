/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import { Provider } from '../../../../../ui-components'
import {
  automationCuratorNamespace,
  automationSecretName,
  ClusterAction,
  clusterDestroyable,
  clusterSupportsAction,
} from './cluster-actions'

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

describe('clusterSupportsAction UpdateAutomationTemplate', () => {
  const baseCluster: Cluster = {
    name: 'test-cluster',
    displayName: 'test-cluster',
    namespace: 'test-cluster',
    uid: 'test-cluster-uid',
    status: ClusterStatus.ready,
    distribution: {
      ocp: {
        version: '4.13',
        availableUpdates: [],
        desiredVersion: '4.13',
        upgradeFailed: false,
      },
      isManagedOpenShift: false,
      upgradeInfo: {
        upgradeFailed: false,
        isUpgrading: false,
        isReadyUpdates: false,
        isReadySelectChannels: false,
        availableUpdates: [],
        currentVersion: '4.13',
        desiredVersion: '4.13',
        latestJob: {},
      },
    },
    labels: { cloud: 'aws' },
    kubeApiServer: '',
    consoleURL: '',
    hasAutomationTemplate: true,
    hive: { isHibernatable: false, secrets: {} },
    isHive: false,
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    owner: {},
    kubeadmin: '',
    kubeconfig: '',
    isHypershift: false,
    isRegionalHubCluster: false,
  }

  test('standalone OCP cluster should support update automation template', () => {
    expect(clusterSupportsAction(baseCluster, ClusterAction.UpdateAutomationTemplate)).toBe(true)
  })

  test('HCP cluster should support update automation template regardless of platform', () => {
    const providers = [Provider.aws, Provider.kubevirt, Provider.hostinventory, Provider.azure]
    providers.forEach((provider) => {
      const hcpCluster: Cluster = {
        ...baseCluster,
        provider,
        isHostedCluster: true,
        isHypershift: true,
      }
      expect(clusterSupportsAction(hcpCluster, ClusterAction.UpdateAutomationTemplate)).toBe(true)
    })
  })
})

// ACM-41796: Update/Remove automation template actions must resolve the ClusterCurator's real
// namespace and Secret name for Hosted Control Plane clusters, which share a namespace instead of
// using a Hive-style namespace-per-cluster layout.
describe('automation namespace/secret naming (ACM-39253/ACM-41796)', () => {
  test('automationCuratorNamespace falls back to the cluster name when namespace is unset (Hive-style)', () => {
    expect(automationCuratorNamespace({ name: 'mycluster' } as Cluster)).toEqual('mycluster')
    expect(automationCuratorNamespace({ name: 'mycluster', namespace: 'mycluster' } as Cluster)).toEqual('mycluster')
  })

  test('automationCuratorNamespace resolves the shared hosted namespace for HCP clusters', () => {
    expect(automationCuratorNamespace({ name: 'hcp-cluster-1', namespace: 'clusters' } as Cluster)).toEqual('clusters')
  })

  test('automationSecretName is undifferentiated when the namespace matches the cluster name', () => {
    expect(automationSecretName('install', { name: 'mycluster', namespace: 'mycluster' } as Cluster)).toEqual(
      'toweraccess-install'
    )
    expect(automationSecretName('upgrade', { name: 'mycluster' } as Cluster)).toEqual('toweraccess-upgrade')
  })

  test('automationSecretName is differentiated by cluster name when the namespace is shared', () => {
    expect(automationSecretName('install', { name: 'hcp-cluster-1', namespace: 'clusters' } as Cluster)).toEqual(
      'toweraccess-install-hcp-cluster-1'
    )
    expect(automationSecretName('destroy', { name: 'hcp-cluster-2', namespace: 'clusters' } as Cluster)).toEqual(
      'toweraccess-destroy-hcp-cluster-2'
    )
  })
})

describe('clusterSupportsAction - OpenConsole', () => {
  const baseCluster: Cluster = {
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
      secrets: { installConfig: '' },
    },
    isHive: true,
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    owner: {},
    kubeconfig: '',
    kubeadmin: '',
    isHypershift: false,
    isRegionalHubCluster: false,
  }

  test('returns true when consoleURL is set', () => {
    const cluster: Cluster = { ...baseCluster, consoleURL: 'https://console.example.com' }
    expect(clusterSupportsAction(cluster, ClusterAction.OpenConsole)).toBe(true)
  })

  test('returns false when consoleURL is empty string', () => {
    const cluster: Cluster = { ...baseCluster, consoleURL: '' }
    expect(clusterSupportsAction(cluster, ClusterAction.OpenConsole)).toBe(false)
  })

  test('returns false when consoleURL is undefined', () => {
    const cluster: Cluster = { ...baseCluster, consoleURL: undefined }
    expect(clusterSupportsAction(cluster, ClusterAction.OpenConsole)).toBe(false)
  })

  test('returns false for hub cluster even when consoleURL is set', () => {
    const cluster: Cluster = { ...baseCluster, name: 'local-cluster', consoleURL: 'https://console.example.com' }
    expect(clusterSupportsAction(cluster, ClusterAction.OpenConsole, undefined, undefined, 'local-cluster')).toBe(false)
  })

  test('returns true for non-hub cluster with consoleURL when localHubName is provided', () => {
    const cluster: Cluster = { ...baseCluster, consoleURL: 'https://console.example.com' }
    expect(clusterSupportsAction(cluster, ClusterAction.OpenConsole, undefined, undefined, 'local-cluster')).toBe(true)
  })
})
