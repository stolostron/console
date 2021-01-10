import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { nockClusterList, nockCreate } from '../../../lib/nock-util'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { FeatureGate } from '../../../resources/feature-gate'
import { Project, ProjectApiVersion, ProjectKind } from '../../../resources/project'
import {
    packProviderConnection,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import AddConnectionPage from './AddConnection'
import { AppContext } from '../../../components/AppContext'
import { NavigationPath } from '../../../NavigationPath'
import { SelfSubjectAccessReview } from '../../../resources/self-subject-access-review'

const mockProject: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'test-namespace' },
}

const mockSelfSubjectAccessRequestAdmin: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        },
    },
}

const mockSelfSubjectAccessResponseAdmin: SelfSubjectAccessReview = {
    apiVersion: 'authorization.k8s.io/v1',
    kind: 'SelfSubjectAccessReview',
    metadata: {},
    spec: {
        resourceAttributes: {
            name: '*',
            namespace: '*',
            resource: '*',
            verb: '*',
        },
    },
    status: {
        allowed: true,
    },
}

const mockFeatureGate: FeatureGate = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'FeatureGate',
    metadata: { name: 'open-cluster-management-discovery' },
    spec: { featureSet: 'DiscoveryEnabled' },
}

const mockProjects: Project[] = [mockProject]

let location: Location

function TestAddConnectionPage() {
    return (
        <AppContext.Provider
            value={{
                featureGates: { 'open-cluster-management-discovery': mockFeatureGate },
                clusterManagementAddons: [],
            }}
        >
            <MemoryRouter>
                <Route
                    render={(props: any) => {
                        location = props.location
                        return <AddConnectionPage {...props} />
                    }}
                />
            </MemoryRouter>
        </AppContext.Provider>
    )
}

describe('add connection page', () => {
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
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        const projectsNock = nockClusterList(mockProject, mockProjects)
        const rbacNock = nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseAdmin)
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
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
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.providerConnections))
    })
})
