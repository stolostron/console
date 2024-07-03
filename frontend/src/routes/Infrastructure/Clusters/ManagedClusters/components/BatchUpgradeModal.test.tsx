/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { RecoilRoot } from 'recoil'
import { nockCreate, nockIgnoreApiPaths, nockPatch, nockUpgradeRiskRequest } from '../../../../../lib/nock-util'
import { waitForNocks } from '../../../../../lib/test-util'
import { Cluster, ClusterCuratorDefinition, ClusterStatus } from '../../../../../resources'
import { BatchUpgradeModal } from './BatchUpgradeModal'
import { MemoryRouter } from 'react-router-dom-v5-compat'
const mockClusterNoAvailable: Cluster = {
  name: 'cluster-0-no-available',
  displayName: 'cluster-0-no-available',
  namespace: 'cluster-0-no-available',
  uid: 'cluster-0-no-available-uid',
  status: ClusterStatus.ready,
  isHive: false,
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
      isReadySelectChannels: false,
      availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2.9', '1.2'],
      currentVersion: '1.2.3',
      desiredVersion: '1.2.3',
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
      isReadySelectChannels: false,
      availableUpdates: ['2.2.4', '2.2.5', '2.2.6', '2.2'],
      currentVersion: '2.2.3',
      desiredVersion: '2.2.3',
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
      isReadySelectChannels: false,
      availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
      currentVersion: '1.2.3',
      desiredVersion: '1.2.3',
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
const mockClusterFailedUpgrade: Cluster = {
  name: 'cluster-4-failedupgrade',
  displayName: 'cluster-4-failedupgrade',
  namespace: 'cluster-4-failedupgrade',
  uid: 'cluster-4-failedupgrade-uid',
  status: ClusterStatus.ready,
  isHive: false,
  distribution: {
    k8sVersion: '1.19',
    displayVersion: 'Openshift 1.2.3',
    isManagedOpenShift: false,
    upgradeInfo: {
      upgradeFailed: true,
      isUpgrading: false,
      isReadyUpdates: false,
      isReadySelectChannels: false,
      availableUpdates: ['1.2.4', '1.2.5', '1.2.6', '1.2'],
      currentVersion: '1.2.3',
      desiredVersion: '1.2.4',
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
const mockClusterWithUpgrade: Cluster = {
  name: 'cluster-5-upgrade',
  displayName: 'cluster-5-upgrade',
  namespace: 'cluster-5-upgrade',
  uid: 'cluster-5-upgrade-uid',
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
      isReadySelectChannels: false,
      availableUpdates: ['2.2.4', '2.2.5', '2.2.6', '2.2'],
      currentVersion: '2.2.3',
      desiredVersion: '2.2.3',
      latestJob: {},
    },
  },
  labels: {
    clusterID: '1234-abcd',
  },
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
const allClusters: Array<Cluster> = [
  mockClusterNoAvailable,
  mockClusterReady1,
  mockClusterReady2,
  mockClusterOffline,
  mockClusterFailedUpgrade,
]
const clusterCuratorReady1 = {
  apiVersion: ClusterCuratorDefinition.apiVersion,
  kind: ClusterCuratorDefinition.kind,
  metadata: {
    name: 'cluster-1-ready1',
    namespace: 'cluster-1-ready1',
  },
}
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
        channel: '',
        desiredUpdate: version,
      },
    },
  }
  return data
}

const mockUpgradeRisksPredictions: any = [
  {
    statusCode: 200,
    body: {
      predictions: [
        {
          cluster_id: '1234-abcd',
          prediction_status: 'ok',
          upgrade_recommended: true,
          upgrade_risks_predictors: {
            alerts: [],
            operator_conditions: [],
          },
          last_checked_at: '2024-03-27T14:35:06.238290+00:00',
        },
      ],
      status: 'ok',
    },
  },
]

describe('BatchUpgradeModal', () => {
  beforeEach(() => nockIgnoreApiPaths())
  it('should only show upgradeable ones, and select latest version as default', () => {
    const { queryByText } = render(
      <RecoilRoot>
        <MemoryRouter>
          <BatchUpgradeModal clusters={allClusters} open={true} close={() => {}} />
        </MemoryRouter>
      </RecoilRoot>
    )
    expect(queryByText('cluster-0-no-available')).toBeFalsy()
    expect(queryByText('cluster-1-ready1')).toBeTruthy()
    expect(queryByText('cluster-2-ready2')).toBeTruthy()
    expect(queryByText('cluster-3-offline')).toBeFalsy()
    expect(queryByText('cluster-4-failedupgrade')).toBeFalsy()
    // check if selecting latest version
    expect(queryByText('1.2.9')).toBeTruthy()
    expect(queryByText('1.2.6')).toBeFalsy()
    expect(queryByText('2.2.6')).toBeTruthy()
    expect(queryByText('2.2')).toBeFalsy()
  })
  it('should close modal when succeed', async () => {
    let isClosed = false
    const { getByText, queryByText } = render(
      <RecoilRoot>
        <MemoryRouter>
          <BatchUpgradeModal
            clusters={allClusters}
            open={true}
            close={() => {
              isClosed = true
            }}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    const mockNockUpgrade1 = nockPatch(clusterCuratorReady1, getPatchUpdate('1.2.9'))
    const mockNockUpgrade2 = nockPatch(clusterCuratorReady2, getPatchUpdate('2.2.6'), undefined, 404)
    const mockNockUpgrade2backup = nockCreate({ ...clusterCuratorReady2, ...getPatchUpdate('2.2.6') })
    expect(getByText('Upgrade')).toBeTruthy()
    userEvent.click(getByText('Upgrade'))
    await act(async () => {
      await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
      await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
      await waitFor(() => expect(mockNockUpgrade2backup.isDone()).toBeTruthy())
      await waitFor(() => expect(queryByText('Upgrading')).toBeFalsy())
      await waitFor(() => expect(isClosed).toBe(true))
    })

    expect(isClosed).toBe(true)
  })
  it('should show loading when click upgrade, and upgrade button should be disabled when loading', async () => {
    let isClosed = false
    const { getByText, queryByText } = render(
      <RecoilRoot>
        <MemoryRouter>
          <BatchUpgradeModal
            clusters={allClusters}
            open={true}
            close={() => {
              isClosed = true
            }}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    const mockNockUpgrade1 = nockPatch(clusterCuratorReady1, getPatchUpdate('1.2.9'))
    const mockNockUpgrade2 = nockPatch(clusterCuratorReady2, getPatchUpdate('2.2.6'))
    expect(getByText('Upgrade')).toBeTruthy()
    userEvent.click(getByText('Upgrade'))
    await act(async () => {
      await waitFor(() => expect(queryByText('Upgrading')).toBeTruthy())
      userEvent.click(getByText('Upgrading')) // do additional click. make sure not calling upgrade again
      userEvent.click(getByText('Upgrading'))
      await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
      await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
      await waitFor(() => expect(queryByText('Upgrading')).toBeFalsy(), { timeout: 5000 })
      await waitFor(() => expect(isClosed).toBe(true))
    })
  })

  it('should close modal if click cancel', () => {
    let isClosed = false
    const { getByText } = render(
      <RecoilRoot>
        <MemoryRouter>
          <BatchUpgradeModal
            clusters={allClusters}
            open={true}
            close={() => {
              isClosed = true
            }}
          />
        </MemoryRouter>
      </RecoilRoot>
    )
    userEvent.click(getByText('Cancel'))
    expect(isClosed).toBe(true)
  })
  it('should show alert when failed; keep failed rows in table with error messages', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    const { getByText, queryByText } = render(
      <RecoilRoot>
        <MemoryRouter>
          <BatchUpgradeModal clusters={allClusters} open={true} close={() => {}} />
        </MemoryRouter>
      </RecoilRoot>
    )
    const mockNockUpgrade1 = nockPatch(clusterCuratorReady1, getPatchUpdate('1.2.9'))
    const mockNockUpgrade2 = nockPatch(clusterCuratorReady2, getPatchUpdate('2.2.6'), undefined, 400)
    expect(queryByText('cluster-1-ready1')).toBeTruthy()
    expect(queryByText('cluster-2-ready2')).toBeTruthy()
    expect(getByText('Upgrade')).toBeTruthy()
    userEvent.click(getByText('Upgrade'))
    await waitFor(() => expect(queryByText('Upgrading')).toBeTruthy())
    await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
    await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
    await waitFor(() => expect(queryByText('Upgrading')).toBeFalsy())
    await waitFor(() => expect(queryByText('There were errors processing the requests')).toBeTruthy())
    expect(queryByText('cluster-2-ready2')).toBeTruthy()
    expect(queryByText('Error')).toBeTruthy()
    expect(queryByText('cluster-1-ready1')).toBeFalsy()
  })
  it('should open modal with cluster upgrade risks present', async () => {
    const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
      '/upgrade-risks-prediction',
      { clusterIds: ['1234-abcd'] },
      mockUpgradeRisksPredictions
    )
    const { getByText } = render(
      <RecoilRoot>
        <MemoryRouter>
          <BatchUpgradeModal clusters={[mockClusterWithUpgrade]} open={true} close={() => {}} />
        </MemoryRouter>
      </RecoilRoot>
    )
    // Wait for prometheus nocks to finish
    await waitForNocks([getUpgradeRisksPredictionsNock])
    expect(getByText('Upgrade')).toBeTruthy()
    expect(getByText('No risks found')).toBeTruthy()
  })
})
