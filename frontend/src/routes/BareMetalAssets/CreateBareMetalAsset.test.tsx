import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import BareMetalAssetsPage from './BareMetalAssetsPage'
import CreateBareMetalAssetPage, { EditBareMetalAssetPageData } from './CreateBareMetalAsset'
import { nockList, nockClusterList, nockGet, nockPatch, nockOptions, nockCreate } from '../../lib/nock-util'
import { Project } from '../../resources/project'
import { BareMetalAsset } from '../../resources/bare-metal-asset'
import { Secret } from '../../resources/secret'
import { SelfSubjectAccessReview } from '../../resources/self-subject-access-review'

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
        bootMACAddress: '00:90:7F:12:DE:7F',
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
        bootMACAddress: '00:90:7F:12:DE:7F',
    },
}
const patchedBareMetalAsset: BareMetalAsset = {
    kind: 'BareMetalAsset',
    apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
    metadata: {
        name: 'test-bare-metal-asset-001',
        namespace: 'test-bare-metal-asset-namespace',
    },
    spec: {
        bmc: {
            address: 'example.com:80/patched',
            credentialsName: 'secret-test-bare-metal-asset',
        },
        bootMACAddress: '00:90:7F:12:DE:7F',
    },
}

const bmaSecret: Secret = {
    kind: 'Secret',
    apiVersion: 'v1',
    metadata: {
        name: 'secret-test-bare-metal-asset',
        namespace: 'test-bare-metal-asset-namespace',
    },
    data: {
        username: 'test',
        password: 'test',
    },
}
const bmaPatchedSecret: Secret = {
    kind: 'Secret',
    apiVersion: 'v1',
    metadata: {
        name: 'secret-test-bare-metal-asset',
        namespace: 'test-bare-metal-asset-namespace',
    },
    data: {
        username: 'test',
        password: 'test',
    },
    stringData: {
        username: '5k-',
        password: '5k-',
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
const mockNewBareMetalAssets = [bareMetalAsset, newBareMetalAsset]
const bmaProjects = [testProject]

describe('bare metal asset page', () => {
    test('can create asset', async () => {
        const listProjectNock = nockClusterList(testProject, bmaProjects)
        const listNocki = nockList(bareMetalAsset, mockBareMetalAssets)
        const clusterNock = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponse)

        const { getByText, getAllByText, getByTestId } = render(
            <MemoryRouter initialEntries={['/cluster-management/baremetal-assets/create']}>
                <Route
                    path="/cluster-management/baremetal-assets/create"
                    render={() => <CreateBareMetalAssetPage bmaSecretID="1234" />}
                ></Route>
                <Route path="/cluster-management/baremetal-assets" render={() => <BareMetalAssetsPage />} />
            </MemoryRouter>
        )

        await waitFor(() => expect(clusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listProjectNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(listNocki.isDone()).toBeTruthy())
        await waitFor(() => expect(getByTestId('bareMetalAssetName'))) // expect asset name form to exist in doc

        // user input
        userEvent.type(getByTestId('bareMetalAssetName'), mockNewBareMetalAssets[0].metadata.name!)
        userEvent.click(getByTestId('namespaceName-button'))
        userEvent.click(getAllByText(mockNewBareMetalAssets[0].metadata.namespace!)[0])
        await waitFor(() => expect(getByText(mockBareMetalAssets[0].metadata.namespace!)).toBeInTheDocument())
        userEvent.type(
            getByTestId('baseboardManagementControllerAddress'),
            mockNewBareMetalAssets[0].spec?.bmc.address!
        )
        userEvent.type(getByTestId('username'), 'test')
        userEvent.type(getByTestId('password'), 'test')
        userEvent.type(getByTestId('bootMACAddress'), mockNewBareMetalAssets[0].spec?.bootMACAddress!)

        // submitting new asset
        expect(getByText('createBareMetalAsset.button.create')).toBeInTheDocument()
        userEvent.click(getByText('createBareMetalAsset.button.create'))

        expect(getByText('bareMetalAsset.bulkAction.createAsset')).toBeVisible()
        await waitFor(() => expect(getAllByText(mockNewBareMetalAssets[0].metadata.name!).length > 0))
    })

    test('populate edit asset page', async () => {
        const listProjectNock = nockClusterList(testProject, bmaProjects)
        const getBMANock = nockGet(bareMetalAsset, bareMetalAsset)
        const getSecretNock = nockGet(bmaSecret, bmaSecret)

        const { getByTestId } = render(
            <MemoryRouter initialEntries={['/cluster-management/baremetal-assets/bma-test-cluster/test-asset-1/edit']}>
                <Route
                    path="/cluster-management/baremetal-assets/bma-test-cluster/test-asset-1/edit"
                    render={() => (
                        <EditBareMetalAssetPageData
                            editAssetNamespace={'test-bare-metal-asset-namespace'}
                            editAssetName={'test-bare-metal-asset-001'}
                        />
                    )}
                />
            </MemoryRouter>
        )

        await waitFor(() => expect(listProjectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getBMANock.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByTestId('bootMACAddress')).toHaveValue(bareMetalAsset.spec?.bootMACAddress))
        expect(getByTestId('baseboardManagementControllerAddress')).toHaveValue(bareMetalAsset.spec?.bmc.address)
    })

    test('submit edit to api', async () => {
        const listProjectNock = nockClusterList(testProject, bmaProjects)
        const getBMANock = nockGet(bareMetalAsset, bareMetalAsset)
        const getSecretNock = nockGet(bmaSecret, bmaSecret)
        const patchNockSecret = nockPatch(bmaPatchedSecret, bmaPatchedSecret)
        nockOptions(bareMetalAsset, bareMetalAsset)
        const patchNock = nockPatch(patchedBareMetalAsset, patchedBareMetalAsset)

        const { getByTestId, getByText } = render(
            <MemoryRouter initialEntries={['/cluster-management/baremetal-assets/bma-test-cluster/test-asset-1/edit']}>
                <Route
                    path="/cluster-management/baremetal-assets/bma-test-cluster/test-asset-1/edit"
                    render={() => (
                        <EditBareMetalAssetPageData
                            editAssetNamespace={'test-bare-metal-asset-namespace'}
                            editAssetName={'test-bare-metal-asset-001'}
                        />
                    )}
                />
            </MemoryRouter>
        )

        await waitFor(() => expect(listProjectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getBMANock.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByTestId('bootMACAddress')).toHaveValue(bareMetalAsset.spec?.bootMACAddress))
        expect(getByTestId('baseboardManagementControllerAddress')).toHaveValue(bareMetalAsset.spec?.bmc.address)

        userEvent.type(getByTestId('baseboardManagementControllerAddress'), '/patched')
        userEvent.click(getByText('editBareMetalAsset.button.submit'))

        await waitFor(() => expect(patchNockSecret.isDone()).toBeTruthy())
        await waitFor(() => expect(patchNock.isDone()).toBeTruthy())
    })
})
