/* Copyright Contributors to the Open Cluster Management project */

import { ClusterCuratorDefinition, HostedClusterApiVersion, HostedClusterKind } from '../../../../../resources'
import { HostedClusterK8sResourceWithChannel } from '../../../../../resources/hosted-cluster'
import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { nockCreate, nockIgnoreApiPaths, nockPatch } from '../../../../../lib/nock-util'
import { BatchChannelSelectModal } from './BatchChannelSelectModal'
import { MemoryRouter } from 'react-router-dom-v5-compat'
const mockClusterNoAvailable: Cluster = {
  name: 'cluster-0-no-available',
  displayName: 'cluster-0-no-available',
  namespace: 'cluster-0-no-available',
  uid: 'cluster-0-no-available',
  status: ClusterStatus.ready,
  isHive: false,
  isCurator: false,
  isHostedCluster: false,
  owner: {},
  distribution: {
    k8sVersion: '1.19',
    displayVersion: 'Openshift 1.2.3',
    isManagedOpenShift: false,
    upgradeInfo: {
      upgradeFailed: false,
      isUpgrading: false,
      isReadyUpdates: false,
      isReadySelectChannels: false,
      availableUpdates: [],
      currentVersion: '1.2.3',
      desiredVersion: '1.2.3',
      currentChannel: 'fast-1.2',
      latestJob: {},
    },
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
  isManaged: true,
  isSNOCluster: false,
  kubeadmin: '',
  kubeconfig: '',
  isHypershift: false,
  isRegionalHubCluster: false,
}
const mockClusterReady1: Cluster = {
  name: 'cluster-1-ready1',
  displayName: 'cluster-1-ready1',
  namespace: 'cluster-1-ready1',
  uid: 'cluster-1-ready1-uid',
  status: ClusterStatus.ready,
  isHive: false,
  distribution: {
    k8sVersion: '1.19',
    displayVersion: 'Openshift 1.2.3',
    isManagedOpenShift: false,
    upgradeInfo: {
      upgradeFailed: false,
      isUpgrading: false,
      isReadyUpdates: true,
      isReadySelectChannels: true,
      availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2.9', '1.2'],
      currentVersion: '1.2.3',
      desiredVersion: '1.2.3',
      currentChannel: 'stable-1.2',
      availableChannels: ['stable-1.3', 'stable-1.2'],
      latestJob: {},
    },
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
const mockClusterReady2: Cluster = {
  name: 'cluster-2-ready2',
  displayName: 'cluster-2-ready2',
  namespace: 'cluster-2-ready2',
  uid: 'cluster-2-ready2-uid',
  status: ClusterStatus.ready,
  isHive: false,
  distribution: {
    k8sVersion: '1.19',
    displayVersion: 'Openshift 2.2.3',
    isManagedOpenShift: false,
    upgradeInfo: {
      upgradeFailed: false,
      isUpgrading: false,
      isReadyUpdates: true,
      isReadySelectChannels: true,
      availableUpdates: ['2.2.4', '2.2.5', '2.2.6', '2.2'],
      currentVersion: '2.2.3',
      desiredVersion: '2.2.3',
      currentChannel: 'stable-2.2',
      availableChannels: ['stable-2.3'],
      latestJob: {},
    },
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
const mockClusterOffline: Cluster = {
  name: 'cluster-3-offline',
  displayName: 'cluster-3-offline',
  namespace: 'cluster-3-offline',
  uid: 'cluster-3-offline-uid',
  status: ClusterStatus.offline,
  isHive: false,
  distribution: {
    k8sVersion: '1.19',
    displayVersion: 'Openshift 1.2.3',
    isManagedOpenShift: false,
    upgradeInfo: {
      upgradeFailed: false,
      isUpgrading: false,
      isReadyUpdates: true,
      isReadySelectChannels: true,
      availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
      currentVersion: '1.2.3',
      desiredVersion: '1.2.3',
      availableChannels: ['stable-2.2', 'stable-2.3'],
      currentChannel: 'fast-2.2',
      latestJob: {},
    },
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

const allClusters: Array<Cluster> = [mockClusterNoAvailable, mockClusterReady1, mockClusterReady2, mockClusterOffline]

const clusterCuratorReady2 = {
  apiVersion: ClusterCuratorDefinition.apiVersion,
  kind: ClusterCuratorDefinition.kind,
  metadata: {
    name: 'cluster-2-ready2',
    namespace: 'cluster-2-ready2',
  },
}
const getPatchUpdate = (version: string) => {
  const data = {
    spec: {
      desiredCuration: 'upgrade',
      upgrade: {
        // set channel to empty to make sure we only use version
        channel: version,
        desiredUpdate: '',
      },
    },
  }
  return data
}

describe('BatchChannelSelectModal', () => {
  beforeEach(() => nockIgnoreApiPaths())
  it('should only show selectable ones, and select current channel as default', () => {
    const { queryAllByText, queryByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal clusters={allClusters} open={true} close={() => {}} />
      </MemoryRouter>
    )
    expect(queryByText('cluster-0-no-available')).toBeFalsy()
    expect(queryByText('cluster-1-ready1')).toBeTruthy()
    expect(queryByText('cluster-2-ready2')).toBeTruthy()
    expect(queryByText('cluster-3-offline')).toBeFalsy()
    // check if selecting latest version
    expect(queryAllByText('stable-1.2')).toHaveLength(2)
    expect(queryByText('fast-2.2')).toBeFalsy()
    expect(queryByText('fast-1.2')).toBeFalsy()
    expect(queryByText('stable-2.2')).toBeTruthy()
  })
  it('should close modal when succeed', async () => {
    let isClosed = false
    const { getByText, queryByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal
          clusters={allClusters}
          open={true}
          close={() => {
            isClosed = true
          }}
        />
      </MemoryRouter>
    )
    const mockNockUpgrade2 = nockPatch(clusterCuratorReady2, getPatchUpdate('stable-2.3'), undefined, 404)
    const mockNockUpgrade2backup = nockCreate({ ...clusterCuratorReady2, ...getPatchUpdate('stable-2.3') })
    expect(getByText('Save')).toBeTruthy()
    userEvent.click(getByText('Save'))
    await act(async () => {
      await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
      await waitFor(() => expect(mockNockUpgrade2backup.isDone()).toBeTruthy())
      await waitFor(() => expect(queryByText('Saving')).toBeFalsy())
      await waitFor(() => expect(isClosed).toBe(true))
    })

    expect(isClosed).toBe(true)
  })
  it('should show loading when click select, and select button should be disabled when loading', async () => {
    let isClosed = false
    const { getByText, queryByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal
          clusters={allClusters}
          open={true}
          close={() => {
            isClosed = true
          }}
        />
      </MemoryRouter>
    )
    const mockNockUpgrade2 = nockPatch(clusterCuratorReady2, getPatchUpdate('stable-2.3'))
    expect(getByText('Save')).toBeTruthy()
    userEvent.click(getByText('Save'))
    await act(async () => {
      await waitFor(() => expect(queryByText('Saving')).toBeTruthy())
      userEvent.click(getByText('Saving')) // do additional click. make sure not calling update again
      userEvent.click(getByText('Saving'))
      await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
      await waitFor(() => expect(queryByText('Saving')).toBeFalsy(), {
        timeout: 5000,
      })
      await waitFor(() => expect(isClosed).toBe(true))
    })
  })

  it('should close modal if click cancel', () => {
    let isClosed = false
    const { getByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal
          clusters={allClusters}
          open={true}
          close={() => {
            isClosed = true
          }}
        />
      </MemoryRouter>
    )
    userEvent.click(getByText('Cancel'))
    expect(isClosed).toBe(true)
  })
  it('should show alert when failed; keep failed rows in table with error messages', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const { getByText, queryByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal clusters={allClusters} open={true} close={() => {}} />
      </MemoryRouter>
    )
    const mockNockUpgrade2 = nockPatch(clusterCuratorReady2, getPatchUpdate('stable-2.3'), undefined, 400)
    expect(queryByText('cluster-1-ready1')).toBeTruthy()
    expect(queryByText('cluster-2-ready2')).toBeTruthy()
    expect(getByText('Save')).toBeTruthy()
    userEvent.click(getByText('Save'))
    await waitFor(() => expect(queryByText('Saving')).toBeTruthy())
    await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
    await waitFor(() => expect(queryByText('Saving')).toBeFalsy())
    await waitFor(() => expect(queryByText('There were errors processing the requests')).toBeTruthy())
    expect(queryByText('cluster-2-ready2')).toBeTruthy()
    expect(queryByText('Error')).toBeTruthy()
    expect(queryByText('cluster-1-ready1')).toBeFalsy()
  })
})

// Mock hosted cluster without channel set
const mockHostedClusterNoChannel: HostedClusterK8sResourceWithChannel = {
  apiVersion: HostedClusterApiVersion,
  kind: HostedClusterKind,
  metadata: {
    name: 'hosted-cluster-test',
    namespace: 'clusters',
  },
  spec: {
    services: [],
    dns: { baseDomain: 'test.com' },
    pullSecret: { name: 'pull-secret' },
    release: { image: 'quay.io/openshift-release-dev/ocp-release:4.14.5-x86_64' },
    sshKey: { name: 'ssh-key' },
    platform: { type: 'AWS' },
  },
  status: {
    conditions: [{ lastTransitionTime: '', message: '', reason: '', status: 'True', type: 'Available' }],
  },
}

// Mock hosted cluster with channel set
const mockHostedClusterWithChannel: HostedClusterK8sResourceWithChannel = {
  ...mockHostedClusterNoChannel,
  spec: {
    ...mockHostedClusterNoChannel.spec,
    channel: 'stable-4.14',
  },
}

// Mock hypershift cluster without channel and no MCI channels
const mockHypershiftClusterNoChannel: Cluster = {
  name: 'hosted-cluster-test',
  displayName: 'hosted-cluster-test',
  namespace: 'hosted-cluster-test',
  uid: 'hosted-cluster-test-uid',
  status: ClusterStatus.ready,
  isHive: false,
  isCurator: false,
  isHostedCluster: true,
  isHypershift: true,
  owner: {},
  distribution: {
    k8sVersion: '1.27',
    displayVersion: 'OpenShift 4.14.5',
    isManagedOpenShift: false,
    ocp: {
      version: '4.14.5',
      availableUpdates: [],
      desiredVersion: '4.14.5',
      upgradeFailed: false,
    },
    upgradeInfo: {
      upgradeFailed: false,
      isUpgrading: false,
      isReadyUpdates: false,
      isReadySelectChannels: false,
      availableUpdates: [],
      availableChannels: [],
      currentVersion: '4.14.5',
      desiredVersion: '4.14.5',
      latestJob: {},
    },
  },
  labels: undefined,
  nodes: undefined,
  kubeApiServer: '',
  consoleURL: '',
  hasAutomationTemplate: false,
  hive: {
    isHibernatable: false,
    clusterPool: undefined,
    secrets: { installConfig: '' },
  },
  isManaged: true,
  isSNOCluster: false,
  kubeadmin: '',
  kubeconfig: '',
  isRegionalHubCluster: false,
  hypershift: {
    agent: false,
    hostingNamespace: 'clusters',
    nodePools: [],
    secretNames: [],
  },
}

// Mock hypershift cluster with channel set and MCI channels available
const mockHypershiftClusterWithMCIChannels: Cluster = {
  ...mockHypershiftClusterNoChannel,
  name: 'hosted-cluster-with-mci',
  displayName: 'hosted-cluster-with-mci',
  namespace: 'hosted-cluster-with-mci',
  uid: 'hosted-cluster-with-mci-uid',
  distribution: {
    ...mockHypershiftClusterNoChannel.distribution!,
    upgradeInfo: {
      ...mockHypershiftClusterNoChannel.distribution!.upgradeInfo!,
      isReadySelectChannels: true,
      availableChannels: ['stable-4.14', 'fast-4.14', 'candidate-4.14'],
      currentChannel: 'stable-4.14',
    },
  },
}

describe('BatchChannelSelectModal - Hosted Clusters', () => {
  beforeEach(() => nockIgnoreApiPaths())

  it('should show warning alert when cluster has no current channel configured', () => {
    const { queryByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal
          clusters={[mockHypershiftClusterNoChannel]}
          open={true}
          close={() => {}}
          hostedClusters={{ 'hosted-cluster-test': mockHostedClusterNoChannel }}
        />
      </MemoryRouter>
    )
    // Should show the warning alert
    expect(
      queryByText('Update channel is not configured for one or more clusters. Select a channel to see update options.')
    ).toBeTruthy()
  })

  it('should not show warning alert when all clusters have current channel configured', () => {
    const { queryByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal clusters={[mockClusterReady1]} open={true} close={() => {}} />
      </MemoryRouter>
    )
    // Should NOT show the warning alert
    expect(
      queryByText('Update channel is not configured for one or more clusters. Select a channel to see update options.')
    ).toBeFalsy()
  })

  it('should show hosted cluster without channel set using fallback fast-X.Y channel', () => {
    const { queryByText, getByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal
          clusters={[mockHypershiftClusterNoChannel]}
          open={true}
          close={() => {}}
          hostedClusters={{ 'hosted-cluster-test': mockHostedClusterNoChannel }}
        />
      </MemoryRouter>
    )
    // Should show the cluster
    expect(queryByText('hosted-cluster-test')).toBeTruthy()
    // Should show current channel as dash (no channel set)
    expect(queryByText('-')).toBeTruthy()
    // Should show the fallback fast-4.14 channel option
    expect(getByText('fast-4.14')).toBeTruthy()
  })

  it('should NOT show hosted cluster with channel set but no MCI channels', () => {
    const { queryByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal
          clusters={[mockHypershiftClusterNoChannel]}
          open={true}
          close={() => {}}
          hostedClusters={{ 'hosted-cluster-test': mockHostedClusterWithChannel }}
        />
      </MemoryRouter>
    )
    // Should NOT show the cluster (empty state)
    expect(queryByText('hosted-cluster-test')).toBeFalsy()
    expect(queryByText('No clusters available')).toBeTruthy()
  })

  it('should show hosted cluster with channel set when MCI has channels', () => {
    const hostedClusterWithChannelResource: HostedClusterK8sResourceWithChannel = {
      ...mockHostedClusterNoChannel,
      metadata: {
        ...mockHostedClusterNoChannel.metadata,
        name: 'hosted-cluster-with-mci',
        namespace: 'clusters',
      },
      spec: {
        ...mockHostedClusterNoChannel.spec,
        channel: 'stable-4.14',
      },
    }

    const { queryByText, queryAllByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal
          clusters={[mockHypershiftClusterWithMCIChannels]}
          open={true}
          close={() => {}}
          hostedClusters={{ 'hosted-cluster-with-mci': hostedClusterWithChannelResource }}
        />
      </MemoryRouter>
    )
    // Should show the cluster
    expect(queryByText('hosted-cluster-with-mci')).toBeTruthy()
    // Should show current channel (appears in both current channel column and dropdown)
    expect(queryAllByText('stable-4.14').length).toBeGreaterThanOrEqual(1)
  })

  it('should use ClusterCurator to set channel for hosted clusters', async () => {
    let isClosed = false
    const { getByText, queryByText } = render(
      <MemoryRouter>
        <BatchChannelSelectModal
          clusters={[mockHypershiftClusterNoChannel]}
          open={true}
          close={() => {
            isClosed = true
          }}
          hostedClusters={{ 'hosted-cluster-test': mockHostedClusterNoChannel }}
        />
      </MemoryRouter>
    )

    const clusterCurator = {
      apiVersion: ClusterCuratorDefinition.apiVersion,
      kind: ClusterCuratorDefinition.kind,
      metadata: {
        name: mockHypershiftClusterNoChannel.name,
        namespace: mockHypershiftClusterNoChannel.namespace,
      },
    }
    const patchSpec = {
      spec: {
        desiredCuration: 'upgrade',
        upgrade: {
          channel: 'fast-4.14',
          desiredUpdate: '',
        },
      },
    }
    // Mock patch returns 404, then create succeeds
    const mockNockPatchCurator = nockPatch(clusterCurator, patchSpec, undefined, 404)
    const mockNockCreateCurator = nockCreate({ ...clusterCurator, ...patchSpec })

    expect(getByText('Save')).toBeTruthy()
    userEvent.click(getByText('Save'))

    await act(async () => {
      await waitFor(() => expect(mockNockPatchCurator.isDone()).toBeTruthy())
      await waitFor(() => expect(mockNockCreateCurator.isDone()).toBeTruthy())
      await waitFor(() => expect(queryByText('Saving')).toBeFalsy())
      await waitFor(() => expect(isClosed).toBe(true))
    })

    expect(isClosed).toBe(true)
  })
})
