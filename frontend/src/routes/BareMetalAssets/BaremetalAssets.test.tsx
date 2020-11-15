import { render, waitFor, act } from '@testing-library/react'
import { V1Namespace, V1Secret } from '@kubernetes/client-node'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { BareMetalAssetsPage } from './BaremetalAssets'
import { timeStamp } from 'console'
import { CreateBareMetalAssetPage } from './CreateBareMetalAsset'
import { nockCreate, nockList, /* nockListProjects, */ nockDelete } from '../../lib/nock-util'
//import { resourceMethods } from '../../lib/resource-request'
import { Project, listProjects } from '../../resources/project'
import { BareMetalAsset } from '../../resources/bare-metal-asset'

const testProject: Project = {
    apiVersion: 'project.openshift.io/v1',
    kind: 'Project',
    metadata: {
        name: 'test-bare-metal-asset-new-namespace',
    },
}
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
        bootMac: '00:90:7F:12:DE:7F',
    },
}

const newBareMetalAsset: BareMetalAsset = {
    kind: 'BareMetalAsset',
    apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
    metadata: {
        name: 'test-bare-metal-asset-002',
        namespace: 'test-bare-metal-asset-new-namespace',
    },
    spec: {
        bmc: {
            address: 'example.com:80',
            credentialsName: 'test-bare-metal-asset-002-bmc-secret-1234',
        },
        bootMac: '00:90:7F:12:DE:7F'
    },
}

const mockBareMetalAssets = [bareMetalAsset]
const mockNewBareMetalAssets = [newBareMetalAsset]

interface testNamespace extends V1Namespace {
    apiVersion: 'v1'
    kind: 'Namespace'
    metadata: {
        name: string
    }
}

interface TestSecret extends V1Secret {
    apiVersion: 'v1'
    kind: 'Secret'
    metadata: {
        name: string
        namespace: string
    }
}
const bmaSecret: TestSecret = {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
        name: 'test-bare-metal-asset-002-bmc-secret-1234',
        namespace: 'test-bare-metal-asset-new-namespace',
    },
    data:{
        password:Buffer.from('test', 'ascii').toString(
            'base64'
        ),
        username:Buffer.from('test', 'ascii').toString(
            'base64'
        ) 
    }
}

const bmaNamespace: testNamespace = {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: {
        name: mockBareMetalAssets[0].metadata.namespace!,
    },
}

const bmaNamespaces = [bmaNamespace]
const bmaProjects = [testProject]
const bmaSecrets = [bmaSecret]

describe('bare metal asset page', () => {
    beforeEach(() => {
        document.getElementsByTagName('html')[0].innerHTML = ''
    })

    test('bare metal assets page renders', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const { getAllByText, container } = render(
            <MemoryRouter>
                <BareMetalAssetsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0))
        console.log('testing html: '+ container.innerHTML)
        expect(getAllByText(mockBareMetalAssets[0].metadata.namespace!).length > 0)
    })

    test('can delete asset from overflow menu', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const deleteNock = nockDelete(mockBareMetalAssets[0])

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
        expect(getByText('Confirm')).toBeInTheDocument()
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        console.log('checking container: ', container.innerHTML.toString())
        expect(queryByText('test-bare-metal-asset-1')).toBeNull()
    })

    test('can delete asset(s) from batch action menu', async () => {
        const listNock = nockList(bareMetalAsset, mockBareMetalAssets)
        const deleteNock = nockDelete(mockBareMetalAssets[0])

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
        expect(getByText('Confirm')).toBeInTheDocument()
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        console.log('checking container: ', container.innerHTML.toString())
        expect(queryByText('test-bare-metal-asset-1')).toBeNull()
    })

})