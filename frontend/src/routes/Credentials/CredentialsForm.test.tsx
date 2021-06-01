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
                      'ssh-privatekey': '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
                      'ssh-publickey': 'ssh-rsa AAAAB1 fakeemail@redhat.com',
                  },
              }
            : stringData,
    }
}

describe('add credentials page', () => {
    beforeEach(() => nockIgnoreRBAC())

    it('should create aws (Amazon Web Services) credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'aws',
            { aws_access_key_id: 'aws_access_key_id', aws_secret_access_key: 'aws_secret_access_key' },
            true
        )

        // Credentials type
        await clickByTestId('aws')
        await typeByTestId('credentialsName', providerConnection.metadata.name!)
        await selectByText('credentialsForm.namespaceName.placeholder', providerConnection.metadata.namespace!)
        await typeByTestId('baseDomain', providerConnection.stringData?.baseDomain!)
        await clickByText('common:next')

        // AWS credentials
        await typeByTestId('aws_access_key_id', providerConnection.stringData?.aws_access_key_id!)
        await typeByTestId('aws_secret_access_key', providerConnection.stringData?.aws_secret_access_key!)
        await clickByText('common:next')

        // Pull secret and SSH
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
        await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create azr (Azure) credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'azr',
            {
                baseDomainResourceGroupName: 'baseDomainResourceGroupName',
                'osServicePrincipal.json': JSON.stringify({
                    clientId: 'clientId',
                    clientSecret: 'clientSecret',
                    tenantId: 'tenantId',
                    subscriptionId: 'subscriptionId',
                }),
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
        await typeByTestId('clientId', 'clientId')
        await typeByTestId('clientSecret', 'clientSecret')
        await typeByTestId('tenantId', 'tenantId')
        await typeByTestId('subscriptionId', 'subscriptionId')
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
        await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create gcp (Google Cloud Platform) credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'gcp',
            {
                projectID: 'gcp123',
                'osServiceAccount.json': '{ "json": "key"}',
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
        await typeByTestId('projectID', providerConnection.stringData?.projectID!)
        await typeByTestId('osServiceAccount.json', providerConnection.stringData?.['osServiceAccount.json']!)
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
        await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create vmw (VMware) credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'vmw',
            {
                vCenter: 'vCenter',
                username: 'username',
                password: 'password',
                cacertificate: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
                cluster: 'cluster',
                datacenter: 'datacenter',
                defaultDatastore: 'defaultDatastore',
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
        await typeByTestId('vCenter', providerConnection.stringData?.vCenter!)
        await typeByTestId('username', providerConnection.stringData?.username!)
        await typeByTestId('password', providerConnection.stringData?.password!)
        await typeByTestId('cacertificate', providerConnection.stringData?.cacertificate!)
        await typeByTestId('cluster', providerConnection.stringData?.cluster!)
        await typeByTestId('datacenter', providerConnection.stringData?.datacenter!)
        await typeByTestId('defaultDatastore', providerConnection.stringData?.defaultDatastore!)
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
        await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create ost (OpenStack) credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'ost',
            {
                'clouds.yaml':
                    'clouds:\n  openstack:\n    auth:\n      auth_url: "https://acme.com"\n      username: "fakeuser"\n      password: "fakepwd"',
                cloud: 'openstack',
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
        await typeByTestId('cloud', providerConnection.stringData?.cloud!)
        await typeByTestId('clouds.yaml', providerConnection.stringData?.['clouds.yaml']!)
        await clickByText('common:next')

        // Pull secret
        await typeByTestId('pullSecret', providerConnection.stringData?.pullSecret!)
        await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
        await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create bmc (Bare Metal) credentials', async () => {
        render(<AddCredentialsTest />)

        const providerConnection = createProviderConnection(
            'bmc',
            {
                libvirtURI: 'qemu+ssh://libvirtURI',
                sshKnownHosts: 'sshKnownHosts',
                imageMirror: 'image.mirror:123/abc',
                bootstrapOSImage:
                    'https://mirror.openshift.com/rhcos-46.82.202011260640-0-qemu.qcow2.gz?sha256=123456789012345678901234567890123456789012345678901234567890abcd',
                clusterOSImage:
                    'https://mirror.openshift.com/rhcos-46.82.202011260640-0-openstack.qcow2.gz?sha256=123456789012345678901234567890123456789012345678901234567890abcd',
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
        await typeByTestId('ssh-privatekey', providerConnection.stringData?.['ssh-privatekey']!)
        await typeByTestId('ssh-publickey', providerConnection.stringData?.['ssh-publickey']!)
        await clickByText('common:next')

        // Add Credentials
        const createNock = nockCreate({ ...providerConnection })
        await clickByText('credentialsForm.submitButton.add')
        await waitForNock(createNock)
    })

    it('should create ans (Ansible) credentials', async () => {
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
