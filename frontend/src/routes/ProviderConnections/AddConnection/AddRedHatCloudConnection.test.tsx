import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { nockClusterList, nockCreate, nockGet } from '../../../lib/nock-util'
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
})
