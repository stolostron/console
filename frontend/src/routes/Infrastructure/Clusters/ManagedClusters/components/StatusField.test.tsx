/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { RecoilRoot } from 'recoil'
import { ansibleJobState, ansibleWorkflowState, configMapsState } from '../../../../../atoms'
import { clickByText, waitForText } from '../../../../../lib/test-util'
import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import { AnsibleJob, AnsibleJobApiVersion, AnsibleJobKind, AnsibleWorkflow, AnsibleWorkflowKind } from '~/resources'
import { StatusField } from './StatusField'

const cluster: Cluster = {
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
    const Component = (props: { cluster: Cluster }) => (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(configMapsState, [])
          snapshot.set(ansibleJobState, [])
        }}
      >
        <MemoryRouter>
          <StatusField {...props} />
        </MemoryRouter>
      </RecoilRoot>
    )

    const props = { cluster }
    const { rerender } = render(Component(props))
    cluster.status = ClusterStatus.creating
    await waitForText('Creating')
    userEvent.click(screen.getByText('Creating'))
    await waitForText('View logs')
    userEvent.click(screen.getByText('View logs'))
    cluster.status = ClusterStatus.unreachable
    rerender(Component({ ...props }))
    await waitForText('Unreachable')
  })
})

describe('StatusField ansible hooks', () => {
  const posthookCluster: Cluster = {
    ...cluster,
    status: ClusterStatus.posthookfailed,
    isHypershift: false,
  }

  const ansibleJobPrehook: AnsibleJob = {
    apiVersion: AnsibleJobApiVersion,
    kind: AnsibleJobKind,
    metadata: {
      name: 'prehookjob-a',
      namespace: 'clusterName',
      annotations: { jobtype: 'prehook' },
    },
    status: {
      ansibleJobResult: {
        changed: true,
        failed: false,
        status: 'successful',
        url: '/ansible/prehook',
        finished: '2021-06-08T16:43:09.023018Z',
        started: '2021-06-08T16:43:01.853019Z',
      },
    },
  }

  const ansibleWorkflowPosthook: AnsibleWorkflow = {
    apiVersion: AnsibleJobApiVersion,
    kind: AnsibleWorkflowKind,
    metadata: {
      name: 'posthookjob-wf',
      namespace: 'clusterName',
      annotations: { jobtype: 'posthook' },
    },
    status: {
      ansibleWorkflowResult: {
        changed: false,
        failed: true,
        status: 'error',
        url: '/#/jobs/workflow/post',
        started: '2021-06-08T16:43:01.853019Z',
        finished: '2021-06-08T16:43:09.023018Z',
      },
    },
  }

  it('opens the posthook workflow URL from View logs', async () => {
    window.open = jest.fn()
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(configMapsState, [])
          snapshot.set(ansibleJobState, [ansibleJobPrehook])
          snapshot.set(ansibleWorkflowState, [ansibleWorkflowPosthook])
        }}
      >
        <MemoryRouter>
          <StatusField cluster={posthookCluster} />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText('Failed')
    await clickByText('Failed')
    await waitForText('View logs')
    await clickByText('View logs')
    expect(window.open).toHaveBeenCalledWith('/#/jobs/workflow/post')
  })
})
