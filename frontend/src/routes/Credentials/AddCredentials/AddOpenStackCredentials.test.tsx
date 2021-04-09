/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { multiClusterHubState, namespacesState } from '../../../atoms'
import { nockCreate, nockIgnoreRBAC } from '../../../lib/nock-util'
import { getProviderByKey, ProviderID } from '../../../lib/providers'
import { multiClusterHub } from '../../../lib/test-metadata'
import { clickByText, typeByTestId, waitForNock } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources/namespace'
import {
    packProviderConnection,
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
import AddCredentialPage from './AddCredentials'

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
                baseDomain: 'base.domain',
                pullSecret: '{"pullSecret":"secret"}',
                sshPrivatekey: '-----BEGIN OPENSSH PRIVATE KEY-----\nkey\n-----END OPENSSH PRIVATE KEY-----',
                sshPublickey: 'ssh-rsa AAAAB1 fakeemail@redhat.com',
                openstackCloudsYaml:
                    'clouds:\n  openstack:\n    auth:\n      auth_url: http://1.2.3.4:5000\n      username: admin\n      password: fake\n      project_id: 123456789\n      project_name: admin\n      user_domain_name: Default\n    region_name: regionOne\n    interface: public\n    identity_api_version: 3',
                openstackCloud: 'openstack',
            },
        }

        const createNock = nockCreate(packProviderConnection({ ...openstackProviderConnection }))
        const { container } = render(<TestAddConnectionPage />)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="providerName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="providerName-label"]`)!.click()
        await clickByText(getProviderByKey(ProviderID.OST).name)
        await typeByTestId('connectionName', openstackProviderConnection.metadata.name!)
        await waitFor(() =>
            expect(container.querySelectorAll(`[aria-labelledby^="namespaceName-label"]`)).toHaveLength(1)
        )
        container.querySelector<HTMLButtonElement>(`[aria-labelledby^="namespaceName-label"]`)!.click()
        await clickByText(openstackProviderConnection.metadata.namespace!)
        await typeByTestId('openstackCloudsYaml', openstackProviderConnection.spec!.openstackCloudsYaml!)
        await typeByTestId('openstackCloud', openstackProviderConnection.spec!.openstackCloud!)
        await typeByTestId('baseDomain', openstackProviderConnection.spec!.baseDomain!)
        await typeByTestId('pullSecret', openstackProviderConnection.spec!.pullSecret!)
        await typeByTestId('sshPrivateKey', openstackProviderConnection.spec!.sshPrivatekey!)
        await typeByTestId('sshPublicKey', openstackProviderConnection.spec!.sshPublickey!)
        await clickByText('addConnection.addButton.label')
        await waitForNock(createNock)
        await waitFor(() => expect(location.pathname).toBe(NavigationPath.credentials))
    })
})
