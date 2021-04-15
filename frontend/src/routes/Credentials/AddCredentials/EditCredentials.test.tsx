/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { multiClusterHubState, namespacesState } from '../../../atoms'
import { nockGet, nockReplace } from '../../../lib/nock-util'
import { ProviderID } from '../../../lib/providers'
import { multiClusterHub } from '../../../lib/test-metadata'
import { NavigationPath } from '../../../NavigationPath'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources/namespace'
import {
    packProviderConnection,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import { Secret } from '../../../resources/secret'
import AddCredentialPage from './AddCredentials'

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

const awsSecret: Secret = {
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
    data: {
        metadata:
            'YXdzQWNjZXNzS2V5SUQ6IGF3c0FjY2Vzc0tleUlECmF3c1NlY3JldEFjY2Vzc0tleUlEOiBhd3NTZWNyZXRBY2Nlc3NLZXlJRApiYXNlRG9tYWluOiBiYXNlLmRvbWFpbgpwdWxsU2VjcmV0OiAneyJwdWxsU2VjcmV0Ijoic2VjcmV0In0nCnNzaFByaXZhdGVrZXk6ICItLS0tLUJFR0lOIE9QRU5TU0ggUFJJVkFURSBLRVktLS0tLVxua2V5XG4tLS0tLUVORCBPUEVOU1NIIFBSSVZBVEUgS0VZLS0tLS0iCnNzaFB1YmxpY2tleTogJ3NzaC1yc2EgQUFBQUIxIGZha2VlbWFpbEByZWRoYXQuY29tJwo=',
    },
}

function TestEditConnectionPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(namespacesState, [mockNamespace])
                snapshot.set(multiClusterHubState, [multiClusterHub])
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
        const getProviderSecretNock = nockGet(awsSecret)
        const { getByText, getByTestId } = render(<TestEditConnectionPage />)

        await waitFor(() => expect(getProviderSecretNock.isDone()).toBeTruthy())

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
