import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockClusterList, nockCreate, nockGet, nockReplace } from '../../../lib/nock-util'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { NavigationPath } from '../../../NavigationPath'
import { Project, ProjectApiVersion, ProjectKind } from '../../../resources/project'
import {
    packProviderConnection,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import AddConnectionPage from './AddConnection'
import { FeatureGate } from '../../../resources/feature-gate'

const mockProject: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'test-namespace' },
}

const mockFeatureGate: FeatureGate = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'FeatureGate',
    metadata: {
        name: 'open-cluster-management-discovery',
    },
    spec: {
        featureSet: 'DiscoveryEnabled',
    },
}

const mockProjects: Project[] = [mockProject]

function EmptyPage() {
    return <div></div>
}

let location: Location
function TestAddConnectionPage() {
    return (
        <MemoryRouter initialEntries={[NavigationPath.addConnection]}>
            <Route
                path={NavigationPath.addConnection}
                render={(props: any) => {
                    location = props.location
                    return <AddConnectionPage {...props} />
                }}
            />
            <Route
                path={NavigationPath.providerConnections}
                render={(props: any) => {
                    location = props.location
                    return <EmptyPage />
                }}
            />
        </MemoryRouter>
    )
}

const awsProviderConnection: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'connection',
        namespace: mockProject.metadata.name,
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
        <MemoryRouter
            initialEntries={[
                NavigationPath.editConnection
                    .replace(':namespace', awsProviderConnection.metadata.namespace!)
                    .replace(':name', awsProviderConnection.metadata.name!),
            ]}
        >
            <Route
                path={NavigationPath.editConnection}
                render={(props: any) => {
                    location = props.location
                    return <AddConnectionPage {...props} />
                }}
            />
        </MemoryRouter>
    )
}

beforeEach(() => {
    sessionStorage.clear()
    nockGet(mockFeatureGate, undefined, 200, true)
})

describe('add connection page', () => {
    it('should create aws provider connection', async () => {
        const projectsNock = nockClusterList(mockProject, mockProjects)
        const badRequestNock = nockCreate(packProviderConnection({ ...awsProviderConnection }), mockBadRequestStatus)
        const createNock = nockCreate(packProviderConnection({ ...awsProviderConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
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
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
    })

    it('should create gcp provider connection', async () => {
        const providerConnection: ProviderConnection = {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
            metadata: {
                name: 'connection',
                namespace: mockProject.metadata.name,
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
            },
        }

        const projectsNock = nockClusterList(mockProject, mockProjects)
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        await waitFor(() => expect(getByText(getProviderByKey(ProviderID.GCP).name)).toBeInTheDocument())
        getByText(getProviderByKey(ProviderID.GCP).name).click()
        userEvent.type(getByTestId('connectionName'), providerConnection.metadata.name!)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="namespaceName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(providerConnection.metadata.namespace!)).toBeInTheDocument())
        getByText(providerConnection.metadata.namespace!).click()
        userEvent.type(getByTestId('gcProjectID'), providerConnection.spec!.gcProjectID!)
        userEvent.type(getByTestId('gcServiceAccountKey'), providerConnection.spec!.gcServiceAccountKey!)
        userEvent.type(getByTestId('baseDomain'), providerConnection.spec!.baseDomain!)
        userEvent.type(getByTestId('pullSecret'), providerConnection.spec!.pullSecret!)
        userEvent.type(getByTestId('sshPrivateKey'), providerConnection.spec!.sshPrivatekey!)
        userEvent.type(getByTestId('sshPublicKey'), providerConnection.spec!.sshPublickey!)
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
    })

    it('should create azr provider connection', async () => {
        const providerConnection: ProviderConnection = {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
            metadata: {
                name: 'connection',
                namespace: mockProject.metadata.name,
                labels: {
                    'cluster.open-cluster-management.io/provider': ProviderID.AZR,
                    'cluster.open-cluster-management.io/cloudconnection': '',
                },
            },
            spec: {
                baseDomainResourceGroupName: 'baseDomainResourceGroupName',
                clientId: 'clientId',
                clientsecret: 'clientsecret',
                subscriptionid: 'subscriptionid',
                tenantid: 'tenantid',
                baseDomain: 'base.domain',
                pullSecret: '{"pullSecret":"secret"}',
                sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
                sshPublickey: 'ssh-rsa AAAAB1 fake@email.com',
            },
        }

        const projectsNock = nockClusterList(mockProject, mockProjects)
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        await waitFor(() => expect(getByText(getProviderByKey(ProviderID.AZR).name)).toBeInTheDocument())
        getByText(getProviderByKey(ProviderID.AZR).name).click()
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
        userEvent.type(getByTestId('clientId'), providerConnection.spec!.clientId!)
        userEvent.type(getByTestId('clientsecret'), providerConnection.spec!.clientsecret!)
        userEvent.type(getByTestId('subscriptionid'), providerConnection.spec!.subscriptionid!)
        userEvent.type(getByTestId('tenantid'), providerConnection.spec!.tenantid!)
        userEvent.type(getByTestId('baseDomain'), providerConnection.spec!.baseDomain!)
        userEvent.type(getByTestId('pullSecret'), providerConnection.spec!.pullSecret!)
        userEvent.type(getByTestId('sshPrivateKey'), providerConnection.spec!.sshPrivatekey!)
        userEvent.type(getByTestId('sshPublicKey'), providerConnection.spec!.sshPublickey!)
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
    })

    it('should create bmc provider connection', async () => {
        const providerConnection: ProviderConnection = {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
            metadata: {
                name: 'connection',
                namespace: mockProject.metadata.name,
                labels: {
                    'cluster.open-cluster-management.io/provider': ProviderID.BMC,
                    'cluster.open-cluster-management.io/cloudconnection': '',
                },
            },
            spec: {
                libvirtURI: 'qemu+ssh://libvirtURI',
                sshKnownHosts: 'sshKnownHosts',
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

        const projectsNock = nockClusterList(mockProject, mockProjects)
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
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
        userEvent.type(getByTestId('sshKnownHosts'), providerConnection.spec!.sshKnownHosts!)
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
    })

    it('should create vmw provider connection', async () => {
        const providerConnection: ProviderConnection = {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
            metadata: {
                name: 'connection',
                namespace: mockProject.metadata.name,
                labels: {
                    'cluster.open-cluster-management.io/provider': ProviderID.VMW,
                    'cluster.open-cluster-management.io/cloudconnection': '',
                },
            },
            spec: {
                username: 'username',
                password: 'password',
                vcenter: 'vcenter',
                cacertificate: '-----BEGIN CERTIFICATE-----\ncertdata\n-----END CERTIFICATE-----',
                vmClusterName: 'vmClusterName',
                datacenter: 'datacenter',
                datastore: 'datastore',
                baseDomain: 'base.domain',
                pullSecret: '{"pullSecret":"secret"}',
                sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
                sshPublickey: 'ssh-rsa AAAAB1 fake@email.com',
            },
        }

        const projectsNock = nockClusterList(mockProject, mockProjects)
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        await waitFor(() => expect(getByText(getProviderByKey(ProviderID.VMW).name)).toBeInTheDocument())
        getByText(getProviderByKey(ProviderID.VMW).name).click()
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

        userEvent.type(getByTestId('username'), providerConnection.spec!.username!)
        userEvent.type(getByTestId('password'), providerConnection.spec!.password!)
        userEvent.type(getByTestId('vcenter'), providerConnection.spec!.vcenter!)
        userEvent.type(getByTestId('cacertificate'), providerConnection.spec!.cacertificate!)
        userEvent.type(getByTestId('vmClusterName'), providerConnection.spec!.vmClusterName!)
        userEvent.type(getByTestId('datacenter'), providerConnection.spec!.datacenter!)
        userEvent.type(getByTestId('datastore'), providerConnection.spec!.datastore!)

        userEvent.type(getByTestId('baseDomain'), providerConnection.spec!.baseDomain!)
        userEvent.type(getByTestId('pullSecret'), providerConnection.spec!.pullSecret!)
        userEvent.type(getByTestId('sshPrivateKey'), providerConnection.spec!.sshPrivatekey!)
        userEvent.type(getByTestId('sshPublicKey'), providerConnection.spec!.sshPublickey!)
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
        expect(location.pathname).toBe(NavigationPath.providerConnections)
    })

    it('should create cloud.redhat.com provider connection', async () => {
        const providerConnection: ProviderConnection = {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
            metadata: {
                name: 'connection',
                namespace: mockProject.metadata.name,
                labels: {
                    'cluster.open-cluster-management.io/provider': ProviderID.CRH,
                    'cluster.open-cluster-management.io/cloudconnection': '',
                },
            },
            spec: {
                baseDomain: '',
                pullSecret: '',
                sshPrivatekey: '',
                sshPublickey: '',
                ocmAPIToken: 'test-ocm-api-token',
            },
        }

        const projectsNock = nockClusterList(mockProject, mockProjects)
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        await waitFor(() => expect(getByText(getProviderByKey(ProviderID.CRH).name)).toBeInTheDocument())
        getByText(getProviderByKey(ProviderID.CRH).name).click()
        userEvent.type(getByTestId('connectionName'), providerConnection.metadata.name!)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="namespaceName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(providerConnection.metadata.namespace!)).toBeInTheDocument())
        getByText(providerConnection.metadata.namespace!).click()

        userEvent.type(getByTestId('baseDomain'), providerConnection.spec!.baseDomain!)
        userEvent.type(getByTestId('pullSecret'), providerConnection.spec!.pullSecret!)
        userEvent.type(getByTestId('sshPrivateKey'), providerConnection.spec!.sshPrivatekey!)
        userEvent.type(getByTestId('sshPublicKey'), providerConnection.spec!.sshPublickey!)
        userEvent.type(getByTestId('ocmAPIToken'), providerConnection.spec!.ocmAPIToken!)
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
    })

    it('should show error if get project error', async () => {
        const projectsNock = nockClusterList(mockProject, mockBadRequestStatus)
        const { getByText } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
        await waitFor(() => expect(getByText('Retry')).toBeInTheDocument())

        const projectsNock2 = nockClusterList(mockProject, [])
        getByText('Retry').click()
        await waitFor(() => expect(projectsNock2.isDone()).toBeTruthy())
    })

    it('should show empty page if there are no projects', async () => {
        const projectsNock = nockClusterList(mockProject, [])
        const { getByText, getAllByText } = render(
            <MemoryRouter initialEntries={[NavigationPath.addConnection]}>
                <Route
                    path={NavigationPath.addConnection}
                    component={(props: any) => <AddConnectionPage {...props} />}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getAllByText('addConnection.error.noNamespacesFound')[0]).toBeInTheDocument())
        await waitFor(() => expect(getByText('Retry')).toBeInTheDocument())

        const projectsNock2 = nockClusterList(mockProject, [])
        getByText('Retry').click()
        await waitFor(() => expect(projectsNock2.isDone()).toBeTruthy())
    })
})

describe('edit connection page', () => {
    it('should edit provider connection', async () => {
        const projectsNock = nockClusterList(mockProject, mockProjects)
        const getProviderConnectionNock = nockGet(awsProviderConnection)
        const { getByText, getByTestId } = render(<TestEditConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
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
