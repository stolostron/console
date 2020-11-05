import { AcmEmptyState, AcmLoadingPage, AcmPageCard, AcmTable } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect } from 'react'
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
    const { data, loading, error, startPolling, stopPolling, refetch } = useBareMetalAssetsQuery({
        client,
    })
    useEffect(() => {
        refetch()
        startPolling(10 * 1000)
        return () => {
            stopPolling()
        }
    }, [refetch, startPolling, stopPolling])
    if (loading) {
        return <AcmLoadingPage />
    } else if (error) {
        return <ErrorPage error={error} />
    } else if (!data?.bareMetalAssets || data.bareMetalAssets.length === 0) {
        return <AcmPageCard><AcmEmptyState title="No bare metal assets found" message="No bare metal assets found" /></AcmPageCard>
    }
    return <BareMetalAssetsTable bareMetalAssets={data.bareMetalAssets as BareMetalAsset[]}></BareMetalAssetsTable>
}

export function BareMetalAssetsTable(props: { bareMetalAssets: BareMetalAsset[] }) {
    return (
        <AcmPageCard>
            <AcmTable<BareMetalAsset>
                emptyState={<AcmEmptyState title="No bare metal assets found" />}
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
