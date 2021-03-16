/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { render, screen } from '@testing-library/react'
import { ClusterDestroy } from './ClusterDestroy'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { nockIgnoreRBAC } from '../../../../lib/nock-util'

const mockDestroyCluster: Cluster = {
    name: 'test-cluster',
    namespace: 'test-cluster',
    provider: undefined,
    status: ClusterStatus.destroying,
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
            installConfig: '',
            kubeadmin: '',
            kubeconfig: '',
        },
    },
    isHive: false,
    isManaged: true,
}

const mockDetachCluster: Cluster = {
    name: 'test-cluster',
    namespace: 'test-cluster',
    provider: undefined,
    status: ClusterStatus.detaching,
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
            installConfig: '',
            kubeadmin: '',
            kubeconfig: '',
        },
    },
    isHive: false,
    isManaged: true,
}

describe('ClusterDestroy', () => {
    test('renders the destroying state', async () => {
        render(
            <RecoilRoot>
                <ClusterDestroy isLoading={true} cluster={mockDestroyCluster} />
            </RecoilRoot>
        )
        expect(screen.getByText('destroying.inprogress')).toBeInTheDocument()
        expect(screen.getByText('view.logs')).toBeInTheDocument()
    })
    test('renders the detaching state', async () => {
        render(
            <RecoilRoot>
                <ClusterDestroy isLoading={true} cluster={mockDetachCluster} />
            </RecoilRoot>
        )
        expect(screen.getByText('detaching.inprogress')).toBeInTheDocument()
        expect(screen.queryByText('view.logs')).toBeNull()
    })
    test('renders success state', async () => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot>
                <MemoryRouter>
                    <ClusterDestroy isLoading={false} cluster={mockDetachCluster} />
                </MemoryRouter>
            </RecoilRoot>
        )
        expect(screen.getByText('detaching.success')).toBeInTheDocument()
    })
})
