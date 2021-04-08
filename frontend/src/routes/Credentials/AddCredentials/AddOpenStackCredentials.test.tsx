/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { mockBadRequestStatus, nockIgnoreRBAC, nockCreate } from '../../../lib/nock-util'
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
import { namespacesState, multiClusterHubState } from '../../../atoms'
import { waitForText } from '../../../lib/test-util'
import { multiClusterHub } from '../../../lib/test-metadata'

const mockNamespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name: 'test-namespace' },
}

let location: Location

function TestAddConnectionPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(namespacesState, [mockNamespace])
                snapshot.set(multiClusterHubState, [multiClusterHub])
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

    //openstackCloudsYaml: 'clouds:\n\topenstack:\n\t\tauth:\n\t\t\tauth_url: http://localhost:5000\n\t\t\tusername: "admin"\n\t\t\tpassword: fake\n\t\t\tproject_id: 123456789',
    //openstackCloudsYaml: 'clouds:\n  openstack:\n    auth:\n      auth_url: http://1.2.3.4:5000\n      username: \"admin\"\n      password: fake\n      project_id: 123456789\n      project_name: \"admin\"\n      user_domain_name: \"Default\"\n    region_name: \"regionOne\"\n    interface: \"public\"\n    identity_api_version: 3"',

describe('add connection page', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
    })
    it('should create openstack provider connection', async () => {
        const openstackProviderConnection: ProviderConnection = {
            apiVersion: ProviderConnectionApiVersion,
            kind: ProviderConnectionKind,
            metadata: {
                name: 'connection',
                namespace: mockNamespace.metadata.name,
                labels: {
                    'cluster.open-cluster-management.io/provider': ProviderID.OST,
                    'cluster.open-cluster-management.io/cloudconnection': '',
                },
            },
            spec: {
                openstackCloudsYaml: 'clouds: openstack:   auth:',
                openstackCloud: 'openstack',
                baseDomain: 'base.domain',
                pullSecret: '{"pullSecret":"secret"}',
                sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
                sshPublickey: 'ssh-rsa AAAAB1 fakeemail@redhat.com',
            },
        }

        const badRequestNock = nockCreate(packProviderConnection({ ...openstackProviderConnection }), mockBadRequestStatus)
        const createNock = nockCreate(packProviderConnection({ ...openstackProviderConnection }))
        const { getByText, getByTestId, container } = render(<TestAddConnectionPage />)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        await waitFor(() => expect(getByText(getProviderByKey(ProviderID.OST).name)).toBeInTheDocument())
        getByText(getProviderByKey(ProviderID.OST).name).click()
        userEvent.type(getByTestId('connectionName'), openstackProviderConnection.metadata.name!)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="namespaceName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await waitFor(() => expect(getByText(openstackProviderConnection.metadata.namespace!)).toBeInTheDocument())
        getByText(openstackProviderConnection.metadata.namespace!).click()
        userEvent.type(getByTestId('openstackCloudsYaml'), openstackProviderConnection.spec!.openstackCloudsYaml!)
        userEvent.type(getByTestId('openstackCloud'), openstackProviderConnection.spec!.openstackCloud!)
        userEvent.type(getByTestId('baseDomain'), openstackProviderConnection.spec!.baseDomain!)
        userEvent.type(getByTestId('pullSecret'), openstackProviderConnection.spec!.pullSecret!)
        userEvent.type(getByTestId('sshPrivateKey'), openstackProviderConnection.spec!.sshPrivatekey!)
        userEvent.type(getByTestId('sshPublicKey'), openstackProviderConnection.spec!.sshPublickey!)
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(badRequestNock.isDone()).toBeTruthy())
        await waitForText(mockBadRequestStatus.message, true)
        await waitFor(() => expect(getByText('addConnection.addButton.label')).toBeInTheDocument())
        getByText('addConnection.addButton.label').click()
        await waitFor(() => expect(createNock.isDone()).toBeTruthy())
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.credentials))
    })
})
