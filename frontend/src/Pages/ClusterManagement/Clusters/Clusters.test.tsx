import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { ClustersPage } from './Clusters'
import { DiscoveredCluster, discoveredClusterMethods } from '../../../lib/DiscoveredCluster'
import {  nockList } from '../../../lib/nock-util'
import userEvent from '@testing-library/user-event'


import { ManagedCluster,  managedClusterMethods } from '../../../lib/ManagedCluster'
import { BrowserRouter as Router } from 'react-router-dom'

const mockDiscoveredClusters: DiscoveredCluster[] = [
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: {
             name: 'test-cluster-01', 
             namespace: 'discovered-cluster-namespace',
             ownerReferences: [{
                apiVersion: 'discovery.open-cluster-management.io/v1',
                kind: 'discoveryconfig',
                name: 'discoveryconfig',
                uid: 'abcd-efgh-ijkl-mnop',
             }],
        },
        info: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: "https://api.test-cluster-01.dev01.red-chesterfield.com:6443",
            cloudProvider: "aws",
            console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            healthState: 'healthy',
            managed: false,
            name: 'test-cluster-01',
            openshiftVersion: '4.5.5',
            product: 'ocp',
            region: 'us-east-1',
            state: 'ready',
            status: 'online',
            support_level: 'eval',
        },
    },
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: { name: 'test-cluster-02', namespace: 'discovered-cluster-namespace' },
        info: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: "https://api.test-cluster-02.dev01.red-chesterfield.com:6443",
            cloudProvider: "gcp",
            console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            healthState: 'healthy',
            managed: false,
            name: 'test-cluster-02',
            openshiftVersion: '4.6.1',
            product: 'ocp',
            region: 'us-east-1',
            state: 'ready',
            status: 'online',
            support_level: 'eval',
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
    expect(getByText('Create cluster')).toBeInTheDocument()
    expect(getByText('Import cluster')).toBeInTheDocument()
    
    // Expect ManagedCluster appears
    await waitFor(() => expect(getByText(mockManagedClusters[0].metadata.name!)).toBeInTheDocument())
    
    // Click on Discovered ToggleGroupItem
    userEvent.click(getByText('Discovered'))

    // Wait for discovery related resources to appear
    await waitFor(() => expect(getByText("Edit cluster discovery")).toBeInTheDocument())
    await waitFor(() => expect(getByText("Disable cluster discovery")).toBeInTheDocument())
    await waitFor(() => expect(getByText(mockDiscoveredClusters[0].metadata.ownerReferences![0].name!)).toBeInTheDocument())

    // Ensure data for each discoveredcluster appears in table
    mockDiscoveredClusters.forEach((dc) => {
        expect(getByText(dc.metadata.name!)).toBeInTheDocument()
        expect(getByText("OpenShift " + dc.info.openshiftVersion)).toBeInTheDocument()
        if (dc.info.cloudProvider === "aws") {
            expect(getByText("Amazon Web Services")).toBeInTheDocument()
        } else {
            expect(getByText(dc.info.cloudProvider)).toBeInTheDocument()
        }
    })

})