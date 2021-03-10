/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'
import { MemoryRouter } from 'react-router-dom'
import { nockCreate, nockDelete, nockList, nockRBAC } from '../../lib/nock-util'
import { clickByText } from '../../lib/test-util'
import { BareMetalAsset, BareMetalAssetApiVersion, BareMetalAssetKind } from '../../resources/bare-metal-asset'
import {
    Project,
    ProjectApiVersion,
    ProjectKind,
    ProjectRequest,
    ProjectRequestApiVersion,
    ProjectRequestKind,
} from '../../resources/project'
import { Secret, SecretApiVersion, SecretKind } from '../../resources/secret'
import { ResourceAttributes } from '../../resources/self-subject-access-review'
import BareMetalAssetsPage from './BareMetalAssetsPage'

const bareMetalAsset: BareMetalAsset = {
    apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
    kind: 'BareMetalAsset',
    metadata: {
        name: 'test-bare-metal-asset-001',
        namespace: 'test-bare-metal-asset-namespace',
    },
    spec: {
        bmc: {
            address: 'example.com:80',
            credentialsName: 'secret-test-bare-metal-asset',
        },
        bootMACAddress: '00:90:7F:12:DE:7F',
    },
}

const mockBmaProject: ProjectRequest = {
    apiVersion: ProjectRequestApiVersion,
    kind: ProjectRequestKind,
    metadata: { name: 'test-namespace' },
}

const mockBmaProjectResponse: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
        name: 'test-namespace',
    },
}

const createBareMetalAsset: BareMetalAsset = {
    kind: BareMetalAssetKind,
    apiVersion: BareMetalAssetApiVersion,
    metadata: {
        name: 'test-bma',
        namespace: 'test-namespace',
    },
    spec: {
        bmc: {
            address: 'example.com:80',
            credentialsName: 'test-bma-bmc-secret',
        },
        bootMACAddress: '00:90:7F:12:DE:7F',
    },
}

const createBmaSecret: Secret = {
    kind: SecretKind,
    apiVersion: SecretApiVersion,
    metadata: {
        name: 'test-bma-bmc-secret',
        namespace: 'test-namespace',
    },
    stringData: {
        password: 'test',
        username: 'test',
    },
}

const bmaSecret: Secret = {
    kind: SecretKind,
    apiVersion: SecretApiVersion,
    metadata: {
        namespace: 'test-namespace',
        name: 'test-bma-bmc-secret',
    },
    data: { password: 'encoded', username: 'encoded' },
}

function clusterCreationResourceAttributes() {
    return {
        resource: 'managedclusters',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
    } as ResourceAttributes
}

const mockBareMetalAssets = [bareMetalAsset]

function getEditBMAResourceAttributes(name: string, namespace: string) {
    return {
        name,
        namespace,
        group: 'inventory.open-cluster-management.io',
        resource: 'baremetalassets',
        verb: 'patch',
    } as ResourceAttributes
}

function getDeleteBMAResourceAttributes(name: string, namespace: string) {
    return {
        name,
        namespace,
        group: 'inventory.open-cluster-management.io',
        resource: 'baremetalassets',
        verb: 'delete',
    } as ResourceAttributes
}

function nocksAreDone(nocks: Scope[]) {
    for (const nock of nocks) {
        if (!nock.isDone()) return false
    }
    return true
}

describe('bare metal asset page', () => {
    test('bare metal assets page renders', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const clusterNock = nockRBAC(clusterCreationResourceAttributes())

        const { getAllByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0))
        expect(getAllByText(mockBareMetalAssets[0].metadata.namespace!).length > 0)
    })

    test('can delete asset from overflow menu', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const deleteNock = nockDelete(mockBareMetalAssets[0])
        const clusterNock = nockRBAC(clusterCreationResourceAttributes())
        const rbacNocks: Scope[] = [
            nockRBAC(getEditBMAResourceAttributes('test-bare-metal-asset-001', 'test-bare-metal-asset-namespace')),
            nockRBAC(getDeleteBMAResourceAttributes('test-bare-metal-asset-001', 'test-bare-metal-asset-namespace')),
        ]
        const { getByText, getAllByText, getAllByLabelText, queryByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call to finish
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0)) // check for asset in doc
        userEvent.click(getAllByLabelText('Actions')[0])
        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())
        userEvent.click(getByText('bareMetalAsset.rowAction.deleteAsset.title')) // click the delete action
        expect(getByText('common:delete')).toBeInTheDocument()
        userEvent.click(getByText('common:delete')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call to finish
        expect(queryByText('test-bare-metal-asset-1')).toBeNull() // expect asset to no longer exist in doc
    })

    test('can delete asset(s) from batch action menu', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const deleteNock = nockDelete(mockBareMetalAssets[0])
        const clusterNock = nockRBAC(clusterCreationResourceAttributes())
        const listNockii = nockList(bareMetalAsset, [])

        const { getAllByText, getByLabelText, queryByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call to finish
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0)) // check for asset in doc
        expect(getByLabelText('Select all rows')).toBeVisible()
        userEvent.click(getByLabelText('Select all rows'))
        await clickByText('bareMetalAsset.bulkAction.deleteAsset')
        await clickByText('common:delete')
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect delete call to finish
        await waitFor(() => expect(listNockii.isDone()).toBeTruthy())
        expect(queryByText('test-bare-metal-asset-1')).toBeNull() // expect asset to no longer exist in doc
    })

    test('can import assets from csv', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const clusterNock = nockRBAC(clusterCreationResourceAttributes())
        const projectCreateNock = nockCreate(mockBmaProject, mockBmaProjectResponse)
        const secretCreateNock = nockCreate(createBmaSecret, bmaSecret)
        const bmaCreateNock = nockCreate(createBareMetalAsset)
        const newListNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const rows = [
            'hostName,hostNamespace,bmcAddress,macAddress,username,password',
            'test-bma,test-namespace,example.com:80,00:90:7F:12:DE:7F,test,test',
        ]
        const file = new File([rows.join('\n')], 'some.csv')

        const { getByTestId } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        // wait for list to fill in with one dummy bma
        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listNock.isDone()).toBeTruthy())

        // click the Import button
        await clickByText('bareMetalAsset.bulkAction.importAssets')

        // click the "Open file" button
        await clickByText('bareMetalAsset.importAction.button')

        // "click" the file input button
        const fileInput = getByTestId('importBMAs')
        Object.defineProperty(fileInput, 'files', { value: [file] })
        fireEvent.change(fileInput)

        // click the Import button on the dialog
        await clickByText('common:import')

        // wait for bma to be created
        await waitFor(() => expect(projectCreateNock.isDone()).toBeTruthy())
        await waitFor(() => expect(secretCreateNock.isDone()).toBeTruthy())
        await waitFor(() => expect(bmaCreateNock.isDone()).toBeTruthy())

        // wait for list to be refreshed
        await waitFor(() => expect(newListNock.isDone()).toBeTruthy())
    })
})
