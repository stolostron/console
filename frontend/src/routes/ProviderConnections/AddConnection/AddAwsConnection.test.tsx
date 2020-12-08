import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockClusterList, nockCreate, nockGet } from '../../../lib/nock-util'
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

const mockProject: Project = {
    apiVersion: ProjectApiVersion,
    kind: ProjectKind,
    metadata: { name: 'test-namespace' },
}

const mockFeatureGate: FeatureGate = {
    apiVersion: 'config.openshift.io/v1',
    kind: 'FeatureGate',
    metadata: { name: 'open-cluster-management-discovery' },
    spec: { featureSet: 'DiscoveryEnabled' },
}

const mockProjects: Project[] = [mockProject]

function TestAddConnectionPage() {
    return (
        <MemoryRouter>
            <Route
                render={(props: any) => {
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
})
