/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockCreate, nockDelete, nockGet, nockList, nockReplace } from '../../../lib/nock-util'
import { ProviderID } from '../../../lib/providers'
import { clickByText, waitForNocks, waitForText } from '../../../lib/test-util'
import { DiscoveryConfig, DiscoveryConfigApiVersion, DiscoveryConfigKind } from '../../../resources/discovery-config'
import { FeatureGate } from '../../../resources/feature-gate'
import { NavigationPath } from '../../../NavigationPath'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    packProviderConnection,
} from '../../../resources/provider-connection'
import DiscoveryConfigPage from './DiscoveryConfig'
import { discoveryConfigState } from '../../../atoms'

const mockFeatureGate: FeatureGate = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'FeatureGate',
    metadata: { name: 'open-cluster-management-discovery' },
    spec: { featureSet: 'DiscoveryEnabled' },
}

const credential: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connection',
        namespace: 'discovery',
        labels: {
            'cluster.open-cluster-management.io/provider': ProviderID.RHOCM,
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

const mockCredential = [packProviderConnection({ ...credential })]

const discoveryConfig: DiscoveryConfig = {
    apiVersion: DiscoveryConfigApiVersion,
    kind: DiscoveryConfigKind,
    metadata: {
        name: 'discovery',
        namespace: credential.metadata.namespace!,
    },
    spec: {
        filters: {
            lastActive: 14,
            openShiftVersions: ['4.7'],
        },
        credential: credential.metadata.name!,
    },
}

const discoveryConfigUpdated: DiscoveryConfig = {
    apiVersion: DiscoveryConfigApiVersion,
    kind: DiscoveryConfigKind,
    metadata: {
        name: 'discovery',
        namespace: 'discovery',
    },
    spec: {
        filters: {
            lastActive: 30,
            openShiftVersions: ['4.7', '4.8'],
        },
        credential: credential.metadata.name!,
    },
}

function TestAddDiscoveryConfigPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(discoveryConfigState, [])
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

function TestEditConnectionPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(discoveryConfigState, [discoveryConfig])
            }}
        >
            <MemoryRouter
                initialEntries={[
                    NavigationPath.editDiscoveryConfig
                        .replace(':namespace', discoveryConfig.metadata.namespace!)
                        .replace(':name', discoveryConfig.metadata.name!),
                ]}
            >
                <Route
                    path={NavigationPath.editDiscoveryConfig}
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
    it('Create DiscoveryConfig', async () => {
        const nocks = [
            nockList(credential, mockCredential, ['cluster.open-cluster-management.io/cloudconnection=']),
            nockList(credential, mockCredential, ['cluster.open-cluster-management.io/cloudconnection=']),
        ]

        const { container } = render(<TestAddDiscoveryConfigPage />)
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

        // Select Credential
        expect(container.querySelectorAll(`[aria-labelledby^="credentials-label"]`)).toHaveLength(1)
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="credentials-label"]`)!.click()
        await clickByText(credential.metadata.namespace! + '/' + credential.metadata.name!)

        // Submit form
        const createDiscoveryConfigNock = nockCreate(discoveryConfig, discoveryConfig)
        await clickByText('discoveryConfig.add')
        await waitFor(() => expect(createDiscoveryConfigNock.isDone()).toBeTruthy())
    })

    it('Edit DiscoveryConfig', async () => {
        const nocks = [
            nockList(credential, mockCredential, ['cluster.open-cluster-management.io/cloudconnection=']),
            nockList(credential, mockCredential, ['cluster.open-cluster-management.io/cloudconnection=']),
            nockGet(discoveryConfig, discoveryConfig),
        ]

        const { container } = render(<TestEditConnectionPage />)
        await waitForNocks(nocks)

        // Ensure Form is prepopulated
        await waitForText(discoveryConfig.spec.filters?.lastActive! + ' days')
        await waitForText(discoveryConfig.spec.filters?.openShiftVersions![0]!)
        await waitForText(credential.metadata.namespace + '/' + credential.metadata.name!)

        // Change form
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="lastActiveFilter-label"]`)!.click()
        await clickByText('30 days')

        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="discoveryVersions-label"]`)!.click()
        await clickByText('4.8')

        const replaceNock = nockReplace(discoveryConfigUpdated)
        await clickByText('discoveryConfig.edit')
        await waitFor(() => expect(replaceNock.isDone()).toBeTruthy())
    })

    it('Delete DiscoveryConfig', async () => {
        const nocks = [
            nockList(credential, mockCredential, ['cluster.open-cluster-management.io/cloudconnection=']),
            nockList(credential, mockCredential, ['cluster.open-cluster-management.io/cloudconnection=']),
            nockGet(discoveryConfig, discoveryConfig),
        ]

        render(<TestEditConnectionPage />)
        await waitForNocks(nocks)

        // Ensure Form is prepopulated
        await waitForText(discoveryConfig.spec.filters?.lastActive! + ' days')
        await waitForText(discoveryConfig.spec.filters?.openShiftVersions![0]!)
        await waitForText(credential.metadata.namespace + '/' + credential.metadata.name!)

        const deleteNock = nockDelete(discoveryConfigUpdated)
        await clickByText('discoveryConfig.delete')
        await waitForText('disable.title')
        await clickByText('discoveryConfig.delete.btn')
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy())
    })
})
