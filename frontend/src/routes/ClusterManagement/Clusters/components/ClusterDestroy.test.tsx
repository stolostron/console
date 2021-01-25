import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { ClusterDestroy } from './ClusterDestroy'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { SelfSubjectAccessReview } from '../../../../resources/self-subject-access-review'
import { nockCreate } from '../../../../lib/nock-util'

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
    hiveSecrets: undefined,
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
    hiveSecrets: undefined,
    isHive: false,
    isManaged: true,
}

function nockCreateClusterRbac() {
    return nockCreate(
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes: {
                    resource: 'managedclusters',
                    verb: 'create',
                    group: 'cluster.open-cluster-management.io',
                },
            },
        } as SelfSubjectAccessReview,
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes: {
                    resource: 'managedclusters',
                    verb: 'create',
                    group: 'cluster.open-cluster-management.io',
                },
            },
            status: {
                allowed: true,
            },
        } as SelfSubjectAccessReview
    )
}

describe('ClusterDestroy', () => {
    test('renders the destroying state', async () => {
        const rbacScope = nockCreateClusterRbac()
        render(<ClusterDestroy isLoading={true} cluster={mockDestroyCluster} />)
        await waitFor(() => expect(rbacScope.isDone()).toBeTruthy())
        expect(screen.getByText('destroying.inprogress')).toBeInTheDocument()
        expect(screen.getByText('view.logs')).toBeInTheDocument()
    })
    test('renders the detaching state', async () => {
        const rbacScope = nockCreateClusterRbac()
        render(<ClusterDestroy isLoading={true} cluster={mockDetachCluster} />)
        await waitFor(() => expect(rbacScope.isDone()).toBeTruthy())
        expect(screen.getByText('detaching.inprogress')).toBeInTheDocument()
        expect(screen.queryByText('view.logs')).toBeNull()
    })
    test('renders success state', async () => {
        const rbacScope = nockCreateClusterRbac()
        render(<ClusterDestroy isLoading={false} cluster={mockDetachCluster} />)
        await waitFor(() => expect(rbacScope.isDone()).toBeTruthy())
        expect(screen.getByText('detaching.success')).toBeInTheDocument()
    })
})
