/* Copyright Contributors to the Open Cluster Management project */

import {
  AnsibleJob,
  AnsibleJobApiVersion,
  AnsibleJobKind,
  ClusterCurator,
  ClusterCuratorApiVersion,
  ClusterCuratorKind,
  Pod,
  PodApiVersion,
  PodKind,
} from '../../../../../resources'
import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import { render } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { ansibleJobState, clusterCuratorsState } from '../../../../../atoms'
import { clickByTestId, clickByText, waitForCalled, waitForNocks, waitForText } from '../../../../../lib/test-util'
import { ClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import { ProgressStepBar } from './ProgressStepBar'
import { nockIgnoreApiPaths, nockList } from '../../../../../lib/nock-util'

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
  isCurator: false,
  isHostedCluster: false,
  isSNOCluster: false,
  owner: {},
  kubeconfig: '',
  kubeadmin: '',
  isHypershift: false,
  isRegionalHubCluster: false,
}

const mockClusterUpdatesAvailable: Cluster = {
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
const mockClusterPosthook: Cluster = {
  name: 'test-cluster',
  displayName: 'test-cluster',
  namespace: 'test-cluster',
  uid: 'test-cluster-uid',
  status: ClusterStatus.posthookjob,
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
  isCurator: false,
  isHostedCluster: false,
  isSNOCluster: false,
  owner: {},
  kubeconfig: '',
  kubeadmin: '',
  isHypershift: false,
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

const clusterCuratorConditionFailedPrehook: ClusterCurator = {
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
  status: {
    conditions: [
      {
        lastTransitionTime: new Date(),
        message:
          'curator-job-llmxl DesiredCuration: install Failed - AnsibleJob test-cluster/prehookjob exited with an error',
        reason: 'Job_failed',
        status: 'True',
        type: 'clustercurator-job',
      },
    ],
  },
}

const clusterCuratorConditionFailedPosthook: ClusterCurator = {
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
      posthook: [
        {
          name: 'test-job-i',
        },
      ],
    },
  },
  status: {
    conditions: [
      {
        lastTransitionTime: new Date(),
        message:
          'curator-job-llmxl DesiredCuration: install Failed - AnsibleJob test-cluster/posthookjob-k92td exited with an error',
        reason: 'Job_failed',
        status: 'True',
        type: 'clustercurator-job',
      },
    ],
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
const ansibleJobFailedPrehook: AnsibleJob = {
  apiVersion: AnsibleJobApiVersion,
  kind: AnsibleJobKind,
  metadata: {
    name: 'failed-ansible-job',
    namespace: 'test-cluster',
    annotations: {
      jobtype: 'prehook',
    },
  },
  status: {
    ansibleJobResult: {
      changed: true,
      failed: false,
      status: 'error',
      finished: '2021-06-08T16:43:09.023018Z',
      started: '2021-06-08T16:43:01.853019Z',
    },
  },
}

const ansibleJobFailedPosthook: AnsibleJob = {
  apiVersion: AnsibleJobApiVersion,
  kind: AnsibleJobKind,
  metadata: {
    name: 'failed-ansible-job',
    namespace: 'test-cluster',
    annotations: {
      jobtype: 'posthook',
    },
  },
  status: {
    ansibleJobResult: {
      changed: true,
      failed: false,
      status: 'error',
      finished: '2021-06-08T16:43:09.023018Z',
      started: '2021-06-08T16:43:01.853019Z',
    },
  },
}

const FailedAnsibleJobPrehook: Pod = {
  apiVersion: PodApiVersion,
  kind: PodKind,
  metadata: {
    name: 'prehookjob-9876',
    namespace: 'cluster',
  },
}

const FailedAnsibleJobPosthook: Pod = {
  apiVersion: PodApiVersion,
  kind: PodKind,
  metadata: {
    name: 'posthookjob-k92td-1234',
    namespace: 'cluster',
  },
}

describe('ProgressStepBar', () => {
  test('renders progress bar', async () => {
    const context: Partial<ClusterDetailsContext> = { cluster: mockCluster }
    render(
      <RecoilRoot initializeState={(snapshot) => snapshot.set(clusterCuratorsState, [clusterCurator1])}>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<ProgressStepBar />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
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
    const context: Partial<ClusterDetailsContext> = { cluster: mockCluster }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(clusterCuratorsState, [clusterCurator1])
          snapshot.set(ansibleJobState, [ansibleJob])
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<ProgressStepBar />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
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
    const context: Partial<ClusterDetailsContext> = { cluster: mockClusterUpdatesAvailable }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(clusterCuratorsState, [clusterCurator1])
          snapshot.set(ansibleJobState, [ansibleJob])
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<ProgressStepBar />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await clickByText('View logs')
  })

  test('OCP job logs links for prehook job', async () => {
    window.open = jest.fn()
    nockIgnoreApiPaths()
    const nocks = [
      nockList(
        { apiVersion: PodApiVersion, kind: PodKind, metadata: { namespace: mockCluster.namespace } },
        [FailedAnsibleJobPrehook],
        ['job-name=prehookjob']
      ),
    ]
    const context: Partial<ClusterDetailsContext> = { cluster: mockCluster }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(clusterCuratorsState, [clusterCuratorConditionFailedPrehook])
          snapshot.set(ansibleJobState, [ansibleJobFailedPrehook])
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<ProgressStepBar />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await clickByText('View logs')
    await waitForNocks(nocks)
    expect(window.open).toHaveBeenLastCalledWith('/k8s/ns/test-cluster/pods/prehookjob-9876/logs')
  })
  test('OCP job logs links for posthook job', async () => {
    window.open = jest.fn()
    nockIgnoreApiPaths()
    const nocks = [
      nockList(
        { apiVersion: PodApiVersion, kind: PodKind, metadata: { namespace: mockCluster.namespace } },
        [FailedAnsibleJobPosthook],
        ['job-name=posthookjob-k92td']
      ),
    ]
    const context: Partial<ClusterDetailsContext> = { cluster: mockClusterPosthook }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(clusterCuratorsState, [clusterCuratorConditionFailedPosthook])
          snapshot.set(ansibleJobState, [ansibleJobFailedPosthook])
        }}
      >
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route path="*" element={<ProgressStepBar />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    await clickByTestId('posthook-link')
    await waitForNocks(nocks)
    expect(window.open).toHaveBeenLastCalledWith('/k8s/ns/test-cluster/pods/posthookjob-k92td-1234/logs')
  })
})
