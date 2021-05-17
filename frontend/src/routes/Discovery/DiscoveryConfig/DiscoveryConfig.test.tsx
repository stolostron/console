/* Copyright Contributors to the Open Cluster Management project */

import { Provider } from '@open-cluster-management/ui-components'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { discoveryConfigState, secretsState } from '../../../atoms'
import { nockCreate, nockIgnoreRBAC, nockGet, nockReplace, nockDelete } from '../../../lib/nock-util'
import { clickByText, waitForNocks, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { DiscoveryConfig, DiscoveryConfigApiVersion, DiscoveryConfigKind } from '../../../resources/discovery-config'
import { Secret, SecretKind, SecretApiVersion } from '../../../resources/secret'
import DiscoveredClustersPage from '../DiscoveredClusters/DiscoveredClusters'
import DiscoveryConfigPage from './DiscoveryConfig'

const credential: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'connection',
        namespace: 'discovery',
        labels: {
            'cluster.open-cluster-management.io/type': Provider.redhatcloud,
            'cluster.open-cluster-management.io/credentials': '',
        },
    },
    type: 'Opaque',
}

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
                snapshot.set(secretsState, [credential])
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.createDiscovery]}>
                <Route path={NavigationPath.createDiscovery} render={() => <DiscoveryConfigPage />} />
                <Route path={NavigationPath.discoveredClusters} render={() => <DiscoveredClustersPage />} />
            </MemoryRouter>
        </RecoilRoot>
    )
}

function TestEditConnectionPage() {
    nockIgnoreRBAC()
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(discoveryConfigState, [discoveryConfig])
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.configureDiscovery]}>
                <Route path={NavigationPath.configureDiscovery} render={() => <DiscoveryConfigPage />} />
                <Route path={NavigationPath.discoveredClusters} render={() => <DiscoveredClustersPage />} />
            </MemoryRouter>
        </RecoilRoot>
    )
}

beforeEach(() => {
    sessionStorage.clear()
})

describe('discovery config page', () => {
    it('Create DiscoveryConfig', async () => {
        const { container } = render(<TestAddDiscoveryConfigPage />)

        // Select Credential
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="credentials-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="credentials-label"]`)!.click()
        await clickByText(credential.metadata.namespace! + '/' + credential.metadata.name!)

        // Select LastActive
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="lastActiveFilter-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="lastActiveFilter-label"]`)!.click()
        await waitForText('14 days')
        await clickByText('14 days')

        // Select Version
        expect(container.querySelectorAll(`[aria-labelledby^="discoveryVersions-label"]`)).toHaveLength(1)
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="discoveryVersions-label"]`)!.click()
        await clickByText('4.7')

        // Submit form
        const createDiscoveryConfigNock = nockCreate(discoveryConfig, discoveryConfig)
        await clickByText('discoveryConfig.add')
        await waitFor(() => expect(createDiscoveryConfigNock.isDone()).toBeTruthy())

        // Wait For Notification on DiscoveredClusters page
        await waitForText('discovery:alert.created.header')
        await waitForText('alert.msg')
    })

    it('Edit DiscoveryConfig', async () => {
        const nocks = [nockGet(discoveryConfig, discoveryConfig)]

        const { container } = render(<TestEditConnectionPage />)
        await waitForNocks(nocks)

        // Select Namespace
        await waitFor(() => expect(container.querySelectorAll(`[aria-labelledby^="namespaces-label"]`)).toHaveLength(1))
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaces-label"]`)!.click()
        await clickByText(discoveryConfig.metadata.namespace!)

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

        // Wait For Notification on DiscoveredClusters page
        await waitForText('discovery:alert.updated.header')
        await waitForText('alert.msg')
    })

    it('Delete DiscoveryConfig', async () => {
        const nocks = [nockGet(discoveryConfig, discoveryConfig)]

        const { container } = render(<TestEditConnectionPage />)
        await waitForNocks(nocks)

        // Select Namespace
        await waitFor(() => expect(container.querySelectorAll(`[aria-labelledby^="namespaces-label"]`)).toHaveLength(1))
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaces-label"]`)!.click()
        await clickByText(discoveryConfig.metadata.namespace!)

        // Ensure Form is prepopulated
        await waitForText(discoveryConfig.spec.filters?.lastActive! + ' days')
        await waitForText(discoveryConfig.spec.filters?.openShiftVersions![0]!)
        await waitForText(credential.metadata.namespace + '/' + credential.metadata.name!)

        const deleteNock = nockDelete(discoveryConfigUpdated)
        await clickByText('discoveryConfig.delete')
        await waitForText('disable.title')
        await clickByText('discoveryConfig.delete.btn')
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy())

        // Wait For Notification on DiscoveredClusters page
        await waitForText('discovery:alert.deleted.header')
        await waitForText('alert.msg')
    })
})
