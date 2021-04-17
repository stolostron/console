/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
import { namespacesState, multiClusterHubState, secretsState } from '../../../atoms'
import { multiClusterHub } from '../../../lib/test-metadata'
import { AnsibleTowerSecretApiVersion, AnsibleTowerSecretKind } from '../../../resources/ansible-tower-secret'
import { Secret } from '../../../resources/secret'
import { waitForText, clickByText, typeByPlaceholderText, typeByTestId } from '../../../lib/test-util'

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
    it('should create gcp provider connection', async () => {
        const providerConnection: ProviderConnection = {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
            metadata: {
                name: 'connection',
                namespace: mockNamespace.metadata.name,
                labels: {
                    'cluster.open-cluster-management.io/provider': ProviderID.GCP,
                    'cluster.open-cluster-management.io/cloudconnection': '',
                },
            },
            spec: {
                gcProjectID: 'gc-project-id',
                gcServiceAccountKey: '{"id":"id"}',
                baseDomain: 'base.domain',
                pullSecret: '{"pullSecret":"secret"}',
                sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
                sshPublickey: 'ssh-rsa AAAAB1 fake@email.com',
                anisibleSecretName: 'ansible-tower-secret',
                anisibleCuratorTemplateName: '',
            },
        }

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
        await clickByText(getProviderByKey(ProviderID.GCP).name)

        typeByTestId('gcProjectID', providerConnection.spec!.gcProjectID!)
        typeByTestId('gcServiceAccountKey', providerConnection.spec!.gcServiceAccountKey!)
        typeByTestId('baseDomain', providerConnection.spec!.baseDomain!)
        typeByTestId('pullSecret', providerConnection.spec!.pullSecret!)
        typeByTestId('sshPrivateKey', providerConnection.spec!.sshPrivatekey!)
        typeByTestId('sshPublicKey', providerConnection.spec!.sshPublickey!)
        await clickByText('Next')

        // integration step
        await clickByText('addConnection.ansibleConnection.placeholder')

        await clickByText(ansSecret.metadata.name!)

        await clickByText('Save')

        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.credentials))
    })
})
