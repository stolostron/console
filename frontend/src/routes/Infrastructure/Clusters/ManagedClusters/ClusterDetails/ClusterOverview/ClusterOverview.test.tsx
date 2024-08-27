/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  agentClusterInstallsState,
  agentsState,
  certificateSigningRequestsState,
  clusterClaimsState,
  clusterCuratorsState,
  clusterDeploymentsState,
  clusterManagementAddonsState,
  hostedClustersState,
  infraEnvironmentsState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClustersState,
  nodePoolsState,
  policyreportState,
} from '../../../../../../atoms'
import { nockGet, nockIgnoreApiPaths, nockIgnoreRBAC, nockSearch } from '../../../../../../lib/nock-util'
import { clickByText, waitForText } from '../../../../../../lib/test-util'
import {
  HostedClusterApiVersion,
  HostedClusterKind,
  Secret,
  SecretApiVersion,
  SecretKind,
} from '../../../../../../resources'
import { HypershiftImportCommand } from '../../components/HypershiftImportCommand'
import {
  mockAWSHostedCluster,
  mockAWSHypershiftCluster,
  mockAWSHypershiftClusterNoHypershift,
  mockBMHypershiftCluster,
  mockBMHypershiftClusterNoNamespace,
  mockRegionalHubCluster,
} from '../ClusterDetails.sharedmocks'
import { ClusterOverviewPageContent } from './ClusterOverview'
import { HostedClusterK8sResource } from '@openshift-assisted/ui-lib/cim'
import userEvent from '@testing-library/user-event'
import { AcmToastGroup, AcmToastProvider } from '../../../../../../ui-components'
import {
  mockSearchQueryArgoAppsClusterOverview,
  mockSearchQueryArgoAppsClusterOverviewFilteredCount,
  mockSearchQueryArgoAppsCount,
  mockSearchQueryOCPApplicationsClusterOverview,
  mockSearchQueryOCPApplicationsClusterOverviewFilteredCount,
  mockSearchQueryOCPApplicationsCount,
  mockSearchResponseArgoApps1,
  mockSearchResponseArgoAppsCount,
  mockSearchResponseArgoAppsCount1,
  mockSearchResponseOCPApplications,
  mockSearchResponseOCPApplicationsCount,
} from '../../../../../Applications/Application.sharedmocks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClusterDetailsContext } from '../ClusterDetails'

const queryClient = new QueryClient()

const mockHistoryPush = jest.fn()

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}))

const mockSearchQuery = {
  operationName: 'searchResult',
  variables: {
    input: [
      {
        filters: [
          { property: 'compliant', values: ['!Compliant'] },
          { property: 'kind', values: ['Policy'] },
          { property: 'namespace', values: ['feng-hypershift-test'] },
          { property: 'cluster', values: ['local-cluster'] },
        ],
      },
    ],
  },
  query:
    'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n    related {\n      kind\n      count\n      __typename\n    }\n    __typename\n  }\n}\n',
}

const mockSearchResponse = {
  data: {
    searchResult: [
      {
        count: 0,
        related: [],
        __typename: 'SearchResult',
      },
      {
        count: 0,
        related: [],
        __typename: 'SearchResult',
      },
    ],
  },
}

const kubeConfigSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'feng-hypershift-test-admin-kubeconfig',
    namespace: 'clusters',
  },
  stringData: {},
}

const kubeAdminPassSecret: Secret = {
  apiVersion: SecretApiVersion,
  kind: SecretKind,
  metadata: {
    name: 'feng-hypershift-test-kubeadmin-password',
    namespace: 'feng-hypershift-test',
  },
  stringData: {},
}

describe('ClusterOverview with AWS hypershift cluster', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverview, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverviewFilteredCount, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsClusterOverview, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsClusterOverviewFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockIgnoreApiPaths()
    const context: Partial<ClusterDetailsContext> = {
      cluster: mockAWSHypershiftCluster,
      hostedCluster: mockAWSHostedCluster,
    }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policyreportState, [])
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(managedClusterAddonsState, new Map())
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(clusterClaimsState, [])
          snapshot.set(clusterCuratorsState, [])
          snapshot.set(agentClusterInstallsState, [])
          snapshot.set(agentsState, [])
          snapshot.set(infraEnvironmentsState, [])
          snapshot.set(hostedClustersState, [])
          snapshot.set(nodePoolsState, [])
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<ClusterOverviewPageContent />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  })

  it('should render overview with AWS hypershift cluster', async () => {
    await waitForText(mockAWSHypershiftCluster.name)
    await clickByText('Reveal credentials')
  })
})

describe('ClusterOverview with BM hypershift cluster', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverview, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverviewFilteredCount, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsClusterOverview, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsClusterOverviewFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockGet(kubeConfigSecret)
    nockGet(kubeAdminPassSecret)
    nockIgnoreApiPaths()
    const context: Partial<ClusterDetailsContext> = {
      cluster: mockBMHypershiftCluster,
      hostedCluster: mockAWSHostedCluster,
    }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policyreportState, [])
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(managedClusterAddonsState, new Map())
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(clusterClaimsState, [])
          snapshot.set(clusterCuratorsState, [])
          snapshot.set(agentClusterInstallsState, [])
          snapshot.set(agentsState, [])
          snapshot.set(infraEnvironmentsState, [])
          snapshot.set(hostedClustersState, [])
          snapshot.set(nodePoolsState, [])
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<ClusterOverviewPageContent />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  })

  it('should render overview with BM hypershift cluster', async () => {
    await waitForText(mockBMHypershiftCluster.name)
    await clickByText('Reveal credentials')
  })
})

describe('ClusterOverview with BM hypershift cluster no namespace', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverview, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverviewFilteredCount, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsClusterOverview, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsClusterOverviewFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockGet(kubeConfigSecret)
    nockGet(kubeAdminPassSecret)
    nockIgnoreApiPaths()
    const context: Partial<ClusterDetailsContext> = {
      cluster: mockBMHypershiftClusterNoNamespace,
      hostedCluster: mockAWSHostedCluster,
    }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policyreportState, [])
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(managedClusterAddonsState, new Map())
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(clusterClaimsState, [])
          snapshot.set(clusterCuratorsState, [])
          snapshot.set(agentClusterInstallsState, [])
          snapshot.set(agentsState, [])
          snapshot.set(infraEnvironmentsState, [])
          snapshot.set(hostedClustersState, [])
          snapshot.set(nodePoolsState, [])
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<ClusterOverviewPageContent />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  })

  it('should render overview with BM hypershift cluster no namespace', async () => {
    await waitForText(mockBMHypershiftClusterNoNamespace.name)
    await clickByText('Reveal credentials')
  })
})

describe('ClusterOverview with AWS hypershift cluster no hypershift', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverview, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverviewFilteredCount, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsClusterOverview, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsClusterOverviewFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockGet(kubeConfigSecret)
    nockGet(kubeAdminPassSecret)
    nockIgnoreApiPaths()
    const context: Partial<ClusterDetailsContext> = {
      cluster: mockAWSHypershiftClusterNoHypershift,
      hostedCluster: mockAWSHostedCluster,
    }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policyreportState, [])
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(managedClusterAddonsState, new Map())
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(clusterClaimsState, [])
          snapshot.set(clusterCuratorsState, [])
          snapshot.set(agentClusterInstallsState, [])
          snapshot.set(agentsState, [])
          snapshot.set(infraEnvironmentsState, [])
          snapshot.set(hostedClustersState, [])
          snapshot.set(nodePoolsState, [])
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<ClusterOverviewPageContent />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  })

  it('should render overview with AWS hypershift cluster no hypershift', async () => {
    await waitForText(mockAWSHypershiftClusterNoHypershift.name)
    await clickByText('Reveal credentials')
  })
})

describe('ClusterOverview with AWS hypershift cluster no hostedCluster', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverview, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverviewFilteredCount, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsClusterOverview, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsClusterOverviewFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockIgnoreApiPaths()
    const context: Partial<ClusterDetailsContext> = { cluster: mockAWSHypershiftCluster }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policyreportState, [])
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(managedClusterAddonsState, new Map())
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(clusterClaimsState, [])
          snapshot.set(clusterCuratorsState, [])
          snapshot.set(agentClusterInstallsState, [])
          snapshot.set(agentsState, [])
          snapshot.set(infraEnvironmentsState, [])
          snapshot.set(hostedClustersState, [])
          snapshot.set(nodePoolsState, [])
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<ClusterOverviewPageContent />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  })

  it('should render overview with AWS hypershift cluster no hostedCluster', async () => {
    await waitForText(mockAWSHypershiftCluster.name)
    await clickByText('Reveal credentials')
  })
})

describe('ClusterOverview with regional hub cluster information', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverview, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverviewFilteredCount, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsClusterOverview, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsClusterOverviewFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockIgnoreApiPaths()
    const context: Partial<ClusterDetailsContext> = { cluster: mockRegionalHubCluster }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policyreportState, [])
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(managedClusterAddonsState, new Map())
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(clusterClaimsState, [])
          snapshot.set(clusterCuratorsState, [])
          snapshot.set(agentClusterInstallsState, [])
          snapshot.set(agentsState, [])
          snapshot.set(infraEnvironmentsState, [])
          snapshot.set(hostedClustersState, [])
          snapshot.set(nodePoolsState, [])
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<ClusterOverviewPageContent />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  })

  it('should render overview with the regional hub cluster', async () => {
    await waitForText(mockRegionalHubCluster.name)
    await waitForText('release-2.7')
    await waitForText('2.7.0')
  })
})

describe('ClusterOverview with regional hub cluster information with hostedCluster', () => {
  beforeEach(() => {
    mockRegionalHubCluster.isHostedCluster = true
    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverview, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverviewFilteredCount, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsClusterOverview, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsClusterOverviewFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockIgnoreApiPaths()
    const context: Partial<ClusterDetailsContext> = { cluster: mockRegionalHubCluster }
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(policyreportState, [])
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(managedClusterAddonsState, new Map())
          snapshot.set(clusterManagementAddonsState, [])
          snapshot.set(clusterClaimsState, [])
          snapshot.set(clusterCuratorsState, [])
          snapshot.set(agentClusterInstallsState, [])
          snapshot.set(agentsState, [])
          snapshot.set(infraEnvironmentsState, [])
          snapshot.set(hostedClustersState, [])
          snapshot.set(nodePoolsState, [])
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <Routes>
              <Route element={<Outlet context={context} />}>
                <Route path="*" element={<ClusterOverviewPageContent />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </RecoilRoot>
    )
  })

  it('should render overview with the regional hub cluster and hostedCluster', async () => {
    await waitForText(mockRegionalHubCluster.name)
    await waitForText('Hub, Hosted')
    await waitForText('release-2.7')
    await waitForText('2.7.0')
  })
})

describe('ClusterOverview with AWS hypershift cluster', () => {
  const mockHostedCluster1: HostedClusterK8sResource = {
    apiVersion: HostedClusterApiVersion,
    kind: HostedClusterKind,
    metadata: {
      name: 'hostedCluster1',
      namespace: 'hostedCluster1',
    },
    spec: {
      services: [],
      dns: {
        baseDomain: 'test.com',
      },
      pullSecret: { name: 'local-cluster-pull-secret' },
      release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
      sshKey: { name: 'feng-hypershift-test-ssh-key' },
      platform: {
        agent: {
          agentNamespace: 'hostedCluster1',
        },
        type: 'Agent',
      },
    },
    status: {
      conditions: [
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: '',
          observedGeneration: 1,
          reason: 'StatusUnknown',
          status: 'Unknown',
          type: 'ValidAWSIdentityProvider',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: 'Condition not found in the CVO.',
          observedGeneration: 3,
          reason: 'StatusUnknown',
          status: 'Unknown',
          type: 'ClusterVersionProgressing',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: 'Condition not found in the CVO.',
          observedGeneration: 3,
          reason: 'StatusUnknown',
          status: 'Unknown',
          type: 'ClusterVersionReleaseAccepted',
        },
        {
          lastTransitionTime: '2022-12-20T16:51:09Z',
          message:
            'Kubernetes 1.25 and therefore OpenShift 4.12 remove several APIs which require admin consideration. Please see the knowledge article https://access.redhat.com/articles/6955381 for details and instructions.',
          observedGeneration: 3,
          reason: 'AdminAckRequired',
          status: 'False',
          type: 'ClusterVersionUpgradeable',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: 'Condition not found in the CVO.',
          observedGeneration: 3,
          reason: 'StatusUnknown',
          status: 'Unknown',
          type: 'ClusterVersionAvailable',
        },
        {
          lastTransitionTime: '2022-12-20T19:15:09Z',
          message: 'Working towards 4.11.17: 508 of 560 done (90% complete)',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'ClusterVersionSucceeding',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:55Z',
          message:
            '[capi-provider deployment has 1 unavailable replicas, cluster-api deployment has 1 unavailable replicas]',
          observedGeneration: 3,
          reason: 'UnavailableReplicas',
          status: 'True',
          type: 'Degraded',
        },
        {
          lastTransitionTime: '2022-12-20T16:49:32Z',
          message: '',
          observedGeneration: 3,
          reason: 'QuorumAvailable',
          status: 'True',
          type: 'EtcdAvailable',
        },
        {
          lastTransitionTime: '2022-12-20T16:50:08Z',
          message: 'Kube APIServer deployment is available',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'KubeAPIServerAvailable',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:59Z',
          message: '',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'InfrastructureReady',
        },
        {
          lastTransitionTime: '2022-12-20T16:50:08Z',
          message: 'The hosted control plane is available',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'Available',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: 'Configuration passes validation',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'ValidConfiguration',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: 'HostedCluster is supported by operator configuration',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'SupportedHostedCluster',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:55Z',
          message: 'Configuration passes validation',
          reason: 'HostedClusterAsExpected',
          status: 'True',
          type: 'ValidHostedControlPlaneConfiguration',
        },
        {
          lastTransitionTime: '2022-12-20T16:50:10Z',
          message: 'Ignition server deployment is available',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'IgnitionEndpointAvailable',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: 'Reconciliation active on resource',
          observedGeneration: 3,
          reason: 'ReconciliationActive',
          status: 'True',
          type: 'ReconciliationActive',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: 'Release image is valid',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'ValidReleaseImage',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:44Z',
          message: 'HostedCluster is at expected version',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'False',
          type: 'Progressing',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:46Z',
          message: 'Reconciliation completed succesfully',
          observedGeneration: 3,
          reason: 'ReconciliatonSucceeded',
          status: 'True',
          type: 'ReconciliationSucceeded',
        },
        {
          lastTransitionTime: '2022-12-20T16:48:46Z',
          message: 'OIDC configuration is valid',
          observedGeneration: 3,
          reason: 'AsExpected',
          status: 'True',
          type: 'ValidOIDCConfiguration',
        },
      ],
    },
  }

  beforeEach(() => {
    const getSecrets1 = {
      req: {
        apiVersion: 'v1',
        kind: 'secrets',
        metadata: {
          namespace: 'clusters',
          name: 'feng-hypershift-test-admin-kubeconfig',
        },
      },
    }

    const getSecrets2 = {
      req: {
        apiVersion: 'v1',
        kind: 'secrets',
        metadata: {
          namespace: 'feng-hypershift-test',
          name: 'feng-hypershift-test-kubeadmin-password',
        },
      },
    }

    nockIgnoreRBAC()
    nockSearch(mockSearchQuery, mockSearchResponse)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverview, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsClusterOverviewFilteredCount, mockSearchResponseOCPApplications)
    nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
    nockSearch(mockSearchQueryArgoAppsClusterOverview, mockSearchResponseArgoApps1)
    nockSearch(mockSearchQueryArgoAppsClusterOverviewFilteredCount, mockSearchResponseArgoAppsCount1)
    nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
    nockIgnoreApiPaths()
    nockGet(getSecrets1.req, getSecrets1.req) // get 'secrets' in 'clusters' namespace
    nockGet(getSecrets2.req, getSecrets2.req)
  })

  it('should display error alert on import with invalid cluster name', async () => {
    const context: Partial<ClusterDetailsContext> = {
      cluster: mockRegionalHubCluster,
      hostedCluster: mockHostedCluster1,
    }
    const { queryAllByText } = render(
      <RecoilRoot>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context} />}>
              <Route
                path="*"
                element={
                  <>
                    <AcmToastProvider>
                      <AcmToastGroup />
                      <HypershiftImportCommand
                        selectedHostedClusterResource={mockHostedCluster1}
                      ></HypershiftImportCommand>
                    </AcmToastProvider>
                    <ClusterOverviewPageContent />
                  </>
                }
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    userEvent.click(
      screen.getByRole('button', {
        name: /import cluster/i,
      })
    )

    await waitFor(() =>
      expect(
        queryAllByText(
          "The cluster name is invalid. Change the name to the RFC 1123 standard which consists of lower case alphanumeric characters, '-', and must start and end with an alphanumeric character."
        )
      ).toHaveLength(1)
    )
  })
})
