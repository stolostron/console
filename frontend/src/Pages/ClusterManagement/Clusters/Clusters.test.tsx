import React from 'react'
import { render } from '@testing-library/react'
import { ClustersTable } from './Clusters'
import { ManagedCluster } from '../../../sdk'
import { BrowserRouter as Router } from 'react-router-dom'

test('clusters page', () => {
    const managedClusters: ManagedCluster[] = [
        {
            apiVersion: '',
            kind: '',
            metadata: {
                creationTimestamp: '',
                uid: '',
                name: 'Cluster 0001',
                labels: ['test=123'],
            },
            displayStatus: 'Ready',
            spec: {
                leaseDurationSeconds: 1000,
                hubAcceptsClient: 'true',
            },
        },
    ]
    const { getByText } = render(<Router><ClustersTable managedClusters={managedClusters} /></Router>)
    expect(getByText('Create cluster')).toBeInTheDocument()
    expect(getByText('Import cluster')).toBeInTheDocument()
    expect(getByText(managedClusters[0].metadata.name)).toBeInTheDocument()
    // expect(getByText(managedClusters[0].displayStatus)).toBeInTheDocument()
    // expect(getByText(managedClusters[0].metadata.labels[0])).toBeInTheDocument()
})
