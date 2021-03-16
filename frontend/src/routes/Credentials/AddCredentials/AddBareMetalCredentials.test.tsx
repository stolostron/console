/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockCreate } from '../../../lib/nock-util'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import {
    packProviderConnection,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import AddCredentialPage from './AddCredentials'
import { NavigationPath } from '../../../NavigationPath'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources/namespace'
import { namespacesState } from '../../../atoms'

const mockNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'test-namespace' },
}

let location: Location

function TestAddConnectionPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(namespacesState, [mockNamespace])
            }}
        >
            <MemoryRouter>
                <Route
                    render={(props: any) => {
                        location = props.location
                        return <AddCredentialPage {...props} />
                    }}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('add connection page', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
    })
    it('should create bmc provider connection', async () => {
        const providerConnection: ProviderConnection = {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
            metadata: {
                name: 'connection',
                namespace: mockNamespace.metadata.name,
                labels: {
                    'cluster.open-cluster-management.io/provider': ProviderID.BMC,
                    'cluster.open-cluster-management.io/cloudconnection': '',
                },
            },
            spec: {
                libvirtURI: 'qemu+ssh://libvirtURI',
                sshKnownHosts: ['sshKnownHosts'],
                imageMirror: 'image.mirror:123/abc',
                bootstrapOSImage: 'bootstrapOSImage',
                clusterOSImage: 'clusterOSImage',
                additionalTrustBundle: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
                baseDomain: 'base.domain',
                pullSecret: '{"pullSecret":"secret"}',
                sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
                sshPublickey: 'ssh-rsa AAAAB1 fake@email.com',
            },
        }
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        await waitFor(() => expect(getByText(getProviderByKey(ProviderID.BMC).name)).toBeInTheDocument())
        getByText(getProviderByKey(ProviderID.BMC).name).click()
        userEvent.type(getByTestId('connectionName'), providerConnection.metadata.name!)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="namespaceName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(providerConnection.metadata.namespace!)).toBeInTheDocument())
        getByText(providerConnection.metadata.namespace!).click()
        userEvent.type(
            getByTestId('baseDomainResourceGroupName'),
            providerConnection.spec!.baseDomainResourceGroupName!
        )
        userEvent.type(getByTestId('libvirtURI'), providerConnection.spec!.libvirtURI!)
        userEvent.type(getByTestId('sshKnownHosts'), providerConnection.spec!.sshKnownHosts![0])
        userEvent.type(getByTestId('imageMirror'), providerConnection.spec!.imageMirror!)
        userEvent.type(getByTestId('bootstrapOSImage'), providerConnection.spec!.bootstrapOSImage!)
        userEvent.type(getByTestId('clusterOSImage'), providerConnection.spec!.clusterOSImage!)
        userEvent.type(getByTestId('additionalTrustBundle'), providerConnection.spec!.additionalTrustBundle!)
        userEvent.type(getByTestId('baseDomain'), providerConnection.spec!.baseDomain!)
        userEvent.type(getByTestId('pullSecret'), providerConnection.spec!.pullSecret!)
        userEvent.type(getByTestId('sshPrivateKey'), providerConnection.spec!.sshPrivatekey!)
        userEvent.type(getByTestId('sshPublicKey'), providerConnection.spec!.sshPublickey!)
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.credentials))
    })
})
