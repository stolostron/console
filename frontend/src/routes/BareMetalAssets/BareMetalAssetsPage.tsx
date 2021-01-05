import {
    AcmButton,
    AcmEmptyState,
    AcmPageCard,
    AcmPageHeader,
    AcmScrollable,
    AcmTable,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../components/ConfirmModal'
import { ErrorPage } from '../../components/ErrorPage'
import { deleteResources } from '../../lib/delete-resources'
import { deleteResource, IRequestResult } from '../../lib/resource-request'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath } from '../../NavigationPath'
import { BareMetalAsset, BMAStatusMessage, listBareMetalAssets } from '../../resources/bare-metal-asset'

export default function BareMetalAssetsPage() {
    const { t } = useTranslation(['bma'])
    return (
        <Page>
            <AcmPageHeader title={t('bmas')} />
            <AcmScrollable>
                <BareMetalAssets />
            </AcmScrollable>
        </Page>
    )
}

export function BareMetalAssets() {
    const { data, error, startPolling } = useQuery(listBareMetalAssets)
    useEffect(startPolling, [startPolling])
    if (error) {
        return <ErrorPage error={error} />
    }
    return <BareMetalAssetsTable bareMetalAssets={data} deleteBareMetalAsset={deleteResource}></BareMetalAssetsTable>
}

export function deleteBareMetalAssets(bareMetalAssets: BareMetalAsset[]) {
    return deleteResources(bareMetalAssets).promise
}

export function BareMetalAssetsTable(props: {
    bareMetalAssets?: BareMetalAsset[]
    deleteBareMetalAsset: (bareMetalAsset: BareMetalAsset) => IRequestResult
}) {
    const [confirm, setConfirm] = useState<IConfirmModalProps>(ClosedConfirmModalProps)
    const history = useHistory()
    const { t } = useTranslation(['bma'])

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
                emptyState={
                    <AcmEmptyState
                        title={t('bareMetalAsset.emptyState.title')}
                        action={
                            <AcmButton
                                variant="primary"
                                onClick={() => {
                                    history.push(NavigationPath.createBareMetalAsset)
                                }}
                            >
                                {t('createBareMetalAsset.title')}
                            </AcmButton>
                        }
                    />
                }
                plural="bare metal assets"
                items={props.bareMetalAssets}
                columns={[
                    {
                        header: t('bareMetalAsset.tableHeader.name'),
                        cell: 'metadata.name',
                        sort: 'metadata.name',
                        search: 'metadata.name',
                    },
                    {
                        header: t('bareMetalAsset.tableHeader.namespace'),
                        cell: 'metadata.namespace',
                        search: 'metadata.namespace',
                    },
                    {
                        header: t('bareMetalAsset.tableHeader.cluster'),
                        cell: 'metal3.io/cluster-deployment-name',
                        search: 'metal3.io/cluster-deployment-name',
                    },
                    {
                        header: t('bareMetalAsset.tableHeader.role'),
                        cell: 'metadata.labels.metal3.io/role',
                        search: 'metadata.labels.metal3.io/role',
                    },
                    {
                        header: t('bareMetalAsset.tableHeader.status'),
                        cell: (bareMetalAssets) => {
                            return BMAStatusMessage(bareMetalAssets, t)
                        },
                    },
                ]}
                keyFn={keyFn}
                tableActions={[
                    {
                        id: 'createAsset',
                        title: t('bareMetalAsset.bulkAction.createAsset'),
                        click: () => {
                            history.push(NavigationPath.createBareMetalAsset)
                        },
                    },
                ]}
                bulkActions={[
                    {
                        id: 'destroyBareMetalAsset',
                        title: t('bareMetalAsset.bulkAction.destroyAsset'),
                        click: (bareMetalAssets: BareMetalAsset[]) => {
                            setConfirm({
                                title: t('bareMetalAsset.modal.deleteMultiple.title'),
                                message: t('bareMetalAsset.modal.deleteMultiple.message', {
                                    assetNum: bareMetalAssets.length,
                                }),
                                open: true,
                                confirm: () => {
                                    void deleteBareMetalAssets(bareMetalAssets)
                                    // TODO refresh
                                    // TODO errors
                                    setConfirm(ClosedConfirmModalProps)
                                },
                                cancel: () => {
                                    setConfirm(ClosedConfirmModalProps)
                                },
                            })
                        },
                    },
                    {
                        id: 'createBareMetalAssetCluster',
                        title: t('bareMetalAsset.bulkAction.createCluster'),
                        click: (items) => {},
                    },
                ]}
                rowActions={[
                    { id: 'editLabels', title: t('bareMetalAsset.rowAction.editLabels.title'), click: (item) => {} },
                    {
                        id: 'editAsset',
                        title: t('bareMetalAsset.rowAction.editAsset.title'),
                        click: (bareMetalAsset: BareMetalAsset) => {
                            history.push(
                                NavigationPath.editBareMetalAsset.replace(
                                    ':namespace/:name',
                                    `${bareMetalAsset.metadata?.namespace}/${bareMetalAsset.metadata?.name}` as string
                                )
                            )
                        },
                    },
                    {
                        id: 'deleteAsset',
                        title: t('bareMetalAsset.rowAction.deleteAsset.title'),
                        click: (bareMetalAsset: BareMetalAsset) => {
                            setConfirm({
                                title: t('bareMetalAsset.modal.delete.title'),
                                message: t('bareMetalAsset.modal.delete.message', {
                                    assetName: bareMetalAsset.metadata?.name,
                                }),
                                open: true,
                                confirm: () => {
                                    props.deleteBareMetalAsset(bareMetalAsset)
                                    setConfirm(ClosedConfirmModalProps)
                                },
                                cancel: () => {
                                    setConfirm(ClosedConfirmModalProps)
                                },
                            })
                        },
                    },
                ]}
            />
        </AcmPageCard>
    )
}
