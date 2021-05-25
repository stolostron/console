/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { discoveredClusterState, discoveryConfigState, secretsState } from '../../../atoms'
import { mockCRHCredential, mockDiscoveryConfig } from '../../../lib/test-metadata'
import { clickByText, waitForNotText, waitForText, waitForNocks } from '../../../lib/test-util'
import DiscoveredClustersPage from './DiscoveredClusters'
import { NavigationPath } from '../../../NavigationPath'
import DiscoveryConfigPage from '../DiscoveryConfig/DiscoveryConfig'
import { nockCreate } from '../../../lib/nock-util'

import {
    mockDiscoveredClusters,
    mockRHOCMSecrets,
    discoveryConfigCreateSelfSubjectAccessRequest,
    discoveryConfigCreateSelfSubjectAccessResponse,
} from '../DiscoveryComponents/test-utils'

beforeEach(() => {
    sessionStorage.clear()
})

describe('DiscoveredClusters', () => {
    test('DiscoveredClusters Table', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(discoveredClusterState, mockDiscoveredClusters)
                    snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
                    snapshot.set(secretsState, [mockCRHCredential])
                }}
            >
                <MemoryRouter>
                    <DiscoveredClustersPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText(mockDiscoveredClusters[0].spec.displayName)
        await waitForText(mockDiscoveredClusters[0].spec.openshiftVersion)
        await waitForText(mockDiscoveredClusters[1].spec.displayName)
        await waitForText(mockDiscoveredClusters[1].spec.openshiftVersion)

        await waitForNotText(mockDiscoveredClusters[2].spec.displayName) // Ensure managedcluster does not appear

        await waitForText(mockDiscoveredClusters[0].metadata.namespace!)
    })

    test('No provider connections or discoveryconfig (Empty State 1)', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(discoveredClusterState, [])
                    snapshot.set(discoveryConfigState, [])
                    snapshot.set(secretsState, [])
                }}
            >
                <MemoryRouter>
                    <DiscoveredClustersPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText('discovery:emptystate.defaultState.title')
        await waitForText('discovery:emptystate.defaultState.msg')
        await waitForText('discovery:emptystate.addCredential')
    })

    test('CRH credentials exist, but no discoveryconfig (Empty State 2)', async () => {
        const discoveryConfigCreateNock = nockCreate(
            discoveryConfigCreateSelfSubjectAccessRequest,
            discoveryConfigCreateSelfSubjectAccessResponse
        )

        const { container } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(discoveredClusterState, [])
                    snapshot.set(discoveryConfigState, [])
                    snapshot.set(secretsState, mockRHOCMSecrets)
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.discoveredClusters]}>
                    <Route path={NavigationPath.discoveredClusters} render={() => <DiscoveredClustersPage />} />
                    <Route path={NavigationPath.createDiscovery} render={() => <DiscoveryConfigPage />} />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText('discovery:emptystate.credentials.title')
        await waitForText('discovery:emptystate.credentials.msg')
        await waitForText('discovery:discovery.addDiscovery')
        await clickByText('discovery:discovery.addDiscovery')

        await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
        await clickByText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="credentials-label"]`)).toHaveLength(1)
        )
        await waitForText(mockRHOCMSecrets[0].metadata.namespace + '/' + mockRHOCMSecrets[0].metadata.name)
        await waitForNocks([discoveryConfigCreateNock])
    })

    test('CRH and discoveryconfig exist, but no discoveredclusters (Empty State 3)', async () => {
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(discoveredClusterState, [])
                    snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
                    snapshot.set(secretsState, [mockCRHCredential])
                }}
            >
                <MemoryRouter>
                    <DiscoveredClustersPage />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitForText('discovery:emptystate.discoveryEnabled.title')
        await waitForText('discovery:emptystate.discoveryEnabled.msg')
        await waitForText('discovery:discovery.configureDiscovery')
        await waitForText('discovery:discovery.addDiscovery')
    })
})
