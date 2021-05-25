/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { namespacesState } from '../../atoms'
import { nockCreate, nockIgnoreRBAC } from '../../lib/nock-util'
import { clickByTestId, clickByText, selectByText, typeByTestId, waitForNock } from '../../lib/test-util'
import { NavigationPath } from '../../NavigationPath'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../resources/namespace'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
    ProviderConnectionStringData,
} from '../../resources/provider-connection'
import AddCredentialPage2 from './CredentialsForm'

const mockNamespaces: Namespace[] = ['namespace1', 'namespace2', 'namespace3'].map((name) => ({
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name },
}))

function AddCredentialsTest() {
    return (
        <RecoilRoot initializeState={(snapshot) => snapshot.set(namespacesState, mockNamespaces)}>
            <MemoryRouter initialEntries={[NavigationPath.addCredentials]}>
                <Route component={(props: any) => <AddCredentialPage2 {...props} />} />
            </MemoryRouter>
        </RecoilRoot>
    )
}

function createProviderConnection(
    provider: string,
    stringData: ProviderConnectionStringData,
    common = false
): ProviderConnection {
    return {
        apiVersion: ProviderConnectionApiVersion,
        kind: ProviderConnectionKind,
        type: 'Opaque',
        metadata: {
            name: `${provider}-connection`,
            namespace: mockNamespaces[0].metadata.name,
            labels: {
                'cluster.open-cluster-management.io/type': provider,
                'cluster.open-cluster-management.io/credentials': '',
            },
        },
        stringData: common
            ? {
                  ...stringData,
                  ...{
                      baseDomain: 'baseDomain',
                      pullSecret: '{"pull":"secret"}',
                      sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
                      sshPublickey: 'ssh-rsa AAAAB1 fakeemail@redhat.com',
                  },
              }
            : stringData,
    }
}

describe('add credentials page', () => {
    beforeEach(() => nockIgnoreRBAC())

    it('should create aws credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'aws',
            { awsAccessKeyID: 'awsAccessKeyID', awsSecretAccessKeyID: 'awsSecretAccessKeyID' },
            true
        )

        // Credentials type
        await clickByTestId('aws')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
        await clickByText('common:next')

        // AWS credentials
        await typeByTestId('awsAccessKeyID', providerConnection.stringData?.awsAccessKeyID!)
        await typeByTestId('awsSecretAccessKeyID', providerConnection.stringData?.awsSecretAccessKeyID!)
        await clickByText('common:next')

        // Pull secret and SSH
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('sshPrivatekey', providerConnection.stringData?.sshPrivatekey!)
        await typeByTestId('sshPublickey', providerConnection.stringData?.sshPublickey!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create azr credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'azr',
            {
                baseDomainResourceGroupName: 'baseDomainResourceGroupName',
                clientId: 'clientId',
                clientSecret: 'clientSecret',
                tenantId: 'tenantId',
                subscriptionId: 'subscriptionId',
            },
            true
        )

        // Credentials type
        await clickByTestId('azr')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
        await clickByText('common:next')

        // AZR credentials
        await typeByTestId('baseDomainResourceGroupName', providerConnection.stringData?.baseDomainResourceGroupName!)
        await typeByTestId('clientId', providerConnection.stringData?.clientId!)
        await typeByTestId('clientSecret', providerConnection.stringData?.clientSecret!)
        await typeByTestId('tenantId', providerConnection.stringData?.tenantId!)
        await typeByTestId('subscriptionId', providerConnection.stringData?.subscriptionId!)
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('sshPrivatekey', providerConnection.stringData?.sshPrivatekey!)
        await typeByTestId('sshPublickey', providerConnection.stringData?.sshPublickey!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create gcp credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'gcp',
            {
                gcProjectID: 'gcp123',
                gcServiceAccountKey: '{ "json": "key"}',
            },
            true
        )

        // Credentials type
        await clickByTestId('gcp')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
        await clickByText('common:next')

        // GCP credentials
        await typeByTestId('gcProjectID', providerConnection.stringData?.gcProjectID!)
        await typeByTestId('gcServiceAccountKey', providerConnection.stringData?.gcServiceAccountKey!)
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('sshPrivatekey', providerConnection.stringData?.sshPrivatekey!)
        await typeByTestId('sshPublickey', providerConnection.stringData?.sshPublickey!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create vmw credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'vmw',
            {
                vcenter: 'vcenter',
                username: 'username',
                password: 'password',
                cacertificate: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
                vmClusterName: 'vmClusterName',
                datacenter: 'datacenter',
                datastore: 'datastore',
            },
            true
        )

        // Credentials type
        await clickByTestId('vmw')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
        await clickByText('common:next')

        // credentials
        await typeByTestId('vcenter', providerConnection.stringData?.vcenter!)
        await typeByTestId('username', providerConnection.stringData?.username!)
        await typeByTestId('password', providerConnection.stringData?.password!)
        await typeByTestId('cacertificate', providerConnection.stringData?.cacertificate!)
        await typeByTestId('vmClusterName', providerConnection.stringData?.vmClusterName!)
        await typeByTestId('datacenter', providerConnection.stringData?.datacenter!)
        await typeByTestId('datastore', providerConnection.stringData?.datastore!)
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('sshPrivatekey', providerConnection.stringData?.sshPrivatekey!)
        await typeByTestId('sshPublickey', providerConnection.stringData?.sshPublickey!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create ost credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'ost',
            {
                openstackCloudsYaml:
                    'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
                openstackCloud: 'openstack',
            },
            true
        )

        // Credentials type
        await clickByTestId('ost')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
        await clickByText('common:next')

        // ost credentials
        await typeByTestId('openstackCloud', providerConnection.stringData?.openstackCloud!)
        await typeByTestId('openstackCloudsYaml', providerConnection.stringData?.openstackCloudsYaml!)
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('sshPrivatekey', providerConnection.stringData?.sshPrivatekey!)
        await typeByTestId('sshPublickey', providerConnection.stringData?.sshPublickey!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create bmc credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'bmc',
            {
                libvirtURI: 'qemu+ssh://libvirtURI',
                sshKnownHosts: 'sshKnownHosts',
                imageMirror: 'image.mirror:123/abc',
                bootstrapOSImage: 'bootstrapOSImage',
                clusterOSImage: 'clusterOSImage',
                additionalTrustBundle: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
            },
            true
        )

        // Credentials type
        await clickByTestId('bmc')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
        await clickByText('common:next')

        // bmc credentials
        await typeByTestId('libvirtURI', providerConnection.stringData?.libvirtURI!)
        await typeByTestId('sshKnownHosts', providerConnection.stringData?.sshKnownHosts!)
        await clickByText('common:next')

        // bmc disconnected
        await typeByTestId('imageMirror', providerConnection.stringData?.imageMirror!)
        await typeByTestId('bootstrapOSImage', providerConnection.stringData?.bootstrapOSImage!)
        await typeByTestId('clusterOSImage', providerConnection.stringData?.clusterOSImage!)
        await typeByTestId('additionalTrustBundle', providerConnection.stringData?.additionalTrustBundle!)
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('sshPrivatekey', providerConnection.stringData?.sshPrivatekey!)
        await typeByTestId('sshPublickey', providerConnection.stringData?.sshPublickey!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create ans credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'ans',
            {
                host: 'ansibleHost',
                token: 'ansibleToken',
            },
            false
        )

        // Credentials type
        await clickByTestId('ans')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await clickByText('common:next')

        // ans credentials
        await typeByTestId('ansibleHost', providerConnection.stringData?.host!)
        await typeByTestId('ansibleToken', providerConnection.stringData?.token!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create rhocm credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection('rhocm', {
            ocmAPIToken: 'ocmAPIToken',
        })

        // Credentials type
        await clickByTestId('rhocm')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await clickByText('common:next')

        // rhocm credentials
        await typeByTestId('ocmAPIToken', providerConnection.stringData?.ocmAPIToken!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })
})
