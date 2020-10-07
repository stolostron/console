import { render } from '@testing-library/react'
import React from 'react'
import { BareMetalAsset } from '../../../sdk'
import { BareMetalAssetsTable } from './BaremetalAssets'

test('bare metal assets page', () => {
    const bareMetalAssets: BareMetalAsset[] = [
        {
            apiVersion: '',
            kind: '',
            metadata: {
                creationTimestamp: '',
                uid: '',
                name: 'Cluster 0001',
                namespace: 'default',
                labels: ['test=123'],
            },
            spec: {
                bmc: {
                    address: '',
                    credentialsName: '',
                },
            },
        },
    ]
    const { getByText } = render(<BareMetalAssetsTable bareMetalAssets={bareMetalAssets} />)
    // expect(getByText('Create cluster')).toBeInTheDocument()
    // expect(getByText('Import cluster')).toBeInTheDocument()
    expect(getByText(bareMetalAssets[0].metadata.name)).toBeInTheDocument()
    expect(getByText(bareMetalAssets[0].metadata.namespace as string)).toBeInTheDocument()
})
