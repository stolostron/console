/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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
import { nockGet, nockIgnoreRBAC, nockSearch } from '../../../../../../lib/nock-util'
import { clickByText, waitForText } from '../../../../../../lib/test-util'
import { Secret, SecretApiVersion, SecretKind } from '../../../../../../resources'
import { ClusterContext } from '../ClusterDetails'
import {
    mockAWSHostedCluster,
    mockAWSHypershiftCluster,
    mockAWSHypershiftClusterNoHypershift,
    mockBMHypershiftCluster,
    mockBMHypershiftClusterNoNamespace,
    mockRegionalHubCluster,
} from '../ClusterDetails.sharedmocks'
import { ClusterOverviewPageContent } from './ClusterOverview'

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
                    { property: 'kind', values: ['Subscription'] },
                    { property: 'cluster', values: ['feng-hypershift-test'] },
                ],
                relatedKinds: ['Application'],
            },
            {
                filters: [
                    { property: 'compliant', values: ['!Compliant'] },
                    { property: 'kind', values: ['Policy'] },
                    { property: 'namespace', values: ['feng-hypershift-test'] },
                    { property: 'cluster', values: ['local-cluster'] },
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
        await clickByText('Reveal credentials')
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
        await waitForText(mockBMHypershiftCluster.name)
        await clickByText('Reveal credentials')
    })
})

describe('ClusterOverview with BM hypershift cluster no namespace', () => {
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
                            cluster: mockBMHypershiftClusterNoNamespace,
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

    it('should render overview with BM hypershift cluster no namespace', async () => {
        await waitForText(mockBMHypershiftClusterNoNamespace.name)
        await clickByText('Reveal credentials')
    })
})

describe('ClusterOverview with AWS hypershift cluster no hypershift', () => {
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
                            cluster: mockAWSHypershiftClusterNoHypershift,
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

    it('should render overview with AWS hypershift cluster no hypershift', async () => {
        await waitForText(mockAWSHypershiftClusterNoHypershift.name)
        await clickByText('Reveal credentials')
    })
})

describe('ClusterOverview with AWS hypershift cluster no hostedCluster', () => {
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
                            hostedCluster: undefined,
                        }}
                    >
                        <ClusterOverviewPageContent />
                    </ClusterContext.Provider>
                </MemoryRouter>
            </RecoilRoot>
        )
    })

    it('should render overview with AWS hypershift cluster no hostedCluster', async () => {
        await waitForText(mockAWSHypershiftCluster.name)
        await clickByText('Reveal credentials')
    })
})

describe('ClusterOverview with regional hub cluster information', () => {
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
                            cluster: mockRegionalHubCluster,
                            addons: undefined,
                            hostedCluster: undefined,
                        }}
                    >
                        <ClusterOverviewPageContent />
                    </ClusterContext.Provider>
                </MemoryRouter>
            </RecoilRoot>
        )
    })

    it('should render overview with the regional hub cluster', async () => {
        await waitForText(mockRegionalHubCluster.name)
        await waitForText('release-2.7')
        await waitForText('2.7.0')
    })
})

describe('ClusterOverview with regional hub cluster information with hostedCluster', () => {
    beforeEach(() => {
        mockRegionalHubCluster.isHostedCluster = true
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
                            cluster: mockRegionalHubCluster,
                            addons: undefined,
                            hostedCluster: undefined,
                        }}
                    >
                        <ClusterOverviewPageContent />
                    </ClusterContext.Provider>
                </MemoryRouter>
            </RecoilRoot>
        )
    })

    it('should render overview with the regional hub cluster and hostedCluster', async () => {
        await waitForText(mockRegionalHubCluster.name)
        await waitForText('Hub, Hosted')
        await waitForText('release-2.7')
        await waitForText('2.7.0')
    })
})
