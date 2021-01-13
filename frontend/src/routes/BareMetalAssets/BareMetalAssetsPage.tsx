import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmButton,
    AcmEmptyState,
    AcmPageCard,
    AcmPageHeader,
    AcmScrollable,
    AcmTable,
    AcmTablePaginationContextProvider,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useContext, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { ClosedConfirmModalProps, ConfirmModal, IConfirmModalProps } from '../../components/ConfirmModal'
import { getErrorInfo } from '../../components/ErrorPage'
import { deleteResources } from '../../lib/delete-resources'
import { DOC_LINKS } from '../../lib/doc-util'
import { deleteResource, IRequestResult } from '../../lib/resource-request'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath } from '../../NavigationPath'
import { BareMetalAsset, BMAStatusMessage, listBareMetalAssets } from '../../resources/bare-metal-asset'
import { createSubjectAccessReviews, rbacMapping } from '../../resources/self-subject-access-review'

export default function BareMetalAssetsPage() {
    const { t } = useTranslation(['bma', 'common'])
    return (
        <Page>
            <AcmPageHeader
                title={t('bmas')}
                titleTooltip={
                    <>
                        {t('bmas.tooltip')}
                        <a
                            href={DOC_LINKS.BARE_METAL_ASSETS}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'block', marginTop: '4px' }}
                        >
                            {t('common:learn.more')}
                        </a>
                    </>
                }
            />
            <AcmScrollable>
                <AcmAlertProvider>
                    <AcmAlertGroup isInline canClose alertMargin="24px 24px 0px 24px" />
                    <BareMetalAssets />
                </AcmAlertProvider>
            </AcmScrollable>
        </Page>
    )
}

let lastData: BareMetalAsset[] | undefined
let lastTime: number = 0

export function BareMetalAssets() {
    const alertContext = useContext(AcmAlertContext)
    const { data, error, startPolling } = useQuery(
        listBareMetalAssets,
        Date.now() - lastTime < 5 * 60 * 1000 ? lastData : undefined
    )
    useEffect(startPolling, [startPolling])
    useEffect(() => {
        if (process.env.NODE_ENV !== 'test') {
            lastData = data
            lastTime = Date.now()
        }
    }, [data])
    useEffect(() => {
        alertContext.clearAlerts()
        if (error) {
            alertContext.addAlert(getErrorInfo(error))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error])

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
    const [accessRestriction, setAccessRestriction] = useState<boolean>(true)
    const history = useHistory()
    const { t } = useTranslation(['bma', 'common'])

    useEffect(() => {
        const resourceList = rbacMapping('cluster.create')
        const promiseResult = createSubjectAccessReviews(resourceList)
        let allowed = true
        promiseResult.promise
            .catch((err) => {
                // send err to console
                console.error(err)
            })
            .then((results) => {
                if (results) {
                    results.forEach((result) => {
                        if (result.status === 'fulfilled') {
                            allowed = allowed && result.value.status?.allowed!
                        }
                    })
                }
                setAccessRestriction(!allowed)
            })
    }, [])

    function keyFn(bareMetalAsset: BareMetalAsset) {
        return bareMetalAsset.metadata.uid as string
    }

    return (
        <AcmPageCard>
            <ConfirmModal {...confirm} />
            <AcmTablePaginationContextProvider localStorageKey="table-bare-metal-assets">
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
                                    isDisabled={accessRestriction}
                                    tooltip={accessRestriction ? t('common:rbac.unauthorized') : ''}
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
                            cell: (bareMetalAsset: BareMetalAsset) =>
                                bareMetalAsset.metadata.labels?.['metal3.io/cluster-deployment-name'] || '-',
                            search: 'metal3.io/cluster-deployment-name',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.role'),
                            cell: (bareMetalAsset: BareMetalAsset) =>
                                bareMetalAsset.metadata.labels?.['metadata.labels.metal3.io/role'] || '-',
                            search: 'metadata.labels.metal3.io/role',
                        },
                        {
                            header: t('bareMetalAsset.tableHeader.status'),
                            cell: (bareMetalAsset) => {
                                return BMAStatusMessage(bareMetalAsset, t)
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
                            isDisabled: accessRestriction,
                            tooltip: accessRestriction ? t('common:rbac.unauthorized') : '',
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
                                    isDanger: true,
                                    confirmText: t('common:destroy'),
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
                                    message: (
                                        <Trans
                                            i18nKey="bma:bareMetalAsset.modal.delete.message"
                                            values={{ assetName: bareMetalAsset.metadata?.name }}
                                            components={{ bold: <strong /> }}
                                        />
                                    ),
                                    confirmText: t('common:destroy'),
                                    isDanger: true,
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
            </AcmTablePaginationContextProvider>
        </AcmPageCard>
    )
}
