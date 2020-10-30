import React from 'react'
import { render } from '@testing-library/react'
import { ClusterSettingsTable } from './ClusterSettings'
import { ClusterManagementAddOn} from '../../../../lib/ClusterManagementAddOn'
import { ManagedClusterAddOn} from '../../../../lib/ManagedClusterAddOn'

test('clusters details page', () => {
    const clusterManagementAddOns: ClusterManagementAddOn[] = [
        {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ClusterManagementAddOn',
            metadata: {
                uid: '',
                name: 'application-manager',
                labels: {'test':'123'},
            },
            spec: {
                addOnConfiguration: {
                    crName: '',
                    crdName: 'klusterletaddonconfig',
                },
                addOnMeta: {
                    displayName: "Application Manager",
                    description: '',
                },
            },
        },
    ]
    const managedClusterAddOns: ManagedClusterAddOn[] = [
        {
            apiVersion: 'addon.open-cluster-management.io/v1alpha1',
            kind: 'ManagedClusterAddOn',
            metadata: {
                uid: '',
                name: 'application-manager',
                namespace: 'test-cluster'
            },
            spec: {
            },
            status: {
                conditions: [{
                    lastTransitionTime: '',
                    message: 'progressing',
                    reason: 'progressing',
                    status: 'true',
                    type: 'progressing',
                }],
                addOnMeta: {
                    displayName: 'application-manager',
                    description: 'application-manager description',
                },
                addOnConfiguration: {
                    crdName: 'klusterletaddonconfig',
                    crName: 'test-cluster',
                }
            }
        },
    ]
    const { getByText } = render(<ClusterSettingsTable clusterManagementAddOns={clusterManagementAddOns} managedClusterAddOns={managedClusterAddOns} refresh={()=>{}}/>)
    expect(getByText(managedClusterAddOns[0].metadata.name!)).toBeInTheDocument()
})
