/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { RecoilRoot } from 'recoil'
import { nockCreate, nockIgnoreApiPaths, nockPatch, nockUpgradeRiskRequest } from '../../../../../lib/nock-util'
import { waitForNocks } from '../../../../../lib/test-util'
import { ClusterCuratorDefinition } from '../../../../../resources'
import { Cluster, ClusterStatus } from '../../../../../resources/utils'
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
    expect(getByText('Update')).toBeTruthy()
    userEvent.click(getByText('Update'))
    await act(async () => {
      await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
      await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
      await waitFor(() => expect(mockNockUpgrade2backup.isDone()).toBeTruthy())
      await waitFor(() => expect(queryByText('Updating')).toBeFalsy())
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
    expect(getByText('Update')).toBeTruthy()
    userEvent.click(getByText('Update'))
    await act(async () => {
      await waitFor(() => expect(queryByText('Updating')).toBeTruthy())
      userEvent.click(getByText('Updating')) // do additional click. make sure not calling update again
      userEvent.click(getByText('Updating'))
      await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
      await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
      await waitFor(() => expect(queryByText('Updating')).toBeFalsy(), { timeout: 5000 })
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
    expect(getByText('Update')).toBeTruthy()
    userEvent.click(getByText('Update'))
    await waitFor(() => expect(queryByText('Updating')).toBeTruthy())
    await waitFor(() => expect(mockNockUpgrade1.isDone()).toBeTruthy())
    await waitFor(() => expect(mockNockUpgrade2.isDone()).toBeTruthy())
    await waitFor(() => expect(queryByText('Updating')).toBeFalsy())
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
    expect(getByText('Update')).toBeTruthy()
    expect(getByText('No risks found')).toBeTruthy()
  })

  describe('version-specific upgrade risks', () => {
    const mockClusterWithOperatorRisk: Cluster = {
      name: 'cluster-with-operator-risk',
      displayName: 'cluster-with-operator-risk',
      namespace: 'cluster-with-operator-risk',
      uid: 'cluster-with-operator-risk-uid',
      status: ClusterStatus.ready,
      isHive: false,
      distribution: {
        k8sVersion: '1.19',
        displayVersion: 'Openshift 4.13.10',
        isManagedOpenShift: false,
        upgradeInfo: {
          upgradeFailed: false,
          isUpgrading: false,
          isReadyUpdates: true,
          isReadySelectChannels: false,
          availableUpdates: ['4.13.50', '4.14.2', '4.15.0'],
          currentVersion: '4.13.10',
          desiredVersion: '4.13.10',
          latestJob: {},
          upgradeableCondition: {
            type: 'Upgradeable',
            status: 'False',
            reason: 'AdminAckRequired',
            message:
              'Kubernetes 1.25 and therefore OpenShift 4.12 remove several APIs which require admin consideration.',
            lastTransitionTime: new Date('2024-01-01T00:00:00Z'),
          },
        },
      },
      labels: {
        clusterID: 'cluster-with-risk-id',
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

    it('should show warning banner for minor/major upgrade with Upgradeable=False', async () => {
      const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
        '/upgrade-risks-prediction',
        { clusterIds: ['cluster-with-risk-id'] },
        [
          {
            statusCode: 200,
            body: {
              predictions: [
                {
                  cluster_id: 'cluster-with-risk-id',
                  prediction_status: 'ok',
                  upgrade_recommended: true,
                  upgrade_risks_predictors: {
                    alerts: [],
                    operator_conditions: [],
                  },
                },
              ],
            },
          },
        ]
      )

      const { getByText } = render(
        <RecoilRoot>
          <MemoryRouter>
            <BatchUpgradeModal clusters={[mockClusterWithOperatorRisk]} open={true} close={() => {}} />
          </MemoryRouter>
        </RecoilRoot>
      )

      await waitForNocks([getUpgradeRisksPredictionsNock])

      // Banner should appear because default selected version (4.15.0) is a minor upgrade
      expect(getByText('Cluster version update risks detected')).toBeTruthy()
      expect(
        getByText(
          'Clusters with warnings have version-specific risks that may cause update failure. Resolve these risks or choose a different target version.'
        )
      ).toBeTruthy()
    })

    it('should NOT show warning banner for patch upgrade with Upgradeable=False', async () => {
      const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
        '/upgrade-risks-prediction',
        { clusterIds: ['cluster-with-risk-id'] },
        [
          {
            statusCode: 200,
            body: {
              predictions: [
                {
                  cluster_id: 'cluster-with-risk-id',
                  prediction_status: 'ok',
                  upgrade_recommended: true,
                  upgrade_risks_predictors: {
                    alerts: [],
                    operator_conditions: [],
                  },
                },
              ],
            },
          },
        ]
      )

      const { getByText, queryByText } = render(
        <RecoilRoot>
          <MemoryRouter>
            <BatchUpgradeModal clusters={[mockClusterWithOperatorRisk]} open={true} close={() => {}} />
          </MemoryRouter>
        </RecoilRoot>
      )

      await waitForNocks([getUpgradeRisksPredictionsNock])

      // Change to patch version (4.13.50)
      const versionDropdown = getByText('4.15.0')
      userEvent.click(versionDropdown)
      const patchVersion = getByText('4.13.50')
      userEvent.click(patchVersion)

      // Banner should NOT appear for patch upgrade
      await waitFor(() => {
        expect(queryByText('Cluster version update risks detected')).toBeFalsy()
      })
    })

    it('should include operator risk in count for minor/major upgrade', async () => {
      const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
        '/upgrade-risks-prediction',
        { clusterIds: ['cluster-with-risk-id'] },
        [
          {
            statusCode: 200,
            body: {
              predictions: [
                {
                  cluster_id: 'cluster-with-risk-id',
                  prediction_status: 'ok',
                  upgrade_recommended: true,
                  upgrade_risks_predictors: {
                    alerts: [],
                    operator_conditions: [],
                  },
                },
              ],
            },
          },
        ]
      )

      const { queryByText } = render(
        <RecoilRoot>
          <MemoryRouter>
            <BatchUpgradeModal clusters={[mockClusterWithOperatorRisk]} open={true} close={() => {}} />
          </MemoryRouter>
        </RecoilRoot>
      )

      await waitForNocks([getUpgradeRisksPredictionsNock])

      // Should show 1 risk (operator risk) for minor upgrade (default is 4.15.0)
      // The text contains "1" and "risk" - using regex to match
      await waitFor(() => {
        expect(queryByText(/.*1.*risk.*/i)).toBeTruthy()
      })
    })

    it('should NOT include operator risk in count for patch upgrade', async () => {
      const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
        '/upgrade-risks-prediction',
        { clusterIds: ['cluster-with-risk-id'] },
        [
          {
            statusCode: 200,
            body: {
              predictions: [
                {
                  cluster_id: 'cluster-with-risk-id',
                  prediction_status: 'ok',
                  upgrade_recommended: true,
                  upgrade_risks_predictors: {
                    alerts: [],
                    operator_conditions: [],
                  },
                },
              ],
            },
          },
        ]
      )

      const { getByText, queryByText } = render(
        <RecoilRoot>
          <MemoryRouter>
            <BatchUpgradeModal clusters={[mockClusterWithOperatorRisk]} open={true} close={() => {}} />
          </MemoryRouter>
        </RecoilRoot>
      )

      await waitForNocks([getUpgradeRisksPredictionsNock])

      // Change to patch version (4.13.50)
      const versionDropdown = getByText('4.15.0')
      userEvent.click(versionDropdown)
      const patchVersion = getByText('4.13.50')
      userEvent.click(patchVersion)

      // Should show "No risks found" for patch upgrade (operator risk not counted)
      await waitFor(() => {
        expect(queryByText('View 1 risk', { exact: false })).toBeFalsy()
        expect(getByText('No risks found')).toBeTruthy()
      })
    })

    it('should show version in helper text warning', async () => {
      const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
        '/upgrade-risks-prediction',
        { clusterIds: ['cluster-with-risk-id'] },
        [
          {
            statusCode: 200,
            body: {
              predictions: [
                {
                  cluster_id: 'cluster-with-risk-id',
                  prediction_status: 'ok',
                  upgrade_recommended: true,
                  upgrade_risks_predictors: {
                    alerts: [],
                    operator_conditions: [],
                  },
                },
              ],
            },
          },
        ]
      )

      const { getByText } = render(
        <RecoilRoot>
          <MemoryRouter>
            <BatchUpgradeModal clusters={[mockClusterWithOperatorRisk]} open={true} close={() => {}} />
          </MemoryRouter>
        </RecoilRoot>
      )

      await waitForNocks([getUpgradeRisksPredictionsNock])

      // Should show version 4.15.0 in helper text
      await waitFor(() => {
        expect(getByText('Cluster version update risk detected for 4.15.0', { exact: false })).toBeTruthy()
      })
    })

    it('should show operator risk in popover for minor/major upgrade', async () => {
      const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
        '/upgrade-risks-prediction',
        { clusterIds: ['cluster-with-risk-id'] },
        [
          {
            statusCode: 200,
            body: {
              predictions: [
                {
                  cluster_id: 'cluster-with-risk-id',
                  prediction_status: 'ok',
                  upgrade_recommended: true,
                  upgrade_risks_predictors: {
                    alerts: [],
                    operator_conditions: [],
                  },
                },
              ],
            },
          },
        ]
      )

      const { getByText, queryByText } = render(
        <RecoilRoot>
          <MemoryRouter>
            <BatchUpgradeModal clusters={[mockClusterWithOperatorRisk]} open={true} close={() => {}} />
          </MemoryRouter>
        </RecoilRoot>
      )

      await waitForNocks([getUpgradeRisksPredictionsNock])

      // Click on risk link to open popover - find link that contains "1" and "risk"
      await waitFor(() => {
        const riskLink = queryByText(/.*1.*risk.*/i)
        expect(riskLink).toBeTruthy()
        userEvent.click(riskLink!)
      })

      // Should show operator risk in popover
      await waitFor(() => {
        expect(getByText('Cluster version update risk')).toBeTruthy()
        expect(
          getByText('Kubernetes 1.25 and therefore OpenShift 4.12 remove several APIs', { exact: false })
        ).toBeTruthy()
      })
    })
  })
})
