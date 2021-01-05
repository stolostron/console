import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HiveNotification } from './HiveNotification'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { nockNamespacedList } from '../../../../lib/nock-util'
import { ClusterProvisionApiVersion, ClusterProvisionKind } from '../../../../resources/cluster-provision'
import { PodApiVersion, PodKind } from '../../../../resources/pod'

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
    hiveSecrets: undefined,
    isHive: false,
    isManaged: true,
}

const mockClusterProvisionList = {
    apiVersion: 'hive.openshift.io/v1',
    items: [
        {
            apiVersion: 'hive.openshift.io/v1',
            kind: 'ClusterProvision',
            metadata: {
                creationTimestamp: '2021-01-04T18:23:30Z',
                labels: {
                    cloud: 'GCP',
                    'hive.openshift.io/cluster-deployment-name': 'test-cluster',
                    'hive.openshift.io/cluster-platform': 'gcp',
                    'hive.openshift.io/cluster-region': 'us-east1',
                    region: 'us-east1',
                    vendor: 'OpenShift',
                },
                name: 'test-cluster-0-hmd44',
                namespace: 'test-cluster',
            },
            spec: {
                attempt: 0,
                clusterDeploymentRef: { name: 'test-cluster' },
                installLog:
                    'level=info msg="Credentials loaded from environment variable \\"GOOGLE_CREDENTIALS\\", file \\"/.gcp/osServiceAccount.json\\""\nlevel=fatal msg="failed to fetch Master Machines: failed to load asset \\"Install Config\\": platform.gcp.project: Invalid value: \\"gc-acm-dev-fake\\": invalid project ID"\n',
            },
            status: {
                conditions: [
                    {
                        lastProbeTime: '2021-01-04T18:23:30Z',
                        lastTransitionTime: '2021-01-04T18:23:30Z',
                        message: 'Install job has been created',
                        reason: 'JobCreated',
                        status: 'True',
                        type: 'ClusterProvisionJobCreated',
                    },
                    {
                        lastProbeTime: '2021-01-04T18:23:37Z',
                        lastTransitionTime: '2021-01-04T18:23:37Z',
                        message: 'Invalid GCP project ID',
                        reason: 'GCPInvalidProjectID',
                        status: 'True',
                        type: 'ClusterProvisionFailed',
                    },
                ],
            },
        },
    ],
    kind: 'ClusterProvisionList',
    metadata: {
        selfLink: '/apis/hive.openshift.io/v1/namespaces/test-cluster/clusterprovisions',
    },
}

const mockPodList = {
    kind: 'PodList',
    apiVersion: 'v1',
    metadata: {
        selfLink: '/api/v1/namespaces/test-cluster/pods',
        resourceVersion: '100373656',
    },
    items: [
        {
            metadata: {
                name: 'test-cluster-pod',
                namespace: 'test-cluster',
            },
        },
    ],
}

describe('HiveNotification', () => {
    window.open = jest.fn()
    const Component = () => {
        return (
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <HiveNotification />
            </ClusterContext.Provider>
        )
    }
    test('renders null for exempt cluster status', async () => {
        const clusterProvisionScope = nockNamespacedList(
            {
                apiVersion: ClusterProvisionApiVersion,
                kind: ClusterProvisionKind,
                metadata: { namespace: 'test-cluster' },
            },
            mockClusterProvisionList
        )
        render(<Component />)
        await waitFor(() => expect(clusterProvisionScope.isDone()).toBeTruthy())
        await act(async () => {
            expect(screen.queryByTestId('view-logs')).toBeNull()
            await new Promise((resolve) => setTimeout(resolve, 100))
        })
    })
    test('renders the danger notification for failed provision status', async () => {
        mockCluster.status = ClusterStatus.failed
        const clusterProvisionScope = nockNamespacedList(
            {
                apiVersion: ClusterProvisionApiVersion,
                kind: ClusterProvisionKind,
                metadata: { namespace: 'test-cluster' },
            },
            mockClusterProvisionList
        )
        const podScope = nockNamespacedList({
            apiVersion: PodApiVersion,
            kind: PodKind,
            metadata: { namespace: 'test-cluster' }
        }, mockPodList, ['hive.openshift.io/cluster-deployment-name=test-cluster'])
        render(<Component />)
        await waitFor(() => expect(clusterProvisionScope.isDone()).toBeTruthy())
        await act(async () => {
            expect(screen.getByTestId('hive-notification-failed')).toBeInTheDocument()
            expect(screen.getByText('provision.notification.failed')).toBeInTheDocument()
            await waitFor(() => expect(screen.getByText('Invalid GCP project ID')).toBeInTheDocument())
            expect(screen.getByTestId('view-logs')).toBeInTheDocument()
            userEvent.click(screen.getByTestId('view-logs'))
            await waitFor(() => expect(podScope.isDone()).toBeTruthy())
            await new Promise((resolve) => setTimeout(resolve, 100))
            expect(window.open).toHaveBeenCalledWith('/k8s/ns/test-cluster/pods/test-cluster-pod/logs?container=hive')
            await new Promise((resolve) => setTimeout(resolve, 100))
        })
    })
    test('renders the info notification variant for creating status', async () => {
        mockCluster.status = ClusterStatus.creating
        const clusterProvisionScope = nockNamespacedList(
            {
                apiVersion: ClusterProvisionApiVersion,
                kind: ClusterProvisionKind,
                metadata: { namespace: 'test-cluster' },
            },
            mockClusterProvisionList
        )
        const podScope = nockNamespacedList({
            apiVersion: PodApiVersion,
            kind: PodKind,
            metadata: { namespace: 'test-cluster' }
        }, mockPodList, ['hive.openshift.io/cluster-deployment-name=test-cluster', 'hive.openshift.io/job-type=provision'])
        render(<Component />)
        await waitFor(() => expect(clusterProvisionScope.isDone()).toBeTruthy())
        await act(async () => {
            expect(screen.getByTestId('hive-notification-creating')).toBeInTheDocument()
            expect(screen.getByText('provision.notification.creating')).toBeInTheDocument()
            expect(screen.getByTestId('view-logs')).toBeInTheDocument()
            userEvent.click(screen.getByTestId('view-logs'))
            await waitFor(() => expect(podScope.isDone()).toBeTruthy())
            await new Promise((resolve) => setTimeout(resolve, 100))
            expect(window.open).toHaveBeenCalledWith('/k8s/ns/test-cluster/pods/test-cluster-pod/logs?container=hive')
            await new Promise((resolve) => setTimeout(resolve, 100))
        })
    })
    test('renders the info notification variant for destroying status', async () => {
        mockCluster.status = ClusterStatus.destroying
        const clusterProvisionScope = nockNamespacedList(
            {
                apiVersion: ClusterProvisionApiVersion,
                kind: ClusterProvisionKind,
                metadata: { namespace: 'test-cluster' },
            },
            mockClusterProvisionList
        )
        const podScope = nockNamespacedList({
            apiVersion: PodApiVersion,
            kind: PodKind,
            metadata: { namespace: 'test-cluster' }
        }, mockPodList, ['hive.openshift.io/cluster-deployment-name=test-cluster', 'job-name=test-cluster-uninstall'])
        render(<Component />)
        await waitFor(() => expect(clusterProvisionScope.isDone()).toBeTruthy())
        await act(async () => {
            expect(screen.getByTestId('hive-notification-destroying')).toBeInTheDocument()
            expect(screen.getByText('provision.notification.destroying')).toBeInTheDocument()
            userEvent.click(screen.getByTestId('view-logs'))
            await waitFor(() => expect(podScope.isDone()).toBeTruthy())
            await new Promise((resolve) => setTimeout(resolve, 100))
            expect(window.open).toHaveBeenCalledWith('/k8s/ns/test-cluster/pods/test-cluster-pod/logs?container=hive')
            await new Promise((resolve) => setTimeout(resolve, 100))
        })
    })
})
