/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { nockIgnoreRBAC, nockSearch } from '../../../../../../lib/nock-util'
import { ClusterContext } from '../ClusterDetails'
import { ClusterOverviewPageContent } from './ClusterOverview'
import { mockAWSHypershiftCluster, mockAWSHostedCluster } from '../ClusterDetails.sharedmocks'
import { waitForText } from '../../../../../../lib/test-util'
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
import { MemoryRouter } from 'react-router-dom'

const mockHistoryPush = jest.fn()

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
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
                    { property: 'kind', values: ['subscription'] },
                    { property: 'cluster', values: ['feng-hypershift-test'] },
                ],
                relatedKinds: ['application'],
            },
            {
                filters: [
                    { property: 'compliant', values: ['!Compliant'] },
                    { property: 'kind', values: ['policy'] },
                    { property: 'namespace', values: ['feng-hypershift-test'] },
                    { property: 'cluster', values: 'local-cluster' },
                ],
            },
        ],
    },
    query: 'query searchResult($input: [SearchInput]) {\n  searchResult: search(input: $input) {\n    count\n    related {\n      kind\n      count\n      __typename\n    }\n    __typename\n  }\n}\n',
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

describe('ClusterOverview', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        nockSearch(mockSearchQuery, mockSearchResponse)
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(policyreportState, [])
                    snapshot.set(managedClustersState, [])
                    snapshot.set(clusterDeploymentsState, [])
                    snapshot.set(managedClusterInfosState, [])
                    snapshot.set(certificateSigningRequestsState, [])
                    snapshot.set(managedClusterAddonsState, [])
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
                <MemoryRouter>
                    <ClusterContext.Provider
                        value={{
                            cluster: mockAWSHypershiftCluster,
                            addons: undefined,
                            hostedCluster: mockAWSHostedCluster,
                        }}
                    >
                        <ClusterOverviewPageContent />
                    </ClusterContext.Provider>
                </MemoryRouter>
            </RecoilRoot>
        )
    })

    it('should render overview with hypershift cluster', async () => {
        await waitForText(mockAWSHypershiftCluster.name)
    })
})
