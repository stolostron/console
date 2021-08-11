/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus } from '@open-cluster-management/resources'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBadRequestStatus, nockGet } from '../../../../../lib/nock-util'
import { waitForNock, waitForNocks, waitForNotText } from '../../../../../lib/test-util'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { LoginCredentials } from './LoginCredentials'

const mockCluster: Cluster = {
    name: 'test-cluster',
    displayName: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.ready,
    distribution: {
        k8sVersion: '1.19',
        ocp: {
            version: '4.6',
            availableUpdates: [],
            desiredVersion: '4.6',
            upgradeFailed: false,
        },
        displayVersion: '4.6',
        isManagedOpenShift: false,
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
            kubeadmin: 'test-cluster-0-fk6c9-admin-password',
            installConfig: '',
        },
    },
    isHive: true,
    isManaged: true,
    isCurator: false,
    owner: {},
}

const mockKubeadminSecret = {
    kind: 'Secret',
    apiVersion: 'v1',
    metadata: {
        name: 'test-cluster-0-fk6c9-admin-password',
        namespace: 'test-cluster',
        selfLink: '/api/v1/namespaces/test-cluster/secrets/test-cluster-0-fk6c9-admin-password',
        uid: 'e5b03674-b778-45a9-a804-26ca396ce96d',
        resourceVersion: '54087401',
        labels: {
            'hive.openshift.io/cluster-provision-name': 'test-cluster-0-fk6c9',
            'hive.openshift.io/secret-type': 'kubeadmincreds',
        },
        ownerReferences: [
            {
                apiVersion: 'hive.openshift.io/v1',
                kind: 'ClusterProvision',
                name: 'test-cluster-0-fk6c9',
                uid: 'cc081438-122e-4f5a-b4e8-5dbf699c0270',
                blockOwnerDeletion: true,
            },
        ],
    },
    data: { password: 'QXhNQXktVWZNR0gtUFdWeEwtRFo5M3c=', username: 'a3ViZWFkbWlu' },
    type: 'Opaque',
}

describe('LoginCredentials', () => {
    test('renders', async () => {
        const nock = nockGet(mockKubeadminSecret)
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <LoginCredentials canGetSecret={true} />
            </ClusterContext.Provider>
        )
        await waitFor(() => screen.getByText('credentials.show'))

        expect(screen.getByTestId('login-credentials')).toBeInTheDocument()
        userEvent.click(screen.getByTestId('login-credentials'))

        await waitFor(() => screen.getByText('credentials.loading'))
        await waitForNotText('credentials.loading')

        await waitForNock(nock)
        await waitFor(() => screen.getByText('credentials.hide'))

        expect(screen.getByTestId('login-credentials')).toBeInTheDocument()
        userEvent.click(screen.getByTestId('login-credentials'))

        await waitFor(() => screen.getByText('credentials.show'))
    })
    test('renders disabled toggle', async () => {
        nockGet(mockKubeadminSecret)
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <LoginCredentials canGetSecret={false} />
            </ClusterContext.Provider>
        )
        expect(screen.getByTestId('login-credentials')).toBeInTheDocument()
        await waitFor(() => screen.getByText('credentials.show'))
        userEvent.click(screen.getByTestId('login-credentials'))
        expect(screen.getByText('credentials.show')).toBeInTheDocument()
    })
    test('renders as a hyphen when secret name is not set', () => {
        render(
            <ClusterContext.Provider value={{ cluster: undefined, addons: undefined }}>
                <LoginCredentials canGetSecret={true} />
            </ClusterContext.Provider>
        )
        expect(screen.queryByTestId('login-credentials')).toBeNull()
        expect(screen.getByText('-')).toBeInTheDocument()
    })
    test('renders in a failed state', async () => {
        const nock = nockGet(mockKubeadminSecret, mockBadRequestStatus)
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <LoginCredentials canGetSecret={true} />
            </ClusterContext.Provider>
        )
        expect(screen.getByTestId('login-credentials')).toBeInTheDocument()
        await waitFor(() => screen.getByText('credentials.show'))
        userEvent.click(screen.getByTestId('login-credentials'))
        await waitFor(() => screen.getByText('credentials.loading'))
        await waitForNocks([nock])
        await waitFor(() => screen.getByText('credentials.failed'))
    })
})
