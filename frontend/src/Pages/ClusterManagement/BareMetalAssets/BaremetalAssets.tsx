import { AcmEmptyPage, AcmLoadingPage, AcmPageCard, AcmTable } from '@open-cluster-management/ui-components'
import { Page, ToggleGroup } from '@patternfly/react-core'
import React, { useState } from 'react'
import { ErrorPage } from '../../../components/ErrorPage'
import { client } from '../../../lib/apollo-client'
import { BareMetalAsset, useBareMetalAssetsQuery } from '../../../sdk'
import { ClusterManagementPageHeader } from '../ClusterManagement'

export function BareMetalAssetsPage() {
    return (
        <Page>
            <ClusterManagementPageHeader />
            <BareMetalAssets />
        </Page>
    )
}

export function BareMetalAssets() {
    const { data, loading, error } = useBareMetalAssetsQuery({ client })
    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data?.bareMetalAssets || data.bareMetalAssets.length === 0) {
        return <AcmEmptyPage title="No bare metal assets found" message="No bare metal assets found" />
    }
    return <BareMetalAssetsTable bareMetalAssets={data.bareMetalAssets as BareMetalAsset[]}></BareMetalAssetsTable>
}

export function BareMetalAssetsTable(props: { bareMetalAssets: BareMetalAsset[] }) {
    return (
        <AcmPageCard>
            <AcmTable<BareMetalAsset>
                plural="bare metal assets"
                items={props.bareMetalAssets}
                columns={[
                    {
                        header: 'Name',
                        cell: 'metadata.name',
                        sort: 'metadata.name',
                        search: 'metadata.name',
                    },
                    {
                        header: 'namespace',
                        cell: 'metadata.namespace',
                        search: 'metadata.namespace',
                    },
                ]}
                keyFn={(item) => item.metadata.uid}
                tableActions={[]}
                rowActions={[]}
                bulkActions={[]}
            />
        </AcmPageCard>
    )
}
