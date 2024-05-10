/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus } from '../../../../../resources'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { ClusterDestroy } from './ClusterDestroy'
import { Provider } from '../../../../../ui-components'
import { ClusterDetailsContext } from '../ClusterDetails/ClusterDetails'

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

const mockDestroyAICluster: Cluster = {
  name: 'test-ai-cluster',
  displayName: 'test-ai-cluster',
  namespace: 'test-ai-cluster',
  uid: 'test-ai-cluster-uid',
  provider: Provider.hostinventory,
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
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={{}} />}>
              <Route path="*" element={<ClusterDestroy isLoading={true} cluster={mockDestroyCluster} />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    expect(screen.getByText('test-cluster is being destroyed')).toBeInTheDocument()
    expect(screen.getAllByText('View logs')[1]).toBeInTheDocument()
  })
  test('renders the detaching state', async () => {
    render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={{}} />}>
              <Route path="*" element={<ClusterDestroy isLoading={true} cluster={mockDetachCluster} />} />
            </Route>
          </Routes>
        </MemoryRouter>
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
          <Routes>
            <Route element={<Outlet context={{}} />}>
              <Route path="*" element={<ClusterDestroy isLoading={false} cluster={mockDetachCluster} />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )
    expect(screen.getByText('was successfully detached')).toBeInTheDocument()
  })

  describe('AI', () => {
    test('renders the destroying state without logs btn', async () => {
      render(
        <RecoilRoot>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={{}} />}>
                <Route path="*" element={<ClusterDestroy isLoading={true} cluster={mockDestroyAICluster} />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </RecoilRoot>
      )
      expect(screen.getByText('test-ai-cluster is being destroyed')).toBeInTheDocument()
      expect(screen.queryByText('ai:Download Installation Logs')).not.toBeInTheDocument()
    })

    test('renders the destroying state with logs btn', async () => {
      const context: Partial<ClusterDetailsContext> = {
        agentClusterInstall: {
          status: {
            debugInfo: {
              logsURL: 'foobar',
            },
          },
        },
      }
      render(
        <RecoilRoot>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<ClusterDestroy isLoading={true} cluster={mockDestroyAICluster} />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </RecoilRoot>
      )
      expect(screen.getByText('test-ai-cluster is being destroyed')).toBeInTheDocument()
      expect(screen.queryByText('ai:Download Installation Logs')).toBeInTheDocument()
    })
  })
})
