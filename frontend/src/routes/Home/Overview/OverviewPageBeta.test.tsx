/* Copyright Contributors to the Open Cluster Management project */

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
  subscriptionsState,
} from '../../../atoms'
import { nockIgnoreApiPaths, nockRequest, nockSearch } from '../../../lib/nock-util'
import { waitForNocks } from '../../../lib/test-util'
import {
  mockApplications,
  mockArgoApplications,
  mockSearchQueryArgoApps,
  mockSearchQueryOCPApplications,
  mockSearchResponseArgoApps,
  mockSearchResponseOCPApplications,
} from '../../Applications/Application.sharedmocks'
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

it('should render overview page with expected data', async () => {
  nockIgnoreApiPaths()
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  const mockAlertMetricsNock = nockRequest('/observability/query?query=ALERTS', mockAlertMetrics)
  const mockOperatorMetricsNock = nockRequest(
    '/observability/query?query=cluster_operator_conditions',
    mockOperatorMetrics
  )

  const { getAllByText, getByText } = render(
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(applicationsState, mockApplications)
        snapshot.set(applicationSetsState, appSets)
        snapshot.set(argoApplicationsState, mockArgoApplications)
        snapshot.set(managedClustersState, managedClusters)
        snapshot.set(managedClusterInfosState, managedClusterInfos)
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
      }}
    >
      <Router history={createBrowserHistory()}>
        <OverviewPageBeta selectedClusterLabels={{}} />
      </Router>
    </RecoilRoot>
  )

  // Wait for prometheus nocks to finish
  await waitForNocks([mockAlertMetricsNock, mockOperatorMetricsNock])

  // Test that the component has rendered correctly
  await waitFor(() => expect(getAllByText(/powered by insights/i)).toHaveLength(2))
  await waitFor(() => expect(getByText(/cluster health/i)).toBeTruthy())
})
