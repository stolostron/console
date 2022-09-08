/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { nockGet, nockIgnoreRBAC, nockSearch } from '../../../../../../lib/nock-util'
import { ClusterContext } from '../ClusterDetails'
import { ClusterOverviewPageContent } from './ClusterOverview'
import { mockAWSHypershiftCluster, mockAWSHostedCluster, mockBMHypershiftCluster } from '../ClusterDetails.sharedmocks'
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
import { Secret, SecretApiVersion, SecretKind } from '../../../../../../resources'

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

    it('should render overview with AWS hypershift cluster', async () => {
        await waitForText(mockAWSHypershiftCluster.name)
    })
})

describe('ClusterOverview with BM hypershift cluster', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        nockSearch(mockSearchQuery, mockSearchResponse)
        nockGet(kubeConfigSecret)
        nockGet(kubeAdminPassSecret)
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
                            cluster: mockBMHypershiftCluster,
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

    it('should render overview with BM hypershift cluster', async () => {
        await waitForText(mockAWSHypershiftCluster.name)
    })
})
