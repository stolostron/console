/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { discoveryConfigState, managedClustersState } from '../../../atoms'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import ClustersPage from '../../ClusterManagement/Clusters/Clusters'
import DiscoveryConfigPage from '../DiscoveryConfig/DiscoveryConfig'
import { NavigationPath } from '../../../NavigationPath'
import { clickByText, waitForNotTestId, waitForNotText, waitForTestId, waitForText } from '../../../lib/test-util'
import { mockDiscoveryConfig } from '../../../lib/test-metadata'

describe('Clusters Page - Discovery Banner', () => {
    beforeEach(() => {
        localStorage.clear()
        nockIgnoreRBAC()
    })

    test('Discovery Banner should not appear (DiscoConfigs exist)', async () => {
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
        await waitForNotText('discovery:clusters.banner.body')
    })
    test('Discovery Banner should appear and route (No DiscoConfigs)', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
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
        await waitForText('discovery:clusters.banner.body')
        await waitForText('discovery.addDiscovery')
        await clickByText('discovery.addDiscovery')
        // Check Page routes correctly
        await waitForText('addDiscoveryConfig.title', true)
        await waitForText('clusters')
        await waitForText('discoveredClusters')
    })

    test('Discovery Banner should not appear, and route (DiscoConfig exists)', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
                    snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.clusters]}>
                    <Route path={NavigationPath.clusters} render={() => <ClustersPage />} />
                    <Route path={NavigationPath.createDiscovery} render={() => <DiscoveryConfigPage />} />
                </MemoryRouter>
            </RecoilRoot>
        )
        // Check Resources appear
        await waitForNotText('clusters.banner.header')
        await waitForNotTestId('discoveryIconPng')
        await waitForNotText('discovery:clusters.banner.body')
    })

    test('Discovery Banner should dismiss', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, [])
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
        await waitForText('discovery:clusters.banner.body')
        await waitForText('discovery.addDiscovery')

        // Dismiss Banner and ensure it disappears
        await waitForText('clusters.banner.dismiss')
        await clickByText('clusters.banner.dismiss')

        await waitForNotText('clusters.banner.header')
        await waitForNotTestId('discoveryIconPng')
        await waitForNotText('discovery:clusters.banner.body')
    })
})
