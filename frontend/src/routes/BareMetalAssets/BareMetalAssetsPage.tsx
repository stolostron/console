import {
    AcmAlertContext,
    AcmAlertGroup,
    AcmAlertProvider,
    AcmButton,
    AcmDropdown,
    AcmEmptyState,
    AcmPageCard,
    AcmPageHeader,
    AcmScrollable,
    AcmTable,
    AcmTablePaginationContextProvider,
} from '@open-cluster-management/ui-components'
import { Page } from '@patternfly/react-core'
import React, { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'
import { BulkActionModel, IBulkActionModelProps } from '../../components/BulkActionModel'
import { getErrorInfo } from '../../components/ErrorPage'
import { deleteResources } from '../../lib/delete-resources'
import { DOC_LINKS } from '../../lib/doc-util'
import { deleteResource, IRequestResult } from '../../lib/resource-request'
import { useQuery } from '../../lib/useQuery'
import { NavigationPath } from '../../NavigationPath'
import { BareMetalAsset, BMAStatusMessage, listBareMetalAssets } from '../../resources/bare-metal-asset'
import { BMATableRbacAccess, createSubjectAccessReviews, rbacMapping } from '../../resources/self-subject-access-review'

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
    const { data, error, startPolling, refresh } = useQuery(
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

    return (
        <BareMetalAssetsTable
            bareMetalAssets={data}
            deleteBareMetalAsset={deleteResource}
            refresh={refresh}
        ></BareMetalAssetsTable>
    )
}

export function deleteBareMetalAssets(bareMetalAssets: BareMetalAsset[]) {
    return deleteResources(bareMetalAssets).promise
}

export function BareMetalAssetsTable(props: {
    bareMetalAssets?: BareMetalAsset[]
    deleteBareMetalAsset: (bareMetalAsset: BareMetalAsset) => IRequestResult
    refresh: () => void
}) {
    const [creationAccessRestriction, setcreationAccessRestriction] = useState<boolean>(true)
    const [modalProps, setModalProps] = useState<IBulkActionModelProps<BareMetalAsset> | { open: false }>({
        open: false,
    })
    const history = useHistory()
    const defaultTableBmaValues: BMATableRbacAccess = {
        'bma.delete': false,
        'bma.edit': false,
    }
    const [tableActionRbacValues, setTableActionRbacValues] = useState<BMATableRbacAccess>(defaultTableBmaValues)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const [abortRbacCheck, setRbacAborts] = useState<Function[]>()
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
                setcreationAccessRestriction(!allowed)
            })
    }, [])

    function abortRbacPromises() {
        abortRbacCheck?.forEach((abort) => abort())
    }

    function CheckTableActionsRbacAccess(bareMetalAsset: BareMetalAsset) {
        let currentRbacValues = { ...defaultTableBmaValues }
        let abortArray: Array<Function> = []
        Object.keys(currentRbacValues).forEach((action) => {
            const request = createSubjectAccessReviews(
                rbacMapping(action, bareMetalAsset.metadata.name, bareMetalAsset.metadata.namespace)
            )
            request.promise
                .then((results) => {
                    if (results) {
                        let rbacQueryResults: boolean[] = []
                        results.forEach((result) => {
                            if (result.status === 'fulfilled') {
                                rbacQueryResults.push(result.value.status?.allowed!)
                            }
                        })
                        if (!rbacQueryResults.includes(false)) {
                            setTableActionRbacValues((current) => {
                                return { ...current, ...{ [action]: true } }
                            })
                        }
                    }
                })
                .catch((err) => console.error(err))
            abortArray.push(request.abort)
        })
        if (setRbacAborts) setRbacAborts(abortArray)
    }

    function keyFn(bareMetalAsset: BareMetalAsset) {
        return bareMetalAsset.metadata.uid as string
    }

    return (
        <AcmPageCard>
            <BulkActionModel<BareMetalAsset> {...modalProps} />
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
                                    isDisabled={creationAccessRestriction}
                                    tooltip={creationAccessRestriction ? t('common:rbac.unauthorized') : ''}
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
                        {
                            header: '',
                            cell: (bareMetalAsset) => {
                                const onSelect = (id: string) => {
                                    const action = actions.find((a) => a.id === id)
                                    return action?.click(bareMetalAsset)
                                }
                                let actions = [
                                    {
                                        id: 'editAsset',
                                        text: t('bareMetalAsset.rowAction.editAsset.title'),
                                        isDisabled: !tableActionRbacValues['bma.edit'],
                                        tooltip: !tableActionRbacValues['bma.edit']
                                            ? t('common:rbac.unauthorized')
                                            : '',
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
                                        text: t('bareMetalAsset.rowAction.deleteAsset.title'),
                                        isDisabled: !tableActionRbacValues['bma.delete'],
                                        tooltip: !tableActionRbacValues['bma.delete']
                                            ? t('common:rbac.unauthorized')
                                            : '',
                                        click: (bareMetalAsset: BareMetalAsset) => {
                                            setModalProps({
                                                open: true,
                                                singular: t('bare metal asset'),
                                                plural: t('bare metal assets'),
                                                action: t('common:delete'),
                                                processing: t('common:deleting'),
                                                resources: [bareMetalAsset],
                                                description: t('modal.delete.content.batch'),
                                                columns: [
                                                    {
                                                        header: t('bareMetalAsset.tableHeader.name'),
                                                        cell: 'metadata.name',
                                                        sort: 'metadata.name',
                                                    },
                                                    {
                                                        header: t('bareMetalAsset.tableHeader.namespace'),
                                                        cell: 'metadata.namespace',
                                                        sort: 'metadata.namespace',
                                                    },
                                                ],
                                                keyFn: (bareMetalAsset: BareMetalAsset) =>
                                                    bareMetalAsset.metadata.uid as string,
                                                actionFn: (bareMetalAsset: BareMetalAsset) =>
                                                    deleteResource(bareMetalAsset),
                                                close: () => {
                                                    setModalProps({ open: false })
                                                    props.refresh()
                                                },
                                                isDanger: true,
                                            })
                                        },
                                    },
                                ]
                                return (
                                    <AcmDropdown
                                        id={`${bareMetalAsset.metadata.namespace}-actions`}
                                        onSelect={onSelect}
                                        text={t('actions')}
                                        dropdownItems={actions}
                                        isKebab={true}
                                        isPlain={true}
                                        onToggle={() => {
                                            if (!isOpen) CheckTableActionsRbacAccess(bareMetalAsset)
                                            else abortRbacPromises()
                                            setIsOpen(!isOpen)
                                        }}
                                    />
                                )
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
                            isDisabled: creationAccessRestriction,
                            tooltip: creationAccessRestriction ? t('common:rbac.unauthorized') : '',
                        },
                    ]}
                    bulkActions={[
                        {
                            id: 'destroyBareMetalAsset',
                            title: t('bareMetalAsset.bulkAction.destroyAsset'),
                            click: (bareMetalAssets: BareMetalAsset[]) => {
                                setModalProps({
                                    open: true,
                                    singular: t('bare metal asset'),
                                    plural: t('bare metal assets'),
                                    action: t('common:delete'),
                                    processing: t('common:deleting'),
                                    resources: [...bareMetalAssets],
                                    description: t('modal.delete.content.batch'),
                                    columns: [
                                        {
                                            header: t('bareMetalAsset.tableHeader.name'),
                                            cell: 'metadata.name',
                                            sort: 'metadata.name',
                                        },
                                        {
                                            header: t('bareMetalAsset.tableHeader.namespace'),
                                            cell: 'metadata.namespace',
                                            sort: 'metadata.namespace',
                                        },
                                    ],
                                    keyFn: (bareMetalAsset: BareMetalAsset) => bareMetalAsset.metadata.uid as string,
                                    actionFn: (bareMetalAsset: BareMetalAsset) => deleteResource(bareMetalAsset),
                                    close: () => {
                                        setModalProps({ open: false })
                                        props.refresh()
                                    },
                                    isDanger: true,
                                })
                            },
                        },
                        {
                            id: 'createBareMetalAssetCluster',
                            title: t('bareMetalAsset.bulkAction.createCluster'),
                            click: (items) => {},
                        },
                    ]}
                    rowActions={[]}
                />
            </AcmTablePaginationContextProvider>
        </AcmPageCard>
    )
}
