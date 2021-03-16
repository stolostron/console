/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { mockBadRequestStatus, nockIgnoreRBAC, nockCreate } from '../../../lib/nock-util'
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
    it('should create aws provider connection', async () => {
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

        const badRequestNock = nockCreate(packProviderConnection({ ...awsProviderConnection }), mockBadRequestStatus)
        const createNock = nockCreate(packProviderConnection({ ...awsProviderConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        await waitFor(() => expect(getByText(getProviderByKey(ProviderID.AWS).name)).toBeInTheDocument())
        getByText(getProviderByKey(ProviderID.AWS).name).click()
        userEvent.type(getByTestId('connectionName'), awsProviderConnection.metadata.name!)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="namespaceName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(awsProviderConnection.metadata.namespace!)).toBeInTheDocument())
        getByText(awsProviderConnection.metadata.namespace!).click()
        userEvent.type(getByTestId('awsAccessKeyID'), awsProviderConnection.spec!.awsAccessKeyID!)
        userEvent.type(getByTestId('awsSecretAccessKeyID'), awsProviderConnection.spec!.awsSecretAccessKeyID!)
        userEvent.type(getByTestId('baseDomain'), awsProviderConnection.spec!.baseDomain!)
        userEvent.type(getByTestId('pullSecret'), awsProviderConnection.spec!.pullSecret!)
        userEvent.type(getByTestId('sshPrivateKey'), awsProviderConnection.spec!.sshPrivatekey!)
        userEvent.type(getByTestId('sshPublicKey'), awsProviderConnection.spec!.sshPublickey!)
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(badRequestNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText(mockBadRequestStatus.message)).toBeInTheDocument())
        await waitFor(() => expect(getByText('addConnection.addButton.label')).toBeInTheDocument())
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.credentials))
    })
})
