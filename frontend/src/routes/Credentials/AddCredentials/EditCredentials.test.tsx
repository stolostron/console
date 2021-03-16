/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { nockGet, nockReplace } from '../../../lib/nock-util'
import { ProviderID } from '../../../lib/providers'
import { NavigationPath } from '../../../NavigationPath'
import {
    packProviderConnection,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import AddCredentialPage from './AddCredentials'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources/namespace'
import { namespacesState } from '../../../atoms'

const mockNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'test-namespace' },
}

const awsProviderConnection: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connection',
        namespace: mockNamespace.metadata.name,
        labels: {
            'cluster.open-cluster-management.io/provider': ProviderID.AWS,
            'cluster.open-cluster-management.io/cloudconnection': '',
        },
    },
    spec: {
        awsAccessKeyID: 'awsAccessKeyID',
        awsSecretAccessKeyID: 'awsSecretAccessKeyID',
        baseDomain: 'base.domain',
        pullSecret: '{"pullSecret":"secret"}',
        sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
        sshPublickey: 'ssh-rsa AAAAB1 fakeemail@redhat.com',
    },
}

function TestEditConnectionPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(namespacesState, [mockNamespace])
            }}
        >
            <MemoryRouter
                initialEntries={[
                    NavigationPath.editCredentials
                        .replace(':namespace', awsProviderConnection.metadata.namespace!)
                        .replace(':name', awsProviderConnection.metadata.name!),
                ]}
            >
                <Route
                    path={NavigationPath.editCredentials}
                    render={(props: any) => {
                        return <AddCredentialPage {...props} />
                    }}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('edit connection page', () => {
    it('should edit provider connection', async () => {
        const getProviderConnectionNock = nockGet(awsProviderConnection)
        const { getByText, getByTestId } = render(<TestEditConnectionPage />)
        await waitFor(() => expect(getProviderConnectionNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('addConnection.saveButton.label')).toBeInTheDocument())

        await waitFor(() => expect(getByTestId('awsAccessKeyID')).toBeInTheDocument())
        userEvent.type(getByTestId('awsAccessKeyID'), '-edit')

        const copy: ProviderConnection = JSON.parse(JSON.stringify(awsProviderConnection))
        copy.spec!.awsAccessKeyID += '-edit'
        const replaceNock = nockReplace(packProviderConnection(copy))
        getByText('addConnection.saveButton.label').click()
        await waitFor(() => expect(replaceNock.isDone()).toBeTruthy())
    })
})
