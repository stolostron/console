import React from 'react'
import { render } from '@testing-library/react'
import { ClusterDetailsTable } from './ClusterDetails-test'
import { ClusterManagementAddOn } from '../../../sdk'

test('clusters details page', () => {
    const clusterManagementAddons: ClusterManagementAddOn[] = [
        {
            apiVersion: '',
            kind: '',
            metadata: {
                creationTimestamp: '',
                uid: '',
                name: 'application-manager',
                labels: ['test=123'],
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
            displayAddonStatus: 'Disabled',
        },
    ]
    const { getByText } = render(<ClusterDetailsTable clusterManagementAddOns={clusterManagementAddons} />)
    expect(getByText(clusterManagementAddons[0].metadata.name)).toBeInTheDocument()
})
