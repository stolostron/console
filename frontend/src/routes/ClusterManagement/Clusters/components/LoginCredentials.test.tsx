import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginCredentials } from './LoginCredentials'
import { ClusterContext }  from '../ClusterDetails/ClusterDetails'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { nockGet } from '../../../../lib/nock-util'

const cluster: Cluster = {
    name: 'test-cluster',
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
    },
    labels: [],
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hiveSecrets: {
        kubeconfig: '',
        kubeadmin: 'test-cluster-kubeadmin',
        installConfig: ''
    },
    isHive: true,
    isManaged: true
}

describe('LoginCredentials', () => {
    test('renders', () => {
        const { getByTestId } = render(
            <ClusterContext.Provider value={{ cluster }}>
                <LoginCredentials />
            </ClusterContext.Provider>
        )
        expect(getByTestId('login-credentials')).toBeInTheDocument()
    })
    test('renders as a hyphen when secret name is not set', () => {
        const { queryByTestId, getByText } = render(
            <ClusterContext.Provider value={{ cluster: undefined }}>
                <LoginCredentials />
            </ClusterContext.Provider>
        )
        expect(queryByTestId('login-credentials')).toBeNull()
        expect(getByText('-')).toBeInTheDocument()
    })
})