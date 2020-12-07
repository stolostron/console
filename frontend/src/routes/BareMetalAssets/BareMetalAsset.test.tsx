import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BareMetalAssetsPage from './BareMetalAssetsPage'
import { nockList, nockDelete } from '../../lib/nock-util'
import { BareMetalAsset } from '../../resources/bare-metal-asset'

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

const mockBareMetalAssets = [bareMetalAsset]

describe('bare metal asset page', () => {
    test('bare metal assets page renders', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const { getAllByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0))
        expect(getAllByText(mockBareMetalAssets[0].metadata.namespace!).length > 0)
    })

    test('can delete asset from overflow menu', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const deleteNock = nockDelete(mockBareMetalAssets[0])

        const { getByText, getAllByText, getByLabelText, queryByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call to finish
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0)) // check for asset in doc
        userEvent.click(getByLabelText('Select all rows')) // Click the action button on the first table row
        userEvent.click(getByText('bareMetalAsset.bulkAction.destroyAsset')) // click the delete action
        expect(getByText('Confirm')).toBeInTheDocument()
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call to finish
        expect(queryByText('test-bare-metal-asset-1')).toBeNull() // expect asset to no longer exist in doc
    })

    test('can delete asset(s) from batch action menu', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const deleteNock = nockDelete(mockBareMetalAssets[0])

        const { getByText, getAllByText, getByLabelText, queryByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call to finish
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0)) // check for asset in doc
        expect(getByLabelText('Select all rows')).toBeVisible()
        userEvent.click(getByLabelText('Select all rows'))
        userEvent.click(getByText('bareMetalAsset.bulkAction.destroyAsset'))
        expect(getByText('Confirm')).toBeInTheDocument()
        userEvent.click(getByText('Confirm'))
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect delete call to finish
        expect(queryByText('test-bare-metal-asset-1')).toBeNull() // expect asset to no longer exist in doc
    })
})
