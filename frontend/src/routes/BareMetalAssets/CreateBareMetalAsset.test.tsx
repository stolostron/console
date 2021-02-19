import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import CreateBareMetalAssetPage from './CreateBareMetalAsset'
import { nockClusterList, nockGet, nockPatch, nockOptions, nockCreate } from '../../lib/nock-util'
import { Project, ProjectApiVersion, ProjectKind } from '../../resources/project'
import { BareMetalAsset, BareMetalAssetApiVersion, BareMetalAssetKind } from '../../resources/bare-metal-asset'
import { Secret, SecretKind, SecretApiVersion } from '../../resources/secret'
import { SelfSubjectAccessReview } from '../../resources/self-subject-access-review'
import { NavigationPath } from '../../NavigationPath'

const mockSelfSubjectAccessRequest: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            namespace: 'test-namespace',
            group: 'inventory.open-cluster-management.io',
            resource: 'baremetalassets',
            verb: 'create',
        },
    },
}

const mockSelfSubjectAccessRequestAdmin: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        },
    },
}

const mockSelfSubjectAccessResponseFalse: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            namespace: 'test-namespace',
            resource: 'baremetalassets',
            group: 'inventory.open-cluster-management.io',
            verb: 'create',
        },
    },
    status: {
        allowed: false,
    },
}

const mockSelfSubjectAccessResponseNonAdmin: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        },
    },
    status: {
        allowed: false,
    },
}
const mockSelfSubjectAccessResponseAdmin: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        },
    },
    status: {
        allowed: true,
    },
}

const testProject: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: {
        name: 'test-namespace',
    },
}

describe('CreateBareMetalAsset', () => {
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

        const listProjectNock = nockClusterList(testProject, [testProject])
        const rbacNock = nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseAdmin)
        const secretCreateNock = nockCreate(createBmaSecret, bmaSecret)
        const bmaCreateNock = nockCreate(createBareMetalAsset)

        const { getByText, queryAllByText, getByTestId } = render(
            <MemoryRouter initialEntries={[NavigationPath.createBareMetalAsset]}>
                <Route path={NavigationPath.createBareMetalAsset} render={() => <CreateBareMetalAssetPage />} />
                <Route path={NavigationPath.bareMetalAssets} render={() => <div id="redirected" />} />
            </MemoryRouter>
        )

        await waitFor(() => expect(listProjectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())

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
            <MemoryRouter initialEntries={[editPath]}>
                <Route path={NavigationPath.editBareMetalAsset} render={() => <CreateBareMetalAssetPage />} />
                <Route path={NavigationPath.bareMetalAssets} render={() => <div id="redirected" />} />
            </MemoryRouter>
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

    test('renders unauthorized page when rbac access is restricted', async () => {
        const listProjectNock = nockClusterList(testProject, [testProject])
        const rbacNock = nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseNonAdmin)
        const rbacNockii = nockCreate(mockSelfSubjectAccessRequest, mockSelfSubjectAccessResponseFalse)
        const { getByText } = render(
            <MemoryRouter initialEntries={[NavigationPath.createBareMetalAsset]}>
                <Route path={NavigationPath.createBareMetalAsset} render={() => <CreateBareMetalAssetPage />} />
            </MemoryRouter>
        )

        await waitFor(() => expect(listProjectNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNockii.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('common:rbac.namespaces.unauthorized')).toBeInTheDocument())
    })
})
