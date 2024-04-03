/* Copyright Contributors to the Open Cluster Management project */

import { MockedProvider } from '@apollo/client/testing'
import { render, waitFor } from '@testing-library/react'
import { createBrowserHistory } from 'history'
import { Router } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
  applicationSetsState,
  applicationsState,
  argoApplicationsState,
  clusterManagementAddonsState,
  discoveredApplicationsState,
  discoveredOCPAppResourcesState,
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
  mockArgoApplications,
  mockSearchQueryArgoApps,
  mockSearchQueryOCPApplications,
  mockSearchResponseArgoApps,
  mockSearchResponseOCPApplications,
} from '../../Applications/Application.sharedmocks'
import { SearchResultCountDocument } from '../Search/search-sdk/search-sdk'
import OverviewPageBeta from './OverviewPageBeta'
import {
  appSets,
  managedClusterInfos,
  managedClusters,
  mockAlertMetrics,
  mockClusterManagementAddons,
  mockManagedClusterAddons,
  mockOperatorMetrics,
  ocpApps,
  placementDecisions,
  policies,
  policyReports,
} from './sharedmocks'

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

it('should render overview page with expected data', async () => {
  nockIgnoreApiPaths()
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  const metricNock = nockPostRequest('/metrics?overview-fleet', {})
  const mockAlertMetricsNock = nockRequest('/observability/query?query=ALERTS', mockAlertMetrics)
  const mockOperatorMetricsNock = nockRequest(
    '/observability/query?query=cluster_operator_conditions',
    mockOperatorMetrics
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
        snapshot.set(applicationSetsState, appSets)
        snapshot.set(argoApplicationsState, mockArgoApplications)
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
        snapshot.set(discoveredOCPAppResourcesState, ocpApps)
        snapshot.set(argoApplicationsState, [])
        snapshot.set(discoveredApplicationsState, [])
        snapshot.set(helmReleaseState, [])
        snapshot.set(subscriptionsState, [])
        snapshot.set(settingsState, mockSettings)
      }}
    >
      <Router history={createBrowserHistory()}>
        <MockedProvider mocks={savedSearchesMock}>
          <OverviewPageBeta selectedClusterLabels={{}} />
        </MockedProvider>
      </Router>
    </RecoilRoot>
  )

  // Wait for prometheus nocks to finish
  await waitForNocks([
    metricNock,
    mockAlertMetricsNock,
    mockOperatorMetricsNock,
    getUserPreferenceNock,
    getUpgradeRisksPredictionsNock,
  ])

  // Test that the component has rendered correctly
  await waitFor(() => expect(getAllByText(/powered by insights/i)).toHaveLength(3))
  await waitFor(() => expect(getByText(/cluster health/i)).toBeTruthy())

  // Check saved search card header strings
  await waitFor(() => expect(getByText('Saved searches')).toBeTruthy())
  await waitFor(() => expect(getByText('Manage')).toBeTruthy())

  // check saved search card name & desc
  await waitFor(() => expect(getByText('All pods')).toBeTruthy())
  await waitFor(() => expect(getByText('testSavedQueryDesc1')).toBeTruthy())
  await waitFor(() => expect(getByText('10')).toBeTruthy())
})
