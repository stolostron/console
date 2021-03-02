/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { nockGet, nockReplace } from '../../../lib/nock-util'
import { ProviderID } from '../../../lib/providers'
import { NavigationPath } from '../../../NavigationPath'
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

describe('edit connection page', () => {
    it('should edit provider connection', async () => {
        const getProviderConnectionNock = nockGet(awsProviderConnection)
        const { getByText, getByTestId } = render(<TestEditConnectionPage />)
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
