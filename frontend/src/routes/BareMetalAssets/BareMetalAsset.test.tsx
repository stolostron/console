/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'
import { MemoryRouter } from 'react-router-dom'
import { nockRBAC, nockDelete, nockList } from '../../lib/nock-util'
import { BareMetalAsset } from '../../resources/bare-metal-asset'
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

        const { getByText, getAllByText, getByLabelText, queryByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call to finish
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0)) // check for asset in doc
        expect(getByLabelText('Select all rows')).toBeVisible()
        userEvent.click(getByLabelText('Select all rows'))
        userEvent.click(getByText('bareMetalAsset.bulkAction.deleteAsset'))
        expect(getByText('common:delete')).toBeInTheDocument()
        userEvent.click(getByText('common:delete'))
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect delete call to finish
        await waitFor(() => expect(listNockii.isDone()).toBeTruthy())
        expect(queryByText('test-bare-metal-asset-1')).toBeNull() // expect asset to no longer exist in doc
    })
})
