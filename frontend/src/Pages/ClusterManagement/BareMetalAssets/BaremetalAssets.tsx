import { AcmEmptyPage, AcmLoadingPage, AcmPageCard, AcmTable } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect } from 'react'
import { ErrorPage } from '../../../components/ErrorPage'
import { client } from '../../../lib/apollo-client'
//import { BareMetalAsset, useBareMetalAssetsQuery } from '../../../sdk'
import { BareMetalAssets as GetBareMetalAsset, BareMetalAsset } from '../../../lib/BareMetalAsset'
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
    const { data, loading, error, startPolling, stopPolling, refresh } = GetBareMetalAsset()
    useEffect(refresh, [refresh])
    useEffect(() => {
        startPolling(5 * 1000)
        return stopPolling
    }, [startPolling, stopPolling, refresh])

    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (data?.length === 0 || !data ) {
        return <AcmEmptyPage title="No bare metal assets found" message="No bare metal assets found" />
    } 
    console.log(`data: ${JSON.stringify(data)}`)

    return <BareMetalAssetsTable bareMetalAssets={ data }></BareMetalAssetsTable>
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
                        header: 'Namespace',
                        cell: 'metadata.namespace',
                        search: 'metadata.namespace',
                    },
                ]}
                // TODO: find out if ! is appropriate for this situation.
                keyFn={(item: BareMetalAsset) => item.metadata?.uid!}
                tableActions={[]}
                rowActions={[]}
                bulkActions={[]}
            />
        </AcmPageCard>
    )
}
