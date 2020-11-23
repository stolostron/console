import React from 'react'
import { render, waitFor } from '@testing-library/react'
//import { mockBadRequestStatus, nockList } from '../../../../../lib/nock-util'
import { ClusterSettingsTable } from './ClusterSettings'
import { ClusterManagementAddOn, ClusterManagementAddOnKind,  ClusterManagementAddOnApiVersion} from '../../../../../resources/cluster-management-add-on'
import { ManagedClusterAddOn, ManagedClusterAddOnApiVersion, ManagedClusterAddOnKind } from '../../../../../resources/managed-cluster-add-on'
import { MemoryRouter } from 'react-router-dom'

const mockclusterManagementAddOnApp: ClusterManagementAddOn = {
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
    metadata: { name: 'application-manager', namespace: 'provider-connection-namespace' },
    spec: {
                addOnConfiguration: {
                    crName: '',
                    crdName: 'klusterletaddonconfig',
                },
                addOnMeta: {
                    displayName: 'Application Manager',
                    description: '',
                },
            },
}

const mockclusterManagementAddOns: ClusterManagementAddOn[] = [
    // {
    //     apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    //     kind: 'ClusterManagementAddOn',
    //     metadata: {
    //         uid: '',
    //         name: 'application-manager',
    //         labels: { test: '123' },
    //     },
    //     spec: {
    //         addOnConfiguration: {
    //             crName: '',
    //             crdName: 'klusterletaddonconfig',
    //         },
    //         addOnMeta: {
    //             displayName: 'Application Manager',
    //             description: '',
    //         },
    //     },
    // },
    mockclusterManagementAddOnApp,
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            uid: '',
            name: 'work-manager',
            labels: { test: '123' },
        },
        spec: {
            addOnConfiguration: {
                crName: '',
                crdName: 'klusterletaddonconfig',
            },
            addOnMeta: {
                displayName: 'Work Manager',
                description: '',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            uid: '',
            name: 'cert-policy-controller',
            labels: { test: '123' },
        },
        spec: {
            addOnConfiguration: {
                crName: '',
                crdName: 'klusterletaddonconfig',
            },
            addOnMeta: {
                displayName: 'Cert Policy Controller',
                description: '',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            uid: '',
            name: 'iam-policy-controller',
            labels: { test: '123' },
        },
        spec: {
            addOnConfiguration: {
                crName: '',
                crdName: 'klusterletaddonconfig',
            },
            addOnMeta: {
                displayName: 'IAM Policy Controller',
                description: '',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            uid: '',
            name: 'policy-controller',
            labels: { test: '123' },
        },
        spec: {
            addOnConfiguration: {
                crName: '',
                crdName: 'klusterletaddonconfig',
            },
            addOnMeta: {
                displayName: 'Policy Controller',
                description: '',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            uid: '',
            name: 'search-collector',
            labels: { test: '123' },
        },
        spec: {
            addOnConfiguration: {
                crName: '',
                crdName: 'klusterletaddonconfig',
            },
            addOnMeta: {
                displayName: 'Search Collector',
                description: '',
            },
        },
    },
]

const mockmanagedClusterAddOns: ManagedClusterAddOn[] = [
    {
        apiVersion: ManagedClusterAddOnApiVersion,
        kind: ManagedClusterAddOnKind,
        metadata: {
            uid: '',
            name: 'application-manager',
            namespace: 'test-cluster',
        },
        spec: {},
        status: {
            conditions: [
                {
                    lastTransitionTime: '',
                    message: 'Progressing',
                    reason: 'Progressing',
                    status: 'True',
                    type: 'Progressing',
                },
            ],
            addOnMeta: {
                displayName: 'application-manager',
                description: 'application-manager description',
            },
            addOnConfiguration: {
                crdName: 'klusterletaddonconfig',
                crName: 'test-cluster',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ManagedClusterAddOn',
        metadata: {
            uid: '',
            name: 'work-manager',
            namespace: 'test-cluster',
        },
        spec: {},
        status: {
            conditions: [
                {
                    lastTransitionTime: '',
                    message: 'Degraded',
                    reason: 'Degraded',
                    status: 'True',
                    type: 'Degraded',
                },
            ],
            addOnMeta: {
                displayName: 'work-manager',
                description: 'work-manager description',
            },
            addOnConfiguration: {
                crdName: 'klusterletaddonconfig',
                crName: 'test-cluster',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ManagedClusterAddOn',
        metadata: {
            uid: '',
            name: 'cert-policy-controller',
            namespace: 'test-cluster',
        },
        spec: {},
        status: {
            conditions: [
                {
                    lastTransitionTime: '',
                    message: 'Available',
                    reason: 'Available',
                    status: 'True',
                    type: 'Available',
                },
            ],
            addOnMeta: {
                displayName: 'cert-policy-controller',
                description: 'cert-policy-controller description',
            },
            addOnConfiguration: {
                crdName: 'klusterletaddonconfig',
                crName: 'test-cluster',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ManagedClusterAddOn',
        metadata: {
            uid: '',
            name: 'policy-controller',
            namespace: 'test-cluster',
        },
        spec: {},
        status: {
            conditions: [
                {
                    lastTransitionTime: '',
                    message: 'Progressing',
                    reason: 'Progressing',
                    status: 'False',
                    type: 'Progressing',
                },
            ],
            addOnMeta: {
                displayName: 'policy-controller',
                description: 'policy-controller description',
            },
            addOnConfiguration: {
                crdName: 'klusterletaddonconfig',
                crName: 'test-cluster',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ManagedClusterAddOn',
        metadata: {
            uid: '',
            name: 'search-collector',
            namespace: 'test-cluster',
        },
        spec: {},
        status: {
            conditions: [
                {
                    lastTransitionTime: '',
                    message: 'Unknown',
                    reason: 'Unknown',
                    status: 'True',
                    type: 'Unknown',
                },
            ],
            addOnMeta: {
                displayName: 'search-collector',
                description: 'search-collector description',
            },
            addOnConfiguration: {
                crdName: 'klusterletaddonconfig',
                crName: 'test-cluster',
            },
        },
    },
]

describe('clusters details page', () => {
    test('should render the table with cluster details', async () => {
        // nockList({ apiVersion: ClusterManagementAddOnApiVersion, kind: ClusterManagementAddOnKind }, mockclusterManagementAddOns)
        // nockList({ apiVersion: ManagedClusterAddOnApiVersion, kind: ManagedClusterAddOnKind }, mockmanagedClusterAddOns)
        const { getByText } = render(
            <MemoryRouter>
                <ClusterSettingsTable
                clusterManagementAddOns={mockclusterManagementAddOns}
                managedClusterAddOns={mockmanagedClusterAddOns}
                refresh={() => {}}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(getByText(mockmanagedClusterAddOns[0].metadata.name!)).toBeInTheDocument())
    })

    // test('should show error if the connections fail to query', async () => {
    //     nockList(mockclusterManagementAddOnApp, mockBadRequestStatus)
    //     const { getByText } = render(
    //         <MemoryRouter>
    //             <ClusterSettingsTable 
    //              clusterManagementAddOns={mockclusterManagementAddOns}
    //              refresh={() => {}}
    //             />
    //         </MemoryRouter>
    //     )
    //     await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
    // })

})