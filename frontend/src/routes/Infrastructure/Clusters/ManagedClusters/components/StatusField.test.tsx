/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { ansibleJobState, configMapsState } from '../../../../../atoms'
import { waitForText } from '../../../../../lib/test-util'
import { Cluster, ClusterStatus } from '../../../../../resources'
import { StatusField } from './StatusField'

const mockCluster1: Cluster = {
  name: 'clusterName',
  displayName: 'clusterName',
  namespace: 'clusterName',
  uid: 'clusterName-uid',
  provider: undefined,
  status: ClusterStatus.creating,
  distribution: {
    ocp: {
      version: '1.2.3',
      availableUpdates: ['1.2.4', '1.2.5'],
      desiredVersion: '1.2.4',
      upgradeFailed: false,
    },
    upgradeInfo: {
      upgradeFailed: false,
      isUpgrading: true,
      isReadyUpdates: false,
      isReadySelectChannels: false,
      availableUpdates: ['1.2.4', '1.2.5'],
      currentVersion: '1.2.3',
      desiredVersion: '1.2.4',
      latestJob: {},
    },
    k8sVersion: '1.11',
    displayVersion: 'openshift',
    isManagedOpenShift: false,
  },
  labels: { abc: '123' },
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
  isHive: false,
  isManaged: true,
  isCurator: true,
  isHostedCluster: false,
  isSNOCluster: false,
  owner: {},
  kubeadmin: '',
  kubeconfig: '',
  isHypershift: true,
  isRegionalHubCluster: false,
}

describe('ScaleClusterAlert', () => {
  it('does not render without MachinePools', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(configMapsState, [])
          snapshot.set(ansibleJobState, [])
        }}
      >
        <MemoryRouter>
          <StatusField cluster={mockCluster1} />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('Creating')
    userEvent.click(screen.getByText('Creating'))
    await waitForText('View logs')
    userEvent.click(screen.getByText('View logs'))
  })
})
