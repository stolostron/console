import React from 'react'
import { render } from '@testing-library/react'
import { ClustersTable } from './Clusters'
import { DiscoveredCluster } from '../../../lib/DiscoveredCluster'
import { ManagedCluster, ManagedClusters, managedClusters } from '../../../lib/ManagedCluster'

import { BrowserRouter as Router } from 'react-router-dom'

test('clusters page', () => {
    const mcList: ManagedCluster[] = [
        {
            apiVersion: 'cluster.open-cluster-management.io/v1',
            kind: 'ManagedCluster',
            metadata: {
                uid: '',
                name: 'Cluster 0001',
                labels: { 'test': '123' },
            },
            spec: {
                leaseDurationSeconds: 1000,
                hubAcceptsClient: true,
            },
        },
    ]
    const dcList: DiscoveredCluster[] = [
        {
            apiVersion: '',
            kind: 'DiscoveredCluster',
            metadata: {
                uid: '',
                name: 'Cluster 0001',
                labels: { 'test': '123' },
            },
            info: {
                activity_timestamp: '2020-07-30T19:09:43Z',
                apiUrl: "https://api.test-cluster.dev01.red-chesterfield.com:6443",
                cloudProvider: "aws",
                console: 'https://console-openshift-console.apps.test-cluster.dev01.red-chesterfield.com',
                creation_timestamp: '2020-07-30T19:09:43Z',
                healthState: 'healthy',
                managed: false,
                name: '472b9e96-fb75-43bf-8b3e-a52d750e2468',
                openshiftVersion: '4.5.5',
                product: 'ocp',
                region: 'us-east-1',
                state: 'ready',
                status: 'online',
                support_level: 'eval',
            },
        },
    ]
    const { getByText } = render(<Router><ClustersTable managedClusters={mcList} discoveredClusters={dcList} deleteCluster={managedClusters.delete} refresh={ManagedClusters().refresh}/></Router>)
    expect(getByText('Create cluster')).toBeInTheDocument()
    expect(getByText('Import cluster')).toBeInTheDocument()
    expect(getByText(mcList[0].metadata.name!)).toBeInTheDocument()
    expect(getByText(mcList[0].metadata.labels![0])).toBeInTheDocument()
})