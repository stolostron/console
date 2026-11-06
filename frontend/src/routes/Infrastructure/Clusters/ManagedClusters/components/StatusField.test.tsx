/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { axe } from 'jest-axe'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { ansibleJobState, ansibleWorkflowState, configMapsState } from '../../../../../atoms'
import { clickByText, waitForText, clickElement, waitForNock } from '~/lib/test-util'
import { nockIgnoreApiPaths, nockNamespacedList } from '~/lib/nock-util'
import { mockOpenShiftConsoleConfigMap } from '~/lib/test-metadata'
import { Cluster, ClusterStatus } from '../../../../../resources/utils'
import {
  type AnsibleJob,
  AnsibleJobApiVersion,
  AnsibleJobKind,
  type AnsibleWorkflow,
  AnsibleWorkflowKind,
  PodApiVersion,
  PodKind,
} from '~/resources'
import { AcmToastContext } from '../../../../../ui-components'
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
      <StateProvider
        initializeStore={(store) => {
          store.set(configMapsState, [])
          store.set(ansibleJobState, [])
        }}
      >
        <MemoryRouter>
          <StatusField {...props} />
        </MemoryRouter>
      </StateProvider>
    )

    const props = { cluster }
    const { rerender } = render(Component(props))
    cluster.status = ClusterStatus.creating
    await waitForText('Creating')
    await clickElement(screen.getByText('Creating'))
    await waitForText('View logs')
    await clickElement(screen.getByText('View logs'))
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
    const { container } = render(
      <StateProvider
        initializeStore={(store) => {
          store.set(configMapsState, [])
          store.set(ansibleJobState, [ansibleJobPrehook])
          store.set(ansibleWorkflowState, [ansibleWorkflowPosthook])
        }}
      >
        <MemoryRouter>
          <StatusField cluster={posthookCluster} />
        </MemoryRouter>
      </StateProvider>
    )
    await waitForText('Failed')
    await clickByText('Failed')
    await waitForText('View logs')
    await clickByText('View logs')
    expect(window.open).toHaveBeenCalledWith('/#/jobs/workflow/post')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('StatusField destroying status', () => {
  beforeEach(() => nockIgnoreApiPaths())

  // Regression test for ACM-49555: clicking "View logs" for a Destroying cluster with no
  // deprovision pod (e.g. ClusterDeployment.spec.preserveOnDelete=true skips the uninstall
  // job) must surface feedback instead of silently doing nothing.
  it('shows a toast instead of silently doing nothing when no deprovision pod is found', async () => {
    window.open = jest.fn()
    const mockAddAlert = jest.fn()
    const destroyingCluster: Cluster = {
      ...cluster,
      status: ClusterStatus.destroying,
      isHypershift: false,
      provider: undefined,
    }
    const podScope = nockNamespacedList(
      {
        apiVersion: PodApiVersion,
        kind: PodKind,
        metadata: { namespace: destroyingCluster.namespace },
      },
      [],
      [
        `hive.openshift.io/cluster-deployment-name=${destroyingCluster.name}`,
        `job-name=${destroyingCluster.name}-uninstall`,
      ]
    )

    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(configMapsState, [mockOpenShiftConsoleConfigMap])
          store.set(ansibleJobState, [])
        }}
      >
        <AcmToastContext.Provider value={{ addAlert: mockAddAlert } as any}>
          <MemoryRouter>
            <StatusField cluster={destroyingCluster} />
          </MemoryRouter>
        </AcmToastContext.Provider>
      </StateProvider>
    )

    await waitForText('Destroying')
    await clickByText('Destroying')
    await waitForText('View logs')
    await clickByText('View logs')
    await waitForNock(podScope)
    await waitFor(() =>
      expect(mockAddAlert).toHaveBeenCalledWith(expect.objectContaining({ title: 'Logs unavailable' }))
    )
    expect(window.open).not.toHaveBeenCalled()
  })
})
