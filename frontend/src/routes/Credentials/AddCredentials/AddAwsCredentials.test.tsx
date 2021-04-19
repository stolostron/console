/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { multiClusterHubState, namespacesState, secretsState } from '../../../atoms'
import { nockCreate, nockIgnoreRBAC } from '../../../lib/nock-util'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { multiClusterHub } from '../../../lib/test-metadata'
import { clickByText, typeByPlaceholderText, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { AnsibleTowerSecretApiVersion, AnsibleTowerSecretKind } from '../../../resources/ansible-tower-secret'
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

const ansSecret: Secret = {
    apiVersion: AnsibleTowerSecretApiVersion,
    kind: AnsibleTowerSecretKind,
    metadata: {
        name: 'ansible-tower-secret',
        namespace: mockNamespace.metadata.name,
        labels: {
            'cluster.open-cluster-management.io/provider': ProviderID.ANS,
        },
    },
    data: {
        metadata: 'aG9zdDogdGVzdAp0b2tlbjogdGVzdAo=',
    },
}

let location: Location

function TestAddConnectionPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(namespacesState, [mockNamespace])
                snapshot.set(multiClusterHubState, [multiClusterHub])
                snapshot.set(secretsState, [ansSecret])
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
        const providerConnection: ProviderConnection = {
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
                anisibleSecretName: 'ansible-tower-secret',
                anisibleCuratorTemplateName: '',
            },
        }
        // const badRequestNock = nockCreate(packProviderConnection({ ...providerConnection }), mockBadRequestStatus)
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        render(<TestAddConnectionPage />)

        // navigate credential selection page
        await waitForText('Infrastructure Provider')
        await clickByText('Infrastructure Provider')
        await typeByPlaceholderText('addConnection.connectionName.placeholder', providerConnection.metadata.name!)
        await clickByText('addConnection.namespaceName.placeholder')
        await clickByText(mockNamespace.metadata.name!)
        await clickByText('Next')

        // navigate provider connection input
        await waitForText('Select a provider and enter basic information')
        await clickByText('addConnection.providerName.placeholder')
        await clickByText(getProviderByKey(ProviderID.AWS).name)
        await typeByPlaceholderText('addConnection.baseDomain.placeholder', providerConnection.spec!.baseDomain!)
        await typeByPlaceholderText(
            'addConnection.awsAccessKeyID.placeholder',
            providerConnection.spec!.awsAccessKeyID!
        )
        await typeByPlaceholderText(
            'addConnection.awsSecretAccessKeyID.placeholder',
            providerConnection.spec!.awsSecretAccessKeyID!
        )
        await typeByPlaceholderText('addConnection.pullSecret.placeholder', providerConnection.spec!.pullSecret!)
        await typeByPlaceholderText('addConnection.sshPrivateKey.placeholder', providerConnection.spec!.sshPrivatekey!)
        await typeByPlaceholderText('addConnection.sshPublicKey.placeholder', providerConnection.spec!.sshPublickey!)

        await clickByText('Next')

        // integration step
        await clickByText('addConnection.ansibleConnection.placeholder')

        await clickByText(ansSecret.metadata.name!)

        await clickByText('Save')

        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.credentials))
    })
})
