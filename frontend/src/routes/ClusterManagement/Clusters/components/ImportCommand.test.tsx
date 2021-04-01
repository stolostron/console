/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { mockBadRequestStatus, nockGet } from '../../../../lib/nock-util'
import { Secret, SecretApiVersion, SecretKind } from '../../../../resources/secret'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ImportCommandContainer } from './ImportCommand'

const mockSecretResponse: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'test-cluster-import',
        namespace: 'test-cluster',
    },
    data: { 'crds.yaml': 'crd yaml', 'import.yaml': 'import yaml' },
    type: 'Opaque',
}

const mockCluster: Cluster = {
    name: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.pendingimport,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: '1.19',
    },
    labels: undefined,
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            kubeconfig: '',
            kubeadmin: '',
            installConfig: '',
        },
    },
    isHive: false,
    isManaged: true,
}

describe('ImportCommandContainer', () => {
    const Component = () => {
        const [importCommand, setImportCommand] = useState<string | undefined>()
        return (
            <ClusterContext.Provider
                value={{ cluster: mockCluster, addons: undefined, importCommand, setImportCommand }}
            >
                <ImportCommandContainer />
            </ClusterContext.Provider>
        )
    }

    test('renders import command', async () => {
        const getSecretNock = nockGet(mockSecretResponse)
        render(<Component />)

        await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument())
        await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())
        await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull())
        // await waitFor(() => expect(screen.getByTestId('pending-import-notification')).toBeInTheDocument())
        await waitFor(() => expect(screen.getByTestId('import-command')).toBeInTheDocument())
    })

    test('renders error state', async () => {
        const getSecretNock = nockGet(mockSecretResponse, mockBadRequestStatus)
        render(<Component />)

        await waitFor(() => expect(screen.getByRole('progressbar')).toBeInTheDocument())
        await waitFor(() => expect(getSecretNock.isDone()).toBeTruthy())
        await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull(), { timeout: 10500 })
        await waitFor(() => expect(screen.getByText(mockBadRequestStatus.message)).toBeInTheDocument())
    })
})
