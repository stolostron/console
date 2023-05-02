/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus } from '../../../../../resources'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { ClusterDestroy } from './ClusterDestroy'

const mockDestroyCluster: Cluster = {
  name: 'test-cluster',
  displayName: 'test-cluster',
  namespace: 'test-cluster',
  uid: 'test-cluster-uid',
  provider: undefined,
  isCurator: false,
  owner: {},
  status: ClusterStatus.destroying,
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
  isHostedCluster: false,
  isSNOCluster: false,
  kubeadmin: '',
  kubeconfig: '',
  isHypershift: false,
  isRegionalHubCluster: false,
}

const mockDetachCluster: Cluster = {
  name: 'test-cluster',
  namespace: 'test-cluster',
  uid: 'test-cluster-uid',
  provider: undefined,
  status: ClusterStatus.detaching,
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
  kubeadmin: '',
  kubeconfig: '',
  isHypershift: false,
  isRegionalHubCluster: false,
}

describe('ClusterDestroy', () => {
  test('renders the destroying state', async () => {
    render(
      <RecoilRoot>
        <ClusterDestroy isLoading={true} cluster={mockDestroyCluster} />
      </RecoilRoot>
    )
    expect(screen.getByText('test-cluster is being destroyed')).toBeInTheDocument()
    expect(screen.getAllByText('View logs')[1]).toBeInTheDocument()
  })
  test('renders the detaching state', async () => {
    render(
      <RecoilRoot>
        <ClusterDestroy isLoading={true} cluster={mockDetachCluster} />
      </RecoilRoot>
    )
    expect(screen.getByText('is being detached')).toBeInTheDocument()
    expect(screen.queryByText('View logs')).toBeNull()
  })
  test('renders success state', async () => {
    nockIgnoreRBAC()
    render(
      <RecoilRoot>
        <MemoryRouter>
          <ClusterDestroy isLoading={false} cluster={mockDetachCluster} />
        </MemoryRouter>
      </RecoilRoot>
    )
    expect(screen.getByText('was successfully detached')).toBeInTheDocument()
  })
})
