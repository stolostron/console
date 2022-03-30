/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { discoveredClusterState, discoveryConfigState, secretsState } from '../../../../atoms'
import { nockCreate } from '../../../../lib/nock-util'
import { mockCRHCredential, mockDiscoveryConfig } from '../../../../lib/test-metadata'
import { clickByText, waitForNocks, waitForNotText, waitForText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import DiscoveredClustersPage from './DiscoveredClusters'
import {
    discoveryConfigCreateSelfSubjectAccessRequest,
    discoveryConfigCreateSelfSubjectAccessResponse,
    mockDiscoveredClusters,
    mockRHOCMSecrets,
} from './DiscoveryComponents/test-utils'
import DiscoveryConfigPage from './DiscoveryConfig/DiscoveryConfig'

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
        const { queryAllByText } = await render(
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
        await waitForText("You don't have any discovered clusters")
        await waitForText('Red Hat OpenShift Cluster Manager')
        expect(queryAllByText('Add credential').length).toBe(2)
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
                    <Route path={NavigationPath.createDiscovery} render={() => <DiscoveryConfigPage />} />
                    <Route path={NavigationPath.discoveredClusters} render={() => <DiscoveredClustersPage />} />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText("You don't have any discovered clusters")
        await waitForText('Configure Discovery')
        await waitForText('Create discovery settings')
        await clickByText('Create discovery settings')

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

        await waitForText("You don't have any discovered clusters")
        await waitForText('Configure discovery settings')
        await waitForText('Create discovery settings')
    })
})
