/* Copyright Contributors to the Open Cluster Management project */

import {
  AnsibleJob,
  AnsibleJobApiVersion,
  AnsibleJobKind,
  Cluster,
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  ClusterStatus,
} from '../../../../../resources'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { ansibleJobState, clusterCuratorsState } from '../../../../../atoms'
import { clickByText, waitForCalled, waitForText } from '../../../../../lib/test-util'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ProgressStepBar } from './ProgressStepBar'

const mockCluster: Cluster = {
  name: 'test-cluster',
  displayName: 'test-cluster',
  namespace: 'test-cluster',
  uid: 'test-cluster-uid',
  status: ClusterStatus.prehookjob,
  distribution: {
    k8sVersion: '1.19',
    ocp: undefined,
    displayVersion: '1.19',
    isManagedOpenShift: false,
  },
  labels: undefined,
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
  isCurator: false,
  isHostedCluster: false,
  isSNOCluster: false,
  owner: {},
  kubeconfig: '',
  kubeadmin: '',
  isHypershift: false,
  isRegionalHubCluster: false,
}

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

const clusterCurator1: ClusterCurator = {
  apiVersion: ClusterCuratorApiVersion,
  kind: ClusterCuratorKind,
  metadata: {
    name: 'test-cluster',
    namespace: 'test-cluster',
  },
  spec: {
    desiredCuration: 'install',
    install: {
      towerAuthSecret: 'ansible-credential-i',
      prehook: [
        {
          name: 'test-job-i',
        },
      ],
    },
  },
}

const ansibleJob: AnsibleJob = {
  apiVersion: AnsibleJobApiVersion,
  kind: AnsibleJobKind,
  metadata: {
    name: 'ansible-job',
    namespace: 'test-cluster',
    annotations: {
      jobtype: 'prehook',
    },
  },
  status: {
    ansibleJobResult: {
      changed: true,
      failed: false,
      status: 'pending',
      url: '/ansible/url',
      finished: '2021-06-08T16:43:09.023018Z',
      started: '2021-06-08T16:43:01.853019Z',
    },
  },
}

describe('ProgressStepBar', () => {
  test('renders progress bar', async () => {
    render(
      <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
        <RecoilRoot initializeState={(snapshot) => snapshot.set(clusterCuratorsState, [clusterCurator1])}>
          <MemoryRouter>
            <ProgressStepBar />
          </MemoryRouter>
        </RecoilRoot>
      </ClusterContext.Provider>
    )
    await waitForText('Creating cluster')
    await waitForText('0 of 4 steps completed')
    await waitForText('No jobs selected')
    await waitForText('In progress')
    await waitForText('Posthook')
    await waitForText('Cluster install')
  })
  test('log link opens new window', async () => {
    window.open = jest.fn()
    render(
      <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(clusterCuratorsState, [clusterCurator1])
            snapshot.set(ansibleJobState, [ansibleJob])
          }}
        >
          <MemoryRouter>
            <ProgressStepBar />
          </MemoryRouter>
        </RecoilRoot>
      </ClusterContext.Provider>
    )
    await waitForText('Creating cluster')
    await waitForText('0 of 4 steps completed')
    await waitForText('No jobs selected')
    await waitForText('In progress')
    await waitForText('Posthook')
    await waitForText('Cluster install')
    await clickByText('View logs')
    await waitForCalled(window.open as jest.Mock)
  })

  test('hypershift logs link', async () => {
    window.open = jest.fn()
    render(
      <ClusterContext.Provider value={{ cluster: mockCluster1, addons: undefined }}>
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(clusterCuratorsState, [clusterCurator1])
            snapshot.set(ansibleJobState, [ansibleJob])
          }}
        >
          <MemoryRouter>
            <ProgressStepBar />
          </MemoryRouter>
        </RecoilRoot>
      </ClusterContext.Provider>
    )
    await clickByText('View logs')
  })
})
