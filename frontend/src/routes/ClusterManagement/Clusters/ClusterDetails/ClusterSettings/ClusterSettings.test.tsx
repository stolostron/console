import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { mockBadRequestStatus, nockClusterList , nockNamespacedList} from '../../../../../lib/nock-util'
import { ClustersSettingsPageContent } from './ClusterSettings'
import { ClusterManagementAddOn, ClusterManagementAddOnKind,  ClusterManagementAddOnApiVersion} from '../../../../../resources/cluster-management-add-on'
import { ManagedClusterAddOn, ManagedClusterAddOnApiVersion, ManagedClusterAddOnKind } from '../../../../../resources/managed-cluster-add-on'
import { MemoryRouter } from 'react-router-dom'

const mockclusterManagementAddOnApp: ClusterManagementAddOn = {
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
    metadata: { name: 'application-manager'},
    spec: {},
}
const mockclusterManagementAddOnWork: ClusterManagementAddOn = {
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
    metadata: {
        name: 'work-manager',
    },
    spec: {},
}

const mockclusterManagementAddOnCert: ClusterManagementAddOn = {
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
    metadata: {
        name: 'cert-policy-controller',
    },
    spec: {},
}

const mockclusterManagementAddOnIAM: ClusterManagementAddOn = {
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
    metadata: {
        name: 'iam-policy-controller',
    },
    spec: {},
}

const mockclusterManagementAddOnPolicy: ClusterManagementAddOn = {
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
    metadata: {
        name: 'policy-controller',
    },
    spec: {},
}

const mockclusterManagementAddOnSearch: ClusterManagementAddOn = {
    apiVersion: ClusterManagementAddOnApiVersion,
    kind: ClusterManagementAddOnKind,
    metadata: {
        name: 'search-collector',
    },
    spec: {},
}
const mockclusterManagementAddOns: ClusterManagementAddOn[] = [
    mockclusterManagementAddOnApp,
    mockclusterManagementAddOnWork,
    mockclusterManagementAddOnCert,
    mockclusterManagementAddOnIAM,
    mockclusterManagementAddOnPolicy,
    mockclusterManagementAddOnSearch,
]

const mockmanagedClusterAddOn: ManagedClusterAddOn = {
        apiVersion: ManagedClusterAddOnApiVersion,
        kind: ManagedClusterAddOnKind,
        metadata: {
            name: 'application-manager',
            namespace: 'test-cluster',
        },
        spec: {}
}

const mockManagedClusterAddOnApp: ManagedClusterAddOn = {
    apiVersion: ManagedClusterAddOnApiVersion,
    kind: ManagedClusterAddOnKind,
    metadata: {
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
}

const mockManagedClusterAddOnWork: ManagedClusterAddOn = {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
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
}

const mockManagedClusterAddOnCert: ManagedClusterAddOn = {
    apiVersion: 'addon.open-cluster-management.io/v1alpha1',
    kind: 'ManagedClusterAddOn',
    metadata: {
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
}

const mockManagedClusterAddOnPolicy: ManagedClusterAddOn = {
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
}

const mockManagedClusterAddOnSearch: ManagedClusterAddOn = {
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
}

const mockmanagedClusterAddOns: ManagedClusterAddOn[] = [
    mockManagedClusterAddOnApp,
    mockManagedClusterAddOnWork,
    mockManagedClusterAddOnCert,
    mockManagedClusterAddOnPolicy,
    mockManagedClusterAddOnSearch,
]

describe('clusters details page', () => {
    test('should render the table with cluster details', async () => {
        nockClusterList(mockclusterManagementAddOnApp, mockclusterManagementAddOns)
        nockNamespacedList(mockmanagedClusterAddOn, mockmanagedClusterAddOns)
        const { getByText } = render(
            <MemoryRouter>
                <ClustersSettingsPageContent
                  name={mockmanagedClusterAddOn.metadata.name!}
                  namespace={mockmanagedClusterAddOn.metadata.namespace!}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(getByText(mockmanagedClusterAddOns[0].metadata.name!)).toBeInTheDocument())
    })

    test('should show error if the managedclusteraddons fail to query', async () => {
        nockClusterList(mockclusterManagementAddOnApp, mockclusterManagementAddOns)
        nockNamespacedList(mockmanagedClusterAddOn, mockBadRequestStatus)
        const { getByText } = render(
            <MemoryRouter>
                <ClustersSettingsPageContent
                  name={mockmanagedClusterAddOn.metadata.name!}
                  namespace={mockmanagedClusterAddOn.metadata.namespace!}
                />
            </MemoryRouter>
        )
        await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
    })

    // test('should show error if the clustermanagementadddon fail to query', async () => {
    //     nockClusterList(mockclusterManagementAddOnApp, mockBadRequestStatus)
    //     nockNamespacedList(mockmanagedClusterAddOn, mockmanagedClusterAddOns)
    //     const { getByText } = render(
    //         <MemoryRouter>
    //             <ClustersSettingsPageContent
    //               name={mockmanagedClusterAddOn.metadata.name!}
    //               namespace={mockmanagedClusterAddOn.metadata.namespace!}
    //             />
    //         </MemoryRouter>
    //     )
    //     await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
    // })

})