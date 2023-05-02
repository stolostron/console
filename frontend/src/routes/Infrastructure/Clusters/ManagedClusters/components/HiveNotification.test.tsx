/* Copyright Contributors to the Open Cluster Management project */

import {
  Cluster,
  ClusterProvision,
  ClusterProvisionApiVersion,
  ClusterProvisionKind,
  ClusterStatus,
  PodApiVersion,
  PodKind,
} from '../../../../../resources'
import { render, waitFor } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { clusterProvisionsState, configMapsState } from '../../../../../atoms'
import { nockIgnoreApiPaths, nockNamespacedList } from '../../../../../lib/nock-util'
import { mockOpenShiftConsoleConfigMap } from '../../../../../lib/test-metadata'
import { clickByTestId, waitForNock, waitForNotTestId, waitForTestId, waitForText } from '../../../../../lib/test-util'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { HiveNotification, launchToYaml } from './HiveNotification'
import { Provider } from '../../../../../ui-components'

const mockCluster: Cluster = {
  name: 'test-cluster',
  displayName: 'test-cluster',
  namespace: 'test-cluster',
  uid: 'test-cluster-uid',
  status: ClusterStatus.pendingimport,
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

const mockClusterProvision: ClusterProvision = {
  apiVersion: ClusterProvisionApiVersion,
  kind: ClusterProvisionKind,
  metadata: {
    labels: {
      cloud: 'GCP',
      'hive.openshift.io/cluster-deployment-name': 'test-cluster',
      'hive.openshift.io/cluster-platform': 'gcp',
      'hive.openshift.io/cluster-region': 'us-east1',
      region: 'us-east1',
      vendor: 'OpenShift',
    },
    name: 'test-cluster-0-hmd44',
    namespace: 'test-cluster',
  },
  spec: {
    attempt: 0,
    clusterDeploymentRef: { name: 'test-cluster' },
    installLog:
      'level=info msg="Credentials loaded from environment variable \\"GOOGLE_CREDENTIALS\\", file \\"/.gcp/osServiceAccount.json\\""\nlevel=fatal msg="failed to fetch Master Machines: failed to load asset \\"Install Config\\": platform.gcp.project: Invalid value: \\"gc-acm-dev-fake\\": invalid project ID"\n',
  },
  status: {
    conditions: [
      {
        message: 'Install job has been created',
        reason: 'JobCreated',
        status: 'True',
        type: 'ClusterProvisionJobCreated',
      },
      {
        message: 'Invalid GCP project ID',
        reason: 'GCPInvalidProjectID',
        status: 'True',
        type: 'ClusterProvisionFailed',
      },
    ],
  },
}

const mockPodList = {
  kind: 'PodList',
  apiVersion: 'v1',
  metadata: {
    selfLink: '/api/v1/namespaces/test-cluster/pods',
    resourceVersion: '100373656',
  },
  items: [
    {
      metadata: {
        name: 'test-cluster-pod',
        namespace: 'test-cluster',
      },
    },
  ],
}

describe('HiveNotification', () => {
  beforeEach(() => nockIgnoreApiPaths())
  window.open = jest.fn()
  const Component = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(configMapsState, [mockOpenShiftConsoleConfigMap])
          snapshot.set(clusterProvisionsState, [mockClusterProvision])
        }}
      >
        <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
          <HiveNotification />
        </ClusterContext.Provider>
      </RecoilRoot>
    )
  }
  test('renders null for exempt cluster status', async () => {
    render(<Component />)
    await waitForNotTestId('View logs')
  })
  test('renders the danger notification for failed provision status', async () => {
    mockCluster.status = ClusterStatus.provisionfailed
    const podScope = nockNamespacedList(
      {
        apiVersion: PodApiVersion,
        kind: PodKind,
        metadata: { namespace: 'test-cluster' },
      },
      mockPodList,
      ['hive.openshift.io/cluster-deployment-name=test-cluster']
    )
    render(<Component />)
    await waitForTestId('hive-notification-provisionfailed')
    await waitForText('Cluster creation failed:')
    await waitForText('Invalid GCP project ID')
    await clickByTestId('view-logs')
    await waitForNock(podScope)
    await waitFor(() =>
      expect(window.open).toHaveBeenCalledWith(
        `${
          mockOpenShiftConsoleConfigMap.data!.consoleURL
        }/k8s/ns/test-cluster/pods/test-cluster-pod/logs?container=hive`
      )
    )
  })

  test('renders the info notification variant for destroying status', async () => {
    mockCluster.status = ClusterStatus.destroying
    const podScope = nockNamespacedList(
      {
        apiVersion: PodApiVersion,
        kind: PodKind,
        metadata: { namespace: 'test-cluster' },
      },
      mockPodList,
      ['hive.openshift.io/cluster-deployment-name=test-cluster', 'job-name=test-cluster-uninstall']
    )
    render(<Component />)
    await waitForTestId('hive-notification-destroying')
    await waitForText('Cluster creation is in progress:')
    await clickByTestId('view-logs')
    await waitForNock(podScope)
    await waitFor(() =>
      expect(window.open).toHaveBeenCalledWith(
        `${
          mockOpenShiftConsoleConfigMap.data!.consoleURL
        }/k8s/ns/test-cluster/pods/test-cluster-pod/logs?container=hive`
      )
    )
  })

  test('wont render for AI cluster - deprivision failed', async () => {
    const mockCluster: Cluster = {
      name: 'test-cluster',
      displayName: 'test-cluster',
      namespace: 'test-cluster',
      uid: 'test-cluster-uid',
      status: ClusterStatus.deprovisionfailed,
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
      provider: Provider.hostinventory,
    }
    const AIComponent = () => {
      return (
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(configMapsState, [mockOpenShiftConsoleConfigMap])
            snapshot.set(clusterProvisionsState, [mockClusterProvision])
          }}
        >
          <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
            <HiveNotification />
          </ClusterContext.Provider>
        </RecoilRoot>
      )
    }
    render(<AIComponent />)
    await waitForNotTestId('View logs')
  })
})

test('wont render if cluster has statusMessage', async () => {
  const mockCluster: Cluster = {
    name: 'test-cluster',
    displayName: 'test-cluster',
    namespace: 'test-cluster',
    uid: 'test-cluster-uid',
    status: ClusterStatus.destroying,
    statusMessage: 'The cluster has failed',
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
    provider: Provider.hostinventory,
  }
  const AIComponent = () => {
    return (
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(configMapsState, [mockOpenShiftConsoleConfigMap])
          snapshot.set(clusterProvisionsState, [mockClusterProvision])
        }}
      >
        <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
          <HiveNotification />
        </ClusterContext.Provider>
      </RecoilRoot>
    )
  }
  render(<AIComponent />)
  await waitForNotTestId('View logs')
})

describe('launchToYaml', () => {
  window.open = jest.fn()
  it('opens window with clusterDeployment properties for non cluster pool clusters', () => {
    launchToYaml(mockCluster, [mockOpenShiftConsoleConfigMap])
    expect(window.open).toHaveBeenCalledWith(
      `${
        mockOpenShiftConsoleConfigMap.data!.consoleURL
      }/k8s/ns/test-cluster/hive.openshift.io~v1~ClusterDeployment/test-cluster/yaml`
    )
  })
  it('opens window with clusterPool properties for cluster pool clusters', () => {
    const cluster = {
      ...mockCluster,
      hive: {
        isHibernatable: true,
        clusterPool: 'my-cluster-pool',
        clusterPoolNamespace: 'my-cluster-pool-namespace',
        secrets: {
          installConfig: '',
        },
      },
    }
    launchToYaml(cluster, [mockOpenShiftConsoleConfigMap])
    expect(window.open).toHaveBeenCalledWith(
      `${
        mockOpenShiftConsoleConfigMap.data!.consoleURL
      }/k8s/ns/my-cluster-pool-namespace/hive.openshift.io~v1~ClusterPool/my-cluster-pool/yaml`
    )
  })
})
