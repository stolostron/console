import React from 'react'
import { render, screen } from '@testing-library/react'
import { HiveNotification } from './HiveNotification'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'

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

describe('HiveNotification', () => {
    const Component = () => {
        return (
            <ClusterContext.Provider
                value={{ cluster: mockCluster, addons: undefined }}
            >
                <HiveNotification />
            </ClusterContext.Provider>
        )
    }
    test('renders null for exempt cluster status', () => {
        render(<Component />)
        expect(screen.queryByTestId('view-logs')).toBeNull()
    })
    test('renders the danger notification for failed provision status', () => {
        mockCluster.status = ClusterStatus.failed
        render(<Component />)
        expect(screen.getByTestId('hive-notification-failed')).toBeInTheDocument()
        expect(screen.getByText('provision.notification.failed')).toBeInTheDocument()
    })
    test('renders the info notification variant for creating status', () => {
        mockCluster.status = ClusterStatus.creating
        render(<Component />)
        expect(screen.getByTestId('hive-notification-creating')).toBeInTheDocument()
        expect(screen.getByText('provision.notification.creating')).toBeInTheDocument()
    })
    test('renders the info notification variant for destroying status', () => {
        mockCluster.status = ClusterStatus.destroying
        render(<Component />)
        expect(screen.getByTestId('hive-notification-destroying')).toBeInTheDocument()
        expect(screen.getByText('provision.notification.destroying')).toBeInTheDocument()
    })
})
