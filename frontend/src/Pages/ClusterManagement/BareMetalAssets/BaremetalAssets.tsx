import { AcmEmptyPage, AcmLabels, AcmLoadingPage, AcmPageCard, AcmTable } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect } from 'react'
import { ErrorPage } from '../../../components/ErrorPage'
import { BareMetalAssets as GetBareMetalAsset, BareMetalAsset, BMAStatusMessage, GetLabels } from '../../../lib/BareMetalAsset'
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
    } else if (data?.length === 0 || !data) {
        return <AcmEmptyPage title="No bare metal assets found" message="No bare metal assets found" />
    }

    return <BareMetalAssetsTable bareMetalAssets={data}></BareMetalAssetsTable>
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
                    {
                        header: 'Cluster',
                        cell: 'metal3.io/cluster-deployment-name',
                        search: 'metal3.io/cluster-deployment-name',
                    },
                    {
                        header: 'Role',
                        cell: 'metadata.labels.metal3.io/role',
                        search: 'metadata.labels.metal3.io/role',
                    },
                    {
                        header: 'Status',
                        cell: (bareMetalAssets) => { 
                            return BMAStatusMessage(bareMetalAssets)
                        },
                    },
                    {
                        header: 'Labels',
                        cell: (bareMetalAssets) => {
                            const labels = GetLabels(bareMetalAssets)
                            return <AcmLabels labels={labels}/>
                        },
                    },
                ]}
                // TODO: find out if ! is appropriate for this situation.
                keyFn={(item: BareMetalAsset) => item.metadata?.uid!}
                tableActions={[
                    {
                        id: 'createAsset',
                        title: 'Create Asset',
                        click: () => {},
                    },
                ]}
                bulkActions={[
                    { id: 'destroyBareMetalAsset', title: 'Destroy', click: (items) => {} },
                    { id: 'createBareMetalAssetCluster', title: 'Create Cluster', click: (items) => {} },
                ]}
                rowActions={[
                    { id: 'editLabels', title: 'Edit labels', click: (item) => {} },
                    { id: 'editAsset', title: 'Edit Asset', click: (item) => {} },
                    { id: 'deleteAsset', title: 'Delete Asset', click: (item) => {} },
                ]}
            />
        </AcmPageCard>
    )
}

function GetStatusMessage(status: string) {
    switch (status) {
        case 'CredentialsFound':
            return 'No credentials'
        case 'AssetSyncStarted':
            return 'Asset syncing'
        case 'ClusterDeploymentFound':
            return 'No cluster deployment'
        case 'AssetSyncCompleted':
            return 'Asset sync failed'
        case 'Ready':
            return 'Ready'
        default:
            return ''
    }
}
