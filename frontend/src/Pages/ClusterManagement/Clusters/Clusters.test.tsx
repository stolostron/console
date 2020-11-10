import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ClustersPage } from './Clusters'
import { DiscoveredCluster, discoveredClusterMethods } from '../../../library/resources/discovered-cluster'
import { ManagedCluster, managedClusterMethods } from '../../../library/resources/managed-cluster'
import {  nockList } from '../../../lib/nock-util'
import userEvent from '@testing-library/user-event'


import { BrowserRouter as Router } from 'react-router-dom'

const mockDiscoveredClusters: DiscoveredCluster[] = [
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: {
             name: 'test-cluster-01', 
        },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: "https://api.test-cluster-01.dev01.red-chesterfield.com:6443",
            cloudProvider: "aws",
            console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            healthState: 'healthy',
            name: 'test-cluster-01',
            openshiftVersion: '4.5.5',
            product: 'ocp',
            providerConnections: [
                {
                    apiVersion: 'v1',
                    kind: 'Secret',
                    name: 'ocm-api-token',
                    namespace: 'open-cluster-management',
                    resourceVersion: '2673462626',
                    uid: '8e103e5d-0267-4872-b185-1240e413d7b4',
                },
            ],
            region: 'us-east-1',
            state: 'ready',
            subscription: {
                creator_id: 'abc123',
                managed: false,
                status: 'Active',
                support_level: 'None'
            }
        },
    },
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: { name: 'test-cluster-02', namespace: 'discovered-cluster-namespace' },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: "https://api.test-cluster-02.dev01.red-chesterfield.com:6443",
            cloudProvider: "gcp",
            console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            healthState: 'healthy',
            name: 'test-cluster-02',
            openshiftVersion: '4.6.1',
            product: 'ocp',
            region: 'us-east-1',
            state: 'ready',
            subscription: {
                status: 'Stale',
                managed: true,
                support_level: 'eval',
                creator_id: 'abc123'
            }
        },
    },
]

const mockManagedClusters: ManagedCluster[] = [
    {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: { name: 'managed-cluster-name', namespace: 'managed-cluster-namespace' },
        spec: {
            leaseDurationSeconds: 1000,
            hubAcceptsClient: true,
        },
    },
]

test('Clusters Page', async () => {
    // Serve Managed and Discovered Clusters
    nockList(managedClusterMethods, mockManagedClusters) 
    nockList(discoveredClusterMethods, mockDiscoveredClusters)

    // Render ClustersPage
    const { getByText } = render(
        <Router>
            <ClustersPage />
        </Router>
    )

    // Ensure Headers appear
    expect(getByText("page.header.cluster-management")).toBeInTheDocument()
    expect(getByText("cluster:clusters")).toBeInTheDocument()
    expect(getByText("connection:connections")).toBeInTheDocument()
    expect(getByText("bma:bmas")).toBeInTheDocument()
    expect(getByText('managed.createCluster')).toBeInTheDocument()
    expect(getByText('managed.importCluster')).toBeInTheDocument()
    
    // Expect ManagedCluster appears
    await waitFor(() => expect(getByText(mockManagedClusters[0].metadata.name!)).toBeInTheDocument())
    
    // Click on Discovered ToggleGroupItem
    userEvent.click(getByText('discovered'))

    // Wait for discovery related resources to appear
    await waitFor(() => expect(getByText("discovery.edit")).toBeInTheDocument())
    await waitFor(() => expect(getByText("discovery.disable")).toBeInTheDocument())
    await waitFor(() => expect(getByText(mockDiscoveredClusters[0].spec.providerConnections![0].name!)).toBeInTheDocument())

    // Ensure data for each discoveredcluster appears in table
    mockDiscoveredClusters.forEach((dc) => {
        expect(getByText(dc.metadata.name!)).toBeInTheDocument()
        expect(getByText("OpenShift " + dc.spec.openshiftVersion)).toBeInTheDocument()
        if (dc.spec.cloudProvider === "aws") {
            expect(getByText("Amazon Web Services")).toBeInTheDocument()
        } else {
            expect(getByText(dc.spec.cloudProvider)).toBeInTheDocument()
        }
    })
})

test('No Discovered Clusters', async() => {
    nockList(managedClusterMethods, mockManagedClusters) 
    nockList(discoveredClusterMethods, [] as DiscoveredCluster[])

    // Render ClustersPage
    const { getByText } = render(
        <Router>
            <ClustersPage />
        </Router>
    )

    await waitFor(() => expect(getByText(mockManagedClusters[0].metadata.name!)).toBeInTheDocument())
    
    // Click on Discovered ToggleGroupItem
    userEvent.click(getByText('discovered'))

    await waitFor(() => expect(getByText("discovery.edit")).toBeInTheDocument())
    await waitFor(() => expect(getByText("discovery.disable")).toBeInTheDocument())

    await waitFor(() => expect(getByText("discovery.emptyStateHeader")).toBeInTheDocument())
    await waitFor(() => expect(getByText("discovery.emptyStateMsg")).toBeInTheDocument())
    await waitFor(() => expect(getByText("discovery.enablediscoverybtn")).toBeInTheDocument())
})
