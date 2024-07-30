/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  certificateSigningRequestsState,
  clusterDeploymentsState,
  clusterManagementAddonsState,
  hostedClustersState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClustersState,
} from '../../../../atoms'
import { nockDelete, nockIgnoreApiPaths, nockIgnoreRBAC, nockPostRequest, nockRBAC } from '../../../../lib/nock-util'
import { rbacCreateTestHelper } from '../../../../lib/rbac-util'
import {
  clickBulkAction,
  clickByLabel,
  clickByText,
  clickRowAction,
  selectTableRow,
  typeByText,
  waitForNock,
  waitForNocks,
  waitForNotText,
  waitForTestId,
  waitForText,
} from '../../../../lib/test-util'
import { ManagedCluster, ManagedClusterDefinition, ManagedClusterInfo, ResourceAttributes } from '../../../../resources'
import ManagedClusters from './ManagedClusters'
import {
  mockCertificateSigningRequests,
  mockClusterDeployments,
  mockClusterManagementAddon,
  mockManagedClusters,
  mockManagedCluster0,
  mockManagedCluster6,
  mockManagedCluster7,
  mockManagedCluster8,
  mockManagedClusterAddon,
  mockManagedClusterInfos,
  upgradeableMockManagedClusters,
  mockClusterDeployment0,
  mockManagedCluster1,
  mockManagedClusterInfo6,
  mockManagedClusterInfo7,
  mockHostedClusters,
  mockManagedClusterInfo8,
} from './ManagedClusters.sharedmocks'

function getClusterCuratorCreateResourceAttributes(name: string) {
  return {
    resource: 'clustercurators',
    verb: 'create',
    group: 'cluster.open-cluster-management.io',
    namespace: name,
  } as ResourceAttributes
}
function getClusterCuratorPatchResourceAttributes(name: string) {
  return {
    resource: 'clustercurators',
    verb: 'patch',
    group: 'cluster.open-cluster-management.io',
    namespace: name,
  } as ResourceAttributes
}

describe('Clusters Page', () => {
  beforeEach(async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const metricNock = nockPostRequest('/metrics?clusters', {})
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
          snapshot.set(managedClusterAddonsState, [mockManagedClusterAddon])
          snapshot.set(clusterManagementAddonsState, [mockClusterManagementAddon])
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNock(metricNock)
    await waitForText(mockManagedCluster0.metadata.name!, true)
  })

  test('should render node column', () => {
    waitForText('Add-ons')
    waitForTestId('add-ons', true)
  })

  test('should be able to delete cluster using row action', async () => {
    await clickRowAction(1, 'Destroy cluster')
    await typeByText(
      `Confirm by typing "${mockManagedCluster0.metadata!.name!}" below:`,
      mockManagedCluster0.metadata!.name!
    )
    const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0), nockDelete(mockClusterDeployment0)]
    await clickByText('Destroy')
    await waitForNocks(deleteNocks)
  })

  test('should be able to delete cluster using bulk action', async () => {
    await selectTableRow(1)
    await clickBulkAction('Destroy clusters')
    await typeByText('Confirm by typing "confirm" below:', 'confirm')
    const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0), nockDelete(mockClusterDeployment0)]
    await clickByText('Destroy')
    await waitForNocks(deleteNocks)
  })

  test('should be able to detach cluster using row action', async () => {
    await clickRowAction(1, 'Detach cluster')
    await typeByText(
      `Confirm by typing "${mockManagedCluster0.metadata!.name!}" below:`,
      mockManagedCluster0.metadata!.name!
    )
    const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0)]
    await clickByText('Detach')
    await waitForNocks(deleteNocks)
  })

  test('should be able to detach cluster using bulk action', async () => {
    await selectTableRow(2)
    await clickBulkAction('Detach clusters')
    await typeByText('Confirm by typing "confirm" below:', 'confirm')
    const deleteNocks: Scope[] = [nockDelete(mockManagedCluster1)]
    await clickByText('Detach')
    await waitForNocks(deleteNocks)
  })

  test('overflow menu should hide upgrade option if no available upgrade', async () => {
    await clickByLabel('Actions', 2)
    await waitForNotText('Upgrade cluster')
  })
  test('overflow menu should hide channel select option if no available channels', async () => {
    await clickByLabel('Actions', 2)
    await waitForNotText('Select channel')
  })

  test('overflow menu should hide upgrade and channel select options if currently upgrading', async () => {
    await clickByLabel('Actions', 4)
    await waitForNotText('Upgrade cluster')
    await waitForNotText('Select channel')
  })

  test('overflow menu should allow upgrade if has available upgrade', async () => {
    await clickByLabel('Actions', 3)
    await clickByText('Upgrade cluster')
    await waitForText('Current version')
  })

  test('overflow menu should allow channel select if has available channels', async () => {
    await clickByLabel('Actions', 3)
    await clickByText('Select channel')
    await waitForText('Current channel')
  })

  test('batch upgrade support when upgrading multiple clusters', async () => {
    await selectTableRow(1)
    await selectTableRow(2)
    await selectTableRow(3)
    await selectTableRow(4)
    await clickBulkAction('Upgrade clusters')
    await waitForText(`Current version`)
  })
  test('batch select channel support when updating multiple clusters', async () => {
    await selectTableRow(1)
    await selectTableRow(2)
    await selectTableRow(3)
    await selectTableRow(4)
    await clickBulkAction('Select channels')
    await waitForText('Current channel')
  })
})

describe('Clusters Page RBAC', () => {
  test('should perform RBAC checks', async () => {
    nockIgnoreApiPaths()
    const metricNock = nockPostRequest('/metrics?clusters', {})
    const rbacCreateManagedClusterNock = nockRBAC(rbacCreateTestHelper(ManagedClusterDefinition))
    const upgradeRBACNocks: Scope[] = upgradeableMockManagedClusters.reduce((prev, mockManagedCluster) => {
      prev.push(
        nockRBAC(getClusterCuratorPatchResourceAttributes(mockManagedCluster.metadata.name!)),
        nockRBAC(getClusterCuratorCreateResourceAttributes(mockManagedCluster.metadata.name!))
      )
      return prev
    }, [] as Scope[])
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForText(mockManagedCluster0.metadata.name!, true)
    await waitForNocks([metricNock, rbacCreateManagedClusterNock, ...upgradeRBACNocks])
  })
})

describe('Clusters Page hypershift', () => {
  test('should render hypershift clusters', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const metricNock = nockPostRequest('/metrics?clusters', {})
    const hypershiftMockManagedClusters: ManagedCluster[] = [mockManagedCluster6, mockManagedCluster7]
    const hypershiftMockManagedClusterInfos: ManagedClusterInfo[] = [mockManagedClusterInfo6, mockManagedClusterInfo7]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, hypershiftMockManagedClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, hypershiftMockManagedClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
          snapshot.set(hostedClustersState, mockHostedClusters)
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNock(metricNock)
    await waitForText(mockManagedCluster6.metadata.name!, true)
  })
})

describe('Clusters Page regional hub cluster', () => {
  test('should render regional hub clusters', async () => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const metricNock = nockPostRequest('/metrics?clusters', {})
    const mockRegionalHubClusters: ManagedCluster[] = [mockManagedCluster8]
    const mockRegionalHubClusterInfos: ManagedClusterInfo[] = [mockManagedClusterInfo8]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockRegionalHubClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, mockRegionalHubClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForNock(metricNock)
    await waitForText(mockManagedCluster8.metadata.name!, true)
    await waitForText('Hub')
  })
})
