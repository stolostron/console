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
import { nockGet, nockIgnoreApiPaths, nockRequest, nockSearch } from '../../../lib/nock-util'
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

const mockMCOReq = {
  apiVersion: 'observability.open-cluster-management.io/v1beta2',
  kind: 'MultiClusterObservability',
  metadata: {
    name: 'observability',
  },
}
const mockMCORes = {
  apiVersion: 'observability.open-cluster-management.io/v1beta2',
  kind: 'MultiClusterObservability',
  metadata: {
    creationTimestamp: '2023-08-14T18:52:13Z',
    name: 'observability',
  },
  status: {
    conditions: [
      {
        lastTransitionTime: '2023-08-14T19:21:00Z',
        message: 'Observability components are deployed and running',
        reason: 'Ready',
        status: 'True',
        type: 'Ready',
      },
    ],
  },
}

const mockRouteReq = {
  apiVersion: 'route.openshift.io/v1',
  kind: 'Route',
  metadata: {
    name: 'grafana',
    namespace: 'open-cluster-management-observability',
  },
}
const mockRouteRes = {
  kind: 'Route',
  apiVersion: 'route.openshift.io/v1',
  metadata: {
    name: 'grafana',
    namespace: 'open-cluster-management-observability',
    creationTimestamp: '2023-08-14T18:52:15Z',
  },
  spec: {
    host: 'grafana-open-cluster-management-observability.apps.sno-4xlarge-413-9grb6.dev07.red-chesterfield.com',
    to: {
      kind: 'Service',
      name: 'grafana',
      weight: 100,
    },
    port: {
      targetPort: 'oauth-proxy',
    },
    tls: {
      termination: 'reencrypt',
      insecureEdgeTerminationPolicy: 'Redirect',
    },
    wildcardPolicy: 'None',
  },
}

it('should render overview page with expected data', async () => {
  nockIgnoreApiPaths()
  const getMCONock = nockGet(mockMCOReq, mockMCORes)
  const getRouteNock = nockGet(mockRouteReq, mockRouteRes)
  nockSearch(mockSearchQueryArgoApps, mockSearchResponseArgoApps)
  nockSearch(mockSearchQueryOCPApplications, mockSearchResponseOCPApplications)
  const mockAlertMetricsNock = nockRequest('/api/v1/query?query=ALERTS', mockAlertMetrics)
  const mockOperatorMetricsNock = nockRequest('/api/v1/query?query=cluster_operator_conditions', mockOperatorMetrics)

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
  await waitForNocks([getMCONock, getRouteNock, mockAlertMetricsNock, mockOperatorMetricsNock])

  // Test that the component has rendered correctly
  await waitFor(() => expect(getAllByText(/powered by insights/i)).toHaveLength(2))
  await waitFor(() => expect(getByText(/cluster health/i)).toBeTruthy())
})
