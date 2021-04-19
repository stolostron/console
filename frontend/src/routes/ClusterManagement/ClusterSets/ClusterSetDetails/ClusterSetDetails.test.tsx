/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Switch, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import ClusterSetDetailsPage from './ClusterSetDetails'
import { waitForText, clickByText, clickByLabel, waitForNocks, clickByPlaceholderText } from '../../../../lib/test-util'
import { nockIgnoreRBAC, nockDelete, nockCreate } from '../../../../lib/nock-util'
import { mockManagedClusterSet } from '../../../../lib/test-metadata'
import { managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import { ManagedCluster } from '../../../../resources/managed-cluster'
import { ClusterRoleBinding, ClusterRoleBindingKind, RbacApiVersion } from '../../../../resources/rbac'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterSetsState,
} from '../../../../atoms'
import { mockClusterDeployments, mockManagedClusterInfos, mockManagedClusters } from '../../Clusters/Clusters.test'
import { NavigationPath } from '../../../../NavigationPath'
import { nockClusterList } from '../../../../lib/nock-util'

const Component = () => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
            snapshot.set(clusterDeploymentsState, mockClusterDeployments)
            snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
            snapshot.set(managedClustersState, mockManagedClusters)
            snapshot.set(certificateSigningRequestsState, [])
        }}
    >
        <MemoryRouter
            initialEntries={[NavigationPath.clusterSetDetails.replace(':id', mockManagedClusterSet.metadata.name!)]}
        >
            <Switch>
                <Route path={NavigationPath.clusterSetDetails} component={ClusterSetDetailsPage} />
            </Switch>
        </MemoryRouter>
    </RecoilRoot>
)

const clusterSetCluster: ManagedCluster = mockManagedClusters.find(
    (mc: ManagedCluster) => mc.metadata.labels?.[managedClusterSetLabel] === mockManagedClusterSet.metadata.name!
)!

const mockClusterRoleBinding: ClusterRoleBinding = {
    apiVersion: RbacApiVersion,
    kind: ClusterRoleBindingKind,
    metadata: {
        name: 'cluster-set-binding',
        uid: '88723604-037e-4e42-9f46-13839752b3be',
    },
    subjects: [
        {
            kind: 'User',
            apiGroup: 'rbac.authorization.k8s.io',
            name: 'mock-user',
        },
    ],
    roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: `open-cluster-management:managedclusterset:admin:${mockManagedClusterSet.metadata.name!}`,
    },
}

const mockUser = {
    kind: 'User',
    apiVersion: 'user.openshift.io/v1',
    metadata: {
        name: 'mock-user2',
        uid: 'e3d73187-dcf4-49a2-b0fb-d2805c5dd584',
    },
    identities: ['myuser:mock-user2'],
    groups: null,
}

const mockGroup = {
    kind: 'Group',
    apiVersion: 'user.openshift.io/v1',
    metadata: {
        name: 'mock-group',
        uid: '98d01b86-7721-4b98-b145-58df2bff2f6e',
    },
    users: [],
}

describe('ClusterSetDetails page', () => {
    beforeEach(async () => {
        const getNocks = [nockClusterList(mockUser, [mockUser]), nockClusterList(mockGroup, [mockGroup])]
        nockIgnoreRBAC()
        render(<Component />)
        await waitForNocks(getNocks)
    })
    test('renders', () => {
        waitForText(mockManagedClusterSet.metadata.name!, true)
        waitForText(clusterSetCluster.metadata.name!)
    })
    test('can remove users from cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('tab.access')
        await waitForNocks([nock])
        await waitForText('mock-user')
        await clickByLabel('Actions', 0)
        await clickByText('access.remove')
        await waitForText('bulk.title.removeAuthorization')
        const deleteNock = nockDelete(mockClusterRoleBinding)
        await clickByText('remove')
        await waitForNocks([deleteNock])
    })
    test('can add users to the cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('tab.access')
        await waitForNocks([nock])
        await clickByText('access.add')
        await waitForText('access.add.title')
        await clickByPlaceholderText('access.select.user')
        await clickByText(mockUser.metadata.name!)
        await clickByText('access.select.role')
        await clickByText('Cluster set admin')
        const createNock = nockCreate({
            apiVersion: RbacApiVersion,
            kind: ClusterRoleBindingKind,
            metadata: {
                generateName: `${mockManagedClusterSet?.metadata.name}-`,
            },
            subjects: [
                {
                    kind: 'User',
                    apiGroup: 'rbac.authorization.k8s.io',
                    name: mockUser!.metadata.name!,
                },
            ],
            roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
                name: `open-cluster-management:managedclusterset:admin:${mockManagedClusterSet!.metadata.name!}`,
            },
        })
        await clickByText('common:add')
        await waitForNocks([createNock])
    })
    test('can add groups to the cluster set', async () => {
        const nock = nockClusterList({ apiVersion: RbacApiVersion, kind: ClusterRoleBindingKind }, [
            mockClusterRoleBinding,
        ])
        await waitForText(mockManagedClusterSet.metadata.name!, true)
        await clickByText('tab.access')
        await waitForNocks([nock])
        await clickByText('access.add')
        await waitForText('access.add.title')
        await clickByText('access.groups')
        await clickByPlaceholderText('access.select.group')
        await clickByText(mockGroup.metadata.name!)
        await clickByText('access.select.role')
        await clickByText('Cluster set view')
        const createNock = nockCreate({
            apiVersion: RbacApiVersion,
            kind: ClusterRoleBindingKind,
            metadata: {
                generateName: `${mockManagedClusterSet?.metadata.name}-`,
            },
            subjects: [
                {
                    kind: 'Group',
                    apiGroup: 'rbac.authorization.k8s.io',
                    name: mockGroup!.metadata.name!,
                },
            ],
            roleRef: {
                apiGroup: 'rbac.authorization.k8s.io',
                kind: 'ClusterRole',
                name: `open-cluster-management:managedclusterset:view:${mockManagedClusterSet!.metadata.name!}`,
            },
        })
        await clickByText('common:add')
        await waitForNocks([createNock])
    })
})
