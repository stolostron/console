import { AcmEmptyPage, AcmLabels, AcmLoadingPage, AcmPageCard, AcmTable } from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../../components/ConfirmModal'
import { ErrorPage } from '../../../components/ErrorPage'
import { BareMetalAssets as GetBareMetalAsset, BareMetalAsset, BMAStatusMessage, GetLabels, bareMetalAssets } from '../../../lib/BareMetalAsset'
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

    return <BareMetalAssetsTable 
                bareMetalAssets={data}
                refresh={refresh}
                deleteBareMetalAsset={bareMetalAssets.delete}
            ></BareMetalAssetsTable>
}

export function BareMetalAssetsTable(props: { 
    bareMetalAssets: BareMetalAsset[] 
    refresh: () => void
    deleteBareMetalAsset: (name?: string, namespace?: string) => Promise<unknown>}) {

    const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    const history = useHistory()

    function keyFn(bareMetalAsset: BareMetalAsset) {
        return bareMetalAsset.metadata.uid as string
    }

    return (
        <AcmPageCard>
             <ConfirmModal
                open={confirm.open}
                confirm={confirm.confirm}
                cancel={confirm.cancel}
                title={confirm.title}
                message={confirm.message}
            ></ConfirmModal>
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
                keyFn={keyFn}
                tableActions={[
                    {
                        id: 'createAsset',
                        title: 'Create Asset',
                        click: () => {},
                    },
                ]}
                bulkActions={[
                    { id: 'destroyBareMetalAsset', title: 'Destroy', click: (items) => {
                        items.forEach(bma => {

                        })
                    } },
                    { id: 'createBareMetalAssetCluster', title: 'Create Cluster', click: (items) => {} },
                ]}
                rowActions={[
                    { id: 'editLabels', title: 'Edit labels', click: (item) => {} },
                    { id: 'editAsset', title: 'Edit Asset', click: (item) => {} },
                    { id: 'deleteAsset', title: 'Delete Asset', click: (bareMetalAsset: BareMetalAsset) => {
                        setConfirm({
                            title: 'Delete bare metal asset',
                            message: `You are about to delete ${bareMetalAsset.metadata?.name}. The bare metal asset will no longer be available. This action is irreversible.`,
                            open: true,
                            confirm: () => {
                                props
                                    .deleteBareMetalAsset(
                                        bareMetalAsset.metadata?.name,
                                        bareMetalAsset.metadata?.namespace
                                    )
                                    .then(() => {
                                        props.refresh()
                                    })
                                setConfirm(ClosedConfirmModalProps)
                            },
                            cancel: () => {
                                setConfirm(ClosedConfirmModalProps)
                            },
                        })
                    } },
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
