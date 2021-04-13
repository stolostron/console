/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { mockBadRequestStatus, nockCreate, nockGet, nockList, nockReplace } from '../../../lib/nock-util'
import { ProviderID } from '../../../lib/providers'
import { clickByText, waitForNock, waitForNocks, waitForText } from '../../../lib/test-util'
import { DiscoveryConfig, DiscoveryConfigApiVersion, DiscoveryConfigKind } from '../../../resources/discovery-config'
import { FeatureGate } from '../../../resources/feature-gate'
import { MultiClusterHub, MultiClusterHubApiVersion, MultiClusterHubKind } from '../../../resources/multi-cluster-hub'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import DiscoveryConfigPage from './DiscoveryConfig'
import { multiClusterHubState } from '../../../atoms'

const mockFeatureGate: FeatureGate = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'FeatureGate',
    metadata: { name: 'open-cluster-management-discovery' },
    spec: { featureSet: 'DiscoveryEnabled' },
}

const multiClusterHub: MultiClusterHub = {
    apiVersion: MultiClusterHubApiVersion,
    kind: MultiClusterHubKind,
    metadata: {
        name: 'multiclusterhub',
        namespace: 'ocm',
    },
    spec: {},
}

const providerConnection: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connection',
        namespace: multiClusterHub.metadata.namespace,
        labels: {
            'cluster.open-cluster-management.io/provider': ProviderID.CRH,
            'cluster.open-cluster-management.io/cloudconnection': '',
        },
    },
    spec: {
        baseDomain: '',
        pullSecret: '',
        sshPrivatekey: '',
        sshPublickey: '',
        ocmAPIToken: 'test-ocm-api-token',
    },
}

const discoveryConfig: DiscoveryConfig = {
    apiVersion: DiscoveryConfigApiVersion,
    kind: DiscoveryConfigKind,
    metadata: {
        name: 'discovery',
        namespace: multiClusterHub.metadata.namespace,
    },
    spec: {
        filters: {
            lastActive: 14,
            openShiftVersions: ['4.7'],
        },
        providerConnections: [providerConnection.metadata.name!],
    },
}

const discoveryConfigUpdated: DiscoveryConfig = {
    apiVersion: DiscoveryConfigApiVersion,
    kind: DiscoveryConfigKind,
    metadata: {
        name: 'discovery',
        namespace: multiClusterHub.metadata.namespace,
    },
    spec: {
        filters: {
            lastActive: 30,
            openShiftVersions: ['4.7', '4.8'],
        },
        providerConnections: [providerConnection.metadata.name!],
    },
}

function TestDiscoveryConfigPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(multiClusterHubState, [multiClusterHub])
            }}
        >
            <MemoryRouter>
                <Route
                    render={(props: any) => {
                        return <DiscoveryConfigPage {...props} />
                    }}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

beforeEach(() => {
    sessionStorage.clear()
    nockGet(mockFeatureGate, undefined, 200, true)
})

describe('discovery config page', () => {
    it('Error retrieving discoveryConfigs', async () => {
        const nocks = [
            nockList(discoveryConfig, mockBadRequestStatus),
            nockList(providerConnection, [providerConnection], ['cluster.open-cluster-management.io/cloudconnection=']),
        ]
        render(<TestDiscoveryConfigPage />)
        await waitForNocks(nocks)
        await waitForText('Bad request')
        await waitForText('common:retry')
    })

    it('Create DiscoveryConfig', async () => {
        const nocks = [
            nockList(discoveryConfig, []),
            nockList(multiClusterHub, [multiClusterHub]),
            nockList(providerConnection, [providerConnection], ['cluster.open-cluster-management.io/cloudconnection=']),
        ]

        // nockGet(discoveryConfig, mockNotFoundStatus),

        const { container } = render(<TestDiscoveryConfigPage />)
        await waitForNocks(nocks)

        // Select LastActive
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="lastActiveFilter-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="lastActiveFilter-label"]`)!.click()
        await clickByText('14 days')

        // Select Version
        expect(container.querySelectorAll(`[aria-labelledby^="discoveryVersions-label"]`)).toHaveLength(1)
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="discoveryVersions-label"]`)!.click()
        await clickByText('4.7')

        // Select ProviderConnection
        expect(container.querySelectorAll(`[aria-labelledby^="providerConnections-label"]`)).toHaveLength(1)
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerConnections-label"]`)!.click()
        await clickByText(providerConnection.metadata.name!)

        // Submit form
        const createDiscoveryConfigNock = nockCreate(discoveryConfig, discoveryConfig)
        await clickByText('discoveryConfig.enable')
        await waitForNock(createDiscoveryConfigNock)
    })

    it('Edit DiscoveryConfig', async () => {
        const nocks = [
            nockList(discoveryConfig, [discoveryConfig]),
            nockList(providerConnection, [providerConnection], ['cluster.open-cluster-management.io/cloudconnection=']),
        ]

        const { container } = render(<TestDiscoveryConfigPage />)
        await waitForNocks(nocks)

        // Ensure Form is prepopulated
        await waitForText(discoveryConfig.spec.filters?.lastActive! + ' days')
        await waitForText(discoveryConfig.spec.filters?.openShiftVersions![0]!)
        await waitForText(providerConnection.metadata.name!)

        // Change form
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="lastActiveFilter-label"]`)!.click()
        await clickByText('30 days')

        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="discoveryVersions-label"]`)!.click()
        await clickByText('4.8')

        const replaceNock = nockReplace(discoveryConfigUpdated)
        await clickByText('discoveryConfig.enable')
        await waitForNock(replaceNock)
    })
})
