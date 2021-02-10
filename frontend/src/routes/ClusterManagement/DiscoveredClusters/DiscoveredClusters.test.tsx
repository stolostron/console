import { render } from '@testing-library/react'
import React from 'react'
import { nockList } from '../../../lib/nock-util'
import { waitForNock, waitForText } from '../../../lib/test-util'
import {
    DiscoveredCluster,
    DiscoveredClusterApiVersion,
    DiscoveredClusterKind,
} from '../../../resources/discovered-cluster'
import DiscoveredClustersPage from './DiscoveredClusters'

const mockDiscoveredClusters: DiscoveredCluster[] = [
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: { name: 'test-cluster-01' },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: 'https://api.test-cluster-01.dev01.red-chesterfield.com:6443',
            cloudProvider: 'aws',
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
                support_level: 'None',
            },
        },
    },
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: { name: 'test-cluster-02', namespace: 'discovered-cluster-namespace' },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            apiUrl: 'https://api.test-cluster-02.dev01.red-chesterfield.com:6443',
            cloudProvider: 'gcp',
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
                creator_id: 'abc123',
            },
        },
    },
]

test('DiscoveredClustersPage', async () => {
    const listNock = nockList(
        { apiVersion: DiscoveredClusterApiVersion, kind: DiscoveredClusterKind },
        mockDiscoveredClusters
    )
    render(<DiscoveredClustersPage />)
    await waitForNock(listNock)

    await waitForText('discovery.edit')
    await waitForText('discovery.disable')
    await waitForText(mockDiscoveredClusters[0].spec.providerConnections![0].name!)

    // Ensure data for each discoveredcluster appears in table
    mockDiscoveredClusters.forEach(async (dc) => {
        await waitForText(dc.metadata.name!)
        await waitForText('OpenShift ' + dc.spec.openshiftVersion)
        if (dc.spec.cloudProvider === 'aws') {
            await waitForText('Amazon Web Services')
        } else {
            await waitForText(dc.spec.cloudProvider)
        }
    })
})

test('No Discovered Clusters', async () => {
    const listNock = nockList({ apiVersion: DiscoveredClusterApiVersion, kind: DiscoveredClusterKind }, [])
    render(<DiscoveredClustersPage />)
    await waitForNock(listNock)
    await waitForText('discovery.emptyStateHeader')
})
