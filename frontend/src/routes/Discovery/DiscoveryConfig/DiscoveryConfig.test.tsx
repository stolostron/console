import { render, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { AppContext } from '../../../components/AppContext'
import {
    mockBadRequestStatus,
    mockNotFoundStatus,
    nockList,
    nockCreate,
    nockGet,
    nockReplace,
} from '../../../lib/nock-util'
import { FeatureGate } from '../../../resources/feature-gate'
import { DiscoveryConfig, DiscoveryConfigApiVersion, DiscoveryConfigKind } from '../../../resources/discovery-config'
import { MultiClusterHub, MultiClusterHubApiVersion, MultiClusterHubKind } from '../../../resources/multi-cluster-hub'
import DiscoveryConfigPage from './DiscoveryConfig'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import { ProviderID } from '../../../lib/providers'

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
        <AppContext.Provider
            value={{
                featureGates: { 'open-cluster-management-discovery': mockFeatureGate },
                clusterManagementAddons: [],
            }}
        >
            <MemoryRouter>
                <Route
                    render={(props: any) => {
                        return <DiscoveryConfigPage {...props} />
                    }}
                />
            </MemoryRouter>
        </AppContext.Provider>
    )
}

beforeEach(() => {
    sessionStorage.clear()
    nockGet(mockFeatureGate, undefined, 200, true)
})

describe('discovery config page', () => {
    it('Error Retrieving discoveryConfigs', async () => {
        const dcNock = nockList(discoveryConfig, mockBadRequestStatus)
        const providerConnectionsNock = nockList(
            providerConnection,
            [providerConnection],
            ['cluster.open-cluster-management.io/cloudconnection=']
        )
        const { getByText } = render(<TestDiscoveryConfigPage />)
        await waitFor(() => expect(dcNock.isDone()).toBeTruthy())
        await waitFor(() => expect(providerConnectionsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
        await waitFor(() => expect(getByText('common:retry')).toBeInTheDocument())
    })

    it('Create DiscoveryConfig', async () => {
        const dcNock = nockList(discoveryConfig, [])
        const mchNock = nockList(multiClusterHub, [multiClusterHub])
        const providerConnectionsNock = nockList(
            providerConnection,
            [providerConnection],
            ['cluster.open-cluster-management.io/cloudconnection=']
        )
        const createDiscoveryConfigNock = nockCreate(discoveryConfig, discoveryConfig)

        nockGet(discoveryConfig, mockNotFoundStatus)
        const { getByText, container } = render(<TestDiscoveryConfigPage />)
        await waitFor(() => expect(dcNock.isDone()).toBeTruthy())
        await waitFor(() => expect(providerConnectionsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(mchNock.isDone()).toBeTruthy())

        // Select LastActive
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="lastActiveFilter-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="lastActiveFilter-label"]`)!.click()
        await waitFor(() => expect(getByText('14 days')).toBeInTheDocument())
        getByText('14 days').click()

        // Select Version
        expect(container.querySelectorAll(`[aria-labelledby^="discoveryVersions-label"]`)).toHaveLength(1)
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="discoveryVersions-label"]`)!.click()
        await waitFor(() => expect(getByText('4.7')).toBeInTheDocument())
        getByText('4.7').click()

        // Select ProviderConnection
        expect(container.querySelectorAll(`[aria-labelledby^="providerConnections-label"]`)).toHaveLength(1)
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerConnections-label"]`)!.click()
        await waitFor(() => expect(getByText(providerConnection.metadata.name!)).toBeInTheDocument())
        getByText(providerConnection.metadata.name!).click()

        // Submit form
        getByText('discoveryConfig.enable').click()
        await waitFor(() => expect(createDiscoveryConfigNock.isDone()).toBeTruthy())
    })

    it('Edit DiscoveryConfig', async () => {
        const dcNock = nockList(discoveryConfig, [discoveryConfig])
        const providerConnectionsNock = nockList(
            providerConnection,
            [providerConnection],
            ['cluster.open-cluster-management.io/cloudconnection=']
        )
        const replaceNock = nockReplace(discoveryConfigUpdated)

        const { getByText, container } = render(<TestDiscoveryConfigPage />)
        await waitFor(() => expect(dcNock.isDone()).toBeTruthy())
        await waitFor(() => expect(providerConnectionsNock.isDone()).toBeTruthy())

        // Ensure Form is prepopulated
        expect(getByText(discoveryConfig.spec.filters?.lastActive! + ' days')).toBeVisible()
        expect(getByText(discoveryConfig.spec.filters?.openShiftVersions![0]!)).toBeVisible()
        expect(getByText(providerConnection.metadata.name!)).toBeVisible()

        // Change form
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="lastActiveFilter-label"]`)!.click()
        await waitFor(() => expect(getByText('30 days')).toBeInTheDocument())
        getByText('30 days').click()

        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="discoveryVersions-label"]`)!.click()
        await waitFor(() => expect(getByText('4.8')).toBeInTheDocument())
        getByText('4.8').click()

        getByText('discoveryConfig.enable').click()
        await waitFor(() => expect(replaceNock.isDone()).toBeTruthy())
    })
})
