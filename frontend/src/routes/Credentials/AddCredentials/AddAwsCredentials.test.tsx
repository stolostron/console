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
import { namespacesState, multiClusterHubState } from '../../../atoms'
import { clickByText, typeByPlaceholderText, typeByText, waitForText } from '../../../lib/test-util'
import { multiClusterHub } from '../../../lib/test-metadata'
import { Secret } from '../../../resources/secret'

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
                snapshot.set(multiClusterHubState, [multiClusterHub])
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

        // const badRequestNock = nockCreate(packProviderConnection({ ...awsProviderConnection }), mockBadRequestStatus)
        // const createNock = nockCreate(packProviderConnection({ ...awsProviderConnection }))
        render(<TestAddConnectionPage />)

        // navigate credential selection page
        await waitForText('Infrastructure Provider')
        await clickByText('Infrastructure Provider')
        await typeByPlaceholderText('addConnection.connectionName.placeholder', awsSecret.metadata.name!)
        await clickByText('addConnection.namespaceName.placeholder')
        await clickByText(mockNamespace.metadata.name!)
        await clickByText('Next')

        // navigate provider connection input
        await waitForText('Select a provider and enter basic information')
        await clickByText('addConnection.providerName.placeholder')
        await clickByText(getProviderByKey(ProviderID.AWS).name)
        await typeByPlaceholderText('addConnection.baseDomain.placeholder', awsProviderConnection.spec!.baseDomain!)
        await typeByPlaceholderText(
            'addConnection.awsAccessKeyID.placeholder',
            awsProviderConnection.spec!.awsAccessKeyID!
        )
        await typeByPlaceholderText(
            'addConnection.awsSecretAccessKeyID.placeholder',
            awsProviderConnection.spec!.awsSecretAccessKeyID!
        )
        await typeByPlaceholderText('addConnection.pullSecret.placeholder', awsProviderConnection.spec!.pullSecret!)
        await typeByPlaceholderText(
            'addConnection.sshPrivateKey.placeholder',
            awsProviderConnection.spec!.sshPrivatekey!
        )
        await typeByPlaceholderText('addConnection.sshPublicKey.placeholder', awsProviderConnection.spec!.sshPublickey!)

        // await waitFor(() =>
        //     expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        // )
        // container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        // await waitFor(() => expect(getByText(getProviderByKey(ProviderID.AWS).name)).toBeInTheDocument())
        // getByText(getProviderByKey(ProviderID.AWS).name).click()
        // userEvent.type(getByTestId('connectionName'), awsProviderConnection.metadata.name!)
        // await waitFor(() =>
        //     expect(container.querySelectorAll(`[aria-labelledby^="namespaceName-label"]`)).toHaveLength(1)
        // )
        // container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        // await waitFor(() => expect(getByText(awsProviderConnection.metadata.namespace!)).toBeInTheDocument())
        // getByText(awsProviderConnection.metadata.namespace!).click()
        // userEvent.type(getByTestId('awsAccessKeyID'), awsProviderConnection.spec!.awsAccessKeyID!)
        // userEvent.type(getByTestId('awsSecretAccessKeyID'), awsProviderConnection.spec!.awsSecretAccessKeyID!)
        // userEvent.type(getByTestId('baseDomain'), awsProviderConnection.spec!.baseDomain!)
        // userEvent.type(getByTestId('pullSecret'), awsProviderConnection.spec!.pullSecret!)
        // userEvent.type(getByTestId('sshPrivateKey'), awsProviderConnection.spec!.sshPrivatekey!)
        // userEvent.type(getByTestId('sshPublicKey'), awsProviderConnection.spec!.sshPublickey!)
        // getByText('addConnection.addButton.label').click()
        // await waitFor(() => expect(badRequestNock.isDone()).toBeTruthy())
        // await waitForText(mockBadRequestStatus.message, true)
        // await waitFor(() => expect(getByText('addConnection.addButton.label')).toBeInTheDocument())
        // getByText('addConnection.addButton.label').click()
        // await waitFor(() => expect(createNock.isDone()).toBeTruthy())
        // await waitFor(() => expect(location.pathname).toBe(NavigationPath.credentials))
    })
})
