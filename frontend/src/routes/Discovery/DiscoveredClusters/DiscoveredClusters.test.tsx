/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { waitForText, waitForNotText } from '../../../lib/test-util'
import { DiscoveredCluster } from '../../../resources/discovered-cluster'
import DiscoveredClustersPage from './DiscoveredClusters'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { featureGatesState, discoveredClusterState, discoveryConfigState, secretsState } from '../../../atoms'
import { mockDiscoveryFeatureGate, mockCRHCredential, mockDiscoveryConfig } from '../../../lib/test-metadata'

const mockDiscoveredClusters: DiscoveredCluster[] = [
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: { name: 'test-cluster-01', namespace: 'alpha' },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            cloudProvider: 'aws',
            console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            name: 'test-cluster-01',
            openshiftVersion: '4.5.5',
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
            status: 'Active',
        },
    },
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: { name: 'test-cluster-02', namespace: 'discovered-cluster-namespace' },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            cloudProvider: 'gcp',
            console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            name: 'test-cluster-02',
            openshiftVersion: '4.6.1',
            status: 'Stale',
        },
    },
    {
        apiVersion: 'discovery.open-cluster-management.io/v1',
        kind: 'DiscoveredCluster',
        metadata: { name: 'test-cluster-03', namespace: 'discovered-cluster-namespace' },
        spec: {
            activity_timestamp: '2020-07-30T19:09:43Z',
            cloudProvider: 'openstack',
            isManagedCluster: true,
            console: 'https://console-openshift-console.apps.test-cluster-01.dev01.red-chesterfield.com',
            creation_timestamp: '2020-07-30T19:09:43Z',
            name: 'test-cluster-02',
            openshiftVersion: '4.6.1',
            status: 'Stale',
        },
    },
]

test('DiscoveredClusters Table', async () => {
    render(
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(featureGatesState, [mockDiscoveryFeatureGate])
                snapshot.set(discoveredClusterState, mockDiscoveredClusters)
                snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
                snapshot.set(secretsState, [mockCRHCredential])
            }}
        >
            <MemoryRouter>
                <DiscoveredClustersPage />
            </MemoryRouter>
        </RecoilRoot>
    )

    await waitForText(mockDiscoveredClusters[0].metadata.namespace!)

    // Ensure data for each discoveredcluster appears in table
    mockDiscoveredClusters.forEach(async (dc) => {
        // Ensures managed clusters dont show up in table
        if (dc.spec.isManagedCluster) {
            await waitForNotText(dc.metadata.name!)
        }
        await waitForText(dc.metadata.name!)
        await waitForText('OpenShift ' + dc.spec.openshiftVersion)
    })
})

test('Discovery featuregate enabled, but no provider connections or discoveryconfig (Empty State 1)', async () => {
    render(
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(featureGatesState, [mockDiscoveryFeatureGate])
                snapshot.set(discoveredClusterState, [])
                snapshot.set(discoveryConfigState, [])
                snapshot.set(secretsState, [])
            }}
        >
            <MemoryRouter>
                <DiscoveredClustersPage />
            </MemoryRouter>
        </RecoilRoot>
    )
    await waitForText('emptystate.defaultState.title')
    await waitForText('discovery:emptystate.defaultState.msg')
    await waitForText('emptystate.addCredential')
})

test('Discovery featuregate enabled, CRH credentials exist, but no discoveryconfig (Empty State 2)', async () => {
    render(
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(featureGatesState, [mockDiscoveryFeatureGate])
                snapshot.set(discoveredClusterState, [])
                snapshot.set(discoveryConfigState, [])
                snapshot.set(secretsState, [mockCRHCredential])
            }}
        >
            <MemoryRouter>
                <DiscoveredClustersPage />
            </MemoryRouter>
        </RecoilRoot>
    )
    await waitForText('emptystate.credentials.title')
    await waitForText('discovery:emptystate.credentials.msg')
    await waitForText('emptystate.enableClusterDiscovery')
})

test('Discovery featuregate enabled, CRH and discoveryconfig exist, but no discoveredclusters (Empty State 3)', async () => {
    render(
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(featureGatesState, [mockDiscoveryFeatureGate])
                snapshot.set(discoveredClusterState, [])
                snapshot.set(discoveryConfigState, [mockDiscoveryConfig])
                snapshot.set(secretsState, [mockCRHCredential])
            }}
        >
            <MemoryRouter>
                <DiscoveredClustersPage />
            </MemoryRouter>
        </RecoilRoot>
    )
    await waitForText('emptystate.discoveryEnabled.title')
    await waitForText('emptystate.discoveryEnabled.msg')
    await waitForText('emptystate.viewDocumentation')
})
