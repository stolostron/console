import { render, waitFor, act } from '@testing-library/react'
import { V1Namespace } from '@kubernetes/client-node'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { BareMetalAssetsPage } from './BaremetalAssets'
import { CreateBareMetalAssetPage } from './CreateBareMetalAsset'
import { nockList, nockListProjects, nockDelete } from '../../lib/nock-util'
import { Project } from '../../resources/project'
import { BareMetalAsset } from '../../resources/bare-metal-asset'
import { Secret } from '../../resources/secret'

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
const mockNewBareMetalAssets = [bareMetalAsset, newBareMetalAsset]

interface testNamespace extends V1Namespace {
    apiVersion: 'v1'
    kind: 'Namespace'
    metadata: {
        name: string
    }
}

interface TestSecret extends Secret {
    apiVersion: 'v1'
    kind: 'Secret'
    metadata: {
        name: string
        namespace: string
    }
}
// const bmaSecret: TestSecret = {
//     apiVersion: 'v1',
//     kind: 'Secret',
//     metadata: {
//         name: 'test-bare-metal-asset-002-bmc-secret-1234',
//         namespace: 'test-bare-metal-asset-new-namespace',
//     },
//     data:{
//         password:Buffer.from('test', 'ascii').toString(
//             'base64'
//         ),
//         username:Buffer.from('test', 'ascii').toString(
//             'base64'
//         ) 
//     }
// }

const bmaSecret : Secret = ({
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

     test('can create asset', async () => {
        const listProjectNock = nockListProjects(bmaProjects)
        let listNocki = nockList(bareMetalAsset, mockBareMetalAssets)
        let listNockii = nockList(bareMetalAsset, mockNewBareMetalAssets)
        //const createNockSecret = nockCreate(bmaSecret, bmaSecrets[0], 201)
        //const createNock = nockCreate(mockNewBareMetalAssets[0], mockNewBareMetalAssets[0])
        
        

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
        await waitFor(() => expect(listNocki.isDone()).toBeTruthy())
        await waitFor(() => expect(getByTestId('bareMetalAssetName')))
        await act(() => new Promise((resolve) => setTimeout(() => resolve(), 100)))
        console.log('checking container: ', container.innerHTML.toString())
        act(() => {userEvent.type(getByTestId('bareMetalAssetName'), mockNewBareMetalAssets[0].metadata.name!)})
        act(() => {
            userEvent.click(getByTestId('namespaceName-button'))
        })
        act(() => {
            userEvent.click(getAllByText(mockNewBareMetalAssets[0].metadata.namespace!)[0])
        })
        await act(() => new Promise((resolve) => setTimeout(() => resolve(), 100)))
        await waitFor(() => expect(getByText(mockBareMetalAssets[0].metadata.namespace!)).toBeInTheDocument())
        userEvent.type(getByTestId('baseboardManagementControllerAddress'), mockNewBareMetalAssets[0].spec.bmc.address!)
        userEvent.type(getByTestId('username'), 'test')
        userEvent.type(getByTestId('password'), 'test')
        userEvent.type(getByTestId('bootMac'), mockNewBareMetalAssets[0].spec.bootMac!)
        expect(getByText('Add connection')).toBeInTheDocument()
        act(() => {
            userEvent.click(getByText('Add connection'))
        })
        await waitFor(() => expect(listNocki.isDone()).toBeTruthy())
        //await act(() => new Promise((resolve) => setTimeout(() => resolve(), 100)))
        //await waitFor(() => expect(createNockSecret.isDone()).toBeTruthy())
        //await waitFor(() => expect(createNock.isDone()).toBeTruthy()) // expect the delete api call
        //act(() => { userEvent.click(getByText('Confirm')) }) // click confirm on the delete dialog
        console.log('checking container: ', container.innerHTML.toString())
        expect(getByText('Create Asset')).toBeVisible()
        await waitFor(() => expect(listNockii.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getAllByText(mockNewBareMetalAssets[0].metadata.name!).length > 0))
        await waitFor(() => expect(getByText('test-bare-metal-asset-002')).toBeInTheDocument())
    })
})