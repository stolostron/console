import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { nockClusterList, nockCreate, nockGet } from '../../../lib/nock-util'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { NavigationPath } from '../../../NavigationPath'
import { FeatureGate } from '../../../resources/feature-gate'
import { Project, ProjectApiVersion, ProjectKind } from '../../../resources/project'
import {
    packProviderConnection,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import { SelfSubjectAccessReview } from '../../../resources/self-subject-access-review'
import AddConnectionPage from './AddConnection'

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

beforeEach(() => {
    sessionStorage.clear()
    nockGet(mockFeatureGate, undefined, 200, true)
})

describe('add connection page', () => {
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
        const rbacNock = nockCreate(mockSelfSubjectAccessRequestAdmin, mockSelfSubjectAccessResponseAdmin)
        const createNock = nockCreate(packProviderConnection({ ...providerConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() => expect(projectsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
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
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.providerConnections))
    })
})
