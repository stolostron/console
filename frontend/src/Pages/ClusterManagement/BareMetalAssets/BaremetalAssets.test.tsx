import { render } from '@testing-library/react'
import React from 'react'
import { BareMetalAsset, bareMetalAssets } from '../../../lib/BareMetalAsset'
import { resourceMethods } from '../../../lib/Resource'
import { BareMetalAssetsTable } from './BaremetalAssets'

test('bare metal assets page', () => {
    const bareMetalAssetList: BareMetalAsset[] = [
        {
            apiVersion: 'inventory.open-cluster-management.io/v1alpha1',
            kind: 'BareMetalAsset',
            metadata: {
                uid: '',
                name: 'Cluster 0001',
                namespace: 'default',
            },
            spec: {
                bmc: {
                    address: '',
                    credentialsName: '',
                },
                bootMac: ''
            },
        },
    ]
    const { getByText } = render(<BareMetalAssetsTable bareMetalAssets={bareMetalAssetList} refresh={() => null} deleteBareMetalAsset={bareMetalAssets.delete} />)
    // expect(getByText('Create cluster')).toBeInTheDocument()
    // expect(getByText('Import cluster')).toBeInTheDocument()
    expect(getByText(bareMetalAssetList[0].metadata.name!)).toBeInTheDocument()
    expect(getByText(bareMetalAssetList[0].metadata.namespace as string)).toBeInTheDocument()
})
