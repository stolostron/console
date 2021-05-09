/* Copyright Contributors to the Open Cluster Management project */
import { getByTestId, render } from '@testing-library/react'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    discoveryConfigState,
    managedClusterInfosState,
    managedClustersState,
    secretsState,
} from '../../../atoms'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockDelete, nockIgnoreRBAC, nockRBAC } from '../../../lib/nock-util'
import ClustersPage from '../../ClusterManagement/Clusters/Clusters'
import DiscoveryConfigPage from '../DiscoveryConfig/DiscoveryConfig'
import { NavigationPath } from '../../../NavigationPath'
import {
    clickBulkAction,
    clickByLabel,
    clickByTestId,
    clickByText,
    clickRowAction,
    selectTableRow,
    typeByText,
    waitForNock,
    waitForNocks,
    waitForNotTestId,
    waitForNotText,
    waitForTestId,
    waitForText,
} from '../../../lib/test-util'
import { Secret, SecretApiVersion, SecretKind } from '../../../resources/secret'
import { mockCRHCredential, mockDiscoveryConfig, mockManagedClusterSet } from '../../../lib/test-metadata'
import { Provider } from '@open-cluster-management/ui-components'



export const mockRHOCMCredential0: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'ocm-api-token',
        namespace: 'ocm',
        labels: {
            'cluster.open-cluster-management.io/provider': Provider.redhatcloud,
        },
    },
}

export const mockRHOCMCredential1: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'ocm-api-token',
        namespace: 'discovery',
        labels: {
            'cluster.open-cluster-management.io/provider': Provider.redhatcloud,
        },
    },
}

export const RHOCMCredentials: Secret[] = [mockRHOCMCredential0, mockRHOCMCredential1]

describe('Clusters Page - Discovery Banner', () => {

    test('Discovery Banner should not appear (0 RHOCM Credential, No DiscoConfigs)', async () => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
                    snapshot.set(secretsState, [])
                }}
            >
                <MemoryRouter>
                    <ClustersPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForNotText('clusters.banner.header')
        await waitForNotTestId('discoveryIconPng')
        await waitForNotText('discovery:clusters.banner.body.single')
    })

    test('Discovery Banner should not appear (DiscoConfigs exist)', async () => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
                    snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
                }}
            >
                <MemoryRouter>
                    <ClustersPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForNotText('clusters.banner.header')
        await waitForNotTestId('discoveryIconPng')
        await waitForNotText('discovery:clusters.banner.body.single')
    })
    test('Discovery Banner should appear, and route (1 RHOCM Credential, No DiscoConfigs)', async () => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
                    snapshot.set(secretsState, [mockCRHCredential])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.clusters]}>
                    <Route path={NavigationPath.clusters} render={() => <ClustersPage />} />
                    <Route path={NavigationPath.createDiscovery} render={() => <DiscoveryConfigPage />} />
                </MemoryRouter>
            </RecoilRoot>
        )
        // Check Resources appear
        await waitForText('clusters.banner.header')
        await waitForTestId('discoveryIconPng')
        await waitForText('discovery:clusters.banner.body.single')
        await waitForText('discovery.addDiscovery')
        await clickByText('discovery.addDiscovery')
        // Check Page routes correctly
        await waitForText('addDiscoveryConfig.title', true)
        await waitForText('clusters')
        await waitForText('discoveredClusters')
    })

    test('Discovery Banner should appear, and route (>1 RHOCM Credentials, No DiscoConfigs)', async () => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
                    snapshot.set(secretsState, RHOCMCredentials)
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.clusters]}>
                    <Route path={NavigationPath.clusters} render={() => <ClustersPage />} />
                    <Route path={NavigationPath.createDiscovery} render={() => <DiscoveryConfigPage />} />
                </MemoryRouter>
            </RecoilRoot>
        )
        // Check Resources appear
        await waitForText('clusters.banner.header')
        await waitForTestId('discoveryIconPng')
        await waitForText('discovery:clusters.banner.body.plural')
        await waitForTestId('discoveryDropdown')
        await clickByTestId('discoveryDropdown')
        // Ensure dropdown populates
        await waitForText(RHOCMCredentials[0].metadata.namespace + "/" + RHOCMCredentials[0].metadata.name)
        await waitForText(RHOCMCredentials[1].metadata.namespace + "/" + RHOCMCredentials[1].metadata.name)
        await clickByText(RHOCMCredentials[1].metadata.namespace + "/" + RHOCMCredentials[1].metadata.name)
        // Check Page routes correctly
        await waitForText('addDiscoveryConfig.title', true)
        await waitForText('clusters')
        await waitForText('discoveredClusters')
        // Ensure Credentials field prepopulated
        await waitForText(RHOCMCredentials[1].metadata.namespace + "/" + RHOCMCredentials[1].metadata.name)
    })
})