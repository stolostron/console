import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import BareMetalAssetsPage from './BareMetalAssetsPage'
import CreateBareMetalAssetPage from './CreateBareMetalAsset'
import { nockList, nockClusterList } from '../../lib/nock-util'
import { Project } from '../../resources/project'
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
        bootMac: '00:90:7F:12:DE:7F',
    },
}

const mockBareMetalAssets = [bareMetalAsset]
const mockNewBareMetalAssets = [bareMetalAsset, newBareMetalAsset]
const bmaProjects = [testProject]

describe('bare metal asset page', () => {
    test('can create asset', async () => {
        const listProjectNock = nockClusterList(testProject, bmaProjects)
        const listNocki = nockList(bareMetalAsset, mockBareMetalAssets)

        const { getByText, getAllByText, getByTestId, container } = render(
            <MemoryRouter initialEntries={['/cluster-management/baremetal-assets/create']}>
                <Route
                    path="/cluster-management/baremetal-assets/create"
                    render={() => <CreateBareMetalAssetPage bmaSecretID="1234" />}
                ></Route>
                <Route path="/cluster-management/baremetal-assets" render={() => <BareMetalAssetsPage />} />
            </MemoryRouter>
        )

        await waitFor(() => expect(listProjectNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(listNocki.isDone()).toBeTruthy())
        await waitFor(() => expect(getByTestId('bareMetalAssetName'))) // expect asset name form to exist in doc

        // user input
        userEvent.type(getByTestId('bareMetalAssetName'), mockNewBareMetalAssets[0].metadata.name!)
        userEvent.click(getByTestId('namespaceName-button'))
        userEvent.click(getAllByText(mockNewBareMetalAssets[0].metadata.namespace!)[0])
        await waitFor(() => expect(getByText(mockBareMetalAssets[0].metadata.namespace!)).toBeInTheDocument())
        userEvent.type(getByTestId('baseboardManagementControllerAddress'), mockNewBareMetalAssets[0].spec.bmc.address!)
        userEvent.type(getByTestId('username'), 'test')
        userEvent.type(getByTestId('password'), 'test')
        userEvent.type(getByTestId('bootMac'), mockNewBareMetalAssets[0].spec.bootMac!)

        // submitting new asset
        expect(getByText('createBareMetalAsset.button.create')).toBeInTheDocument()
        userEvent.click(getByText('createBareMetalAsset.button.create'))

        expect(getByText('bareMetalAsset.bulkAction.createAsset')).toBeVisible()
        await waitFor(() => expect(getAllByText(mockNewBareMetalAssets[0].metadata.name!).length > 0))
    })
})
