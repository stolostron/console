/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Switch, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import ClusterSetDetailsPage from './ClusterSetDetails'
import { waitForText } from '../../../../lib/test-util'
import { nockIgnoreRBAC } from '../../../../lib/nock-util'
import { mockManagedClusterSet } from '../../../../lib/test-metadata'
import { managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import { ManagedCluster } from '../../../../resources/managed-cluster'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterSetsState,
} from '../../../../atoms'
import { mockClusterDeployments, mockManagedClusterInfos, mockManagedClusters } from '../../Clusters/Clusters.test'
import { NavigationPath } from '../../../../NavigationPath'

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

describe('ClusterSetDetails page', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        render(<Component />)
    })
    test('renders', () => {
        waitForText(mockManagedClusterSet.metadata.name!, true)
        waitForText(clusterSetCluster.metadata.name!)
    })
})
