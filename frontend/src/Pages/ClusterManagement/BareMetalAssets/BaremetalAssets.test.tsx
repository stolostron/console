import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { BareMetalAsset, bareMetalAssets } from '../../../lib/BareMetalAsset'
import { BareMetalAssetsPage } from './BaremetalAssets'
import { nockDelete, nockList } from '../../../lib/nock-util'
import nock from 'nock'

function MakeBMA(name: string) {
    const bma: BareMetalAsset = {
        apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
        kind: 'BareMetalAsset',
        metadata: {
            name: name,
            namespace: name + '-namespace',
        },
        spec: {
            bmc: {
                address: 'example.com',
                credentialsName: 'secret-test-bare-metal-assset',
            },
            bootMac: '00:90:7F:12:DE:7F',
        },
    }
    return bma
}

const mockBareMetalAssets = [
    MakeBMA('test-bare-metal-asset-1')
]

describe('bare metal asset page', () => {

    beforeEach(() => {
        document.getElementsByTagName('html')[0].innerHTML = ''; 
    })

    test('bare metal assets page renders', async () => {
        const listNock = nockList(bareMetalAssets, mockBareMetalAssets)
        const { getByText, getAllByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )
        // expect(getByText('Create cluster')).toBeInTheDocument()
        // expect(getByText('Import cluster')).toBeInTheDocument()
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0))
        // console.log('testing html: '+getAllByText(mockBareMetalAssets[0].metadata.name!)[0].innerHTML)
        // console.log('testing html: '+ container.innerHTML)
        expect(getAllByText(mockBareMetalAssets[0].metadata.namespace!).length > 0)
    })

    test('can delete asset from overflow menu', async () => {
        const listNock = nockList(bareMetalAssets, mockBareMetalAssets)
        const deleteNock = nockDelete(bareMetalAssets, mockBareMetalAssets[0])
        
        const { getByText, getAllByText, getAllByLabelText, queryByText, container } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0))
        expect(getByText(mockBareMetalAssets[0].metadata.name!)).toBeInTheDocument()
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        userEvent.click(getByText('Delete Asset')) // click the delete action
        expect(getByText('Confirm')).toBeInTheDocument
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        console.log('checking container: ',container.innerHTML.toString())
        expect(queryByText('test-bare-metal-asset-1')).toBeNull()
    })

    test('can delete assset(s) from batch action menu', async () => {
        const listNock = nockList(bareMetalAssets, mockBareMetalAssets)
        const deleteNock = nockDelete(bareMetalAssets, mockBareMetalAssets[0])
        
        const { getByText, getAllByText, getByLabelText, getAllByLabelText, queryByText, container } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0))
        expect(getByText(mockBareMetalAssets[0].metadata.name!)).toBeInTheDocument()
        expect(getByLabelText('Select all rows')).toBeVisible()
        userEvent.click(getByLabelText('Select all rows'))
        userEvent.click(getByText('Destroy')) // click the delete action
        expect(getByText('Confirm')).toBeInTheDocument
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        console.log('checking container: ',container.innerHTML.toString())
        expect(queryByText('test-bare-metal-asset-1')).toBeNull()
    })
})
