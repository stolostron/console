/* Copyright Contributors to the Open Cluster Management project */

import { MockedProvider } from '@apollo/client/testing'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  applicationsState,
  clusterManagementAddonsState,
  helmReleaseState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClustersState,
  placementDecisionsState,
  policiesState,
  policyreportState,
  Settings,
  settingsState,
  subscriptionsState,
} from '../../../atoms'
import {
  nockAggegateRequest,
  nockIgnoreApiPaths,
  nockPostRequest,
  nockRequest,
  nockSearch,
  nockUpgradeRiskRequest,
} from '../../../lib/nock-util'
import { waitForNocks } from '../../../lib/test-util'
import { ManagedClusterInfo, UserPreference } from '../../../resources'
import {
  mockApplications,
  mockSearchQueryArgoApps,
  mockSearchQueryArgoAppsCount,
  mockSearchQueryOCPApplications,
  mockSearchQueryOCPApplicationsCount,
  mockSearchResponseArgoApps,
  mockSearchResponseArgoAppsCount,
  mockSearchResponseOCPApplications,
  mockSearchResponseOCPApplicationsCount,
} from '../../Applications/Application.sharedmocks'
import { SearchResultCountDocument } from '../../Search/search-sdk/search-sdk'
import OverviewPage from './OverviewPage'

// Mock the useVirtualMachineDetection hook
jest.mock('../../../hooks/useVirtualMachineDetection', () => ({
  useVirtualMachineDetection: jest.fn(() => ({
    hasVirtualMachines: false,
    isLoading: false,
    error: undefined,
    virtualMachines: [],
  })),
}))
import {
  managedClusterInfos,
  managedClusters,
  mockAlertMetrics,
  mockClusterManagementAddons,
  mockManagedClusterAddons,
  mockOperatorMetrics,
  mockWorkerCoreCountMetrics,
  placementDecisions,
  policies,
  policyReports,
} from './sharedmocks'

const queryClient = new QueryClient()

const mockSettings: Settings = {
  SEARCH_RESULT_LIMIT: '1000',
}

const mockUserPreference: UserPreference = {
  apiVersion: 'console.open-cluster-management.io/v1',
  kind: 'UserPreference',
  metadata: {
    name: 'kube-admin',
  },
  spec: {
    savedSearches: [
      {
        description: 'testSavedQueryDesc1',
        id: '1609811592984',
        name: 'All pods',
        searchText: 'kind:Pod',
      },
    ],
  },
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

const savedSearchesMock = [
  {
    request: {
      query: SearchResultCountDocument,
      variables: {
        input: [
          {
            keywords: [],
            filters: [
              {
                property: 'kind',
                values: ['Pod'],
              },
            ],
            limit: 1000,
          },
        ],
      },
    },
    result: {
      data: {
        searchResult: [
          {
            count: 10,
            __typename: 'SearchResult',
          },
        ],
      },
    },
  },
]
const statusAggregate = {
  req: {
    clusters: ['managed-1', 'local-cluster', 'managed-2', 'managed-cluster'],
  },
  res: {
    itemCount: 42,
    filterCounts: undefined,
  },
}

it('should render overview page with expected data', async () => {
  nockIgnoreApiPaths()
  nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
  const metricNock = nockPostRequest('/metrics?overview-fleet', {})
  const mockAlertMetricsNock = nockRequest('/observability/query?query=ALERTS', mockAlertMetrics)
  const mockOperatorMetricsNock = nockRequest(
    '/observability/query?query=cluster_operator_conditions',
    mockOperatorMetrics
  )
  const mockWorkerCoreCountMetricsNock = nockRequest(
    '/prometheus/query?query=acm_managed_cluster_worker_cores',
    mockWorkerCoreCountMetrics
  )
  const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
  const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
    '/upgrade-risks-prediction',
    { clusterIds: ['1234-abcd'] },
    mockUpgradeRisksPredictions
  )

  const { getAllByText, getByText } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(applicationsState, mockApplications)
        snapshot.set(managedClustersState, managedClusters)
        snapshot.set(managedClusterInfosState, [
          ...managedClusterInfos,
          {
            apiVersion: 'internal.open-cluster-management.io/v1beta1',
            kind: 'ManagedClusterInfo',
            metadata: {
              labels: {
                cloud: 'Amazon',
                env: 'dev',
                name: 'managed-2',
                vendor: 'OpenShift',
                clusterID: '1234-abcd',
              },
              name: 'managed-2',
              namespace: 'managed-2',
            },
            status: {
              cloudVendor: 'Amazon',
              kubeVendor: 'OpenShift',
              loggingPort: { name: 'https', port: 443, protocol: 'TCP' },
              version: 'v1.26.5+7d22122',
            },
          } as ManagedClusterInfo,
        ])
        snapshot.set(policiesState, policies)
        snapshot.set(policyreportState, policyReports)
        snapshot.set(managedClusterAddonsState, mockManagedClusterAddons)
        snapshot.set(clusterManagementAddonsState, mockClusterManagementAddons)
        snapshot.set(placementDecisionsState, placementDecisions)
        snapshot.set(helmReleaseState, [])
        snapshot.set(subscriptionsState, [])
        snapshot.set(settingsState, mockSettings)
      }}
    >
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MockedProvider mocks={savedSearchesMock}>
            <OverviewPage selectedClusterLabels={{}} />
          </MockedProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </RecoilRoot>
  )

  // Wait for prometheus nocks to finish
  await waitForNocks([
    metricNock,
    mockAlertMetricsNock,
    mockOperatorMetricsNock,
    mockWorkerCoreCountMetricsNock,
    getUserPreferenceNock,
    getUpgradeRisksPredictionsNock,
  ])

  // Test that the component has rendered correctly
  await waitFor(() => expect(getAllByText(/insights/i)).toHaveLength(3))
  await waitFor(() => expect(getByText(/cluster health/i)).toBeTruthy())

  // Check saved search card header strings
  await waitFor(() => expect(getByText('Saved searches')).toBeTruthy())
  await waitFor(() => expect(getByText('Manage')).toBeTruthy())

  // check saved search card name & desc
  await waitFor(() => expect(getByText('All pods')).toBeTruthy())
  await waitFor(() => expect(getByText('testSavedQueryDesc1')).toBeTruthy())
  await waitFor(() => expect(getByText('10')).toBeTruthy())
})

it('should toggle card sections correctly', async () => {
  nockIgnoreApiPaths()
  nockAggegateRequest('statuses', statusAggregate.req, statusAggregate.res)
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryArgoAppsCount, mockSearchResponseArgoAppsCount)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  nockSearch(mockSearchQueryOCPApplicationsCount, mockSearchResponseOCPApplicationsCount)
  const metricNock = nockPostRequest('/metrics?overview-fleet', {})
  const mockAlertMetricsNock = nockRequest('/observability/query?query=ALERTS', mockAlertMetrics)
  const mockOperatorMetricsNock = nockRequest(
    '/observability/query?query=cluster_operator_conditions',
    mockOperatorMetrics
  )
  const mockWorkerCoreCountMetricsNock = nockRequest(
    '/prometheus/query?query=acm_managed_cluster_worker_cores',
    mockWorkerCoreCountMetrics
  )
  const getUserPreferenceNock = nockRequest('/userpreference', mockUserPreference)
  const getUpgradeRisksPredictionsNock = nockUpgradeRiskRequest(
    '/upgrade-risks-prediction',
    { clusterIds: ['1234-abcd'] },
    mockUpgradeRisksPredictions
  )

  const { container } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(applicationsState, mockApplications)
        snapshot.set(managedClustersState, managedClusters)
        snapshot.set(managedClusterInfosState, [
          ...managedClusterInfos,
          {
            apiVersion: 'internal.open-cluster-management.io/v1beta1',
            kind: 'ManagedClusterInfo',
            metadata: {
              labels: {
                cloud: 'Amazon',
                env: 'dev',
                name: 'managed-2',
                vendor: 'OpenShift',
                clusterID: '1234-abcd',
              },
              name: 'managed-2',
              namespace: 'managed-2',
            },
            status: {
              cloudVendor: 'Amazon',
              kubeVendor: 'OpenShift',
              loggingPort: { name: 'https', port: 443, protocol: 'TCP' },
              version: 'v1.26.5+7d22122',
            },
          } as ManagedClusterInfo,
        ])
        snapshot.set(policiesState, policies)
        snapshot.set(policyreportState, policyReports)
        snapshot.set(managedClusterAddonsState, mockManagedClusterAddons)
        snapshot.set(clusterManagementAddonsState, mockClusterManagementAddons)
        snapshot.set(placementDecisionsState, placementDecisions)
        snapshot.set(helmReleaseState, [])
        snapshot.set(subscriptionsState, [])
        snapshot.set(settingsState, mockSettings)
      }}
    >
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MockedProvider mocks={savedSearchesMock}>
            <OverviewPage selectedClusterLabels={{}} />
          </MockedProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </RecoilRoot>
  )

  // Wait for prometheus nocks to finish
  await waitForNocks([
    metricNock,
    mockAlertMetricsNock,
    mockOperatorMetricsNock,
    mockWorkerCoreCountMetricsNock,
    getUserPreferenceNock,
    getUpgradeRisksPredictionsNock,
  ])

  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
    },
    writable: true,
  })

  // toggle insights section
  const insightsToggle = container.querySelector('#insights-section-toggle')
  expect(insightsToggle).toBeTruthy()
  userEvent.click(insightsToggle as Element)

  // toggle cluster health section
  const clusterToggle = container.querySelector('#cluster-section-toggle')
  expect(clusterToggle).toBeTruthy()
  userEvent.click(clusterToggle as Element)

  // toggle your view section
  const savedSearchToggle = container.querySelector('#saved-search-section-toggle')
  expect(savedSearchToggle).toBeTruthy()
  userEvent.click(savedSearchToggle as Element)

  expect(window.localStorage.setItem).toHaveBeenCalledWith('insights-section-toggle', 'false')
  expect(window.localStorage.setItem).toHaveBeenCalledWith('cluster-section-toggle', 'false')
  expect(window.localStorage.setItem).toHaveBeenCalledWith('saved-search-section-toggle', 'false')
})
