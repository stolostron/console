import { render, waitFor, act } from '@testing-library/react'
import { V1Namespace, V1Secret } from '@kubernetes/client-node'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { BareMetalAssetsPage } from './BaremetalAssets'
import { CreateBareMetalAssetPage } from './CreateBareMetalAsset'
import { nockCreate, nockList, nockListProjects, nockDelete } from '../../../lib/nock-util'
import { resourceMethods } from '../../../lib/Resource'
import { Project } from '../../../lib/Project'
import { secrets } from '../../../lib/Secret'
import { BareMetalAsset, bareMetalAssets } from '../../../library/resources/bare-metal-asset'

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
    apiVersion?: 'v1'
    kind?: 'Secret'
    metadata: {
        name: string
        namespace: string
    }
}
const bmaSecret: TestSecret = {
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

const bmaProject = resourceMethods<Project>({
    path: '/apis/project.openshift.io/v1',
    plural: 'projects',
})

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

    test('can delete assset(s) from batch action menu', async () => {
        const listNock = nockList(bareMetalAssets, mockBareMetalAssets)
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

    test('can create asset', async () => {
        const listProjectNock = nockListProjects(bmaProjects)
        const createNockSecret = nockCreate(secrets, bmaSecrets[0], bmaSecrets[0])
        const createNock = nockCreate(bareMetalAssets, mockNewBareMetalAssets[0], mockNewBareMetalAssets[0])
        const listNock = nockList(bareMetalAssets, mockNewBareMetalAssets)
        

        const { getByText, getAllByText, getByTestId, queryByText, getByLabelText, container } = render(
            <MemoryRouter initialEntries={['/cluster-management/baremetal-assets/create']}>
                <Route
                    path="/cluster-management/baremetal-assets/create"
                    render={() => <CreateBareMetalAssetPage bmaSecretID='1234'/>}
                ></Route>
                <Route path="/cluster-management/baremetal-assets" render={() =><BareMetalAssetsPage />} />
            </MemoryRouter>
        )

        await waitFor(() => expect(listProjectNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByTestId('bareMetalAssetName')))
        await act(() => new Promise((resolve) => setTimeout(() => resolve(), 100)))
        console.log('checking container: ', container.innerHTML.toString())
        userEvent.type(getByTestId('bareMetalAssetName'), mockNewBareMetalAssets[0].metadata.name!)
        act(() => {
            userEvent.click(getByTestId('namespaceName-button'))
        })
        act(() => {
            userEvent.click(getAllByText(mockNewBareMetalAssets[0].metadata.namespace!)[0])
        })
        await act(() => new Promise((resolve) => setTimeout(() => resolve(), 100)))
        //expect(getByText(bmaProjects[0].metadata.name!)).toBeVisible
        //userEvent.selectOptions(getByLabelText('namespaceName-label'), mockBareMetalAssets[0].metadata.namespace!)
        userEvent.type(getByTestId('baseboardManagementControllerAddress'), mockNewBareMetalAssets[0].spec.bmc.address!)
        userEvent.type(getByTestId('username'), 'test')
        userEvent.type(getByTestId('password'), 'test')
        userEvent.type(getByTestId('bootMac'), mockNewBareMetalAssets[0].spec.bootMac!)
        expect(getByText('Add connection')).toBeInTheDocument()
        act(() => {
            userEvent.click(getByText('Add connection'))
        })
        await waitFor(() => expect(createNockSecret.isDone()).toBeTruthy())
        await act(() => new Promise((resolve) => setTimeout(() => resolve(), 100)))
        await waitFor(() => expect(createNock.isDone()).toBeTruthy()) // expect the delete api call
        await act(() => new Promise((resolve) => setTimeout(() => resolve(), 100)))
        //act(() => { userEvent.click(getByText('Confirm')) }) // click confirm on the delete dialog
        //console.log('checking container: ', container.innerHTML.toString())
        expect(getByText('Create Asset')).toBeVisible()
        console.log('checking container: ', container.innerHTML.toString())
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getAllByText(mockNewBareMetalAssets[0].metadata.name!).length > 0))
        //await waitFor(() => expect(getAllByText(mockBareMetalAssets[0].metadata.name!).length > 0))
        //await waitFor(() => expect(getByText('test-bare-metal-asset-002')).toBeInTheDocument())
    })
})
