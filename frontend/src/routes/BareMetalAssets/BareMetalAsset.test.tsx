import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BareMetalAssetsPage from './BareMetalAssetsPage'
import { nockList, nockDelete, nockCreate } from '../../lib/nock-util'
import { BareMetalAsset } from '../../resources/bare-metal-asset'
import { SelfSubjectAccessReview } from '../../resources/self-subject-access-review'

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

const mockSelfSubjectAccessRequest: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            resource: 'managedclusters',
            verb: 'create',
            group: 'cluster.open-cluster-management.io',
        },
    },
}
const mockSelfSubjectAccessResponse: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            resource: 'managedclusters',
            verb: 'create',
            group: 'cluster.open-cluster-management.io',
        },
    },
    status: {
        allowed: true,
    },
}

const mockBareMetalAssets = [bareMetalAsset]

describe('bare metal asset page', () => {
    test('bare metal assets page renders', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const clusterNock = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponse)

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
        const clusterNock = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponse)

        const { getByText, getAllByText, getByLabelText, queryByText } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call to finish
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0)) // check for asset in doc
        userEvent.click(getByLabelText('Select all rows')) // Click the action button on the first table row
        userEvent.click(getByText('bareMetalAsset.bulkAction.destroyAsset')) // click the delete action
        expect(getByText('common:destroy')).toBeInTheDocument()
        userEvent.click(getByText('common:destroy')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call to finish
        expect(queryByText('test-bare-metal-asset-1')).toBeNull() // expect asset to no longer exist in doc
    })

    test('can delete asset(s) from batch action menu', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const deleteNock = nockDelete(mockBareMetalAssets[0])
        const clusterNock = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponse)

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
        userEvent.click(getByText('bareMetalAsset.bulkAction.destroyAsset'))
        expect(getByText('common:destroy')).toBeInTheDocument()
        userEvent.click(getByText('common:destroy'))
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect delete call to finish
        expect(queryByText('test-bare-metal-asset-1')).toBeNull() // expect asset to no longer exist in doc
    })
})
