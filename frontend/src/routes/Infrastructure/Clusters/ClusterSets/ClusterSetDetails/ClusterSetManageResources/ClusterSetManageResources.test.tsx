/* Copyright Contributors to the Open Cluster Management project */

import {
  ClusterDeployment,
  ClusterDeploymentApiVersion,
  ClusterDeploymentKind,
  ClusterPool,
  ClusterPoolApiVersion,
  ClusterPoolKind,
  ManagedCluster,
  ManagedClusterApiVersion,
  ManagedClusterKind,
  ManagedClusterSet,
  ManagedClusterSetApiVersion,
  ManagedClusterSetKind,
  SelfSubjectAccessReview,
  managedClusterSetLabel,
} from '../../../../../../resources'
import { testMapClusters } from '../../../../../../resources/utils'
import { render } from '@testing-library/react'
import nock from 'nock'
import { MemoryRouter, Outlet, Route, Routes, generatePath } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import {
  certificateSigningRequestsState,
  clusterDeploymentsState,
  clusterPoolsState,
  managedClusterInfosState,
  managedClusterSetsState,
  managedClustersState,
} from '../../../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC, nockPatch, nockRBAC } from '../../../../../../lib/nock-util'
import { mockGlobalClusterSet, mockManagedClusterSet } from '../../../../../../lib/test-metadata'
import {
  clickByLabel,
  clickByText,
  waitForNocks,
  waitForNotText,
  waitForTestId,
  waitForText,
} from '../../../../../../lib/test-util'
import { NavigationPath } from '../../../../../../NavigationPath'
import { ClusterSetDetailsContext } from '../ClusterSetDetails'
import { ClusterSetManageResourcesPage } from './ClusterSetManageResources'

const mockManagedClusterAdd: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'a-managed-cluster-add',
    uid: 'a-managed-cluster-add',
    labels: {},
  },
  spec: { hubAcceptsClient: true },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
    conditions: [],
    version: { kubernetes: '' },
  },
}
const mockClusterDeploymentAdd: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    name: mockManagedClusterAdd.metadata.name!,
    namespace: mockManagedClusterAdd.metadata.name!,
    uid: mockManagedClusterAdd.metadata.name!,
    labels: {},
  },
}
const mockManagedClusterRemove: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'b-managed-cluster-remove',
    uid: 'b-managed-cluster-remove',
    labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
  },
  spec: { hubAcceptsClient: true },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
    conditions: [],
    version: { kubernetes: '' },
  },
}
const mockClusterDeploymentRemove: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    name: mockManagedClusterRemove.metadata.name!,
    namespace: mockManagedClusterRemove.metadata.name!,
    uid: mockManagedClusterRemove.metadata.name!,
    labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
  },
}
const mockManagedClusterUnchanged: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'c-managed-cluster-unchanged',
    uid: 'c-managed-cluster-unchanged',
    labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
  },
  spec: { hubAcceptsClient: true },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
    conditions: [],
    version: { kubernetes: '' },
  },
}

const mockManagedClusterSetTransfer: ManagedClusterSet = {
  apiVersion: ManagedClusterSetApiVersion,
  kind: ManagedClusterSetKind,
  metadata: {
    name: 'test-cluster-set-transfer',
    uid: 'test-cluster-set-transfer',
  },
  spec: {},
}

const mockManagedClusterTransfer: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'd-managed-cluster-transfer',
    uid: 'd-managed-cluster-transfer',
    labels: { [managedClusterSetLabel]: mockManagedClusterSetTransfer.metadata.name! },
  },
  spec: { hubAcceptsClient: true },
}

// Hub / local-cluster labeled with the global set — must remain assignable (ACM-46180)
const mockManagedClusterGlobal: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'local-cluster',
    uid: 'local-cluster',
    labels: {
      [managedClusterSetLabel]: mockGlobalClusterSet.metadata.name!,
      'local-cluster': 'true',
    },
  },
  spec: { hubAcceptsClient: true },
  status: {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
    conditions: [],
    version: { kubernetes: '' },
  },
}

const mockManagedClusterClaimed: ManagedCluster = {
  apiVersion: ManagedClusterApiVersion,
  kind: ManagedClusterKind,
  metadata: {
    name: 'd-managed-cluster-claimed',
    uid: 'd-managed-cluster-claimed',
  },
  spec: { hubAcceptsClient: true },
}

const mockClusterDeploymentClaimed: ClusterDeployment = {
  apiVersion: ClusterDeploymentApiVersion,
  kind: ClusterDeploymentKind,
  metadata: {
    name: mockManagedClusterClaimed.metadata.name!,
    namespace: mockManagedClusterClaimed.metadata.name!,
    uid: mockManagedClusterClaimed.metadata.name!,
  },
  spec: {
    clusterName: mockManagedClusterClaimed.metadata.name!,
    installed: true,
    provisioning: {
      imageSetRef: {
        name: '',
      },
      installConfigSecretRef: {
        name: '',
      },
      sshPrivateKeySecretRef: {
        name: '',
      },
    },
    pullSecretRef: {
      name: '',
    },
    clusterPoolRef: {
      claimName: 'e-managed-cluster-claim',
      namespace: 'e-managed-cluster-claim',
      poolName: 'a-cluster-pool-i',
    },
  },
}

const mockClusterPool: ClusterPool = {
  apiVersion: ClusterPoolApiVersion,
  kind: ClusterPoolKind,
  metadata: {
    name: 'a-cluster-pool',
    namespace: 'a-cluster-pool',
    uid: 'a-cluster-pool',
  },
  spec: {
    baseDomain: '',
    installConfigSecretTemplateRef: {
      name: '',
    },
    imageSetRef: {
      name: '',
    },
    pullSecretRef: {
      name: '',
    },
    size: 1,
  },
}

function nockNonAdminAccess() {
  return nock(process.env.JEST_DEFAULT_HOST as string)
    .persist()
    .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', (body: SelfSubjectAccessReview) => {
      const resourceAttributes = body.spec?.resourceAttributes
      return resourceAttributes?.verb === '*' && resourceAttributes?.resource === '*'
    })
    .optionally()
    .reply(201, (_uri, requestBody: SelfSubjectAccessReview) => ({
      apiVersion: 'authorization.k8s.io/v1',
      kind: 'SelfSubjectAccessReview',
      metadata: {},
      spec: requestBody.spec,
      status: { allowed: false },
    }))
}

function nockJoinClusterSet(clusterSetName: string, allowed: boolean) {
  return nockRBAC(
    {
      name: clusterSetName,
      resource: 'managedclustersets',
      subresource: 'join',
      verb: 'create',
      group: 'cluster.open-cluster-management.io',
    },
    allowed
  )
}

function nockPatchManagedCluster(clusterName: string, op: 'replace' | 'add' | 'remove', value?: string) {
  const patch: { op: 'replace' | 'add' | 'remove'; path: string; value?: string } = {
    op,
    path: `/metadata/labels/${managedClusterSetLabel.replaceAll('/', '~1')}`,
  }
  if (value) {
    patch.value = value
  }
  return nockPatch(
    {
      apiVersion: ManagedClusterApiVersion,
      kind: ManagedClusterKind,
      metadata: {
        name: clusterName,
      },
    },
    [patch]
  )
}

function nockPatchClusterDeployment(clusterName: string, op: 'replace' | 'add' | 'remove', value?: string) {
  const patch: { op: 'replace' | 'add' | 'remove'; path: string; value?: string } = {
    op,
    path: `/metadata/labels/${managedClusterSetLabel.replaceAll('/', '~1')}`,
  }
  if (value) {
    patch.value = value
  }
  return nockPatch(
    {
      apiVersion: ClusterDeploymentApiVersion,
      kind: ClusterDeploymentKind,
      metadata: {
        name: clusterName,
        namespace: clusterName,
      },
    },
    [patch]
  )
}

const Component = () => {
  const context: Partial<ClusterSetDetailsContext> = {
    clusterSet: mockManagedClusterSet,
    clusters: testMapClusters({
      managedClusters: [mockManagedClusterRemove, mockManagedClusterUnchanged],
    }),
    clusterPools: [],
    clusterDeployments: [mockClusterDeploymentClaimed],
    clusterRoleBindings: [],
  }
  return (
    <StateProvider
      initializeStore={(store) => {
        store.set(managedClustersState, [
          mockManagedClusterAdd,
          mockManagedClusterRemove,
          mockManagedClusterUnchanged,
          mockManagedClusterTransfer,
          mockManagedClusterGlobal,
          mockManagedClusterClaimed,
        ])
        store.set(managedClusterSetsState, [mockManagedClusterSet, mockManagedClusterSetTransfer, mockGlobalClusterSet])
        store.set(clusterDeploymentsState, [mockClusterDeploymentAdd, mockClusterDeploymentRemove])
        store.set(managedClusterInfosState, [])
        store.set(certificateSigningRequestsState, [])
        store.set(clusterDeploymentsState, [
          mockClusterDeploymentAdd,
          mockClusterDeploymentRemove,
          mockClusterDeploymentClaimed,
        ])
        store.set(clusterPoolsState, [mockClusterPool])
      }}
    >
      <MemoryRouter
        initialEntries={[generatePath(NavigationPath.clusterSetManage, { id: mockManagedClusterSet.metadata.name! })]}
      >
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route path={NavigationPath.clusterSetManage} element={<ClusterSetManageResourcesPage />} />
            <Route path={NavigationPath.clusterSetOverview} element={<div id="redirected" />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </StateProvider>
  )
}

describe('ClusterSetManageClusters', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })
  test('does not display claimed clusters for reassignment', async () => {
    render(<Component />)
    await waitForNotText('Loading')
    await waitForText(mockManagedClusterAdd.metadata.name!)
    await waitForText(mockManagedClusterRemove.metadata.name!)
    await waitForText(mockManagedClusterUnchanged.metadata.name!)
    await waitForText(mockManagedClusterTransfer.metadata.name!)
    await waitForText(mockManagedClusterGlobal.metadata.name!)

    await waitForNotText(mockManagedClusterClaimed.metadata.name!)
    await waitForText(mockManagedClusterAdd.metadata.name!)
  })
  test('does not display cluster pools for reassignment', async () => {
    render(<Component />)
    await waitForNotText('Loading')
    await waitForText(mockManagedClusterAdd.metadata.name!)
    await waitForText(mockManagedClusterRemove.metadata.name!)
    await waitForText(mockManagedClusterUnchanged.metadata.name!)
    await waitForText(mockManagedClusterTransfer.metadata.name!)
    await waitForText(mockManagedClusterGlobal.metadata.name!)

    await waitForNotText(mockClusterPool.metadata.name!)
  })

  test('displays clusters labeled with the global cluster set for reassignment', async () => {
    const { container } = render(<Component />)
    await waitForNotText('Loading')
    await waitForText(mockManagedClusterGlobal.metadata.name!)

    expect(
      container.querySelector(
        `[data-ouia-component-id=${mockManagedClusterGlobal.metadata.name!}] td[data-label="Current cluster set"]`
      )!.innerHTML
    ).toEqual(mockGlobalClusterSet.metadata.name!)
  })

  test('does not display global-labeled clusters when user cannot join global', async () => {
    nock.cleanAll()
    nockIgnoreApiPaths()
    nockNonAdminAccess()
    nockJoinClusterSet(mockManagedClusterSet.metadata.name!, true)
    nockJoinClusterSet(mockManagedClusterSetTransfer.metadata.name!, true)
    nockJoinClusterSet(mockGlobalClusterSet.metadata.name!, false)

    render(<Component />)
    await waitForNotText('Loading')
    await waitForText(mockManagedClusterAdd.metadata.name!)
    await waitForText(mockManagedClusterRemove.metadata.name!)
    await waitForText(mockManagedClusterTransfer.metadata.name!)
    await waitForNotText(mockManagedClusterGlobal.metadata.name!)
  })

  test('can transfer a cluster labeled with the global cluster set', async () => {
    render(<Component />)
    await waitForNotText('Loading')
    await waitForText(mockManagedClusterGlobal.metadata.name!)
    await waitForText('2 selected')

    // local-cluster is sorted after the a–d managed clusters
    await clickByLabel('Select row 4')
    await clickByText('Review')

    await waitForText('Confirm changes')
    await waitForText('Transferred')

    const patchNocks = [
      nockPatchManagedCluster(mockManagedClusterGlobal.metadata.name!, 'replace', mockManagedClusterSet.metadata.name!),
      nockPatchClusterDeployment(
        mockManagedClusterGlobal.metadata.name!,
        'replace',
        mockManagedClusterSet.metadata.name!
      ),
    ]
    await clickByText('Save')

    await waitForNocks(patchNocks)
    await waitForTestId('redirected')
  })

  test('can update cluster assignments', async () => {
    const { container } = render(<Component />)
    await waitForNotText('Loading')
    await waitForText(mockManagedClusterAdd.metadata.name!)
    await waitForText(mockManagedClusterRemove.metadata.name!)
    await waitForText(mockManagedClusterUnchanged.metadata.name!)
    await waitForText(mockManagedClusterTransfer.metadata.name!)
    await waitForText(mockManagedClusterGlobal.metadata.name!)

    await waitForText('2 selected')

    // verify cluster to add is not assigned
    expect(
      container.querySelector(
        `[data-ouia-component-id=${mockManagedClusterAdd.metadata.name!}] td[data-label="Current cluster set"]`
      )!.innerHTML
    ).toEqual('-')

    // verify cluster to remove is assigned
    expect(
      container.querySelector(
        `[data-ouia-component-id=${mockManagedClusterRemove.metadata.name!}] td[data-label="Current cluster set"]`
      )!.innerHTML
    ).toEqual(mockManagedClusterSet.metadata.name!)

    // verify cluster that won't be changed is assigned
    expect(
      container.querySelector(
        `[data-ouia-component-id=${mockManagedClusterUnchanged.metadata.name!}] td[data-label="Current cluster set"]`
      )!.innerHTML
    ).toEqual(mockManagedClusterSet.metadata.name!)

    // verify transferred cluster is marked under a different cluster set
    expect(
      container.querySelector(
        `[data-ouia-component-id=${mockManagedClusterTransfer.metadata.name!}] td[data-label="Current cluster set"]`
      )!.innerHTML
    ).toEqual(mockManagedClusterSetTransfer.metadata.name!)

    // select the cluster to add
    await clickByLabel('Select row 0')
    // unselect the cluster to remove
    await clickByLabel('Select row 1')
    // select the cluster to transfer
    await clickByLabel('Select row 3')

    await clickByText('Review')

    // confirm modal
    await waitForText('Confirm changes')

    await waitForText('Added')
    await waitForText('Removed')
    await waitForText('No change')
    await waitForText('Transferred')

    const patchNocks = [
      // remove cluster
      nockPatchManagedCluster(mockManagedClusterRemove.metadata.name!, 'remove'),
      nockPatchClusterDeployment(mockClusterDeploymentRemove.metadata.name!, 'remove'),

      // add cluster
      nockPatchManagedCluster(mockManagedClusterAdd.metadata.name!, 'add', mockManagedClusterSet.metadata.name!),
      nockPatchClusterDeployment(mockClusterDeploymentAdd.metadata.name!, 'add', mockManagedClusterSet.metadata.name!),

      // transfer cluster
      nockPatchManagedCluster(
        mockManagedClusterTransfer.metadata.name!,
        'replace',
        mockManagedClusterSet.metadata.name!
      ),
      nockPatchClusterDeployment(
        mockManagedClusterTransfer.metadata.name!,
        'replace',
        mockManagedClusterSet.metadata.name!
      ),
    ]
    await clickByText('Save')

    await waitForNocks(patchNocks)

    await waitForTestId('redirected')
  })
})
