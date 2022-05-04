/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { namespacesState } from '../../../atoms'
import { nockCreate, nockGet, nockIgnoreRBAC, nockOptions, nockPatch, nockRBAC } from '../../../lib/nock-util'
import { clickByText, selectByText, typeByTestId, waitForNock, waitForTestId } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import {
    BareMetalAsset,
    BareMetalAssetApiVersion,
    BareMetalAssetKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
    ResourceAttributes,
    Secret,
    SecretApiVersion,
    SecretKind,
} from '../../../resources'
import CreateBareMetalAssetPage from './CreateBareMetalAsset'

const bmaNamespace: ResourceAttributes = {
    namespace: 'test-namespace',
    group: 'inventory.open-cluster-management.io',
    resource: 'baremetalassets',
    verb: 'create',
}

const adminAccess: ResourceAttributes = {
    name: '*',
    namespace: '*',
    resource: '*',
    verb: '*',
}

const mockNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'test-namespace' },
}

describe('CreateBareMetalAsset', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
    })
    test('can create asset', async () => {
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

        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(namespacesState, [mockNamespace])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.createBareMetalAsset]}>
                    <Route path={NavigationPath.createBareMetalAsset} render={() => <CreateBareMetalAssetPage />} />
                    <Route path={NavigationPath.bareMetalAssets} render={() => <div id="redirected" />} />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForTestId('bareMetalAssetName')
        await typeByTestId('bareMetalAssetName', createBareMetalAsset.metadata.name!)
        await selectByText(
            'Select a namespace to store the bare metal asset in the cluster',
            createBareMetalAsset.metadata.namespace!
        )
        await typeByTestId('baseboardManagementControllerAddress', createBareMetalAsset.spec?.bmc.address!)
        await typeByTestId('username', createBmaSecret.stringData?.username!)
        await typeByTestId('password', createBmaSecret.stringData?.password!)
        await typeByTestId('bootMACAddress', createBareMetalAsset.spec?.bootMACAddress!)
        const secretCreateNock = nockCreate(createBmaSecret)
        const bmaCreateNock = nockCreate(createBareMetalAsset)
        await clickByText('Create')
        await waitForNock(secretCreateNock)
        await waitForNock(bmaCreateNock)
        await waitForTestId('redirected')
    })

    test('can edit asset', async () => {
        const bareMetalAsset: BareMetalAsset = {
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

        const patchBareMetalAsset: BareMetalAsset = {
            kind: BareMetalAssetKind,
            apiVersion: BareMetalAssetApiVersion,
            metadata: {
                name: 'test-bma',
                namespace: 'test-namespace',
            },
            spec: {
                bmc: {
                    address: 'example.com:80/patched',
                    credentialsName: 'test-bma-bmc-secret',
                },
                bootMACAddress: '00:90:7F:12:DE:7F',
            },
        }

        const patchBmaSecret: Secret = {
            kind: SecretKind,
            apiVersion: SecretApiVersion,
            metadata: {
                name: 'test-bma-bmc-secret',
                namespace: 'test-namespace',
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

        const editPath = NavigationPath.editBareMetalAsset.replace(
            ':namespace/:name',
            `${bareMetalAsset.metadata?.namespace}/${bareMetalAsset.metadata?.name}` as string
        )
        const getBMANock = nockGet(bareMetalAsset, bareMetalAsset)
        const getSecretNock = nockGet(patchBmaSecret, patchBmaSecret)
        const patchNockSecret = nockPatch(patchBmaSecret, [
            {
                op: 'replace',
                path: `/stringData`,
                value: patchBmaSecret.stringData,
            },
        ])
        nockOptions(patchBareMetalAsset, patchBareMetalAsset)
        const patchNock = nockPatch(patchBareMetalAsset, [
            {
                op: 'replace',
                path: `/spec/bmc`,
                value: patchBareMetalAsset.spec?.bmc,
            },
            {
                op: 'replace',
                path: `/spec/bootMACAddress`,
                value: patchBareMetalAsset.spec?.bootMACAddress!,
            },
        ])

        const { getByTestId, getByText } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(namespacesState, [mockNamespace])
                }}
            >
                <MemoryRouter initialEntries={[editPath]}>
                    <Route path={NavigationPath.editBareMetalAsset} render={() => <CreateBareMetalAssetPage />} />
                    <Route path={NavigationPath.bareMetalAssets} render={() => <div id="redirected" />} />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitFor(() => expect(getBMANock.isDone()).toBeTruthy())
        await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByTestId('bootMACAddress')).toHaveValue(bareMetalAsset.spec?.bootMACAddress))
        expect(getByTestId('baseboardManagementControllerAddress')).toHaveValue(bareMetalAsset.spec?.bmc.address)

        userEvent.type(getByTestId('baseboardManagementControllerAddress'), '/patched')
        userEvent.click(getByText('Apply'))

        await waitFor(() => expect(patchNockSecret.isDone()).toBeTruthy())
        await waitFor(() => expect(patchNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByTestId('redirected')).toBeInTheDocument())
    })
})

describe('CreateBareMetalAsset', () => {
    test('renders unauthorized page when rbac access is restricted', async () => {
        const rbacNock = nockRBAC(adminAccess, false)
        const rbacNockii = nockRBAC(bmaNamespace, false)
        const { getByText } = render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(namespacesState, [mockNamespace])
                }}
            >
                <MemoryRouter initialEntries={[NavigationPath.createBareMetalAsset]}>
                    <Route path={NavigationPath.createBareMetalAsset} render={() => <CreateBareMetalAssetPage />} />
                </MemoryRouter>
            </RecoilRoot>
        )

        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNockii.isDone()).toBeTruthy())
        await waitFor(() =>
            expect(
                getByText(
                    'You are not authorized to complete this action. There is currently no namespace that allows you to create this resource. See your cluster administrator for role-based access control information.'
                )
            ).toBeInTheDocument()
        )
    })
})
