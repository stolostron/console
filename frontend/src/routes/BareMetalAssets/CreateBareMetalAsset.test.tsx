/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import CreateBareMetalAssetPage from './CreateBareMetalAsset'
import { nockGet, nockPatch, nockOptions, nockCreate, nockRBAC, nockIgnoreRBAC } from '../../lib/nock-util'
import { BareMetalAsset, BareMetalAssetApiVersion, BareMetalAssetKind } from '../../resources/bare-metal-asset'
import { Secret, SecretKind, SecretApiVersion } from '../../resources/secret'
import { ResourceAttributes } from '../../resources/self-subject-access-review'
import { NavigationPath } from '../../NavigationPath'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../resources/namespace'
import { namespacesState } from '../../atoms'

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

        const bmaSecret: Secret = {
            kind: SecretKind,
            apiVersion: SecretApiVersion,
            metadata: {
                namespace: 'test-namespace',
                name: 'test-bma-bmc-secret',
            },
            data: { password: 'encoded', username: 'encoded' },
        }

        const secretCreateNock = nockCreate(createBmaSecret, bmaSecret)
        const bmaCreateNock = nockCreate(createBareMetalAsset)

        const { getByText, queryAllByText, getByTestId } = render(
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

        await waitFor(() => expect(getByTestId('bareMetalAssetName')))

        // user input
        userEvent.type(getByTestId('bareMetalAssetName'), createBareMetalAsset.metadata.name!)
        userEvent.type(
            getByTestId('namespaceName-button-select-typeahead'),
            `${createBareMetalAsset.metadata.namespace!}{enter}`
        )
        userEvent.type(getByTestId('baseboardManagementControllerAddress'), createBareMetalAsset.spec?.bmc.address!)
        userEvent.type(getByTestId('username'), createBmaSecret.stringData?.username!)
        userEvent.type(getByTestId('password'), createBmaSecret.stringData?.username!)
        userEvent.type(getByTestId('bootMACAddress'), createBareMetalAsset.spec?.bootMACAddress!)

        userEvent.click(getByText('createBareMetalAsset.button.create'))

        await waitFor(() => expect(queryAllByText('Required').length).toBe(0))

        await waitFor(() => expect(secretCreateNock.isDone()).toBeTruthy())
        await waitFor(() => expect(bmaCreateNock.isDone()).toBeTruthy())

        await waitFor(() => expect(getByTestId('redirected')).toBeInTheDocument())
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
        userEvent.click(getByText('editBareMetalAsset.button.submit'))

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
        await waitFor(() => expect(getByText('common:rbac.namespaces.unauthorized')).toBeInTheDocument())
    })
})
