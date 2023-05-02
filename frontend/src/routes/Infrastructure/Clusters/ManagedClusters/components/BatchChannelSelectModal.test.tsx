/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterCuratorDefinition, ClusterStatus } from '../../../../../resources'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { nockCreate, nockIgnoreApiPaths, nockPatch } from '../../../../../lib/nock-util'
import { BatchChannelSelectModal } from './BatchChannelSelectModal'
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
      <BatchChannelSelectModal clusters={allClusters} open={true} close={() => {}} />
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
      <BatchChannelSelectModal
        clusters={allClusters}
        open={true}
        close={() => {
          isClosed = true
        }}
      />
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
      <BatchChannelSelectModal
        clusters={allClusters}
        open={true}
        close={() => {
          isClosed = true
        }}
      />
    )
    const mockNockUpgrade2 = nockPatch(clusterCuratorReady2, getPatchUpdate('stable-2.3'))
    expect(getByText('Save')).toBeTruthy()
    userEvent.click(getByText('Save'))
    await act(async () => {
      await waitFor(() => expect(queryByText('Saving')).toBeTruthy())
      userEvent.click(getByText('Saving')) // do additional click. make sure not calling upgrade again
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
      <BatchChannelSelectModal
        clusters={allClusters}
        open={true}
        close={() => {
          isClosed = true
        }}
      />
    )
    userEvent.click(getByText('Cancel'))
    expect(isClosed).toBe(true)
  })
  it('should show alert when failed; keep failed rows in table with error messages', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const { getByText, queryByText } = render(
      <BatchChannelSelectModal clusters={allClusters} open={true} close={() => {}} />
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
