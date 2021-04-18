/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { multiClusterHubState, namespacesState, secretsState } from '../../../atoms'
import { nockCreate, nockIgnoreRBAC } from '../../../lib/nock-util'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { multiClusterHub } from '../../../lib/test-metadata'
import { clickByText, typeByPlaceholderText, typeByTestId, waitForText } from '../../../lib/test-util'
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
        name: 'test-ansible-secret',
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
                anisibleSecretName: 'test-ansible-secret',
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
        await clickByText(getProviderByKey(ProviderID.BMC).name)
        await typeByPlaceholderText('addConnection.libvirtURI.placeholder', providerConnection.spec!.libvirtURI!)
        await typeByTestId('sshKnownHosts', providerConnection.spec!.sshKnownHosts![0])
        await typeByTestId('imageMirror', providerConnection.spec!.imageMirror!)
        await typeByTestId('bootstrapOSImage', providerConnection.spec!.bootstrapOSImage!)
        await typeByTestId('clusterOSImage', providerConnection.spec!.clusterOSImage!)
        await typeByTestId('additionalTrustBundle', providerConnection.spec!.additionalTrustBundle!)
        await typeByTestId('baseDomain', providerConnection.spec!.baseDomain!)
        await typeByTestId('pullSecret', providerConnection.spec!.pullSecret!)
        await typeByTestId('sshPrivateKey', providerConnection.spec!.sshPrivatekey!)
        await typeByTestId('sshPublicKey', providerConnection.spec!.sshPublickey!)
        await clickByText('Next')

        // integration step
        await clickByText('addConnection.ansibleConnection.placeholder')
        await clickByText(ansSecret.metadata.name!)
        await clickByText('Save')
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.credentials))
    })
})
